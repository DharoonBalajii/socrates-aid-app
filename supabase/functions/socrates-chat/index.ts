import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, imageUrl, chatId } = await req.json();
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get user
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    // Get chat history
    const { data: chatMessages } = await supabaseClient
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    // Get user's subject notes
    const { data: subjects } = await supabaseClient
      .from('subjects')
      .select('id, name, subject_notes(*)')
      .eq('user_id', user.id);

    let contextPrompt = '';
    if (subjects && subjects.length > 0) {
      contextPrompt = '\n\nStudent\'s uploaded notes and materials:\n';
      subjects.forEach((subject: any) => {
        if (subject.subject_notes && subject.subject_notes.length > 0) {
          contextPrompt += `\n${subject.name}:\n`;
          subject.subject_notes.forEach((note: any) => {
            contextPrompt += `- ${note.title}: ${note.content}\n`;
          });
        }
      });
    }

    // Prepare messages for Gemini
    const messagesForAI = chatMessages?.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    })) || [];

    // Add current message
    const currentMessageParts: any[] = [{ text: message }];
    if (imageUrl) {
      // Extract base64 data
      const base64Data = imageUrl.split(',')[1];
      const mimeType = imageUrl.split(';')[0].split(':')[1];
      
      currentMessageParts.push({
        inlineData: {
          mimeType: mimeType,
          data: base64Data
        }
      });
    }

    messagesForAI.push({
      role: 'user',
      parts: currentMessageParts
    });

    // Call Lovable AI with Gemini
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are Socrates, an AI learning assistant for StemPal. Your goal is to help students understand concepts deeply through the Socratic method - asking guiding questions and providing explanations that build understanding.

When students upload homework problems:
1. Analyze the problem carefully
2. Break it down into steps
3. Guide the student through the solution with questions
4. Provide clear explanations
5. Encourage follow-up questions

${contextPrompt}

Be encouraging, patient, and focus on helping students learn, not just giving answers.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messagesForAI.map((msg: any) => ({
            role: msg.role === 'model' ? 'assistant' : 'user',
            content: msg.parts.map((p: any) => p.text || '[image]').join(' ')
          }))
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error('AI processing failed');
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Save AI response to database
    await supabaseClient
      .from('messages')
      .insert({
        chat_id: chatId,
        user_id: user.id,
        role: 'assistant',
        content: aiResponse,
      });

    // Update chat title if it's still "New Chat"
    const { data: chat } = await supabaseClient
      .from('chats')
      .select('title')
      .eq('id', chatId)
      .single();

    if (chat?.title === 'New Chat') {
      const titleSummary = message.slice(0, 50) + (message.length > 50 ? '...' : '');
      await supabaseClient
        .from('chats')
        .update({ title: titleSummary })
        .eq('id', chatId);
    }

    // Track common struggles
    const topicKeywords = extractTopics(message);
    if (topicKeywords.length > 0) {
      for (const topic of topicKeywords) {
        const { data: existingStruggle } = await supabaseClient
          .from('student_struggles')
          .select('*')
          .eq('topic', topic)
          .maybeSingle();

        if (existingStruggle) {
          await supabaseClient
            .from('student_struggles')
            .update({
              student_count: existingStruggle.student_count + 1,
              last_asked: new Date().toISOString(),
            })
            .eq('id', existingStruggle.id);
        } else {
          await supabaseClient
            .from('student_struggles')
            .insert({
              topic: topic,
              question_summary: message.slice(0, 100),
              student_count: 1,
            });
        }
      }
    }

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in socrates-chat:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function extractTopics(text: string): string[] {
  const topics: string[] = [];
  const commonTopics = [
    'algebra', 'geometry', 'calculus', 'physics', 'chemistry', 'biology',
    'trigonometry', 'statistics', 'probability', 'equations', 'functions',
    'derivatives', 'integrals', 'vectors', 'matrices'
  ];

  const lowerText = text.toLowerCase();
  commonTopics.forEach(topic => {
    if (lowerText.includes(topic)) {
      topics.push(topic.charAt(0).toUpperCase() + topic.slice(1));
    }
  });

  return topics.slice(0, 2); // Return max 2 topics
}

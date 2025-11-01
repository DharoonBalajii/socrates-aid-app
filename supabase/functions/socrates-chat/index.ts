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
    
    // Get authorization header (case-insensitive)
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError) {
      console.error('User auth error:', userError);
      throw new Error(`Authentication failed: ${userError.message}`);
    }
    
    if (!user) {
      throw new Error('No user found');
    }
    
    console.log('User authenticated:', user.id);

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

    const systemPrompt = `You are Socrates, an AI learning assistant for StemPal. Your goal is to help students understand concepts deeply through the Socratic method - asking guiding questions and providing explanations that build understanding.

When students upload homework problems:
1. Analyze the problem carefully
2. Break it down into steps
3. Guide the student through the solution with questions
4. Provide clear explanations
5. Encourage follow-up questions

${contextPrompt}

Be encouraging, patient, and focus on helping students learn, not just giving answers.`;

    // Prepare messages for Gemini
    const contents: any[] = [];
    
    // Add chat history
    if (chatMessages && chatMessages.length > 0) {
      chatMessages.forEach((msg: any) => {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        });
      });
    }

    // Add current message with optional image
    const currentMessageParts: any[] = [{ text: systemPrompt + '\n\nUser: ' + message }];
    if (imageUrl) {
      const base64Data = imageUrl.split(',')[1];
      const mimeType = imageUrl.split(';')[0].split(':')[1];
      
      currentMessageParts.push({
        inline_data: {
          mime_type: mimeType,
          data: base64Data
        }
      });
    }

    contents.push({
      role: 'user',
      parts: currentMessageParts
    });

    // Call Gemini API directly
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: contents,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', geminiResponse.status, errorText);
      throw new Error(`Gemini API failed: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    const aiResponse = geminiData.candidates[0].content.parts[0].text;

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

    // Track common struggles for teacher dashboard
    const topicKeywords = extractTopics(message + ' ' + aiResponse);
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
              question_summary: message.slice(0, 100),
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
    'derivatives', 'integrals', 'vectors', 'matrices', 'stoichiometry',
    'kinematics', 'thermodynamics', 'electromagnetism', 'optics', 'waves',
    'polynomials', 'logarithms', 'exponentials', 'limits', 'series'
  ];

  const lowerText = text.toLowerCase();
  const foundTopics = new Set<string>();
  
  commonTopics.forEach(topic => {
    if (lowerText.includes(topic)) {
      foundTopics.add(topic.charAt(0).toUpperCase() + topic.slice(1));
    }
  });

  return Array.from(foundTopics).slice(0, 3); // Return max 3 topics
}

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
    const { message, imageUrl, chatId, documentUrl, documentName } = await req.json();
    
    // Create Supabase client for database operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      throw new Error('Unauthorized');
    }
    
    console.log('User authenticated:', user.id);

    // Get chat history
    const { data: chatMessages } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    // Get user's profile to find their subjects
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('class_number, full_name, email')
      .eq('id', user.id)
      .single();

    // Get user's subject notes
    const { data: subjects } = await supabaseAdmin
      .from('subjects')
      .select('id, name, subject_notes(*)')
      .eq('user_id', user.id);

    // Get teacher-uploaded resources for relevant subjects
    let subjectList: string[] = [];
    if (profile?.class_number) {
      try {
        const parsed = JSON.parse(profile.class_number);
        subjectList = Array.isArray(parsed) ? parsed : [String(parsed)];
      } catch (e) {
        subjectList = [String(profile.class_number)];
      }
    }

    const { data: teacherResources } = await supabaseAdmin
      .from('teacher_resources')
      .select('*')
      .in('subject', subjectList);

    let contextPrompt = '';
    
    // Add teacher resources context
    if (teacherResources && teacherResources.length > 0) {
      contextPrompt += '\n\nTEACHER-PROVIDED LEARNING RESOURCES:\n';
      contextPrompt += 'When answering questions, reference these materials and tell students which document to check:\n\n';
      teacherResources.forEach((resource: any) => {
        contextPrompt += `📚 "${resource.title}" (${resource.subject})\n`;
        if (resource.description) {
          contextPrompt += `   Description: ${resource.description}\n`;
        }
        contextPrompt += `   Document: ${resource.document_name}\n\n`;
      });
    }
    
    // Add student's own notes
    if (subjects && subjects.length > 0) {
      contextPrompt += '\n\nStudent\'s uploaded notes and materials:\n';
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

**CRITICAL INSTRUCTION - REVIEW TEACHER MATERIALS FIRST:**
Before answering any question, you MUST:
1. **THOROUGHLY REVIEW** all teacher-provided resources listed below for the relevant subject
2. **IDENTIFY** which document(s) contain information related to the student's question
3. **USE THE EXACT METHODS** and approaches shown in those materials
4. **REFERENCE** the specific document name and sections students should consult

When students upload homework problems or documents:
1. Analyze the problem carefully and CHECK if teacher materials cover this topic
2. If the student uploaded a document, acknowledge it and offer to help with it
3. Break down problems into steps using the SAME methodology from teacher resources
4. Guide the student through the solution with questions
5. **MANDATORY**: When teacher resources exist for this topic, you MUST:
   - Tell students: "Based on [Document Name], here's how to approach this..."
   - Reference specific sections: "You can find this method in [Document Name], Section X"
   - Use the EXACT problem-solving approach from the teacher's materials
6. If multiple methods exist, prioritize the one shown in teacher materials
7. Highlight specific pages or topics the student should review in the teacher's documents
8. Provide clear explanations while encouraging students to check the referenced materials for deeper understanding

${contextPrompt}

**REMEMBER**: Your primary role is to guide students through concepts using the teacher's curriculum and materials as the authoritative source. Always reference and follow the methods shown in teacher-uploaded documents.

Be encouraging, patient, and focus on helping students learn, not just giving answers. ALWAYS direct students to the relevant teacher-uploaded resources when available.`;

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

    // Add current message with optional image and document
    let fullMessage = message;
    if (documentName) {
      fullMessage += `\n\n[Student uploaded document: ${documentName}]`;
    }
    
    const currentMessageParts: any[] = [{ text: systemPrompt + '\n\nUser: ' + fullMessage }];
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
    await supabaseAdmin
      .from('messages')
      .insert({
        chat_id: chatId,
        user_id: user.id,
        role: 'assistant',
        content: aiResponse,
        document_url: documentUrl || null,
        document_name: documentName || null,
      });

    // Update chat title if it's still "New Chat"
    const { data: chat } = await supabaseAdmin
      .from('chats')
      .select('title')
      .eq('id', chatId)
      .single();

    if (chat?.title === 'New Chat') {
      const titleSummary = message.slice(0, 50) + (message.length > 50 ? '...' : '');
      await supabaseAdmin
        .from('chats')
        .update({ title: titleSummary })
        .eq('id', chatId);
    }

    // Track common struggles for teacher dashboard
    const topicKeywords = extractTopics(message + ' ' + aiResponse);
    if (topicKeywords.length > 0) {
      for (const topic of topicKeywords) {
        // Log individual student query with name
        await supabaseAdmin
          .from('student_query_log')
          .insert({
            student_id: user.id,
            student_name: profile?.full_name || profile?.email || 'Unknown Student',
            topic: topic,
            question: message.slice(0, 200)
          });

        // Update aggregate struggles table
        const { data: existingStruggle } = await supabaseAdmin
          .from('student_struggles')
          .select('*')
          .eq('topic', topic)
          .maybeSingle();

        if (existingStruggle) {
          await supabaseAdmin
            .from('student_struggles')
            .update({
              student_count: existingStruggle.student_count + 1,
              last_asked: new Date().toISOString(),
              question_summary: message.slice(0, 100),
            })
            .eq('id', existingStruggle.id);
        } else {
          await supabaseAdmin
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

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

    const systemPrompt = `You are Socrates, an AI learning assistant for StemPal. Your PRIMARY mission is to teach through the SOCRATIC METHOD - NEVER give direct answers. Guide students to discover solutions themselves through careful questioning and step-by-step interactive dialogue.

**CRITICAL FORMATTING INSTRUCTIONS:**
- Use proper Markdown formatting for all responses
- Use LaTeX for ALL mathematical expressions:
  * Inline math: \\( x^2 + y^2 = z^2 \\)
  * Display math (centered): \\[ \\int_{a}^{b} f(x)dx \\]
- Use proper formatting: bold (**text**), italic (*text*), code blocks, lists
- Structure responses with clear headings and sections

**SOCRATIC METHOD - MANDATORY APPROACH:**
You MUST follow this teaching pattern for EVERY question:

1. **NEVER give the complete solution immediately**
2. **Start with a guiding question** that checks their understanding of the fundamentals
3. **Wait for student response** - Ask: "What do you think about this?" or "Can you try solving the first step?"
4. **Provide ONE hint or mini-step at a time**
5. **Ask a follow-up question** after each explanation
6. **Build understanding incrementally** - Each response should reveal only ONE concept or step
7. **Encourage them to attempt** before revealing the next step

**INTERACTIVE STEP-BY-STEP PATTERN:**
Instead of: "Here's how to solve this: [full solution]"
Do this:
- "Let's think about this step by step. First, what's the fundamental concept at play here?"
- [Wait for response]
- "Good! Now, based on that, what should our first step be?"
- [Wait for response]
- "Excellent! Let's work through that. Try calculating [specific sub-step] and tell me what you get."

**CRITICAL INSTRUCTION - REVIEW TEACHER MATERIALS FIRST:**
Before answering any question, you MUST:
1. **THOROUGHLY REVIEW** all teacher-provided resources listed below for the relevant subject
2. **IDENTIFY** which document(s) contain information related to the student's question
3. **USE THE EXACT METHODS** and approaches shown in those materials
4. **REFERENCE** the specific document name and sections students should consult

When students upload homework problems or documents:
1. Analyze the problem carefully and CHECK if teacher materials cover this topic
2. If the student uploaded a document, acknowledge it and offer to help with it
3. **Use Socratic questioning** to guide them through the solution - don't solve it for them
4. Break down problems into small steps, asking them to attempt each step
5. **MANDATORY**: When teacher resources exist for this topic, you MUST:
   - Tell students: "Based on [Document Name], here's a question to get you thinking..."
   - Reference specific sections: "Check [Document Name], Section X. What method do you see there?"
   - Guide them to discover the approach from teacher materials themselves
6. If multiple methods exist, ask them which approach from the teacher's materials they'd like to explore
7. Highlight specific pages or topics the student should review in the teacher's documents

${contextPrompt}

**EXAMPLES OF GOOD SOCRATIC RESPONSES:**
❌ BAD: "To solve \\( x^2 + 5x + 6 = 0 \\), factor it as \\( (x+2)(x+3) = 0 \\), so \\( x = -2 \\) or \\( x = -3 \\)"
✅ GOOD: "I see you're working with a quadratic equation! Before we jump in, what are the different methods you know for solving quadratic equations? Let's think about which one might work best here."

❌ BAD: "The derivative is \\( 2x \\)"
✅ GOOD: "Great question! Let's think about what differentiation means. Can you tell me what the power rule states? Once you remember that, try applying it to this function and share what you get."

**REMEMBER**: 
- Your role is a GUIDE, not a solution provider
- INTERACT - ask questions, wait for responses, guide incrementally
- Use beautiful LaTeX formatting: \\( \\) for inline, \\[ \\] for display equations
- Format all math properly, use Markdown for structure
- Make learning a dialogue, not a lecture
- Students learn by DOING, not by watching you solve problems
- Reference teacher materials to guide their independent exploration

Be encouraging, patient, and Socratic at ALL times. NEVER solve problems completely - guide students to solve them themselves!`;

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

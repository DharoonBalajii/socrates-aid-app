-- Add document fields to messages table
ALTER TABLE public.messages 
ADD COLUMN document_url TEXT,
ADD COLUMN document_name TEXT;
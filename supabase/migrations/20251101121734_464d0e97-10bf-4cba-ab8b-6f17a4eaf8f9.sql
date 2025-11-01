-- Create teacher_resources table for uploaded learning materials
CREATE TABLE public.teacher_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL,
  subject TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  document_url TEXT NOT NULL,
  document_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.teacher_resources ENABLE ROW LEVEL SECURITY;

-- Teachers can manage their own resources
CREATE POLICY "Teachers can manage own resources"
ON public.teacher_resources
FOR ALL
USING (
  auth.uid() = teacher_id 
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'teacher'
  )
)
WITH CHECK (
  auth.uid() = teacher_id 
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'teacher'
  )
);

-- Students can view all resources
CREATE POLICY "Students can view all resources"
ON public.teacher_resources
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'student'
  )
);
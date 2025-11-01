-- Create table to track individual student queries with names
CREATE TABLE public.student_query_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  student_name TEXT NOT NULL,
  topic TEXT NOT NULL,
  question TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.student_query_log ENABLE ROW LEVEL SECURITY;

-- Teachers can view all student queries
CREATE POLICY "Teachers can view student queries"
ON public.student_query_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'teacher'::app_role
  )
);

-- Students can view their own queries
CREATE POLICY "Students can view own queries"
ON public.student_query_log
FOR SELECT
USING (auth.uid() = student_id);

-- System can insert queries (for edge function)
CREATE POLICY "System can insert queries"
ON public.student_query_log
FOR INSERT
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_student_query_log_topic ON public.student_query_log(topic);
CREATE INDEX idx_student_query_log_created_at ON public.student_query_log(created_at DESC);
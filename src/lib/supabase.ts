import { supabase } from "@/integrations/supabase/client";

export { supabase };

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: 'student' | 'teacher';
  class_number: string | null;
  created_at: string;
  updated_at: string;
};

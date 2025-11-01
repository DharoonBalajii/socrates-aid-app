import { supabase } from "@/integrations/supabase/client";

export { supabase };

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: 'student' | 'teacher';
  created_at: string;
  updated_at: string;
};

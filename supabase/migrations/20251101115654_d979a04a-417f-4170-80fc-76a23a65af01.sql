-- Add class_number to profiles table
ALTER TABLE public.profiles 
ADD COLUMN class_number TEXT;

-- Make full_name NOT NULL (set default for existing rows first)
UPDATE public.profiles SET full_name = '' WHERE full_name IS NULL;
ALTER TABLE public.profiles 
ALTER COLUMN full_name SET NOT NULL,
ALTER COLUMN full_name SET DEFAULT '';

-- Update the handle_new_user function to include class_number and full_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, role, full_name, class_number)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'student'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'class_number', '')
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'student')
  );
  
  RETURN NEW;
END;
$function$;
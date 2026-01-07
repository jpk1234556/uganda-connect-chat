-- Update handle_new_user function to work with email auth and phone from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, phone_number, display_name)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'phone_number', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', 'User')
  )
  ON CONFLICT (id) DO UPDATE SET
    phone_number = COALESCE(EXCLUDED.phone_number, profiles.phone_number),
    display_name = COALESCE(EXCLUDED.display_name, profiles.display_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Make phone_number nullable since we now use email as primary auth
ALTER TABLE public.profiles ALTER COLUMN phone_number DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.normalize_code(p text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path TO 'public' AS $$
  SELECT upper(regexp_replace(coalesce(p,''), '[^A-Za-z0-9]', '', 'g'));
$$;
REVOKE EXECUTE ON FUNCTION public.check_staff_invite(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.normalize_code(text) FROM anon;

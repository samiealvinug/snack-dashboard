
CREATE OR REPLACE FUNCTION public.normalize_code(p text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT upper(regexp_replace(coalesce(p,''), '[^A-Za-z0-9]', '', 'g'));
$$;

CREATE OR REPLACE FUNCTION public.check_staff_invite(p_code text)
RETURNS TABLE(valid boolean, reason text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT
    EXISTS (SELECT 1 FROM public.staff_invites i
            WHERE public.normalize_code(i.code) = public.normalize_code(p_code)
              AND i.used_at IS NULL AND i.expires_at > now()),
    CASE
      WHEN NOT EXISTS (SELECT 1 FROM public.staff_invites i WHERE public.normalize_code(i.code) = public.normalize_code(p_code)) THEN 'not_found'
      WHEN EXISTS (SELECT 1 FROM public.staff_invites i WHERE public.normalize_code(i.code) = public.normalize_code(p_code) AND i.used_at IS NOT NULL) THEN 'already_used'
      WHEN EXISTS (SELECT 1 FROM public.staff_invites i WHERE public.normalize_code(i.code) = public.normalize_code(p_code) AND i.expires_at <= now()) THEN 'expired'
      ELSE 'ok'
    END;
$$;

CREATE OR REPLACE FUNCTION public.redeem_staff_invite(p_code text)
RETURNS TABLE(owner_id uuid, staff_id text, name text, role text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE inv public.staff_invites%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in first'; END IF;
  SELECT * INTO inv FROM public.staff_invites i
    WHERE public.normalize_code(i.code) = public.normalize_code(p_code)
      AND i.used_at IS NULL AND i.expires_at > now()
    ORDER BY i.created_at DESC LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invite code is invalid, already used, or expired'; END IF;

  UPDATE public.staff_invites SET used_at = now(), used_by = auth.uid() WHERE code = inv.code;
  INSERT INTO public.shop_members (user_id, owner_id, staff_id)
    VALUES (auth.uid(), inv.owner_id, inv.staff_id)
    ON CONFLICT (user_id, owner_id) DO UPDATE SET staff_id = EXCLUDED.staff_id;
  UPDATE public.staff s SET user_id = auth.uid() WHERE s.id = inv.staff_id AND s.owner_id = inv.owner_id;

  RETURN QUERY
    SELECT inv.owner_id, inv.staff_id, COALESCE(s.name, 'Worker'), COALESCE(s.role, 'Cashier')
    FROM (SELECT 1) x LEFT JOIN public.staff s ON s.id = inv.staff_id AND s.owner_id = inv.owner_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.join_shop(code text)
RETURNS TABLE(owner_id uuid, staff_id text, name text, role text)
LANGUAGE sql SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT * FROM public.redeem_staff_invite(code);
$$;

GRANT EXECUTE ON FUNCTION public.normalize_code(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_staff_invite(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.redeem_staff_invite(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.join_shop(text) TO authenticated, service_role;

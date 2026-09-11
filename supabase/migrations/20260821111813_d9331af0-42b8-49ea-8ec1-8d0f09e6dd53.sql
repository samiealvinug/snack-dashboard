
-- staff <-> app user link
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS user_id uuid;

CREATE TABLE IF NOT EXISTS public.shop_members (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  staff_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, owner_id)
);
GRANT SELECT ON public.shop_members TO authenticated;
GRANT ALL ON public.shop_members TO service_role;
ALTER TABLE public.shop_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members see own membership" ON public.shop_members FOR SELECT TO authenticated USING (user_id = auth.uid() OR owner_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.staff_invites (
  code text PRIMARY KEY,
  owner_id uuid NOT NULL,
  staff_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '14 days',
  used_at timestamptz,
  used_by uuid
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_invites TO authenticated;
GRANT ALL ON public.staff_invites TO service_role;
ALTER TABLE public.staff_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner manages invites" ON public.staff_invites FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE OR REPLACE FUNCTION public.is_shop_member(_owner uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.shop_members m WHERE m.user_id = auth.uid() AND m.owner_id = _owner);
$$;

CREATE OR REPLACE FUNCTION public.redeem_staff_invite(p_code text)
RETURNS TABLE (owner_id uuid, staff_id text, name text, role text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE inv public.staff_invites%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in first'; END IF;
  SELECT * INTO inv FROM public.staff_invites i
    WHERE upper(i.code) = upper(trim(p_code)) AND i.used_at IS NULL AND i.expires_at > now();
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
GRANT EXECUTE ON FUNCTION public.redeem_staff_invite(text) TO authenticated;

-- member read/write access on shop data
CREATE POLICY "members read products" ON public.products FOR SELECT TO authenticated USING (public.is_shop_member(owner_id));
CREATE POLICY "members read staff" ON public.staff FOR SELECT TO authenticated USING (public.is_shop_member(owner_id));
CREATE POLICY "members insert sales" ON public.sales FOR INSERT TO authenticated WITH CHECK (public.is_shop_member(owner_id));
CREATE POLICY "members insert deliveries" ON public.deliveries FOR INSERT TO authenticated WITH CHECK (public.is_shop_member(owner_id));
CREATE POLICY "members insert adjustments" ON public.adjustments FOR INSERT TO authenticated WITH CHECK (public.is_shop_member(owner_id));

-- stock automation for worker-originated rows only (owner app pushes its own stock numbers)
CREATE OR REPLACE FUNCTION public.apply_worker_sale_stock()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE it jsonb;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() = NEW.owner_id THEN RETURN NEW; END IF;
  FOR it IN SELECT * FROM jsonb_array_elements(COALESCE(NEW.items, '[]'::jsonb)) LOOP
    UPDATE public.products p
       SET stock = GREATEST(p.stock - COALESCE((it->>'qty')::numeric, 0), 0), updated_at = now()
     WHERE p.owner_id = NEW.owner_id AND p.id = (it->>'productId');
  END LOOP;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_worker_sale_stock ON public.sales;
CREATE TRIGGER trg_worker_sale_stock AFTER INSERT ON public.sales FOR EACH ROW EXECUTE FUNCTION public.apply_worker_sale_stock();

CREATE OR REPLACE FUNCTION public.apply_worker_delivery_stock()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE it jsonb;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() = NEW.owner_id THEN RETURN NEW; END IF;
  FOR it IN SELECT * FROM jsonb_array_elements(COALESCE(NEW.items, '[]'::jsonb)) LOOP
    UPDATE public.products p
       SET stock = p.stock + COALESCE((it->>'qty')::numeric, 0), updated_at = now()
     WHERE p.owner_id = NEW.owner_id AND p.id = (it->>'productId');
  END LOOP;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_worker_delivery_stock ON public.deliveries;
CREATE TRIGGER trg_worker_delivery_stock AFTER INSERT ON public.deliveries FOR EACH ROW EXECUTE FUNCTION public.apply_worker_delivery_stock();

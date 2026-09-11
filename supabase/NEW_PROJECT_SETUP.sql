-- Julienne Shop POS - New Supabase project setup
-- Run once in Supabase SQL Editor for project ymbvwutdmhutyctubhay.

-- ===== 20260816150617_eb4ed814-a58d-43ce-a43d-57a1bb547aa5.sql =====

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.products (
  id text NOT NULL,
  owner_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL DEFAULT '',
  sku text NOT NULL DEFAULT '',
  barcode text NOT NULL DEFAULT '',
  cost numeric NOT NULL DEFAULT 0,
  price numeric NOT NULL DEFAULT 0,
  stock numeric NOT NULL DEFAULT 0,
  min_stock numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'Pack',
  image text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, id)
);

CREATE TABLE public.sales (
  id text NOT NULL,
  owner_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  receipt_no text NOT NULL DEFAULT '',
  date timestamptz NOT NULL DEFAULT now(),
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  tax numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  cogs numeric NOT NULL DEFAULT 0,
  payment text NOT NULL DEFAULT 'Cash',
  cash_given numeric,
  change numeric,
  staff_id text NOT NULL DEFAULT '',
  staff_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, id)
);

CREATE TABLE public.expenses (
  id text NOT NULL,
  owner_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  date timestamptz NOT NULL DEFAULT now(),
  category text NOT NULL DEFAULT 'Other',
  amount numeric NOT NULL DEFAULT 0,
  note text NOT NULL DEFAULT '',
  payment text NOT NULL DEFAULT 'Cash',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, id)
);

CREATE TABLE public.suppliers (
  id text NOT NULL,
  owner_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name text NOT NULL,
  contact text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, id)
);

CREATE TABLE public.deliveries (
  id text NOT NULL,
  owner_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  supplier text NOT NULL DEFAULT '',
  reference text NOT NULL DEFAULT '',
  date timestamptz NOT NULL DEFAULT now(),
  notes text NOT NULL DEFAULT '',
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total numeric NOT NULL DEFAULT 0,
  staff_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, id)
);

CREATE TABLE public.adjustments (
  id text NOT NULL,
  owner_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  date timestamptz NOT NULL DEFAULT now(),
  product_id text NOT NULL DEFAULT '',
  product_name text NOT NULL DEFAULT '',
  before numeric NOT NULL DEFAULT 0,
  after numeric NOT NULL DEFAULT 0,
  reason text NOT NULL DEFAULT '',
  staff_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, id)
);

CREATE TABLE public.staff (
  id text NOT NULL,
  owner_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'Cashier',
  pin text NOT NULL DEFAULT '0000',
  color text NOT NULL DEFAULT '#0f172a',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, id)
);

CREATE TABLE public.shop_settings (
  owner_id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  tax_rate numeric NOT NULL DEFAULT 0,
  active_staff_id text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.suppliers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deliveries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.adjustments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_settings TO authenticated;
GRANT ALL ON public.products, public.sales, public.expenses, public.suppliers, public.deliveries, public.adjustments, public.staff, public.shop_settings TO service_role;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own products" ON public.products FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "own sales" ON public.sales FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "own expenses" ON public.expenses FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "own suppliers" ON public.suppliers FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "own deliveries" ON public.deliveries FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "own adjustments" ON public.adjustments FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "own staff" ON public.staff FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "own settings" ON public.shop_settings FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER settings_updated_at BEFORE UPDATE ON public.shop_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
-- ===== 20260817063235_8eee7345-952d-4010-9c32-19c80fe32ef1.sql =====

CREATE INDEX IF NOT EXISTS idx_sales_owner_date ON public.sales (owner_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_owner_date ON public.expenses (owner_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_deliveries_owner_date ON public.deliveries (owner_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_adjustments_owner_date ON public.adjustments (owner_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_products_owner_name ON public.products (owner_id, name);
CREATE INDEX IF NOT EXISTS idx_staff_owner ON public.staff (owner_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_owner ON public.suppliers (owner_id);
-- ===== 20260820150943_4d14ce36-96c1-4a24-ab83-07fe71125120.sql =====

ALTER TABLE public.sales REPLICA IDENTITY FULL;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'sales'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.sales';
  END IF;
END $$;
-- ===== 20260821111813_d9331af0-42b8-49ea-8ec1-8d0f09e6dd53.sql =====


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

-- ===== 20260821111830_2898cc7a-c2ed-4908-9f4d-7d6ed2564eb7.sql =====


REVOKE ALL ON FUNCTION public.apply_worker_sale_stock() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.apply_worker_delivery_stock() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.is_shop_member(uuid) FROM anon, public;
REVOKE ALL ON FUNCTION public.redeem_staff_invite(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.redeem_staff_invite(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_shop_member(uuid) TO authenticated;

-- ===== 20260821135114_7967fe5c-ee18-4cc9-be1b-eee1e7ac24f1.sql =====

ALTER TABLE public.staff_invites ALTER COLUMN expires_at SET DEFAULT now() + interval '30 days';
UPDATE public.staff_invites SET expires_at = created_at + interval '30 days' WHERE used_at IS NULL;
-- ===== 20260902072438_8d524a5b-771e-48a3-a445-eb91ae454c05.sql =====


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

-- ===== 20260902072449_73097e42-23d2-4855-ae65-a7a426fd4a6a.sql =====


CREATE OR REPLACE FUNCTION public.normalize_code(p text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path TO 'public' AS $$
  SELECT upper(regexp_replace(coalesce(p,''), '[^A-Za-z0-9]', '', 'g'));
$$;
REVOKE EXECUTE ON FUNCTION public.check_staff_invite(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.normalize_code(text) FROM anon;

-- ===== 20260910113400_live_cloud_inventory.sql =====

-- Live cloud inventory consistency for worker-originated stock adjustments.
CREATE OR REPLACE FUNCTION public.apply_worker_adjustment_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() = NEW.owner_id THEN
    RETURN NEW;
  END IF;

  UPDATE public.products p
     SET stock = GREATEST(NEW.after, 0), updated_at = now()
   WHERE p.owner_id = NEW.owner_id
     AND p.id = NEW.product_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_worker_adjustment_stock ON public.adjustments;
CREATE TRIGGER trg_worker_adjustment_stock
AFTER INSERT ON public.adjustments
FOR EACH ROW EXECUTE FUNCTION public.apply_worker_adjustment_stock();

REVOKE EXECUTE ON FUNCTION public.apply_worker_adjustment_stock() FROM anon, authenticated, public;

-- ===== 20260910113500_realtime_inventory.sql =====

-- Enable live inventory updates for the management dashboard.
ALTER TABLE public.products REPLICA IDENTITY FULL;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'products'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.products';
  END IF;
END $$;

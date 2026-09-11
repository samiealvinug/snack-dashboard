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

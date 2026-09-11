
REVOKE ALL ON FUNCTION public.apply_worker_sale_stock() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.apply_worker_delivery_stock() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.is_shop_member(uuid) FROM anon, public;
REVOKE ALL ON FUNCTION public.redeem_staff_invite(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.redeem_staff_invite(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_shop_member(uuid) TO authenticated;

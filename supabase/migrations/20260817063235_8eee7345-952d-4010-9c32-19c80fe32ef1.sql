CREATE INDEX IF NOT EXISTS idx_sales_owner_date ON public.sales (owner_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_owner_date ON public.expenses (owner_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_deliveries_owner_date ON public.deliveries (owner_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_adjustments_owner_date ON public.adjustments (owner_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_products_owner_name ON public.products (owner_id, name);
CREATE INDEX IF NOT EXISTS idx_staff_owner ON public.staff (owner_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_owner ON public.suppliers (owner_id);
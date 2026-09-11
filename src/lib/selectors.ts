import type { Product, ShopState } from "./types";

export type StockStatus = "in" | "low" | "out";

export function stockStatus(p: Product): StockStatus {
  if (p.stock <= 0) return "out";
  if (p.stock <= p.minStock) return "low";
  return "in";
}

export const STATUS_LABEL: Record<StockStatus, string> = {
  in: "In Stock",
  low: "Running Low",
  out: "Finished",
};

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function metrics(s: ShopState) {
  const now = new Date();
  const today = startOfDay(now).getTime();
  const week = today - 6 * 86400000;
  const month = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  const sum = (from: number) =>
    s.sales.filter((x) => new Date(x.date).getTime() >= from).reduce((a, x) => a + x.total, 0);

  const revenue = s.sales.reduce((a, x) => a + x.total, 0);
  const cogs = s.sales.reduce((a, x) => a + x.cogs, 0);
  const expenses = s.expenses.reduce((a, x) => a + x.amount, 0);
  const lowStock = s.products.filter((p) => p.stock <= p.minStock);

  return {
    today: sum(today),
    week: sum(week),
    month: sum(month),
    revenue,
    cogs,
    expenses,
    grossProfit: revenue - cogs,
    netProfit: revenue - cogs - expenses,
    margin: revenue > 0 ? ((revenue - cogs) / revenue) * 100 : 0,
    lowStock,
    stockUnits: s.products.reduce((a, p) => a + p.stock, 0),
    stockValue: s.products.reduce((a, p) => a + p.stock * p.cost, 0),
    salesCount: s.sales.length,
  };
}

export function last7Days(s: ShopState) {
  const out: { day: string; sales: number; profit: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = startOfDay(new Date(Date.now() - i * 86400000));
    const next = d.getTime() + 86400000;
    const rows = s.sales.filter((x) => {
      const t = new Date(x.date).getTime();
      return t >= d.getTime() && t < next;
    });
    out.push({
      day: d.toLocaleDateString("en-UG", { weekday: "short" }),
      sales: rows.reduce((a, x) => a + x.total, 0),
      profit: rows.reduce((a, x) => a + (x.total - x.cogs), 0),
    });
  }
  return out;
}

export function topSellers(s: ShopState, limit = 6) {
  const map = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const sale of s.sales) {
    for (const item of sale.items) {
      const cur = map.get(item.productId) ?? { name: item.name, qty: 0, revenue: 0 };
      cur.qty += item.qty;
      cur.revenue += item.qty * item.price;
      map.set(item.productId, cur);
    }
  }
  return [...map.values()].sort((a, b) => b.qty - a.qty).slice(0, limit);
}

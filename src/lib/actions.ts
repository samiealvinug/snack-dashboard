import { setState, uid, getShop } from "./store";
import type {
  Adjustment,
  Delivery,
  Expense,
  Product,
  Sale,
  SaleItem,
  Staff,
  Supplier,
  PaymentMethod,
} from "./types";

export function addProduct(p: Omit<Product, "id">) {
  const product: Product = { ...p, id: uid("p") };
  setState((s) => ({ ...s, products: [product, ...s.products] }));
  return product;
}

export function updateProduct(id: string, patch: Partial<Product>) {
  setState((s) => ({
    ...s,
    products: s.products.map((p) => (p.id === id ? { ...p, ...patch } : p)),
  }));
}

export function deleteProduct(id: string) {
  setState((s) => ({ ...s, products: s.products.filter((p) => p.id !== id) }));
}

export function recordSale(input: {
  items: SaleItem[];
  discount: number;
  payment: PaymentMethod;
  cashGiven?: number;
}): Sale {
  const s = getShop();
  const staff = s.staff.find((x) => x.id === s.activeStaffId) ?? s.staff[0]!;
  const subtotal = input.items.reduce((a, i) => a + i.price * i.qty, 0);
  const taxable = Math.max(subtotal - input.discount, 0);
  const tax = Math.round((taxable * s.taxRate) / 100);
  const total = taxable + tax;
  const cogs = input.items.reduce((a, i) => a + i.cost * i.qty, 0);
  const sale: Sale = {
    id: uid("sale"),
    receiptNo: `R-${String(s.sales.length + 1).padStart(5, "0")}`,
    date: new Date().toISOString(),
    items: input.items,
    subtotal,
    discount: input.discount,
    tax,
    total,
    cogs,
    payment: input.payment,
    cashGiven: input.cashGiven,
    change: input.cashGiven != null ? Math.max(input.cashGiven - total, 0) : undefined,
    staffId: staff.id,
    staffName: staff.name,
  };
  setState((st) => ({
    ...st,
    sales: [sale, ...st.sales],
    products: st.products.map((p) => {
      const item = input.items.find((i) => i.productId === p.id);
      return item ? { ...p, stock: Math.max(p.stock - item.qty, 0) } : p;
    }),
  }));
  return sale;
}

export function addExpense(e: Omit<Expense, "id">) {
  setState((s) => ({ ...s, expenses: [{ ...e, id: uid("exp") }, ...s.expenses] }));
}

export function deleteExpense(id: string) {
  setState((s) => ({ ...s, expenses: s.expenses.filter((e) => e.id !== id) }));
}

export function addSupplier(sup: Omit<Supplier, "id">) {
  setState((s) => ({ ...s, suppliers: [{ ...sup, id: uid("sup") }, ...s.suppliers] }));
}

export function deleteSupplier(id: string) {
  setState((s) => ({ ...s, suppliers: s.suppliers.filter((x) => x.id !== id) }));
}

export function receiveDelivery(d: Omit<Delivery, "id" | "total" | "staffName">) {
  const s = getShop();
  const staff = s.staff.find((x) => x.id === s.activeStaffId) ?? s.staff[0]!;
  const total = d.items.reduce((a, i) => a + i.qty * i.cost, 0);
  const delivery: Delivery = { ...d, id: uid("del"), total, staffName: staff.name };
  setState((st) => ({
    ...st,
    deliveries: [delivery, ...st.deliveries],
    products: st.products.map((p) => {
      const item = delivery.items.find((i) => i.productId === p.id);
      return item ? { ...p, stock: p.stock + item.qty, cost: item.cost || p.cost } : p;
    }),
  }));
  return delivery;
}

export function adjustStock(productId: string, after: number, reason: string) {
  const s = getShop();
  const product = s.products.find((p) => p.id === productId);
  if (!product) return;
  const staff = s.staff.find((x) => x.id === s.activeStaffId) ?? s.staff[0]!;
  const adj: Adjustment = {
    id: uid("adj"),
    date: new Date().toISOString(),
    productId,
    productName: product.name,
    before: product.stock,
    after,
    reason,
    staffName: staff.name,
  };
  setState((st) => ({
    ...st,
    adjustments: [adj, ...st.adjustments],
    products: st.products.map((p) => (p.id === productId ? { ...p, stock: after } : p)),
  }));
}

export function setActiveStaff(id: string) {
  setState((s) => ({ ...s, activeStaffId: id }));
}

export function addStaff(st: Omit<Staff, "id">) {
  setState((s) => ({ ...s, staff: [...s.staff, { ...st, id: uid("stf") }] }));
}

export function removeStaff(id: string) {
  setState((s) => ({
    ...s,
    staff: s.staff.filter((x) => x.id !== id),
    activeStaffId: s.activeStaffId === id ? (s.staff.find((x) => x.id !== id)?.id ?? "") : s.activeStaffId,
  }));
}

export function setTaxRate(rate: number) {
  setState((s) => ({ ...s, taxRate: rate }));
}

import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getShop, replaceState, subscribeStore } from "./store";
import { ugx } from "./currency";
import { playCashChime } from "./sound";
import { seedState } from "./seed";
import type {
  Adjustment,
  Delivery,
  Expense,
  PaymentMethod,
  Product,
  Sale,
  SaleItem,
  ShopState,
  Staff,
  Supplier,
} from "./types";

export type SyncStatus = "disconnected" | "syncing" | "synced" | "error";

type CloudListener = () => void;

let status: SyncStatus = "disconnected";
let userEmail: string | null = null;
let userId: string | null = null;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let pulling = false;
let started = false;
const listeners = new Set<CloudListener>();

type CloudSnapshot = { status: SyncStatus; email: string | null; signedIn: boolean; ready: boolean };

let snapshot: CloudSnapshot = { status: "disconnected", email: null, signedIn: false, ready: false };

function emit() {
  snapshot = { status, email: userEmail, signedIn: Boolean(userId), ready: snapshot.ready };
  listeners.forEach((l) => l());
}

function setStatus(next: SyncStatus) {
  if (status !== next) {
    status = next;
    emit();
  }
}

export function subscribeCloud(cb: CloudListener) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function cloudSnapshot(): CloudSnapshot {
  return snapshot;
}


const num = (v: unknown, d = 0) => (typeof v === "number" ? v : Number(v ?? d) || d);

/* ---------------- mappers ---------------- */

function productRow(p: Product, owner: string) {
  return {
    id: p.id,
    owner_id: owner,
    name: p.name,
    category: String(p.category),
    sku: p.sku,
    barcode: p.barcode,
    cost: p.cost,
    price: p.price,
    stock: p.stock,
    min_stock: p.minStock,
    unit: p.unit,
    image: p.image ?? null,
  };
}

function saleRow(s: Sale, owner: string) {
  return {
    id: s.id,
    owner_id: owner,
    receipt_no: s.receiptNo,
    date: s.date,
    items: s.items,
    subtotal: s.subtotal,
    discount: s.discount,
    tax: s.tax,
    total: s.total,
    cogs: s.cogs,
    payment: s.payment,
    cash_given: s.cashGiven ?? null,
    change: s.change ?? null,
    staff_id: s.staffId,
    staff_name: s.staffName,
  };
}

function deliveryRow(d: Delivery, owner: string) {
  return {
    id: d.id,
    owner_id: owner,
    supplier: d.supplier,
    reference: d.reference,
    date: d.date,
    notes: d.notes,
    items: d.items,
    total: d.total,
    staff_name: d.staffName,
  };
}

function adjustmentRow(a: Adjustment, owner: string) {
  return {
    id: a.id,
    owner_id: owner,
    date: a.date,
    product_id: a.productId,
    product_name: a.productName,
    before: a.before,
    after: a.after,
    reason: a.reason,
    staff_name: a.staffName,
  };
}

/* ---------------- pull ---------------- */

export async function pullFromCloud(): Promise<void> {
  if (!userId) return;
  pulling = true;
  setStatus("syncing");
  try {
    const [products, sales, expenses, suppliers, deliveries, adjustments, staff, settings] =
      await Promise.all([
        supabase.from("products").select("*"),
        supabase.from("sales").select("*").order("date", { ascending: false }).limit(1000),
        supabase.from("expenses").select("*").order("date", { ascending: false }).limit(1000),
        supabase.from("suppliers").select("*"),
        supabase.from("deliveries").select("*").order("date", { ascending: false }).limit(500),
        supabase.from("adjustments").select("*").order("date", { ascending: false }).limit(500),
        supabase.from("staff").select("*"),
        supabase.from("shop_settings").select("*").maybeSingle(),
      ]);

    const empty =
      (products.data?.length ?? 0) === 0 &&
      (staff.data?.length ?? 0) === 0 &&
      (sales.data?.length ?? 0) === 0;

    if (empty) {
      // First sign-in on this account: upload what is already on the device.
      await pushAll(getShop());
      setStatus("synced");
      return;
    }

    const next: ShopState = {
      products: (products.data ?? []).map((r) => ({
        id: r.id,
        name: r.name,
        category: r.category,
        sku: r.sku,
        barcode: r.barcode,
        cost: num(r.cost),
        price: num(r.price),
        stock: num(r.stock),
        minStock: num(r.min_stock),
        unit: r.unit,
        image: r.image ?? undefined,
      })),
      sales: (sales.data ?? []).map((r) => ({
        id: r.id,
        receiptNo: r.receipt_no,
        date: r.date,
        items: (r.items ?? []) as unknown as SaleItem[],
        subtotal: num(r.subtotal),
        discount: num(r.discount),
        tax: num(r.tax),
        total: num(r.total),
        cogs: num(r.cogs),
        payment: r.payment as PaymentMethod,
        cashGiven: r.cash_given == null ? undefined : num(r.cash_given),
        change: r.change == null ? undefined : num(r.change),
        staffId: r.staff_id,
        staffName: r.staff_name,
      })),
      expenses: (expenses.data ?? []).map(
        (r): Expense => ({
          id: r.id,
          date: r.date,
          category: r.category,
          amount: num(r.amount),
          note: r.note,
          payment: r.payment as PaymentMethod,
        }),
      ),
      suppliers: (suppliers.data ?? []).map(
        (r): Supplier => ({
          id: r.id,
          name: r.name,
          contact: r.contact,
          phone: r.phone,
          email: r.email,
          address: r.address,
        }),
      ),
      deliveries: (deliveries.data ?? []).map(
        (r): Delivery => ({
          id: r.id,
          supplier: r.supplier,
          reference: r.reference,
          date: r.date,
          notes: r.notes,
          items: (r.items ?? []) as unknown as Delivery["items"],
          total: num(r.total),
          staffName: r.staff_name,
        }),
      ),
      adjustments: (adjustments.data ?? []).map(
        (r): Adjustment => ({
          id: r.id,
          date: r.date,
          productId: r.product_id,
          productName: r.product_name,
          before: num(r.before),
          after: num(r.after),
          reason: r.reason,
          staffName: r.staff_name,
        }),
      ),
      staff: (staff.data ?? []).map(
        (r): Staff => ({
          id: r.id,
          name: r.name,
          role: r.role === "Admin" ? "Admin" : "Cashier",
          pin: r.pin,
          color: r.color,
        }),
      ),
      activeStaffId: settings.data?.active_staff_id || (staff.data?.[0]?.id ?? ""),
      taxRate: num(settings.data?.tax_rate),
    };

    if (next.staff.length === 0) next.staff = seedState().staff;
    if (!next.activeStaffId) next.activeStaffId = next.staff[0]?.id ?? "";

    replaceState(next);
    setStatus("synced");
  } catch (err) {
    console.error("cloud pull failed", err);
    setStatus("error");
  } finally {
    pulling = false;
  }
}

/* ---------------- push ---------------- */

async function replaceTable(
  table: "products" | "sales" | "expenses" | "suppliers" | "deliveries" | "adjustments" | "staff",
  rows: Array<Record<string, unknown>>,
  ids: string[],
) {
  if (rows.length) {
    const { error } = await supabase.from(table).upsert(rows as never, { onConflict: "owner_id,id" });
    if (error) throw error;
  }
  const del = supabase.from(table).delete().eq("owner_id", userId!);
  const { error: delError } = ids.length
    ? await del.not("id", "in", `(${ids.map((i) => `"${i}"`).join(",")})`)
    : await del;
  if (delError) throw delError;
}

export async function pushAll(state: ShopState) {
  const owner = userId;
  if (!owner) return;
  setStatus("syncing");
  try {
    await replaceTable(
      "products",
      state.products.map((p) => productRow(p, owner)),
      state.products.map((p) => p.id),
    );
    await replaceTable(
      "staff",
      state.staff.map((s) => ({
        id: s.id,
        owner_id: owner,
        name: s.name,
        role: s.role,
        pin: s.pin,
        color: s.color,
      })),
      state.staff.map((s) => s.id),
    );
    await replaceTable(
      "suppliers",
      state.suppliers.map((s) => ({ ...s, owner_id: owner })),
      state.suppliers.map((s) => s.id),
    );
    await replaceTable(
      "sales",
      state.sales.map((s) => saleRow(s, owner)),
      state.sales.map((s) => s.id),
    );
    await replaceTable(
      "expenses",
      state.expenses.map((e) => ({ ...e, owner_id: owner })),
      state.expenses.map((e) => e.id),
    );
    await replaceTable(
      "deliveries",
      state.deliveries.map((d) => deliveryRow(d, owner)),
      state.deliveries.map((d) => d.id),
    );
    await replaceTable(
      "adjustments",
      state.adjustments.map((a) => adjustmentRow(a, owner)),
      state.adjustments.map((a) => a.id),
    );

    const { error } = await supabase.from("shop_settings").upsert(
      {
        owner_id: owner,
        tax_rate: state.taxRate,
        active_staff_id: state.activeStaffId,
      },
      { onConflict: "owner_id" },
    );
    if (error) throw error;

    setStatus("synced");
  } catch (err) {
    console.error("cloud push failed", err);
    setStatus("error");
  }
}

function schedulePush() {
  if (!userId || pulling) return;
  if (pushTimer) clearTimeout(pushTimer);
  setStatus("syncing");
  pushTimer = setTimeout(() => {
    pushTimer = null;
    void pushAll(getShop());
  }, 900);
}

/* ---------------- realtime: live sales feed ---------------- */

let salesChannel: ReturnType<typeof supabase.channel> | null = null;
let productChannel: ReturnType<typeof supabase.channel> | null = null;
let salesRealtimeAttempt = 0;
let productRealtimeAttempt = 0;

function rowToSale(r: Record<string, unknown>): Sale {
  return {
    id: String(r["id"]),
    receiptNo: String(r["receipt_no"] ?? ""),
    date: String(r["date"] ?? new Date().toISOString()),
    items: (r["items"] ?? []) as unknown as SaleItem[],
    subtotal: num(r["subtotal"]),
    discount: num(r["discount"]),
    tax: num(r["tax"]),
    total: num(r["total"]),
    cogs: num(r["cogs"]),
    payment: (r["payment"] ?? "Cash") as PaymentMethod,
    cashGiven: r["cash_given"] == null ? undefined : num(r["cash_given"]),
    change: r["change"] == null ? undefined : num(r["change"]),
    staffId: String(r["staff_id"] ?? ""),
    staffName: String(r["staff_name"] ?? ""),
  };
}

/** Merge a sale that arrived from another device without pushing back to the cloud. */
function mergeRemoteSale(sale: Sale) {
  const current = getShop();
  if (current.sales.some((s) => s.id === sale.id)) return;

  const next: ShopState = {
    ...current,
    sales: [sale, ...current.sales],
    products: current.products.map((p) => {
      const item = sale.items.find((i) => i.productId === p.id);
      return item ? { ...p, stock: Math.max(p.stock - item.qty, 0) } : p;
    }),
  };

  pulling = true; // suppress the push-back triggered by the store update
  replaceState(next);
  pulling = false;

  const summary = sale.items.map((i) => `${i.qty}× ${i.name}`).join(", ");
  playCashChime();
  toast.success(`New sale — ${ugx(sale.total)}`, {
    description: `${summary || sale.receiptNo} · ${sale.staffName || "Staff"} · ${sale.payment}`,
    duration: 8000,
  });
}

let resubscribeTimer: ReturnType<typeof setTimeout> | null = null;

async function startSalesRealtime() {
  if (!userId) return;
  stopSalesRealtime();
  const attempt = ++salesRealtimeAttempt;
  const owner = userId;

  // Realtime RLS needs the user's access token on the socket.
  const { data } = await supabase.auth.getSession();
  if (attempt !== salesRealtimeAttempt || userId !== owner) return;
  const token = data.session?.access_token;
  if (token) supabase.realtime.setAuth(token);

  salesChannel = supabase
    .channel(`sales-live-${owner}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "sales", filter: `owner_id=eq.${owner}` },
      (payload) => {
        const row = (payload.new ?? {}) as Record<string, unknown>;
        if (!row?.["id"]) return;
        mergeRemoteSale(rowToSale(row));
      },
    )
    .subscribe((state) => {
      if (state === "CHANNEL_ERROR" || state === "TIMED_OUT" || state === "CLOSED") {
        // Socket dropped — reconnect shortly and catch up by polling now.
        void pollRecentSales();
        if (resubscribeTimer) clearTimeout(resubscribeTimer);
        resubscribeTimer = setTimeout(() => {
          resubscribeTimer = null;
          if (userId === owner) void startSalesRealtime();
        }, 4000);
      }
    });

  startSalesPolling();
  void startProductRealtime();
}

async function startProductRealtime() {
  if (!userId) return;
  if (productChannel) await supabase.removeChannel(productChannel);
  const attempt = ++productRealtimeAttempt;
  const owner = userId;
  const { data } = await supabase.auth.getSession();
  if (attempt !== productRealtimeAttempt || userId !== owner) return;
  const token = data.session?.access_token;
  if (token) supabase.realtime.setAuth(token);

  productChannel = supabase
    .channel(`products-live-${owner}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "products", filter: `owner_id=eq.${owner}` },
      () => {
        // Pull the authoritative stock/prices from Supabase. This keeps inventory exact after
        // a mobile sale, delivery, or stock adjustment and never pushes the change back.
        void pullFromCloud();
      },
    )
    .subscribe((state) => {
      if (state === "CHANNEL_ERROR" || state === "TIMED_OUT" || state === "CLOSED") {
        setTimeout(() => {
          if (userId === owner) void startProductRealtime();
        }, 4000);
      }
    });
}

/* Fallback: poll recent sales so nothing is missed if the socket drops. */
let pollTimer: ReturnType<typeof setInterval> | null = null;

async function pollRecentSales() {
  if (!userId || pulling || (typeof document !== "undefined" && document.hidden)) return;
  const { data, error } = await supabase
    .from("sales")
    .select("*")
    .order("date", { ascending: false })
    .limit(20);
  if (error || !data) return;
  const known = new Set(getShop().sales.map((s) => s.id));
  data
    .filter((r) => !known.has(r.id))
    .reverse()
    .forEach((r) => mergeRemoteSale(rowToSale(r as unknown as Record<string, unknown>)));
}

function startSalesPolling() {
  if (pollTimer) clearInterval(pollTimer);
  void pollRecentSales();
  pollTimer = setInterval(() => void pollRecentSales(), 6000);
}

function stopSalesRealtime() {
  salesRealtimeAttempt += 1;
  productRealtimeAttempt += 1;
  if (resubscribeTimer) {
    clearTimeout(resubscribeTimer);
    resubscribeTimer = null;
  }
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  if (salesChannel) {
    void supabase.removeChannel(salesChannel);
    salesChannel = null;
  }
  if (productChannel) {
    void supabase.removeChannel(productChannel);
    productChannel = null;
  }
}


/* ---------------- lifecycle ---------------- */

export function startCloudSync() {
  if (started || typeof window === "undefined") return;
  started = true;

  subscribeStore(schedulePush);

  // Retry the last state when the device comes back online.
  window.addEventListener("online", () => {
    if (!userId) return;
    void pushAll(getShop());
    void pollRecentSales();
    void startSalesRealtime();
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) void pollRecentSales();
  });

  window.addEventListener("focus", () => void pollRecentSales());


  void supabase.auth.getSession().then(({ data }) => {
    applySession(data.session?.user.id ?? null, data.session?.user.email ?? null, true);
  });

  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "INITIAL_SESSION") return;
    if (event === "TOKEN_REFRESHED") {
      // Keep the realtime socket authorised, otherwise RLS silently drops events.
      if (session?.access_token) supabase.realtime.setAuth(session.access_token);
      return;
    }
    applySession(session?.user.id ?? null, session?.user.email ?? null, event === "SIGNED_IN");
  });
}


function applySession(id: string | null, email: string | null, pull: boolean) {
  const changed = id !== userId;
  userId = id;
  userEmail = email;
  snapshot = { ...snapshot, ready: true };
  if (!id) {
    stopSalesRealtime();
    setStatus("disconnected");
    emit();
    return;
  }
  emit();
  if (pull || changed) void pullFromCloud();
  void startSalesRealtime();
}


export async function signOutCloud() {
  stopSalesRealtime();
  await supabase.auth.signOut();
  userId = null;
  userEmail = null;
  setStatus("disconnected");
  emit();
}

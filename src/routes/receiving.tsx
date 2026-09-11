import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ClipboardCheck, Minus, PackagePlus, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useShopState } from "@/lib/store";
import { adjustStock, receiveDelivery } from "@/lib/actions";
import { ugx } from "@/lib/currency";
import { playBeep, playCashChime } from "@/lib/sound";
import type { DeliveryItem } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import { Field, inputCls } from "./catalog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/receiving")({
  head: () => ({
    meta: [
      { title: "Stock Receiving & Audit Hub — Julienne General Enterprises" },
      {
        name: "description",
        content:
          "Register supplier deliveries, adjust buying cost per unit, preview stock increases and run physical shelf count audits.",
      },
      { property: "og:title", content: "Stock Receiving & Audit Hub — Julienne General Enterprises" },
      { property: "og:description", content: "Log snack deliveries and shelf recounts with a clear audit trail." },
    ],
  }),
  component: ReceivingPage,
});

const PRESETS = [10, 20, 50, 100];
const REASONS = [
  "Routine audit",
  "Damaged / Expired stock write-off",
  "Theft / Loss",
  "Miscount correction",
  "Supplier return",
];

function ReceivingPage() {
  const { products, suppliers, deliveries, adjustments } = useShopState();
  const [tab, setTab] = useState<"receive" | "audit">("receive");

  const [supplier, setSupplier] = useState("");
  const [reference, setReference] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<DeliveryItem[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  const total = items.reduce((a, i) => a + i.qty * i.cost, 0);

  function save() {
    if (!supplier.trim()) {
      toast.error("Enter the supplier name");
      return;
    }
    if (items.length === 0) {
      toast.error("Add at least one item to the delivery");
      return;
    }
    receiveDelivery({ supplier, reference, date: new Date(date).toISOString(), notes, items });
    playCashChime();
    toast.success(`Delivery received — ${ugx(total)}`, { description: `${items.length} item(s) added to shelf stock` });
    setSupplier("");
    setReference("");
    setNotes("");
    setItems([]);
  }

  return (
    <div>
      <header className="mb-5">
        <h1 className="text-2xl font-extrabold">Stock Receiving</h1>
        <p className="text-sm text-muted-foreground">Record deliveries and recount the shelf</p>
      </header>

      <div className="mb-5 flex gap-2  border border-border bg-card p-1.5">
        {(["receive", "audit"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2  py-3 font-bold",
              tab === t ? "bg-primary text-primary-foreground" : "hover:bg-accent",
            )}
          >
            {t === "receive" ? <PackagePlus className="size-5" /> : <ClipboardCheck className="size-5" />}
            {t === "receive" ? "New delivery" : "Physical count audit"}
          </button>
        ))}
      </div>

      {tab === "receive" ? (
        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <section className=" border border-border bg-card p-5 shadow-card">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Supplier name">
                <input
                  className={inputCls}
                  list="supplier-list"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  placeholder="Start typing…"
                />
                <datalist id="supplier-list">
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.name} />
                  ))}
                </datalist>
              </Field>
              <Field label="Invoice / Reference #">
                <input className={inputCls} value={reference} onChange={(e) => setReference(e.target.value)} />
              </Field>
              <Field label="Date received">
                <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
              </Field>
              <Field label="Delivery notes">
                <input className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </Field>
            </div>

            <button
              onClick={() => setPickerOpen(true)}
              className="mt-4 flex h-14 w-full items-center justify-center gap-2  border-2 border-dashed border-primary text-base font-extrabold text-primary"
            >
              <Plus className="size-5" /> Add item via form
            </button>

            <div className="mt-4 space-y-2">
              {items.map((i, idx) => (
                <div key={i.productId} className="flex items-center gap-3  bg-muted p-3">
                  <div className="mr-auto">
                    <p className="font-bold">{i.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {i.qty} × {ugx(i.cost)}
                    </p>
                  </div>
                  <span className="tabular font-extrabold">{ugx(i.qty * i.cost)}</span>
                  <button
                    onClick={() => setItems((c) => c.filter((_, n) => n !== idx))}
                    className=" p-2 text-danger hover:bg-danger-soft"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
              {items.length === 0 && (
                <p className=" border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  No items on this delivery yet.
                </p>
              )}
            </div>
          </section>

          <aside className="h-fit  border border-border bg-card p-5 shadow-card lg:sticky lg:top-24">
            <h2 className="text-lg font-extrabold">Delivery summary</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <SumRow label="Supplier" value={supplier || "—"} />
              <SumRow label="Reference" value={reference || "—"} />
              <SumRow label="Items" value={String(items.length)} />
              <SumRow label="Total units" value={String(items.reduce((a, i) => a + i.qty, 0))} />
            </dl>
            <div className="mt-3 flex items-center justify-between  bg-brand-soft px-3 py-3">
              <span className="font-extrabold">Delivery value</span>
              <span className="metric text-xl text-primary">{ugx(total)}</span>
            </div>
            <button
              onClick={save}
              className="mt-4 h-14 w-full  bg-primary text-lg font-extrabold text-primary-foreground shadow-lift"
            >
              Save &amp; add to stock
            </button>
          </aside>
        </div>
      ) : (
        <AuditPanel />
      )}

      <h2 className="mb-3 mt-8 text-xl font-extrabold">
        {tab === "receive" ? "Recent deliveries" : "Adjustment log"}
      </h2>
      <div className="overflow-x-auto  border border-border bg-card shadow-card">
        {tab === "receive" ? (
          <table className="w-full min-w-[700px] text-sm">
            <thead className="bg-muted text-left text-xs uppercase text-muted-foreground">
              <tr>
                {["Date", "Supplier", "Ref", "Items", "Value", "By"].map((h) => (
                  <th key={h} className="px-4 py-3 font-bold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deliveries.map((d) => (
                <tr key={d.id} className="border-t border-border">
                  <td className="px-4 py-3">{new Date(d.date).toLocaleDateString("en-UG")}</td>
                  <td className="px-4 py-3 font-bold">{d.supplier}</td>
                  <td className="px-4 py-3 text-muted-foreground">{d.reference || "—"}</td>
                  <td className="px-4 py-3">{d.items.length}</td>
                  <td className="tabular px-4 py-3 font-bold">{ugx(d.total)}</td>
                  <td className="px-4 py-3">{d.staffName}</td>
                </tr>
              ))}
              {deliveries.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No deliveries yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          <table className="w-full min-w-[700px] text-sm">
            <thead className="bg-muted text-left text-xs uppercase text-muted-foreground">
              <tr>
                {["Date", "Snack", "Before", "After", "Difference", "Reason", "By"].map((h) => (
                  <th key={h} className="px-4 py-3 font-bold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {adjustments.map((a) => (
                <tr key={a.id} className="border-t border-border">
                  <td className="px-4 py-3">{new Date(a.date).toLocaleDateString("en-UG")}</td>
                  <td className="px-4 py-3 font-bold">{a.productName}</td>
                  <td className="tabular px-4 py-3">{a.before}</td>
                  <td className="tabular px-4 py-3">{a.after}</td>
                  <td
                    className={cn(
                      "tabular px-4 py-3 font-bold",
                      a.after - a.before < 0 ? "text-danger" : "text-success",
                    )}
                  >
                    {a.after - a.before > 0 ? "+" : ""}
                    {a.after - a.before}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{a.reason}</td>
                  <td className="px-4 py-3">{a.staffName}</td>
                </tr>
              ))}
              {adjustments.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No stock adjustments logged.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {pickerOpen && (
        <AddItemModal
          onClose={() => setPickerOpen(false)}
          onAdd={(item) => {
            setItems((c) => {
              const found = c.find((i) => i.productId === item.productId);
              return found
                ? c.map((i) => (i.productId === item.productId ? { ...i, qty: i.qty + item.qty, cost: item.cost } : i))
                : [...c, item];
            });
            setPickerOpen(false);
            playBeep();
            toast.success(`${item.name} added to delivery`);
          }}
        />
      )}
    </div>
  );
}

function SumRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="truncate font-bold">{value}</dd>
    </div>
  );
}

function AddItemModal({ onClose, onAdd }: { onClose: () => void; onAdd: (i: DeliveryItem) => void }) {
  const { products } = useShopState();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [qty, setQty] = useState(10);
  const [cost, setCost] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  }, [products, query]);

  const selected = products.find((p) => p.id === selectedId) ?? null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-foreground/50 sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full max-w-lg overflow-auto  bg-card p-5 shadow-lift ">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-extrabold">Add item to delivery</h2>
          <button onClick={onClose} className=" p-2 hover:bg-accent">
            <X className="size-5" />
          </button>
        </div>

        {!selected ? (
          <>
            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search catalog…"
                className="h-12 w-full  border border-border bg-background pl-12 pr-3 font-semibold outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="max-h-80 space-y-2 overflow-auto">
              {filtered.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedId(p.id);
                    setCost(p.cost);
                  }}
                  className="flex w-full items-center gap-3  border border-border p-3 text-left hover:bg-accent"
                >
                  <div className="mr-auto">
                    <p className="font-bold">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.stock} {p.unit} on shelf · buy {ugx(p.cost)}
                    </p>
                  </div>
                  <StatusBadge product={p} />
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className=" bg-muted p-3">
              <p className="font-extrabold">{selected.name}</p>
              <p className="text-xs text-muted-foreground">
                {selected.sku} · unit: {selected.unit}
              </p>
            </div>

            <p className="mb-2 mt-4 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Quantity received
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQty((q) => Math.max(q - 1, 1))}
                className="grid size-14 place-items-center  border border-border active:scale-95"
              >
                <Minus className="size-5" />
              </button>
              <input
                type="number"
                value={qty}
                onChange={(e) => setQty(Math.max(Number(e.target.value) || 0, 0))}
                className="metric h-14 flex-1  border border-border bg-background text-center text-2xl outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                onClick={() => setQty((q) => q + 1)}
                className="grid size-14 place-items-center  bg-primary text-primary-foreground active:scale-95"
              >
                <Plus className="size-5" />
              </button>
            </div>
            <div className="mt-2 flex gap-2">
              {PRESETS.map((n) => (
                <button
                  key={n}
                  onClick={() => setQty((q) => q + n)}
                  className="flex-1  border border-border py-2.5 text-sm font-bold hover:bg-accent"
                >
                  +{n}
                </button>
              ))}
            </div>

            <div className="mt-4">
              <Field label="Buying cost per unit (UGX)">
                <input
                  type="number"
                  className={inputCls}
                  value={cost || ""}
                  onChange={(e) => setCost(Number(e.target.value) || 0)}
                />
              </Field>
            </div>

            <div className="mt-4 flex items-center justify-between  bg-success-soft px-4 py-3">
              <span className="font-bold text-success">Stock preview</span>
              <span className="metric text-lg text-success">
                {selected.stock} → {selected.stock + qty} {selected.unit}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between  bg-brand-soft px-4 py-3">
              <span className="font-bold">Line value</span>
              <span className="metric text-lg text-primary">{ugx(qty * cost)}</span>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setSelectedId(null)}
                className=" border border-border px-4 py-3.5 font-bold"
              >
                Back
              </button>
              <button
                onClick={() => onAdd({ productId: selected.id, name: selected.name, qty, cost })}
                className="h-14 flex-1  bg-primary font-extrabold text-primary-foreground"
              >
                Add to delivery
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function AuditPanel() {
  const { products } = useShopState();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [reason, setReason] = useState(REASONS[0]!);

  return (
    <section className=" border border-border bg-card p-5 shadow-card">
      <div className="mb-3 max-w-sm">
        <Field label="Adjustment reason">
          <select className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)}>
            {REASONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </Field>
      </div>
      <div className="space-y-2">
        {products.map((p) => {
          const counted = counts[p.id];
          const diff = counted == null ? 0 : counted - p.stock;
          return (
            <div key={p.id} className="flex flex-wrap items-center gap-3  bg-muted p-3">
              <div className="mr-auto min-w-40">
                <p className="font-bold">{p.name}</p>
                <p className="text-xs text-muted-foreground">
                  System: {p.stock} {p.unit}
                </p>
              </div>
              <input
                type="number"
                placeholder="Counted"
                value={counted ?? ""}
                onChange={(e) =>
                  setCounts((c) => ({ ...c, [p.id]: Math.max(Number(e.target.value) || 0, 0) }))
                }
                className="h-12 w-28  border border-border bg-background px-3 text-center font-extrabold outline-none focus:ring-2 focus:ring-ring"
              />
              <span
                className={cn(
                  "tabular w-16 text-center font-extrabold",
                  diff < 0 ? "text-danger" : diff > 0 ? "text-success" : "text-muted-foreground",
                )}
              >
                {counted == null ? "—" : `${diff > 0 ? "+" : ""}${diff}`}
              </span>
              <button
                disabled={counted == null || diff === 0}
                onClick={() => {
                  adjustStock(p.id, counted!, reason);
                  setCounts((c) => {
                    const next = { ...c };
                    delete next[p.id];
                    return next;
                  });
                  toast.success(`${p.name} adjusted to ${counted}`);
                }}
                className=" bg-primary px-4 py-3 font-bold text-primary-foreground disabled:opacity-40"
              >
                Apply
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

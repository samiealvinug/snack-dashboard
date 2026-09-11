import { useMemo, useState } from "react";
import { Download, ChevronDown, Receipt } from "lucide-react";
import { ugx } from "@/lib/currency";
import { useShopState } from "@/lib/store";
import type { Sale } from "@/lib/types";
import { cn } from "@/lib/utils";

type RangeKey = "today" | "week" | "month" | "all";

const RANGES: { key: RangeKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "Last 7 days" },
  { key: "month", label: "This month" },
  { key: "all", label: "All time" },
];

function rangeStart(key: RangeKey) {
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  if (key === "today") return today.getTime();
  if (key === "week") return today.getTime() - 6 * 86400000;
  if (key === "month") return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  return 0;
}

function csvCell(v: string | number) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadCsv(sales: Sale[]) {
  const header = [
    "Receipt",
    "Date",
    "Time",
    "Cashier",
    "Payment",
    "Item",
    "Unit",
    "Qty",
    "Unit price (UGX)",
    "Line total (UGX)",
    "Sale subtotal",
    "Discount",
    "Tax",
    "Sale total",
    "Profit",
  ];
  const rows = [...sales]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .flatMap((s) => {
      const d = new Date(s.date);
      return s.items.map((i) => [
        s.receiptNo,
        d.toLocaleDateString("en-UG"),
        d.toLocaleTimeString("en-UG"),
        s.staffName,
        s.payment,
        i.name,
        i.unit,
        i.qty,
        i.price,
        i.qty * i.price,
        s.subtotal,
        s.discount,
        s.tax,
        s.total,
        s.total - s.cogs,
      ]);
    });
  const csv = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `sales-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function SalesHistory({ onOpenReceipt }: { onOpenReceipt?: (s: Sale) => void }) {
  const { sales } = useShopState();
  const [range, setRange] = useState<RangeKey>("today");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const rows = useMemo(() => {
    const from = rangeStart(range);
    const q = query.trim().toLowerCase();
    return sales.filter((s) => {
      if (new Date(s.date).getTime() < from) return false;
      if (!q) return true;
      return (
        s.receiptNo.toLowerCase().includes(q) ||
        s.staffName.toLowerCase().includes(q) ||
        s.payment.toLowerCase().includes(q) ||
        s.items.some((i) => i.name.toLowerCase().includes(q))
      );
    });
  }, [sales, range, query]);

  const totals = useMemo(
    () => ({
      count: rows.length,
      amount: rows.reduce((a, s) => a + s.total, 0),
      profit: rows.reduce((a, s) => a + (s.total - s.cogs), 0),
      units: rows.reduce((a, s) => a + s.items.reduce((b, i) => b + i.qty, 0), 0),
    }),
    [rows],
  );

  return (
    <section className="mt-8 border border-border bg-card shadow-card">
      <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
        <h2 className="text-lg font-extrabold">Sales transactions</h2>
        <span className="bg-muted px-2 py-1 text-xs font-bold text-muted-foreground">
          {totals.count} sale(s) · {totals.units} unit(s) · {ugx(totals.amount)}
        </span>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search receipt, snack, cashier…"
            className="h-11 w-56 border border-border bg-background px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-ring"
          />
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as RangeKey)}
            className="h-11 border border-border bg-background px-3 text-sm font-bold outline-none focus:ring-2 focus:ring-ring"
          >
            {RANGES.map((r) => (
              <option key={r.key} value={r.key}>
                {r.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => downloadCsv(rows)}
            disabled={rows.length === 0}
            className="flex h-11 items-center gap-2 bg-primary px-4 text-sm font-bold text-primary-foreground disabled:opacity-50"
          >
            <Download className="size-4" /> Download CSV
          </button>
        </div>
      </div>

      <ul className="divide-y divide-border">
        {rows.map((s) => {
          const isOpen = open === s.id;
          const d = new Date(s.date);
          return (
            <li key={s.id}>
              <button
                onClick={() => setOpen(isOpen ? null : s.id)}
                className="flex w-full items-center gap-3 p-4 text-left hover:bg-muted/50"
              >
                <span className="hidden w-28 shrink-0 font-mono text-sm font-bold sm:block">
                  {s.receiptNo}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">
                    {s.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {d.toLocaleString("en-UG")} · {s.staffName} · {s.payment}
                  </span>
                </span>
                <span className="tabular shrink-0 text-right font-extrabold">{ugx(s.total)}</span>
                <ChevronDown
                  className={cn("size-4 shrink-0 transition-transform", isOpen && "rotate-180")}
                />
              </button>

              {isOpen && (
                <div className="bg-muted/40 px-4 pb-4 pt-1 text-sm">
                  <table className="w-full">
                    <thead className="text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="py-1 text-left font-bold">Item</th>
                        <th className="py-1 text-right font-bold">Qty</th>
                        <th className="py-1 text-right font-bold">Price</th>
                        <th className="py-1 text-right font-bold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {s.items.map((i) => (
                        <tr key={i.productId} className="border-t border-border/60">
                          <td className="py-1 font-semibold">
                            {i.name}{" "}
                            <span className="text-xs text-muted-foreground">({i.unit})</span>
                          </td>
                          <td className="tabular py-1 text-right">{i.qty}</td>
                          <td className="tabular py-1 text-right">{ugx(i.price)}</td>
                          <td className="tabular py-1 text-right font-bold">
                            {ugx(i.qty * i.price)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-xs font-semibold text-muted-foreground">
                    <span>Subtotal: {ugx(s.subtotal)}</span>
                    {s.discount > 0 && <span>Discount: -{ugx(s.discount)}</span>}
                    {s.tax > 0 && <span>Tax: {ugx(s.tax)}</span>}
                    {s.cashGiven != null && (
                      <span>
                        Cash: {ugx(s.cashGiven)} · Change: {ugx(s.change ?? 0)}
                      </span>
                    )}
                    <span className="text-foreground">Profit: {ugx(s.total - s.cogs)}</span>
                  </div>
                  {onOpenReceipt && (
                    <button
                      onClick={() => onOpenReceipt(s)}
                      className="mt-3 flex items-center gap-2 border border-border bg-card px-3 py-2 text-xs font-bold"
                    >
                      <Receipt className="size-4" /> View receipt
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
        {rows.length === 0 && (
          <li className="p-10 text-center text-muted-foreground">
            No sales recorded for this period yet.
          </li>
        )}
      </ul>
    </section>
  );
}

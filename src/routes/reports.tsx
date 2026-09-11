import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  Boxes,
  CalendarDays,
  Plus,
  Receipt,
  Trash2,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useShopState } from "@/lib/store";
import { addExpense, deleteExpense } from "@/lib/actions";
import { ugx, num } from "@/lib/currency";
import { last7Days, metrics, topSellers } from "@/lib/selectors";
import { EXPENSE_CATEGORIES, type PaymentMethod } from "@/lib/types";
import { Field, inputCls } from "./catalog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Profit, Loss & Daily Reports — Julienne General Enterprises" },
      {
        name: "description",
        content:
          "Daily, weekly and monthly snack sales, 7-day trend chart, top sellers, expense tracking and net profit in UGX.",
      },
      { property: "og:title", content: "Profit, Loss & Daily Reports — Julienne General Enterprises" },
      { property: "og:description", content: "See exactly what the shop earned after cost of goods and expenses." },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const state = useShopState();
  const m = metrics(state);
  const trend = last7Days(state);
  const top = topSellers(state);
  const [open, setOpen] = useState(false);

  return (
    <div>
      <header className="mb-5">
        <h1 className="text-2xl font-extrabold">Money &amp; Reports</h1>
        <p className="text-sm text-muted-foreground">Everything the shop earned and spent</p>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <Metric label="Today's sales" value={ugx(m.today)} icon={CalendarDays} tone="brand" />
        <Metric label="This week" value={ugx(m.week)} icon={TrendingUp} />
        <Metric label="This month" value={ugx(m.month)} icon={Receipt} />
        <Metric
          label="Low stock alerts"
          value={String(m.lowStock.length)}
          icon={AlertTriangle}
          tone={m.lowStock.length ? "warn" : "plain"}
        />
        <Metric label="Stock on shelf" value={`${num(m.stockUnits)} units`} icon={Boxes} />
        <Metric label="Gross margin" value={`${m.margin.toFixed(1)}%`} icon={Wallet} tone="success" />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <section className=" border border-border bg-card p-5 shadow-card">
          <h2 className="mb-3 text-lg font-extrabold">7-day sales trend</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ left: -10, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--brand)" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis
                  tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000}k` : String(v))}
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                />
                <Tooltip
                  formatter={(v: number) => ugx(v)}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    background: "var(--card)",
                    fontWeight: 700,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="var(--brand)"
                  strokeWidth={3}
                  fill="url(#salesFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className=" border border-border bg-card p-5 shadow-card">
          <h2 className="mb-3 text-lg font-extrabold">Top selling snacks</h2>
          {top.length === 0 ? (
            <p className=" border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Sales will appear here after your first checkout.
            </p>
          ) : (
            <ol className="space-y-2">
              {top.map((t, i) => (
                <li key={t.name} className="flex items-center gap-3  bg-muted p-3">
                  <span className="grid size-8 shrink-0 place-items-center  bg-primary font-extrabold text-primary-foreground">
                    {i + 1}
                  </span>
                  <span className="mr-auto font-bold leading-tight">{t.name}</span>
                  <span className="text-right">
                    <span className="tabular block font-extrabold">{ugx(t.revenue)}</span>
                    <span className="block text-xs text-muted-foreground">{t.qty} sold</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1fr]">
        <section className=" border border-border bg-card p-5 shadow-card">
          <h2 className="mb-3 text-lg font-extrabold">Profit &amp; loss statement</h2>
          <dl className="space-y-2 text-sm">
            <PLRow label="Total sales revenue" value={ugx(m.revenue)} />
            <PLRow label="Cost of goods sold (COGS)" value={`- ${ugx(m.cogs)}`} />
            <PLRow label="Gross profit" value={ugx(m.grossProfit)} bold />
            <PLRow label="Operating expenses" value={`- ${ugx(m.expenses)}`} />
            <div
              className={cn(
                "mt-3 flex items-center justify-between  px-4 py-3",
                m.netProfit >= 0 ? "bg-success-soft" : "bg-danger-soft",
              )}
            >
              <span className="font-extrabold">NET PROFIT</span>
              <span className={cn("metric text-2xl", m.netProfit >= 0 ? "text-success" : "text-danger")}>
                {ugx(m.netProfit)}
              </span>
            </div>
            <p className="pt-1 text-xs text-muted-foreground">
              Based on {m.salesCount} sale(s). Stock still on shelf is worth {ugx(m.stockValue)} at cost.
            </p>
          </dl>
        </section>

        <section className=" border border-border bg-card p-5 shadow-card">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="mr-auto text-lg font-extrabold">Shop expenses</h2>
            <button
              onClick={() => setOpen(true)}
              className="flex items-center gap-1.5  bg-primary px-3 py-2.5 text-sm font-bold text-primary-foreground"
            >
              <Plus className="size-4" /> Log expense
            </button>
          </div>
          <div className="space-y-2">
            {state.expenses.map((e) => (
              <div key={e.id} className="flex items-center gap-3  bg-muted p-3">
                <div className="mr-auto">
                  <p className="font-bold">{e.category}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(e.date).toLocaleDateString("en-UG")} · {e.payment}
                    {e.note ? ` · ${e.note}` : ""}
                  </p>
                </div>
                <span className="tabular font-extrabold text-danger">- {ugx(e.amount)}</span>
                <button
                  onClick={() => {
                    deleteExpense(e.id);
                    toast.success("Expense removed");
                  }}
                  className=" p-2 text-danger hover:bg-danger-soft"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
            {state.expenses.length === 0 && (
              <p className=" border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                No expenses logged yet.
              </p>
            )}
          </div>
        </section>
      </div>

      {m.lowStock.length > 0 && (
        <section className="mt-5  border border-warn/40 bg-warn-soft p-4">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-extrabold text-warn">
            <AlertTriangle className="size-5" /> Restock these snacks
          </h2>
          <div className="flex flex-wrap gap-2">
            {m.lowStock.map((p) => (
              <span key={p.id} className=" bg-card px-3 py-2 text-sm font-bold shadow-card">
                {p.name} · {p.stock} {p.unit}
              </span>
            ))}
          </div>
        </section>
      )}

      {open && <ExpenseModal onClose={() => setOpen(false)} />}
    </div>
  );
}

function PLRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={cn("flex justify-between border-b border-dashed border-border pb-2", bold && "font-extrabold")}>
      <dt className={cn(!bold && "text-muted-foreground")}>{label}</dt>
      <dd className="tabular font-bold">{value}</dd>
    </div>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
  tone = "plain",
}: {
  label: string;
  value: string;
  icon: typeof Wallet;
  tone?: "plain" | "brand" | "warn" | "success";
}) {
  return (
    <div
      className={cn(
        " border border-border bg-card p-5 shadow-card",
        tone === "brand" && "border-primary/30 bg-brand-soft",
        tone === "warn" && "border-warn/40 bg-warn-soft",
        tone === "success" && "border-success/30 bg-success-soft",
      )}
    >
      <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        <Icon className="size-4" /> {label}
      </div>
      <p className="metric text-xl xl:text-2xl">{value}</p>
    </div>
  );
}

function ExpenseModal({ onClose }: { onClose: () => void }) {
  const [d, setD] = useState({
    category: EXPENSE_CATEGORIES[0]!,
    amount: 0,
    note: "",
    payment: "Cash" as PaymentMethod,
    date: new Date().toISOString().slice(0, 10),
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-foreground/50 sm:items-center sm:p-4">
      <div className="w-full max-w-md  bg-card p-5 shadow-lift ">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-extrabold">Log shop expense</h2>
          <button onClick={onClose} className=" p-2 hover:bg-accent">
            <X className="size-5" />
          </button>
        </div>
        <div className="space-y-3">
          <Field label="Expense type">
            <select className={inputCls} value={d.category} onChange={(e) => setD({ ...d, category: e.target.value })}>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Amount (UGX)">
            <input
              type="number"
              className={inputCls}
              value={d.amount || ""}
              onChange={(e) => setD({ ...d, amount: Number(e.target.value) || 0 })}
            />
          </Field>
          <Field label="Date">
            <input type="date" className={inputCls} value={d.date} onChange={(e) => setD({ ...d, date: e.target.value })} />
          </Field>
          <Field label="Paid with">
            <select
              className={inputCls}
              value={d.payment}
              onChange={(e) => setD({ ...d, payment: e.target.value as PaymentMethod })}
            >
              {["Cash", "MTN Mobile Money", "Airtel Money", "Bank Card"].map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </Field>
          <Field label="Note (optional)">
            <input className={inputCls} value={d.note} onChange={(e) => setD({ ...d, note: e.target.value })} />
          </Field>
        </div>
        <button
          onClick={() => {
            if (d.amount <= 0) {
              toast.error("Enter the amount spent");
              return;
            }
            addExpense({
              category: d.category,
              amount: d.amount,
              note: d.note,
              payment: d.payment,
              date: new Date(d.date).toISOString(),
            });
            toast.success("Expense logged");
            onClose();
          }}
          className="mt-5 h-14 w-full  bg-primary text-lg font-extrabold text-primary-foreground"
        >
          Save expense
        </button>
      </div>
    </div>
  );
}

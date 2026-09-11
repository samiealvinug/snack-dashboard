import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowUpRight,
  Banknote,
  DollarSign,
  Package,
  PackagePlus,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useShopState } from "@/lib/store";
import { ugx } from "@/lib/currency";
import { last7Days, metrics, stockStatus, STATUS_LABEL } from "@/lib/selectors";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Shop Dashboard — Julienne General Enterprises — Home of Snacks" },
      {
        name: "description",
        content:
          "Daily overview for your snack shop: money made today, snacks in stock, running-low alerts and one-tap shortcuts to sell, restock or record expenses in UGX.",
      },
      { property: "og:title", content: "Shop Dashboard — Julienne General Enterprises — Home of Snacks" },
      {
        property: "og:description",
        content: "Daily overview for your snack shop: money made today, snacks in stock, running-low alerts and one-tap shortcuts to sell, restock or record expenses in UGX.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

const RANGES = ["Today", "This Week", "This Month"] as const;

function DashboardPage() {
  const state = useShopState();
  const [range, setRange] = useState<(typeof RANGES)[number]>("Today");
  const m = metrics(state);
  const trend = last7Days(state);
  const active = state.staff.find((s) => s.id === state.activeStaffId) ?? state.staff[0];
  const firstName = (active?.name ?? "there").split(" ")[0];
  const outOfStock = state.products.filter((p) => p.stock <= 0);
  const runningLow = state.products.filter((p) => p.stock > 0 && p.stock <= p.minStock);
  const attention = [...outOfStock, ...runningLow].slice(0, 6);
  const salesValue = range === "Today" ? m.today : range === "This Week" ? m.week : m.month;
  const salesCount = state.sales.filter((s) => {
    const t = new Date(s.date).getTime();
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    if (range === "Today") return t >= start.getTime();
    if (range === "This Week") return t >= start.getTime() - 6 * 86400000;
    return t >= new Date(start.getFullYear(), start.getMonth(), 1).getTime();
  }).length;

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <section className="flex flex-col gap-4 border border-border bg-card px-7 py-6 shadow-card md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold">👋 Welcome, {firstName}!</h1>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">
            Here is your snack shop's overview for{" "}
            <span className="text-foreground">
              {new Date().toLocaleDateString("en-UG", { weekday: "long", month: "short", day: "numeric" })}
            </span>
          </p>
        </div>
        <div className="flex  border border-border p-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                " px-4 py-2 text-sm font-bold transition-colors",
                r === range ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent",
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={`Total Sales (${range})`}
          icon={Banknote}
          tone="success"
          value={ugx(salesValue)}
          footer={
            <span className="flex items-center gap-1.5 text-success">
              <TrendingUp className="size-4" />
              {salesCount} customer purchases
            </span>
          }
        />
        <StatCard
          label="Snacks in Shop"
          icon={Package}
          tone="info"
          value={
            <>
              {m.stockUnits.toLocaleString()}{" "}
              <span className="text-base font-bold text-muted-foreground">total units</span>
            </>
          }
          footer={
            <span className="text-muted-foreground">
              Spread across <b className="text-foreground">{state.products.length} snack varieties</b>
            </span>
          }
        />
        <StatCard
          label="Running Low"
          icon={AlertTriangle}
          tone="warn"
          value={runningLow.length}
          footer={
            <span className="flex w-full items-center justify-between text-warn">
              <b>Needs Reordering Soon</b>
              <Link to="/catalog" className="font-bold text-foreground underline">
                View List →
              </Link>
            </span>
          }
        />
        <StatCard
          label="Finished (0 Left)"
          icon={XCircle}
          tone="danger"
          value={outOfStock.length}
          footer={
            <span className="flex w-full items-center justify-between text-danger">
              <b>Completely Unavailable</b>
              <Link to="/receiving" className="font-bold text-foreground underline">
                Restock →
              </Link>
            </span>
          }
        />
      </section>

      <section className="border border-border bg-card p-6 shadow-card">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 font-display text-base font-extrabold uppercase tracking-wide">
            <Sparkles className="size-5 text-brand" />
            Quick Actions (What would you like to do?)
          </h2>
          <p className="text-xs font-semibold text-muted-foreground">Simple one-tap shortcuts</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <ActionCard
            to="/pos"
            n="1"
            title="Sell Snacks"
            desc="Ring up customers & issue receipts"
            icon={ShoppingCart}
            primary
          />
          <ActionCard
            to="/receiving"
            n="2"
            title="Receive New Stock"
            desc="Add snacks delivered by suppliers"
            icon={PackagePlus}
            tone="success"
          />
          <ActionCard
            to="/catalog"
            n="3"
            title="Snacks & Prices"
            desc="Change selling prices or add new snacks"
            icon={Package}
            tone="info"
          />
          <ActionCard
            to="/reports"
            n="4"
            title="Shop Expenses"
            desc="Record rent, transport, or bills"
            icon={DollarSign}
            tone="brand"
          />
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <div className="border border-border bg-card p-6 shadow-card">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-base font-extrabold uppercase tracking-wide">
                7-Day Sales Trend (Money Made)
              </h2>
              <p className="text-sm font-semibold text-muted-foreground">
                Visual chart of daily income in Ugandan Shillings (UGX)
              </p>
            </div>
            <span className=" bg-muted px-3 py-1.5 font-mono text-xs font-bold text-muted-foreground">
              Currency: UGX
            </span>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ left: 4, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="dashSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} fontWeight={700} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  width={64}
                  tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000}k` : `${v}`)}
                />
                <Tooltip
                  formatter={(v: number) => ugx(v)}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    fontWeight: 700,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="var(--primary)"
                  strokeWidth={3}
                  fill="url(#dashSales)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="border border-border bg-card p-6 shadow-card">
          <div className="mb-5 flex items-center justify-between gap-2">
            <h2 className="font-display text-base font-extrabold uppercase tracking-wide">
              Stock Attention List
            </h2>
            <span className="bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">
              {attention.length} items
            </span>
          </div>
          <div className="space-y-3">
            {attention.length === 0 && (
              <p className="bg-muted px-4 py-8 text-center text-sm font-bold text-success">
                Everything is well stocked 🎉
              </p>
            )}
            {attention.map((p) => {
              const st = stockStatus(p);
              return (
                <div
                  key={p.id}
                  className={cn(
                    "flex items-center justify-between gap-3 border border-border border-l-4 bg-card px-4 py-3.5",
                    st === "out" ? "border-l-danger" : "border-l-warn",
                  )}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold">{p.name}</p>
                    <p className="text-xs font-semibold text-muted-foreground">
                      {p.stock} {p.unit} left · reorder at {p.minStock}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 px-2.5 py-1 text-[11px] font-extrabold text-primary-foreground",
                      st === "out" ? "bg-danger" : "bg-warn",
                    )}
                  >
                    {STATUS_LABEL[st]}
                  </span>
                </div>
              );
            })}
          </div>
          <Link
            to="/receiving"
            className="mt-5 flex items-center justify-center gap-2 bg-primary px-4 py-3.5 text-sm font-extrabold text-primary-foreground"
          >
            <PackagePlus className="size-4 text-brand" />
            Receive New Stock
          </Link>
        </div>
      </section>
    </div>
  );
}

const TONES = {
  success: "bg-success/10 text-success",
  info: "bg-primary/8 text-primary",
  warn: "bg-warn/10 text-warn",
  danger: "bg-danger/10 text-danger",
  brand: "bg-brand/20 text-brand-foreground",
} as const;

const CARD_TONES = {
  success: "border-border bg-card",
  info: "border-border bg-card",
  warn: "border-border bg-card",
  danger: "border-border bg-card",
  brand: "border-border bg-card",
} as const;

function StatCard({
  label,
  value,
  footer,
  icon: Icon,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  footer: React.ReactNode;
  icon: typeof Package;
  tone: keyof typeof TONES;
}) {
  return (
    <div className={cn("border p-6 shadow-card", CARD_TONES[tone])}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
        <span className={cn("grid size-9 shrink-0 place-items-center ", TONES[tone])}>
          <Icon className="size-5" />
        </span>
      </div>
      <p className="metric mt-4 text-[2rem] leading-tight">{value}</p>
      <div className="mt-4 flex text-xs font-bold">{footer}</div>
    </div>
  );
}

function ActionCard({
  to,
  n,
  title,
  desc,
  icon: Icon,
  primary,
  tone = "brand",
}: {
  to: string;
  n: string;
  title: string;
  desc: string;
  icon: typeof Package;
  primary?: boolean;
  tone?: keyof typeof TONES;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "group relative flex flex-col justify-between gap-6 border p-5 transition-shadow hover:shadow-lift",
        primary ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card",
      )}
    >
      <div className="flex items-start justify-between">
        <span
          className={cn(
            "grid size-11 place-items-center ",
            primary ? "bg-brand text-brand-foreground" : TONES[tone],
          )}
        >
          <Icon className="size-5" />
        </span>
        <ArrowUpRight className={cn("size-5", primary ? "opacity-80" : "text-muted-foreground")} />
      </div>
      <div>
        <p className="text-sm font-extrabold">
          {n}. {title}
        </p>
        <p className={cn("mt-0.5 text-xs font-semibold", primary ? "opacity-75" : "text-muted-foreground")}>
          {desc}
        </p>
      </div>
    </Link>
  );
}

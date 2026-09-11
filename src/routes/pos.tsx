import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Banknote, Smartphone, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { useShopState } from "@/lib/store";
import { useCloud } from "@/lib/useCloud";
import { recordSale } from "@/lib/actions";
import { ugx } from "@/lib/currency";
import { playCashChime, playAlert } from "@/lib/sound";
import { CATEGORIES, type PaymentMethod, type Product, type Sale } from "@/lib/types";
import { stockStatus } from "@/lib/selectors";
import { StatusBadge } from "@/components/StatusBadge";
import { ReceiptModal } from "@/components/ReceiptModal";

import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pos")({
  head: () => ({
    meta: [
      { title: "Sales Register — Julienne General Enterprises" },
      {
        name: "description",
        content:
          "Fast touch point-of-sale for snack shops: scan or tap snacks, take Cash, MTN or Airtel Money, and print UGX receipts instantly.",
      },
      { property: "og:title", content: "Sales Register — Julienne General Enterprises" },
      {
        property: "og:description",
        content: "Ring up snack sales in Uganda Shillings with instant change calculation and printed receipts.",
      },
    ],
  }),
  component: RegisterPage,
});

const PAYMENTS: { key: PaymentMethod; icon: typeof Banknote }[] = [
  { key: "Cash", icon: Banknote },
  { key: "MTN Mobile Money", icon: Smartphone },
  { key: "Airtel Money", icon: Smartphone },
  { key: "Bank Card", icon: CreditCard },
];

function RegisterPage() {
  const { products } = useShopState();
  const cloud = useCloud();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [payment, setPayment] = useState<PaymentMethod>("Cash");
  const [receipt, setReceipt] = useState<Sale | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter(
      (p) =>
        (category === "All" || p.category === category) &&
        (!q ||
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.barcode.includes(q)),
    );
  }, [products, query, category]);

  function sell(p: Product) {
    if (!cloud.signedIn) {
      toast.error("Shop cloud is not connected", { description: "Connect the shop before recording a sale." });
      return;
    }
    if (p.stock <= 0) {
      playAlert();
      toast.error(`${p.name} is finished`, { description: "Receive new stock to keep selling." });
      return;
    }
    const sale = recordSale({
      items: [{ productId: p.id, name: p.name, unit: p.unit, qty: 1, price: p.price, cost: p.cost }],
      discount: 0,
      payment,
    });
    playCashChime();
    toast.success(`Sold ${p.name} — ${ugx(sale.total)}`, {
      description: `${sale.payment} · ${sale.staffName}`,
      duration: 5000,
    });
    setReceipt(sale);
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search snack name, SKU or scan barcode…"
            className="h-14 w-full  border border-border bg-card pl-12 pr-4 text-base font-semibold shadow-card outline-none placeholder:font-normal placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-bold">
            <span className="text-muted-foreground">Category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-11 min-w-40 border border-border bg-card px-3 text-sm font-bold outline-none focus:ring-2 focus:ring-ring"
            >
              {["All", ...CATEGORIES].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="ml-auto flex items-center gap-2 text-sm font-bold">
            <span className="text-muted-foreground">Payment</span>
            <select
              value={payment}
              onChange={(e) => setPayment(e.target.value as PaymentMethod)}
              className="h-11 min-w-40 border border-border bg-card px-3 text-sm font-bold outline-none focus:ring-2 focus:ring-ring"
            >
              {PAYMENTS.map(({ key }) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="text-xs font-semibold text-muted-foreground">
          Tap a snack to sell 1 {""}unit instantly · paying by {payment}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
        {filtered.map((p) => {
          const status = stockStatus(p);
          return (
            <button
              key={p.id}
              onClick={() => sell(p)}
              disabled={!cloud.signedIn || status === "out"}
              className={cn(
                "flex flex-col  border border-border bg-card p-3 text-left shadow-card transition-all active:scale-[0.98]",
                status === "out" ? "opacity-60" : "hover:-translate-y-0.5 hover:shadow-lift",
              )}
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <span className=" bg-muted px-2 py-1 text-[10px] font-bold uppercase text-muted-foreground">
                  {p.category}
                </span>
                <StatusBadge product={p} />
              </div>
              <p className="line-clamp-2 min-h-11 font-bold leading-tight">{p.name}</p>
              <p className="metric mt-2 text-xl text-primary">{ugx(p.price)}</p>
              <p className="text-xs text-muted-foreground">
                {p.stock} {p.unit} left · {p.sku}
              </p>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="col-span-full  border border-dashed border-border p-10 text-center text-muted-foreground">
            No snacks match that search.
          </p>
        )}
      </div>

      {receipt && <ReceiptModal sale={receipt} onClose={() => setReceipt(null)} />}
    </div>
  );
}

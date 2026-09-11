import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Grid3x3, List, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useShopState } from "@/lib/store";
import { addProduct, deleteProduct, updateProduct } from "@/lib/actions";
import { ugx } from "@/lib/currency";
import { CATEGORIES, UNITS, type Product } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/catalog")({
  head: () => ({
    meta: [
      { title: "Snack Catalog & Product Manager — Julienne General Enterprises" },
      {
        name: "description",
        content:
          "Manage snack products, SKUs, barcodes, buying and selling prices, stock levels and custom retail units in UGX.",
      },
      { property: "og:title", content: "Snack Catalog & Product Manager — Julienne General Enterprises" },
      {
        property: "og:description",
        content: "Card and table views of every snack with In Stock, Running Low and Finished badges.",
      },
    ],
  }),
  component: CatalogPage,
});

type Draft = Omit<Product, "id">;

const emptyDraft = (): Draft => ({
  name: "",
  category: CATEGORIES[0]!,
  sku: "",
  barcode: "",
  cost: 0,
  price: 0,
  stock: 0,
  minStock: 5,
  unit: "Pack",
});

function CatalogPage() {
  const { products } = useShopState();
  const [view, setView] = useState<"cards" | "table">("cards");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [editing, setEditing] = useState<{ id: string | null; draft: Draft } | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter(
      (p) =>
        (category === "All" || p.category === category) &&
        (!q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.barcode.includes(q)),
    );
  }, [products, query, category]);

  return (
    <div>
      <header className="mb-5 flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <h1 className="text-2xl font-extrabold">Snack Catalog</h1>
          <p className="text-sm text-muted-foreground">{products.length} products on the shelf</p>
        </div>
        <div className="flex  border border-border bg-card p-1">
          <button
            onClick={() => setView("cards")}
            className={cn(" p-2.5", view === "cards" && "bg-primary text-primary-foreground")}
            aria-label="Card view"
          >
            <Grid3x3 className="size-5" />
          </button>
          <button
            onClick={() => setView("table")}
            className={cn(" p-2.5", view === "table" && "bg-primary text-primary-foreground")}
            aria-label="Table view"
          >
            <List className="size-5" />
          </button>
        </div>
        <button
          onClick={() => setEditing({ id: null, draft: emptyDraft() })}
          className="flex h-12 items-center gap-2  bg-primary px-4 font-bold text-primary-foreground shadow-card"
        >
          <Plus className="size-5" /> New snack
        </button>
      </header>

      <div className="mb-4 flex flex-col gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, SKU or barcode…"
            className="h-13 w-full  border border-border bg-card py-3.5 pl-12 pr-4 font-semibold shadow-card outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <label className="flex items-center gap-2 text-sm font-bold">
          <span className="text-muted-foreground">Category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-11 min-w-44 border border-border bg-card px-3 text-sm font-bold outline-none focus:ring-2 focus:ring-ring"
          >
            {["All", ...CATEGORIES].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>

      {view === "cards" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <article key={p.id} className=" border border-border bg-card p-5 shadow-card">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-bold leading-tight">{p.name}</h2>
                  <p className="text-xs text-muted-foreground">
                    {p.category} · {p.sku} · {p.barcode}
                  </p>
                </div>
                <StatusBadge product={p} />
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2 text-center">
                <Cell label="Stock" value={`${p.stock} ${p.unit}`} />
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setEditing({ id: p.id, draft: { ...p } })}
                  className="flex flex-1 items-center justify-center gap-2  border border-border py-2.5 text-sm font-bold hover:bg-accent"
                >
                  <Pencil className="size-4" /> Edit
                </button>
                <button
                  onClick={() => {
                    deleteProduct(p.id);
                    toast.success(`${p.name} removed`);
                  }}
                  className=" border border-border px-3 py-2.5 text-danger hover:bg-danger-soft"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto  border border-border bg-card shadow-card">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                {["Snack", "SKU", "Unit", "Stock", "Status", ""].map((h) => (
                  <th key={h} className="px-4 py-3 font-bold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-4 py-3 font-bold">{p.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.sku}</td>
                  <td className="px-4 py-3">{p.unit}</td>
                  <td className="tabular px-4 py-3">{p.stock}</td>
                  <td className="px-4 py-3">
                    <StatusBadge product={p} />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setEditing({ id: p.id, draft: { ...p } })}
                      className=" border border-border p-2 hover:bg-accent"
                    >
                      <Pencil className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <ProductForm
          initial={editing.draft}
          isNew={editing.id === null}
          onClose={() => setEditing(null)}
          onSave={(draft) => {
            if (editing.id) {
              updateProduct(editing.id, draft);
              toast.success("Snack updated");
            } else {
              addProduct(draft);
              toast.success("Snack added to catalog");
            }
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function Cell({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className=" bg-muted px-2 py-2">
      <p className="text-[10px] font-bold uppercase text-muted-foreground">{label}</p>
      <p className={cn("tabular text-sm font-extrabold", accent && "text-primary")}>{value}</p>
    </div>
  );
}

function ProductForm({
  initial,
  isNew,
  onClose,
  onSave,
}: {
  initial: Draft;
  isNew: boolean;
  onClose: () => void;
  onSave: (d: Draft) => void;
}) {
  const [d, setD] = useState<Draft>(initial);
  const [customUnit, setCustomUnit] = useState(!UNITS.includes(initial.unit));
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-foreground/50 p-0 sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full max-w-lg overflow-auto  bg-card p-5 shadow-lift ">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-extrabold">{isNew ? "New snack" : "Edit snack"}</h2>
          <button onClick={onClose} className=" p-2 hover:bg-accent">
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-3">
          <Field label="Snack name">
            <input className={inputCls} value={d.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <select className={inputCls} value={d.category} onChange={(e) => set("category", e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Unit">
              {customUnit ? (
                <div className="flex gap-2">
                  <input
                    className={inputCls}
                    placeholder="e.g. Tray"
                    value={d.unit}
                    onChange={(e) => set("unit", e.target.value)}
                  />
                  <button
                    onClick={() => {
                      setCustomUnit(false);
                      set("unit", "Pack");
                    }}
                    className=" border border-border px-3 text-sm font-bold"
                  >
                    List
                  </button>
                </div>
              ) : (
                <select
                  className={inputCls}
                  value={d.unit}
                  onChange={(e) => {
                    if (e.target.value === "__custom") {
                      setCustomUnit(true);
                      set("unit", "");
                    } else set("unit", e.target.value);
                  }}
                >
                  {UNITS.map((u) => (
                    <option key={u}>{u}</option>
                  ))}
                  <option value="__custom">+ Enter Custom Unit</option>
                </select>
              )}
            </Field>
            <Field label="SKU">
              <input className={inputCls} value={d.sku} onChange={(e) => set("sku", e.target.value)} />
            </Field>
            <Field label="Barcode">
              <input className={inputCls} value={d.barcode} onChange={(e) => set("barcode", e.target.value)} />
            </Field>
            <Field label="Buying price (UGX)">
              <input
                type="number"
                className={inputCls}
                value={d.cost || ""}
                onChange={(e) => set("cost", Number(e.target.value) || 0)}
              />
            </Field>
            <Field label="Selling price (UGX)">
              <input
                type="number"
                className={inputCls}
                value={d.price || ""}
                onChange={(e) => set("price", Number(e.target.value) || 0)}
              />
            </Field>
            <Field label="Stock on shelf">
              <input
                type="number"
                className={inputCls}
                value={d.stock || ""}
                onChange={(e) => set("stock", Number(e.target.value) || 0)}
              />
            </Field>
            <Field label="Low stock alert at">
              <input
                type="number"
                className={inputCls}
                value={d.minStock || ""}
                onChange={(e) => set("minStock", Number(e.target.value) || 0)}
              />
            </Field>
          </div>
          <Field label="Image URL (optional)">
            <input className={inputCls} value={d.image ?? ""} onChange={(e) => set("image", e.target.value)} />
          </Field>
          {d.price > 0 && d.cost > 0 && (
            <p className=" bg-success-soft px-3 py-2 text-sm font-bold text-success">
              Profit per {d.unit || "unit"}: {ugx(d.price - d.cost)}
            </p>
          )}
        </div>

        <button
          onClick={() => {
            if (!d.name.trim()) {
              toast.error("Give the snack a name");
              return;
            }
            onSave({ ...d, sku: d.sku || `SKU-${Date.now().toString().slice(-5)}`, unit: d.unit || "Piece" });
          }}
          className="mt-5 h-14 w-full  bg-primary text-lg font-extrabold text-primary-foreground"
        >
          Save snack
        </button>
      </div>
    </div>
  );
}

export const inputCls =
  "h-12 w-full  border border-border bg-background px-3 font-semibold outline-none focus:ring-2 focus:ring-ring";

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

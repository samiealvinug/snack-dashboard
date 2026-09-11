import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, MapPin, Phone, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useShopState } from "@/lib/store";
import { addSupplier, deleteSupplier } from "@/lib/actions";
import { ugx } from "@/lib/currency";
import { Field, inputCls } from "./catalog";

export const Route = createFileRoute("/suppliers")({
  head: () => ({
    meta: [
      { title: "Suppliers & Purchase History — Julienne General Enterprises" },
      {
        name: "description",
        content: "Supplier directory with contacts, phone numbers and every snack delivery logged against them.",
      },
      { property: "og:title", content: "Suppliers & Purchase History — Julienne General Enterprises" },
      { property: "og:description", content: "Track snack suppliers and their delivery history in UGX." },
    ],
  }),
  component: SuppliersPage,
});

function SuppliersPage() {
  const { suppliers, deliveries } = useShopState();
  const [open, setOpen] = useState(false);
  const [d, setD] = useState({ name: "", contact: "", phone: "", email: "", address: "" });

  return (
    <div>
      <header className="mb-5 flex items-center gap-3">
        <div className="mr-auto">
          <h1 className="text-2xl font-extrabold">Suppliers</h1>
          <p className="text-sm text-muted-foreground">{suppliers.length} suppliers · {deliveries.length} deliveries logged</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex h-12 items-center gap-2  bg-primary px-4 font-bold text-primary-foreground shadow-card"
        >
          <Plus className="size-5" /> Add supplier
        </button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {suppliers.map((s) => {
          const logs = deliveries.filter((x) => x.supplier === s.name);
          const spend = logs.reduce((a, x) => a + x.total, 0);
          return (
            <article key={s.id} className=" border border-border bg-card p-5 shadow-card">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-extrabold">{s.name}</h2>
                  <p className="text-xs text-muted-foreground">{s.contact}</p>
                </div>
                <button
                  onClick={() => {
                    deleteSupplier(s.id);
                    toast.success("Supplier removed");
                  }}
                  className=" p-2 text-danger hover:bg-danger-soft"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              <div className="mt-3 space-y-1.5 text-sm">
                <p className="flex items-center gap-2">
                  <Phone className="size-4 text-muted-foreground" /> {s.phone}
                </p>
                <p className="flex items-center gap-2 break-all">
                  <Mail className="size-4 text-muted-foreground" /> {s.email}
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="size-4 text-muted-foreground" /> {s.address}
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between  bg-muted px-3 py-2">
                <span className="text-xs font-bold uppercase text-muted-foreground">
                  {logs.length} deliveries
                </span>
                <span className="tabular font-extrabold">{ugx(spend)}</span>
              </div>
            </article>
          );
        })}
      </div>

      <h2 className="mb-3 mt-8 text-xl font-extrabold">Purchase history</h2>
      <div className="overflow-x-auto  border border-border bg-card shadow-card">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              {["Date", "Supplier", "Reference", "Items", "Value", "Received by"].map((h) => (
                <th key={h} className="px-4 py-3 font-bold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {deliveries.map((x) => (
              <tr key={x.id} className="border-t border-border">
                <td className="px-4 py-3">{new Date(x.date).toLocaleDateString("en-UG")}</td>
                <td className="px-4 py-3 font-bold">{x.supplier}</td>
                <td className="px-4 py-3 text-muted-foreground">{x.reference || "—"}</td>
                <td className="px-4 py-3">{x.items.length}</td>
                <td className="tabular px-4 py-3 font-bold">{ugx(x.total)}</td>
                <td className="px-4 py-3">{x.staffName}</td>
              </tr>
            ))}
            {deliveries.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  No deliveries recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-foreground/50 sm:items-center sm:p-4">
          <div className="w-full max-w-md  bg-card p-5 shadow-lift ">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-extrabold">New supplier</h2>
              <button onClick={() => setOpen(false)} className=" p-2 hover:bg-accent">
                <X className="size-5" />
              </button>
            </div>
            <div className="space-y-3">
              <Field label="Business name">
                <input className={inputCls} value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} />
              </Field>
              <Field label="Contact person">
                <input className={inputCls} value={d.contact} onChange={(e) => setD({ ...d, contact: e.target.value })} />
              </Field>
              <Field label="Phone">
                <input className={inputCls} value={d.phone} onChange={(e) => setD({ ...d, phone: e.target.value })} />
              </Field>
              <Field label="Email">
                <input className={inputCls} value={d.email} onChange={(e) => setD({ ...d, email: e.target.value })} />
              </Field>
              <Field label="Address">
                <input className={inputCls} value={d.address} onChange={(e) => setD({ ...d, address: e.target.value })} />
              </Field>
            </div>
            <button
              onClick={() => {
                if (!d.name.trim()) { toast.error("Enter the supplier name"); return; }
                addSupplier(d);
                setD({ name: "", contact: "", phone: "", email: "", address: "" });
                setOpen(false);
                toast.success("Supplier added");
              }}
              className="mt-5 h-14 w-full  bg-primary text-lg font-extrabold text-primary-foreground"
            >
              Save supplier
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

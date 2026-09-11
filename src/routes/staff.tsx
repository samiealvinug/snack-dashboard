import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Plus, ShieldCheck, Smartphone, Trash2, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import { useShopState } from "@/lib/store";
import { addStaff, removeStaff, setActiveStaff } from "@/lib/actions";
import { ugx } from "@/lib/currency";
import { playBeep } from "@/lib/sound";
import { createStaffInvite } from "@/lib/invites";
import type { Role } from "@/lib/types";
import { Field, inputCls } from "./catalog";
import { cn } from "@/lib/utils";


export const Route = createFileRoute("/staff")({
  head: () => ({
    meta: [
      { title: "Staff Portal & Shift Handover — Julienne General Enterprises" },
      {
        name: "description",
        content:
          "Admin and cashier profiles with role permissions and 1-click staff switching for fast counter handover.",
      },
      { property: "og:title", content: "Staff Portal & Shift Handover — Julienne General Enterprises" },
      { property: "og:description", content: "Switch cashiers in one tap and see each person's sales total." },
    ],
  }),
  component: StaffPage,
});

const PERMISSIONS: Record<Role, string[]> = {
  Admin: ["Full sales register", "Add & edit snack prices", "Delete products", "View profit & loss", "Manage staff"],
  Cashier: ["Sales register", "View snack catalog", "Receive stock deliveries", "Log expenses"],
};

function StaffPage() {
  const { staff, activeStaffId, sales } = useShopState();
  const [open, setOpen] = useState(false);
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [d, setD] = useState<{ name: string; role: Role; pin: string }>({ name: "", role: "Cashier", pin: "" });

  async function makeCode(staffId: string) {
    setBusyId(staffId);
    try {
      const code = await createStaffInvite(staffId);
      setCodes((c) => ({ ...c, [staffId]: code }));
      playBeep();
      toast.success(`Phone code: ${code}`, { description: "Valid for 1 month — one worker only." });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create the code");
    } finally {
      setBusyId(null);
    }
  }


  return (
    <div>
      <header className="mb-5 flex items-center gap-3">
        <div className="mr-auto">
          <h1 className="text-2xl font-extrabold">Staff Portal</h1>
          <p className="text-sm text-muted-foreground">Tap a profile to take over the counter</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex h-12 items-center gap-2  bg-primary px-4 font-bold text-primary-foreground shadow-card"
        >
          <Plus className="size-5" /> Add staff
        </button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {staff.map((s) => {
          const mine = sales.filter((x) => x.staffId === s.id);
          const isActive = s.id === activeStaffId;
          return (
            <article
              key={s.id}
              className={cn(
                " border-2 bg-card p-5 shadow-card transition-colors",
                isActive ? "border-primary" : "border-border",
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className="grid size-14 place-items-center  text-lg font-extrabold text-primary-foreground"
                  style={{ background: s.color }}
                >
                  {s.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")}
                </span>
                <div className="mr-auto">
                  <h2 className="font-extrabold leading-tight">{s.name}</h2>
                  <p className="flex items-center gap-1 text-xs font-bold text-muted-foreground">
                    {s.role === "Admin" ? <ShieldCheck className="size-3.5" /> : <UserRound className="size-3.5" />}
                    {s.role === "Admin" ? "Admin / Manager" : "Cashier / Salesperson"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    removeStaff(s.id);
                    toast.success("Staff removed");
                  }}
                  className=" p-2 text-danger hover:bg-danger-soft"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>

              <ul className="mt-3 space-y-1 text-sm">
                {PERMISSIONS[s.role].map((p) => (
                  <li key={p} className="flex items-center gap-2 text-muted-foreground">
                    <Check className="size-4 text-success" /> {p}
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex items-center justify-between  bg-muted px-3 py-2 text-sm">
                <span className="font-bold text-muted-foreground">{mine.length} sales</span>
                <span className="tabular font-extrabold">{ugx(mine.reduce((a, x) => a + x.total, 0))}</span>
              </div>

              <button
                disabled={isActive}
                onClick={() => {
                  setActiveStaff(s.id);
                  playBeep();
                  toast.success(`${s.name} is now on the counter`);
                }}
                className={cn(
                  "mt-3 h-13 w-full  py-3.5 font-extrabold",
                  isActive
                    ? "bg-success-soft text-success"
                    : "bg-primary text-primary-foreground active:scale-[0.99]",
                )}
              >
                {isActive ? "On duty now" : "Switch to this staff"}
              </button>

              <button
                onClick={() => void makeCode(s.id)}
                disabled={busyId === s.id}
                className="mt-2 flex h-12 w-full items-center justify-center gap-2 border border-border bg-card font-bold text-foreground disabled:opacity-60"
              >
                <Smartphone className="size-4" />
                {busyId === s.id ? "Creating…" : "Phone app code"}
              </button>
              {codes[s.id] && (
                <p className="mt-2 bg-muted px-3 py-2 text-center text-lg font-extrabold tracking-[0.3em]">
                  {codes[s.id]}
                </p>
              )}

            </article>
          );
        })}
      </div>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-foreground/50 sm:items-center sm:p-4">
          <div className="w-full max-w-md  bg-card p-5 shadow-lift ">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-extrabold">Add staff member</h2>
              <button onClick={() => setOpen(false)} className=" p-2 hover:bg-accent">
                <X className="size-5" />
              </button>
            </div>
            <div className="space-y-3">
              <Field label="Full name">
                <input className={inputCls} value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} />
              </Field>
              <Field label="Role">
                <select
                  className={inputCls}
                  value={d.role}
                  onChange={(e) => setD({ ...d, role: e.target.value as Role })}
                >
                  <option value="Cashier">Cashier / Salesperson</option>
                  <option value="Admin">Admin / Manager</option>
                </select>
              </Field>
              <Field label="Quick PIN">
                <input
                  className={inputCls}
                  maxLength={4}
                  value={d.pin}
                  onChange={(e) => setD({ ...d, pin: e.target.value.replace(/\D/g, "") })}
                />
              </Field>
            </div>
            <button
              onClick={() => {
                if (!d.name.trim()) { toast.error("Enter the staff name"); return; }
                addStaff({ ...d, pin: d.pin || "0000", color: "var(--accent-2)" });
                setD({ name: "", role: "Cashier", pin: "" });
                setOpen(false);
                toast.success("Staff added");
              }}
              className="mt-5 h-14 w-full  bg-primary text-lg font-extrabold text-primary-foreground"
            >
              Save staff
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

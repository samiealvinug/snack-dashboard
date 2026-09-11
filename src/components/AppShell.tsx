import logoAsset from "@/assets/julienne-logo.jpeg.asset.json";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  Boxes,
  ChevronDown,
  CloudOff,
  LogIn,
  LogOut,
  LayoutGrid,
  PackagePlus,
  Receipt,
  RefreshCw,
  ScrollText,
  ShoppingCart,
  Smartphone,
  Truck,
  Users,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { hydrateStore, useShopState } from "@/lib/store";
import { setActiveStaff } from "@/lib/actions";
import { playBeep } from "@/lib/sound";
import { cn } from "@/lib/utils";
import { pullFromCloud, signOutCloud, startCloudSync } from "@/lib/cloud";
import { useCloud } from "@/lib/useCloud";
import { loadSession, signOut, useSession, useSessionReady } from "@/lib/session";
import { isSupabaseConfigured } from "@/integrations/supabase/client";

const MAIN = [
  { to: "/", label: "Shop Dashboard", icon: LayoutGrid, exact: true },
  { to: "/pos", label: "Record a Sale", icon: Receipt },
  { to: "/transactions", label: "Sales Records", icon: ScrollText },
  { to: "/catalog", label: "Stock & Inventory", icon: Boxes, badge: true },
  { to: "/receiving", label: "Receive New Stock", icon: PackagePlus },
] as const;

const MANAGE = [
  { to: "/reports", label: "Reports & Analytics", icon: BarChart3 },
  { to: "/suppliers", label: "Suppliers", icon: Truck },
  { to: "/staff", label: "Staff Accounts", icon: Users },
  { to: "/devices", label: "Add a Phone", icon: Smartphone },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { staff, activeStaffId, products } = useShopState();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const active = staff.find((s) => s.id === activeStaffId) ?? staff[0];
  const low = products.filter((p) => p.stock <= p.minStock).length;
  const cloud = useCloud();
  const session = useSession();
  const ready = useSessionReady();

  useEffect(() => {
    hydrateStore();
    loadSession();
    if (isSupabaseConfigured()) startCloudSync();
  }, []);

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-surface">
        <div className="flex flex-col items-center gap-3">
          <span className="grid size-12 place-items-center rounded-xl bg-primary text-brand shadow-card">
            <Boxes className="size-6" />
          </span>
          <p className="text-sm font-bold text-muted-foreground">Connecting to shop cloud…</p>
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-40 border-b border-border bg-card">
        <div className="flex items-center gap-3 px-5 py-3">
          <Link to="/" className="flex items-center gap-2.5">
            <img
              src={logoAsset.url}
              alt="Julienne General Enterprises logo"
              className="size-10 rounded-xl object-contain"
            />
            <span className="hidden leading-tight sm:block">
              <span className="block font-display text-base font-extrabold">
                Julienne General Enterprises
              </span>
              <span className="block text-xs font-semibold text-muted-foreground">
                Home of Snacks
              </span>
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <Link
              to="/pos"
              className="flex items-center gap-2 bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-card transition-opacity hover:opacity-90"
            >
              <ShoppingCart className="size-4 text-brand" />
              <span className="hidden sm:inline">Record Sale</span>
            </Link>
            {cloud.signedIn ? (
              <button
                onClick={() => void pullFromCloud()}
                title={`Backed up as ${cloud.email ?? "shop owner"}`}
                className="hidden items-center gap-2 border border-border px-3.5 py-2.5 text-sm font-bold hover:bg-accent sm:flex"
              >
                <RefreshCw
                  className={cn(
                    "size-4",
                    cloud.status === "syncing" && "animate-spin text-brand",
                    cloud.status === "synced" && "text-success",
                    cloud.status === "error" && "text-danger",
                  )}
                />
                {cloud.status === "error" ? "Sync failed" : "Cloud saved"}
              </button>
            ) : (
              <Link
                to="/auth"
                className="hidden items-center gap-2 border border-border px-3.5 py-2.5 text-sm font-bold hover:bg-accent sm:flex"
              >
                <CloudOff className="size-4 text-muted-foreground" />
                Back up shop
              </Link>
            )}
            <Link
              to="/catalog"
              className="relative hidden border border-border p-2.5 hover:bg-accent md:block"
              aria-label="Stock alerts"
            >
              <Bell className="size-4.5 text-muted-foreground" />
              {low > 0 && (
                <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center bg-danger text-[10px] font-bold text-primary-foreground">
                  {low}
                </span>
              )}
            </Link>

            <div className="relative">
              <button
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-2 border border-border px-2 py-1.5 text-left hover:bg-accent"
              >
                <span
                  className="grid size-8 place-items-center text-xs font-extrabold text-primary-foreground"
                  style={{ background: active?.color ?? "var(--primary)" }}
                >
                  {initials(active?.name ?? "?")}
                </span>
                <span className="hidden leading-tight sm:block">
                  <span className="block text-sm font-bold">{active?.name}</span>
                  <span className="block text-xs text-muted-foreground">{active?.role}</span>
                </span>
                <ChevronDown className="size-4 text-muted-foreground" />
              </button>
              {open && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                  <div className="absolute right-0 z-50 mt-2 w-64 border border-border bg-popover p-2 shadow-lift">
                    <p className="px-2 py-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      Quick staff switch
                    </p>
                    {staff.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          setActiveStaff(s.id);
                          playBeep();
                          setOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center gap-2.5 px-2 py-2.5 text-left transition-colors hover:bg-accent",
                          s.id === activeStaffId && "bg-accent",
                        )}
                      >
                        <span
                          className="grid size-9 place-items-center text-sm font-extrabold text-primary-foreground"
                          style={{ background: s.color }}
                        >
                          {initials(s.name)}
                        </span>
                        <span className="leading-tight">
                          <span className="block text-sm font-bold">{s.name}</span>
                          <span className="block text-xs text-muted-foreground">{s.role}</span>
                        </span>
                      </button>
                    ))}

                    <div className="my-2 border-t border-border" />
                    <button
                      onClick={() => {
                        signOut();
                        setOpen(false);
                        void navigate({ to: "/login", replace: true });
                      }}
                      className="flex w-full items-center gap-2.5 px-2 py-2.5 text-left text-sm font-bold hover:bg-accent"
                    >
                      <LogIn className="size-4 text-muted-foreground" />
                      Log out (lock counter)
                    </button>


                    <div className="my-2 border-t border-border" />
                    {cloud.signedIn ? (
                      <>
                        <p className="truncate px-2 py-1 text-xs font-semibold text-muted-foreground">
                          Cloud backup: {cloud.email}
                        </p>
                        <button
                          onClick={() => {
                            void signOutCloud();
                            setOpen(false);
                          }}
                          className="flex w-full items-center gap-2.5 px-2 py-2.5 text-left text-sm font-bold hover:bg-accent"
                        >
                          <LogOut className="size-4 text-muted-foreground" />
                          Sign out of cloud backup
                        </button>
                      </>
                    ) : (
                      <Link
                        to="/auth"
                        onClick={() => setOpen(false)}
                        className="flex w-full items-center gap-2.5 px-2 py-2.5 text-left text-sm font-bold hover:bg-accent"
                      >
                        <CloudOff className="size-4 text-muted-foreground" />
                        Sign in to back up shop
                      </Link>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="sticky top-[65px] hidden h-[calc(100vh-65px)] w-[286px] shrink-0 overflow-y-auto border-r border-border bg-card px-4 py-5 lg:block">
          <Link
            to="/pos"
            className="mb-6 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-sm font-extrabold text-primary-foreground shadow-card transition-opacity hover:opacity-90"
          >
            <ShoppingCart className="size-5 text-brand" />
            Record Sale
          </Link>

          <SideGroup title="Main Menu" items={MAIN} low={low} />
          <div className="my-5 border-t border-border" />
          <SideGroup title="Shop Management" items={MANAGE} low={low} />
        </aside>

        <main className="min-w-0 flex-1 px-5 pb-28 pt-6 lg:px-8 lg:py-8">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-card lg:hidden">
        {[MAIN[0], MAIN[1], MAIN[2], MAIN[3], MANAGE[0]].map(({ to, label, icon: Icon }) => (
          <Link
            key={label}
            to={to}
            activeOptions={{ exact: to === "/" }}
            activeProps={{ className: "text-foreground" }}
            inactiveProps={{ className: "text-muted-foreground" }}
            className="flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold"
          >
            <Icon className="size-5" />
            {label.split(" ")[0]}
          </Link>
        ))}
      </nav>
    </div>
  );
}

function SideGroup({
  title,
  items,
  low,
}: {
  title: string;
  items: readonly { to: string; label: string; icon: typeof Boxes; badge?: boolean }[];
  low: number;
}) {
  return (
    <div>
      <p className="px-3 pb-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </p>
      <div className="space-y-1">
        {items.map(({ to, label, icon: Icon, badge }) => (
          <Link
            key={label}
            to={to}
            activeOptions={{ exact: to === "/" }}
            activeProps={{ className: "bg-primary text-primary-foreground rounded-none" }}
            inactiveProps={{ className: "text-foreground hover:bg-accent rounded-xl" }}
            className="flex items-center gap-3 px-3 py-3 text-[15px] font-bold transition-colors"
          >
            <Icon className="size-5 opacity-80" />
            <span className="truncate">{label}</span>
            {badge && low > 0 && (
              <span className="ml-auto grid min-w-6 place-items-center rounded-md bg-danger px-1.5 py-0.5 text-[11px] font-bold text-primary-foreground">
                {low}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

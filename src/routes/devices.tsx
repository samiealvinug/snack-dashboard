import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Smartphone, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useShopState } from "@/lib/store";
import { useCloud } from "@/lib/useCloud";
import {
  createStaffInvite,
  listLinkedDevices,
  listStaffInvites,
  revokeStaffInvite,
  type InviteRow,
} from "@/lib/invites";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { authIdentifierFromUsername } from "@/lib/usernameAuth";

export const Route = createFileRoute("/devices")({
  head: () => ({
    meta: [
      { title: "Add a Phone — Julienne General Enterprises" },
      {
        name: "description",
        content:
          "Give a shop worker a one-month code so their phone app can record sales and restocks straight into this shop.",
      },
      { property: "og:title", content: "Add a Phone — Julienne General Enterprises" },
      {
        property: "og:description",
        content: "Create and manage the codes that connect worker phones to your snack shop.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DevicesPage,
});

function fmt(d: string) {
  return new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function DevicesPage() {
  const { staff } = useShopState();
  const cloud = useCloud();
  const [staffId, setStaffId] = useState("");
  const [busy, setBusy] = useState(false);
  const [fresh, setFresh] = useState<string | null>(null);
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [devices, setDevices] = useState<{ user_id: string; staff_id: string; created_at: string }[]>([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [signingIn, setSigningIn] = useState(false);

  async function signIn() {
    setSigningIn(true);
    try {
      const identifier = authIdentifierFromUsername(username);
      let { error } = await supabase.auth.signInWithPassword({ email: identifier, password });
      if (error) {
        // First time on this device: create the shop account for this username.
        const signUp = await supabase.auth.signUp({ email: identifier, password });
        if (signUp.error) throw error;
        const retry = await supabase.auth.signInWithPassword({ email: identifier, password });
        error = retry.error;
        if (error) throw error;
      }
      toast.success("Signed in — you can create phone codes now.");
      setPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not sign in");
    } finally {
      setSigningIn(false);
    }
  }


  const staffName = (id: string) => staff.find((s) => s.id === id)?.name ?? "Staff";

  const refresh = useCallback(async () => {
    if (!cloud.signedIn) return;
    try {
      const [i, d] = await Promise.all([listStaffInvites(), listLinkedDevices()]);
      setInvites(i);
      setDevices(d);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load codes");
    }
  }, [cloud.signedIn]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!staffId && staff[0]) setStaffId(staff[0].id);
  }, [staff, staffId]);

  async function generate() {
    if (!staffId) return;
    setBusy(true);
    try {
      const code = await createStaffInvite(staffId);
      setFresh(code);
      toast.success(`Code for ${staffName(staffId)}: ${code}`, { description: "Valid for 1 month" });
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create the code");
    } finally {
      setBusy(false);
    }
  }

  async function copy(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Code copied");
    } catch {
      toast.error("Copy failed — write it down instead");
    }
  }

  async function revoke(code: string) {
    try {
      await revokeStaffInvite(code);
      if (fresh === code) setFresh(null);
      toast.success("Code cancelled");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not cancel the code");
    }
  }

  const pending = invites.filter((i) => !i.used_at && new Date(i.expires_at) > new Date());

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold">Add a Phone</h1>
        <p className="text-sm font-semibold text-muted-foreground">
          Give a worker a code. They type it into the shop app once, and their sales and restocks appear here
          straight away.
        </p>
      </header>

      {!cloud.signedIn && (
        <section className="border border-danger bg-danger-soft p-5">
          <h2 className="font-extrabold text-danger">Sign in to the shop account first</h2>
          <p className="mt-1 text-sm font-semibold text-danger">
            Phone codes are created on your cloud shop account. Sign in here and stay on this page.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void signIn();
            }}
            className="mt-4 flex flex-col gap-3 sm:flex-row"
          >
            <input
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username (alvin)"
              className="h-13 w-full border border-border bg-card px-3 text-base font-bold outline-none focus:ring-2 focus:ring-ring sm:max-w-xs"
            />

            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="h-13 w-full border border-border bg-card px-3 text-base font-bold outline-none focus:ring-2 focus:ring-ring sm:max-w-xs"
            />
            <button
              type="submit"
              disabled={signingIn}
              className="h-13 bg-primary px-5 font-extrabold text-primary-foreground disabled:opacity-60"
            >
              {signingIn ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </section>
      )}

      <section className="border border-border bg-card p-5 shadow-card">
        <h2 className="mb-3 font-extrabold">1. Pick the worker</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            value={staffId}
            onChange={(e) => setStaffId(e.target.value)}
            className="h-13 w-full border border-border bg-card px-3 text-base font-bold outline-none focus:ring-2 focus:ring-ring sm:max-w-xs"
          >
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · {s.role}
              </option>
            ))}
          </select>
          <button
            onClick={() => void generate()}
            disabled={busy || !cloud.signedIn || !staffId}
            className="flex h-13 items-center justify-center gap-2 bg-primary px-5 font-extrabold text-primary-foreground disabled:opacity-60"
          >
            <Smartphone className="size-5" />
            {busy ? "Creating…" : "Create phone code"}
          </button>
        </div>

        {fresh && (
          <div className="mt-4 flex flex-col items-center gap-3 bg-muted p-5 sm:flex-row sm:justify-between">
            <div className="text-center sm:text-left">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Give this to {staffName(staffId)}
              </p>
              <p className="metric text-4xl tracking-[0.35em]">{fresh}</p>
            </div>
            <button
              onClick={() => void copy(fresh)}
              className="flex h-12 items-center gap-2 border border-border bg-card px-4 font-bold"
            >
              <Copy className="size-4" /> Copy
            </button>
          </div>
        )}
      </section>

      <section className="border border-border bg-card p-5 shadow-card">
        <h2 className="font-extrabold">2. On the worker&rsquo;s phone</h2>
        <ol className="mt-2 space-y-1.5 text-sm font-semibold text-muted-foreground">
          <li>1. Open the shop app and create an account with their own username and password.</li>
          <li>2. Type this 6-letter code on the &ldquo;Join a shop&rdquo; screen.</li>
          <li>3. Done — the phone is linked to this shop for good; the code itself lasts one month.</li>
        </ol>
      </section>

      <section className="border border-border bg-card p-5 shadow-card">
        <h2 className="mb-3 font-extrabold">Codes waiting to be used ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="text-sm font-semibold text-muted-foreground">No unused codes right now.</p>
        ) : (
          <ul className="divide-y divide-border">
            {pending.map((i) => (
              <li key={i.code} className="flex items-center gap-3 py-3">
                <span className="metric text-xl tracking-[0.25em]">{i.code}</span>
                <span className="text-sm font-bold">{staffName(i.staff_id)}</span>
                <span className="ml-auto text-xs font-semibold text-muted-foreground">
                  expires {fmt(i.expires_at)}
                </span>
                <button
                  onClick={() => void copy(i.code)}
                  className="border border-border p-2 hover:bg-accent"
                  aria-label={`Copy code ${i.code}`}
                >
                  <Copy className="size-4" />
                </button>
                <button
                  onClick={() => void revoke(i.code)}
                  className="border border-border p-2 text-danger hover:bg-accent"
                  aria-label={`Cancel code ${i.code}`}
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="border border-border bg-card p-5 shadow-card">
        <h2 className="mb-3 font-extrabold">Phones already linked ({devices.length})</h2>
        {devices.length === 0 ? (
          <p className="text-sm font-semibold text-muted-foreground">
            No phone has joined yet. Sales from the app only arrive after a worker uses a code.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {devices.map((d) => (
              <li key={d.user_id} className="flex items-center gap-3 py-3">
                <span className={cn("grid size-9 place-items-center bg-success-soft text-success")}>
                  <Check className="size-4" />
                </span>
                <span className="font-bold">{staffName(d.staff_id)}</span>
                <span className="ml-auto text-xs font-semibold text-muted-foreground">
                  linked {fmt(d.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Boxes, Eye, EyeOff, Lock, Unlock, User } from "lucide-react";
import { hydrateStore } from "@/lib/store";
import { setActiveStaff } from "@/lib/actions";
import { playBeep, playError } from "@/lib/sound";
import { loadSession, signIn } from "@/lib/session";
import { cloudSnapshot, pullFromCloud, startCloudSync } from "@/lib/cloud";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { authIdentifierFromUsername } from "@/lib/usernameAuth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Connected Login — Julienne General Enterprises" },
      { name: "description", content: "Sign in to the connected shop cloud to access the dashboard, sales and inventory." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    hydrateStore();
    loadSession();
    startCloudSync();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const identifier = authIdentifierFromUsername(username);
      const { error: authError } = await supabase.auth.signInWithPassword({ email: identifier, password });
      if (authError) throw authError;

      await pullFromCloud();
      if (cloudSnapshot().status === "error" || !cloudSnapshot().signedIn) {
        throw new Error("Could not establish a live connection to the shop cloud.");
      }
      // The cloud pull updates the store synchronously; use the current staff snapshot next.
      const currentStaff = (await import("@/lib/store")).getShop().staff;
      const active = currentStaff[0];
      if (active) {
        setActiveStaff(active.id);
        signIn(active.id, active.name);
      } else {
        throw new Error("No staff account is configured for this shop.");
      }

      playBeep();
      toast.success("Connected — shop cloud is active.");
      void navigate({ to: "/" });
    } catch (err) {
      await supabase.auth.signOut().catch(() => undefined);
      const message = err instanceof Error ? err.message : "Could not connect to the shop cloud";
      setError(message);
      playError();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center text-center">
            <span className="grid size-20 place-items-center rounded-xl bg-primary text-brand shadow-card">
              <Boxes className="size-10" />
            </span>
            <h1 className="mt-4 font-display text-2xl font-extrabold leading-tight">Julienne General Enterprises</h1>
            <p className="text-sm font-semibold text-muted-foreground">Connected Shop Cloud · Uganda</p>
          </div>

          <form onSubmit={submit} className="border border-border bg-card p-6 shadow-card sm:p-8">
            <h2 className="text-xl font-extrabold">Connected login</h2>
            <p className="mt-1 text-sm text-muted-foreground">Internet connection is required. Sales and inventory are saved directly to the shared cloud.</p>

            <div className="mt-6">
              <label htmlFor="username" className="mb-1.5 block text-sm font-bold">Username</label>
              <div className="flex items-center border-2 border-border bg-background focus-within:border-primary">
                <User className="ml-3 size-5 text-muted-foreground" />
                <input id="username" autoComplete="username" required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter username" className="w-full bg-transparent px-3 py-3.5 text-base font-semibold outline-none" />
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="password" className="mb-1.5 block text-sm font-bold">Password</label>
              <div className="flex items-center border-2 border-border bg-background focus-within:border-primary">
                <Lock className="ml-3 size-5 text-muted-foreground" />
                <input id="password" type={show ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-transparent px-3 py-3.5 text-base font-semibold outline-none" />
                <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"} className="px-3 py-3 text-muted-foreground hover:text-foreground">
                  {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
            </div>

            {error && <p className={cn("mt-4 text-sm font-bold text-danger")}>{error}</p>}

            <button type="submit" disabled={busy} className="mt-6 flex h-14 w-full items-center justify-center gap-2 bg-primary text-lg font-extrabold text-primary-foreground disabled:opacity-50">
              {busy ? <Unlock className="size-5 animate-pulse" /> : <Lock className="size-5" />}
              {busy ? "Connecting…" : "Connect and log in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

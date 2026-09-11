import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Cloud, Loader2, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { authIdentifierFromUsername } from "@/lib/usernameAuth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Shop Owner Sign In — Julienne General Enterprises" },
      {
        name: "description",
        content:
          "Sign in to back up your snack shop sales, stock and expenses to the cloud and use them on any device.",
      },
      { property: "og:title", content: "Shop Owner Sign In — Julienne General Enterprises" },
      {
        property: "og:description",
        content: "Back up your snack shop sales, stock and expenses to the cloud.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: authIdentifierFromUsername(username),
          password,
        });
        if (error) throw error;
        toast.success("Account created — your shop data is now backed up.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: authIdentifierFromUsername(username), password });
        if (error) throw error;
        toast.success("Signed in — syncing your shop data.");
      }
      void navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not sign in");
    } finally {
      setBusy(false);
    }
  }



  return (
    <div className="mx-auto max-w-md py-6">
      <div className="border border-border bg-card p-7 shadow-card">
        <span className="grid size-12 place-items-center bg-primary text-brand">
          <Cloud className="size-6" />
        </span>
        <h1 className="mt-4 font-display text-2xl font-extrabold">
          {mode === "signin" ? "Shop owner sign in" : "Create shop account"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to keep your snacks, sales and money records saved online and available on every
          device in the shop.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-bold" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-border bg-background px-3 py-3 text-base"
              placeholder="owner"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-bold" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-border bg-background px-3 py-3 text-base"
              placeholder="At least 6 characters"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 bg-primary px-4 py-3.5 text-sm font-extrabold text-primary-foreground disabled:opacity-60"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-5 w-full text-sm font-bold text-muted-foreground hover:text-foreground"
        >
          {mode === "signin"
            ? "New here? Create a shop account"
            : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}

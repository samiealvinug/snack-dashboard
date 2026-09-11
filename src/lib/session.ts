import { useSyncExternalStore } from "react";

const KEY = "snackshop-session-v1";

type Session = { staffId: string; name: string; at: string } | null;

let session: Session = null;
let loaded = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function loadSession() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) session = JSON.parse(raw) as Session;
  } catch {
    session = null;
  }
  emit();
}

export function signIn(staffId: string, name: string) {
  session = { staffId, name, at: new Date().toISOString() };
  loaded = true;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    /* private mode — session stays in memory */
  }
  emit();
}

export function signOut() {
  session = null;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  emit();
}

export function getSession() {
  return session;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function useSession() {
  return useSyncExternalStore(
    subscribe,
    () => session,
    () => null,
  );
}

/** True once localStorage has been read on the client. */
export function useSessionReady() {
  return useSyncExternalStore(
    subscribe,
    () => loaded,
    () => false,
  );
}

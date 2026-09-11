import { useSyncExternalStore } from "react";
import { seedState } from "./seed";
import type { ShopState } from "./types";

const KEY = "snackshop-state-v1";

let state: ShopState = seedState();
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* quota / private mode — keep working in memory */
  }
}

export function hydrateStore() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ShopState>;
      state = { ...seedState(), ...parsed };
      // Single owner account: Alvin Sam.
      state.staff = [
        {
          id: "s1",
          name: "Alvin Sam",
          role: "Admin",
          pin: "1111",
          username: "alvin",
          password: "timesam",
          color: "var(--brand)",
        },
      ];
      state.activeStaffId = "s1";
      persist();
    } else {
      persist();
    }
  } catch {
    /* corrupt cache — fall back to seed */
  }
  emit();
}

export function setState(updater: (s: ShopState) => ShopState) {
  state = updater(state);
  persist();
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Subscribe outside React (used by the cloud sync layer). */
export function subscribeStore(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** Replace the whole state without triggering a push back to the cloud. */
export function replaceState(next: ShopState) {
  state = next;
  persist();
  emit();
}

const getSnapshot = () => state;

export function useShop<T>(selector: (s: ShopState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(getSnapshot()),
    () => selector(seedState()),
  );
}

export function useShopState(): ShopState {
  return useSyncExternalStore(subscribe, getSnapshot, () => state);
}

export function getShop() {
  return state;
}

export function uid(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function resetStore() {
  state = seedState();
  persist();
  emit();
}

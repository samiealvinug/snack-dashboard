import { useSyncExternalStore } from "react";
import { cloudSnapshot, subscribeCloud } from "./cloud";

const serverSnapshot = { status: "disconnected" as const, email: null, signedIn: false, ready: false };

export function useCloud() {
  return useSyncExternalStore(subscribeCloud, cloudSnapshot, () => serverSnapshot);
}

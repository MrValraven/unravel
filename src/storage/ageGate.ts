import { createStore, useStore } from "./createStore";

const isBoolean = (raw: unknown): raw is boolean => typeof raw === "boolean";

export const ageGateStore = createStore<boolean>(
  "ageConfirmed",
  false,
  isBoolean
);

export function isAgeConfirmed(): boolean {
  return ageGateStore.get();
}

export function confirmAge(): void {
  ageGateStore.set(true);
}

export function useAgeConfirmed(): boolean {
  return useStore(ageGateStore);
}

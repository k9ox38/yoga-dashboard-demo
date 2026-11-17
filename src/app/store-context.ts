import { createContext, useContext } from "react";
import type { Store } from "./store";

export const StoreContext = createContext<Store | null>(null);

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore must be used within StoreProvider");
  return store;
}

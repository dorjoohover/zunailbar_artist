import { create } from "zustand";

interface SidebarStore {
  value: string | undefined;
  setValue: (value: string | undefined) => void;
}

export const useSidebarStore = create<SidebarStore>((set) => ({
  value: undefined,
  setValue: (value) => set({ value }),
}));

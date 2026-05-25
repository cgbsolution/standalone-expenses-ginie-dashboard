"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Session, User } from "@/types/auth";

interface AuthState {
  session: Session | null;
  isHydrated: boolean;
  setSession: (session: Session | null) => void;
  setUser: (user: User) => void;
  clear: () => void;
  markHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      isHydrated: false,
      setSession: (session) => set({ session }),
      setUser: (user) =>
        set((s) => (s.session ? { session: { ...s.session, user } } : s)),
      clear: () => set({ session: null }),
      markHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: "expg.auth",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      },
      partialize: (state) => ({ session: state.session }),
    },
  ),
);

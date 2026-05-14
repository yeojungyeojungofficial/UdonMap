import type { Session } from "@supabase/supabase-js";
import { create } from "zustand";
import type { UserProfile } from "@/src/core/userProfiles";

type AuthStore = {
  currentUserId: string | null;
  isAuthReady: boolean;
  profile: UserProfile | null;
  session: Session | null;
  clearAuth: () => void;
  clearProfile: () => void;
  setAuthReady: (isAuthReady: boolean) => void;
  setProfile: (profile: UserProfile | null) => void;
  setSession: (session: Session | null) => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  currentUserId: null,
  isAuthReady: false,
  profile: null,
  session: null,
  clearAuth: () =>
    set({
      currentUserId: null,
      isAuthReady: true,
      profile: null,
      session: null,
    }),
  clearProfile: () => set({ profile: null }),
  setAuthReady: (isAuthReady) => set({ isAuthReady }),
  setProfile: (profile) => set({ profile }),
  setSession: (session) =>
    set((state) => ({
      currentUserId: session?.user.id ?? null,
      profile:
        session && state.profile?.id === session.user.id ? state.profile : null,
      session,
    })),
}));

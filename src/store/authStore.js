import { create } from "zustand";
import { getFirebaseAuthServices } from "@/lib/firebaseClient";
import { getSyncStatus } from "@/lib/syncConfig";

let unsubscribeAuth = null;

function toUser(authUser) {
  if (!authUser) return null;
  return {
    uid: authUser.uid,
    email: authUser.email,
    displayName: authUser.displayName,
    photoURL: authUser.photoURL,
  };
}

export const useAuthStore = create((set, get) => ({
  status: getSyncStatus().configured ? "ready" : "local",
  user: null,
  error: null,
  initialized: false,

  initializeAuth: async () => {
    if (get().initialized) return;
    try {
      const services = await getFirebaseAuthServices();
      if (!services.configured) {
        set({ status: "local", initialized: true, error: null });
        return;
      }

      unsubscribeAuth = services.authApi.onAuthStateChanged(
        services.auth,
        (authUser) => {
          set({
            user: toUser(authUser),
            status: authUser ? "authenticated" : "ready",
            initialized: true,
            error: null,
          });
        },
        (error) => {
          set({ status: "error", initialized: true, error: error.message });
        }
      );
    } catch (error) {
      set({ status: "error", initialized: true, error: error.message });
    }
  },

  signInWithGoogle: async () => {
    const services = await getFirebaseAuthServices();
    if (!services.configured) {
      set({ status: "local", error: "Firebase 환경 변수가 설정되지 않았습니다." });
      return null;
    }

    set({ status: "loading", error: null });
    try {
      const credential = await services.authApi.signInWithPopup(services.auth, services.provider);
      const user = toUser(credential.user);
      set({ user, status: "authenticated", error: null, initialized: true });
      return user;
    } catch (error) {
      set({ status: "error", error: error.message });
      return null;
    }
  },

  signOutUser: async () => {
    const services = await getFirebaseAuthServices();
    if (!services.configured) return;
    await services.authApi.signOut(services.auth);
    set({ user: null, status: "ready", error: null });
  },

  disposeAuth: () => {
    unsubscribeAuth?.();
    unsubscribeAuth = null;
    set({ initialized: false });
  },
}));

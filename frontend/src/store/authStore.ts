import { create } from "zustand";

interface AuthState {
  token: string | null;
  setToken: (token: string) => void;
  logout: () => void;
}

const STORAGE_KEY = "survey_admin_token";

// Admin JWT is kept in localStorage so the session survives page reloads.
export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem(STORAGE_KEY),
  setToken: (token) => {
    localStorage.setItem(STORAGE_KEY, token);
    set({ token });
  },
  logout: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ token: null });
  },
}));

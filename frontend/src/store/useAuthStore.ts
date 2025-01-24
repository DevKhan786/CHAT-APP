import { create } from "zustand";
import { axiosInstance } from "../lib/axios";

interface AuthUser {
  _id: string;
  username: string;
  email: string;
}
interface AuthStore {
  authUser: AuthUser | null;
  loading: boolean;
  isCheckingAuth: boolean;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  authUser: null,
  loading: false,
  isCheckingAuth: true,

  checkAuth: async () => {
    set({ loading: true, isCheckingAuth: true });
    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data, loading: false, isCheckingAuth: false });
    } catch (error) {
      console.log("Error in checkAuth:", error);
      set({ authUser: null, loading: false, isCheckingAuth: false });
    } finally {
      set({ loading: false, isCheckingAuth: false });
    }
  },
}));

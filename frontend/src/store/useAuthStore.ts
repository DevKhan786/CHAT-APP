import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

interface AuthUser {
  _id: string;
  username: string;
  email: string;
}

interface SignupData {
  name: string;
  email: string;
  password: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface AuthStore {
  authUser: AuthUser | null;
  loading: boolean;
  isCheckingAuth: boolean;
  checkAuth: () => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  login: (data: LoginData) => Promise<void>;
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
      console.error("Error in checkAuth:", error);
      set({ authUser: null, loading: false, isCheckingAuth: false });
    }
  },

  signup: async (data: SignupData) => {
    set({ loading: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      toast.success("Account created successfully");
      set({ authUser: res.data, loading: false });
    } catch (error: any) {
      console.error("Error in signup:", error);
      toast.error(error.response?.data?.message || "Something went wrong");
      set({ loading: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
    } catch (error) {
      console.error("Error in logout:", error);
    }
  },

  login: async (data: LoginData) => {
    set({ loading: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      toast.success("Logged in successfully");
      set({ authUser: res.data, loading: false });
    } catch (error: any) {
      console.error("Error in login:", error);
      toast.error(error.response?.data?.message || "Something went wrong");
      set({ loading: false });
    }
  },
}));

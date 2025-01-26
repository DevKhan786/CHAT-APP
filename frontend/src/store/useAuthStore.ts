import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { io, Socket } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.MODE === "development" ? "http://localhost:5000" : "/";

interface AuthUser {
  _id: string;
  name: string;
  username: string;
  email: string;
  profilePic: string | null;
  createdAt: string;
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

interface UpdateProfileData {
  profilePic: string;
}

interface AuthStore {
  authUser: AuthUser | null;
  loading: boolean;
  isCheckingAuth: boolean;
  socket: Socket | null;
  onlineUsers: string[];
  checkAuth: () => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  login: (data: LoginData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  connectSocket: () => void;
  disconnectSocket: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  authUser: null,
  loading: false,
  isCheckingAuth: true,
  socket: null,
  onlineUsers: [],

  checkAuth: async () => {
    set({ loading: true, isCheckingAuth: true });
    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data, loading: false, isCheckingAuth: false });
    } catch (error: unknown) {
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
      get().connectSocket();
    } catch (error: unknown) {
      console.error("Error in signup:", error);
      toast.error(
        (error as any)?.response?.data?.message || "Something went wrong"
      );
      set({ loading: false });
    }
  },

  login: async (data: LoginData) => {
    set({ loading: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      toast.success("Logged in successfully");
      set({ authUser: res.data, loading: false });
      get().connectSocket();
    } catch (error: unknown) {
      console.error("Error in login:", error);
      toast.error(
        (error as any)?.response?.data?.message || "Something went wrong"
      );
      set({ loading: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      get().disconnectSocket();
    } catch (error: unknown) {
      console.error("Error in logout:", error);
    }
  },

  updateProfile: async (data: UpdateProfileData) => {
    set({ loading: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error: any) {
      console.log("Error in update profile:", error);
      toast.error(error.response?.data?.message || "Error updating profile");
    } finally {
      set({ loading: false });
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    const socket = io(SOCKET_URL, {
      query: { userId: authUser._id },
    });

    socket.connect();

    set({ socket: socket });

    socket.on("getOnlineUsers", (userIds: string[]) => {
      set({ onlineUsers: userIds });
    });
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket?.connected) socket.disconnect();
  },
}));

import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

// Define types for Message, User, and State
interface Message {
  _id: string;
  content: string;
  senderId: string;
  timestamp: string;
}

interface User {
  _id: string;
  name: string;
  profilePic: string;
}

interface ChatStore {
  messages: Message[];
  users: User[];
  selectedUser: User | null;
  loading: boolean;

  getUsers: () => Promise<void>;
  getMessages: (userId: string) => Promise<void>;
  sendMessage: (messageData: { content: string }) => Promise<void>;
  subscribeToMessages: () => void;
  unsubscribeFromMessages: () => void;
  setSelectedUser: (selectedUser: User) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  loading: false,

  // Get Users
  getUsers: async () => {
    set({ loading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to load users");
    } finally {
      set({ loading: false });
    }
  },

  // Get Messages
  getMessages: async (userId: string) => {
    set({ loading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to load messages");
    } finally {
      set({ loading: false });
    }
  },

  // Send a Message
  sendMessage: async (messageData: { content: string }) => {
    const { selectedUser, messages } = get();
    if (!selectedUser) return;
    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );
      set({ messages: [...messages, res.data] });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to send message");
    }
  },

  // Subscribe to New Messages
  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket?.on("newMessage", (newMessage: Message) => {
      const isMessageSentFromSelectedUser =
        newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;

      set({
        messages: [...get().messages, newMessage],
      });
    });
  },

  // Unsubscribe from Messages
  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket?.off("newMessage");
  },

  // Set Selected User
  setSelectedUser: (selectedUser: User) => set({ selectedUser }),
}));

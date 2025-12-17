import api from "./index";
import type { Message } from "@/types";

export interface SendMessageData {
  receiverId: string;
  content: string;
  conversationId: string;
}

interface MessagesResponse {
  success: boolean;
  message: string;
  data: Message[];
}

export const getMessages = async (
  conversationId: string
): Promise<Message[]> => {
  try {
    const response = await api.get<MessagesResponse>(
      `/api/messages/${conversationId}`
    );
    console.log("Get messages response:", response.data);
    return response.data.data;
  } catch (error: any) {
    console.error("Get messages error:", error);
    throw error.response?.data || error;
  }
};

export const sendMessage = async (data: SendMessageData) => {
  const response = await api.post("/api/messages", data);
  return response.data;
};

export const markMessagesAsRead = async (conversationId: string) => {
  try {
    const response = await api.patch(`/api/messages/read/${conversationId}`);
    console.log("Mark messages as read response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Mark messages as read error:", error);
    throw error.response?.data || error;
  }
};

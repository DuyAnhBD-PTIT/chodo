import type { Conversation } from "@/types";
import api from "./index";

interface ConversationsResponse {
  success: boolean;
  message: string;
  data: Conversation[];
}

interface ConversationResponse {
  success: boolean;
  message: string;
  data: Conversation;
}

interface CreateConversationData {
  receiverId: string;
  postId: string;
}

// Lấy danh sách conversations của user hiện tại
export const getConversations = async (): Promise<Conversation[]> => {
  try {
    const response = await api.get<ConversationsResponse>("/api/conversations");
    console.log("Get conversations response:", response.data);
    return response.data.data;
  } catch (error: any) {
    console.error("Get conversations error:", error);
    throw error.response?.data || error;
  }
};

// Tạo mới conversation
export const createConversation = async (
  data: CreateConversationData
): Promise<Conversation> => {
  try {
    const response = await api.post<ConversationResponse>(
      "/api/conversations",
      data
    );
    console.log("Create conversation response:", response.data);
    return response.data.data;
  } catch (error: any) {
    console.error("Create conversation error:", error);
    throw error.response?.data || error;
  }
};

// Lấy chi tiết conversation theo ID
export const getConversationById = async (
  id: string
): Promise<Conversation> => {
  try {
    const response = await api.get<ConversationResponse>(
      `/api/conversations/${id}`
    );
    console.log("Get conversation by ID response:", response.data);
    return response.data.data;
  } catch (error: any) {
    console.error("Get conversation by ID error:", error);
    throw error.response?.data || error;
  }
};

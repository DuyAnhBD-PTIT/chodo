import type {
  ApiResponse,
  CreatePostData,
  Post,
  PostDetailResponse,
  UpdatePostData,
} from "@/types";
import api from "./api";

// Lấy danh sách posts
export const getPosts = async (params?: {
  page?: number;
  limit?: number;
  category?: string;
  status?: string;
}): Promise<Post[]> => {
  try {
    const response = await api.get("/api/posts", { params });
    console.log("Get posts response:", response.data);

    return response.data.data;
  } catch (error: any) {
    console.error("Get posts error:", error);
    throw error.response?.data || error;
  }
};

// Lấy chi tiết post
export const getPostById = async (id: string): Promise<Post> => {
  try {
    const response = await api.get<PostDetailResponse>(`/api/posts/${id}`);
    console.log("Get post detail response:", response.data);
    return response.data.data;
  } catch (error: any) {
    console.error("Get post detail error:", error);
    throw error.response?.data || error;
  }
};

// Tạo post mới (yêu cầu token)
export const createPost = async (data: CreatePostData): Promise<Post> => {
  try {
    const response = await api.post<PostDetailResponse>("/api/posts", data);
    console.log("Create post response:", response.data);
    return response.data.data;
  } catch (error: any) {
    console.error("Create post error:", error);
    throw error.response?.data || error;
  }
};

// Cập nhật post (yêu cầu token)
export const updatePost = async (
  id: string,
  data: UpdatePostData
): Promise<Post> => {
  try {
    const response = await api.put<PostDetailResponse>(
      `/api/posts/${id}`,
      data
    );
    console.log("Update post response:", response.data);
    return response.data.data;
  } catch (error: any) {
    console.error("Update post error:", error);
    throw error.response?.data || error;
  }
};

// Xóa post (yêu cầu token)
export const deletePost = async (id: string): Promise<void> => {
  try {
    const response = await api.delete<ApiResponse>(`/api/posts/${id}`);
    console.log("Delete post response:", response.data);
  } catch (error: any) {
    console.error("Delete post error:", error);
    throw error.response?.data || error;
  }
};

// Lấy posts của user hiện tại (yêu cầu token)
export const getMyPosts = async (params?: {
  page?: number;
  limit?: number;
}): Promise<Post[]> => {
  try {
    const response = await api.get("/api/posts/my/posts", { params });
    console.log("Get my posts response:", response.data);

    return response.data.data;
  } catch (error: any) {
    console.error("Get my posts error:", error);
    throw error.response?.data || error;
  }
};

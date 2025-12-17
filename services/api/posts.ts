import type {
  ApiResponse,
  CreatePostData,
  Post,
  PostDetailResponse,
  UpdatePostData,
} from "@/types";
import api from "./index";

// Lấy danh sách posts
export const getPosts = async (params?: {
  page?: number;
  limit?: number;
  category?: string;
  status?: string;
  author?: string;
  title?: string;
}): Promise<Post[]> => {
  try {
    const response = await api.get("/api/posts", { params });

    return response.data.data;
  } catch (error: any) {
    console.error("Get posts error:", error);
    throw error.response?.data || error;
  }
};

// Lấy chi tiết post
export const getPostById = async (
  id: string,
  skipViewIncrement: boolean = false
): Promise<Post> => {
  try {
    const params = skipViewIncrement ? { skipView: "true" } : {};
    const response = await api.get<PostDetailResponse>(`/api/posts/${id}`, {
      params,
    });
    console.log("Get post detail response:", response.data);
    return response.data.data;
  } catch (error: any) {
    console.error("Get post detail error:", error);
    throw error.response?.data || error;
  }
};

// Tạo post mới (yêu cầu token)
export const createPost = async (
  data: CreatePostData & { imageUris?: string[] }
): Promise<Post> => {
  try {
    const formData = new FormData();

    // Thêm các field thông tin
    formData.append("title", data.title);
    formData.append("description", data.description || "");
    formData.append("price", data.price.toString());
    formData.append("condition", data.condition);
    formData.append("categoryId", data.categoryId);
    formData.append("categoryName", data.categoryName || "");
    formData.append("address", data.address || "");

    // Thêm ảnh
    if (data.imageUris && data.imageUris.length > 0) {
      data.imageUris.forEach((uri, index) => {
        const filename = uri.split("/").pop() || `image${index}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image/jpeg";

        formData.append("images", {
          uri,
          name: filename,
          type,
        } as any);
      });
    }

    console.log("Creating post with FormData");

    const response = await api.post<PostDetailResponse>(
      "/api/posts",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

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
  data: UpdatePostData & { imageUris?: string[] }
): Promise<Post> => {
  try {
    const formData = new FormData();

    // Thêm các field thông tin
    formData.append("title", data.title || "");
    formData.append("description", data.description || "");
    formData.append("price", data.price?.toString() || "");
    formData.append("condition", data.condition || "");
    formData.append("categoryId", data.categoryId || "");
    formData.append("categoryName", data.categoryName || "");
    formData.append("address", data.address || "");

    // Thêm ảnh (giống như createPost)
    if (data.imageUris && data.imageUris.length > 0) {
      data.imageUris.forEach((uri, index) => {
        const filename = uri.split("/").pop() || `image${index}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image/jpeg";

        formData.append("images", {
          uri,
          name: filename,
          type,
        } as any);
      });
    }

    console.log("Updating post with FormData");

    const response = await api.put<PostDetailResponse>(
      `/api/posts/${id}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
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
    console.log("First my post sample:", response.data.data?.[0]);

    return response.data.data;
  } catch (error: any) {
    console.error("Get my posts error:", error);
    throw error.response?.data || error;
  }
};

// Tăng view count cho post
export const incrementPostView = async (id: string): Promise<void> => {
  try {
    await api.patch(`/api/posts/${id}/view`);
  } catch (error: any) {
    console.error("Increment post view error:", error);
    // Không throw error để không ảnh hưởng đến UX
  }
};

// Xác nhận giao dịch bán hàng
export const confirmSell = async (
  postId: string,
  buyerId: string,
  quantity: number
): Promise<ApiResponse> => {
  try {
    const response = await api.post<ApiResponse>(`/api/posts/${postId}/sell`, {
      buyerId,
      quantity,
    });
    console.log("Confirm sell response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Confirm sell error:", error);
    throw error.response?.data || error;
  }
};

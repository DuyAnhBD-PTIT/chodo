import type { Category } from "@/types";
import api from "./index";

/**
 * Lấy danh sách tất cả categories
 */
export const getCategories = async (): Promise<Category[]> => {
  try {
    const response = await api.get("/api/categories");

    // Backend trả về: { success: true, message: "", data: Category[] }
    if (response.data.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }

    // Fallback nếu cấu trúc khác
    if (Array.isArray(response.data)) {
      return response.data;
    }

    return [];
  } catch (error: any) {
    console.error("Get categories error:", error.response?.data || error);
    throw new Error(error.response?.data?.message || "Không thể tải danh mục");
  }
};

/**
 * Lấy chi tiết một category theo ID
 */
export const getCategoryById = async (id: string): Promise<Category> => {
  try {
    const response = await api.get(`/api/categories/${id}`);

    if (response.data.success) {
      return response.data.data;
    }

    return response.data;
  } catch (error: any) {
    console.error("Get category by id error:", error.response?.data || error);
    throw new Error(
      error.response?.data?.message || "Không thể tải thông tin danh mục"
    );
  }
};

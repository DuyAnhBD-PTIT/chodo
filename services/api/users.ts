import api from "./index";

export interface TopSeller {
  fullName: string;
  avatarUrl: string | null;
  productCount: number;
  totalViews: number;
  userId: string;
}

interface TopSellersResponse {
  success: boolean;
  message: string;
  data: TopSeller[];
}

export const getTopSellers = async (
  limit: number = 10
): Promise<TopSeller[]> => {
  try {
    const response = await api.get<TopSellersResponse>(
      "/api/users/top-sellers",
      {
        params: { limit },
      }
    );
    console.log("Get top sellers response:", response.data);
    return response.data.data;
  } catch (error: any) {
    console.error("Get top sellers error:", error);
    throw error.response?.data || error;
  }
};

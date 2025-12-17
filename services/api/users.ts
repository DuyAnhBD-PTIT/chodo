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

export interface UpdateUserData {
  fullName?: string;
  phone?: string;
  gender?: string;
  address?: string;
  TinhThanh?: string;
  XaPhuong?: string;
  DateOfBirth?: string;
  avatarUrl?: string;
  password?: string;
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

export const updateUser = async (data: UpdateUserData) => {
  try {
    const response = await api.put("/api/users/update", data);
    console.log("Update user response:", response.data);

    // Update stored user data if update successful
    if (response.data.success && response.data.data) {
      const AsyncStorage = (
        await import("@react-native-async-storage/async-storage")
      ).default;
      const storedUser = await AsyncStorage.getItem("@marketplace_user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        const updatedUser = { ...user, ...response.data.data };
        await AsyncStorage.setItem(
          "@marketplace_user",
          JSON.stringify(updatedUser)
        );
      }
    }

    return response.data;
  } catch (error: any) {
    console.error("Update user error:", error);
    throw error.response?.data || error;
  }
};

export const getProfile = async () => {
  try {
    const response = await api.get("/api/users/profile");
    console.log("Get profile response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Get profile error:", error);
    throw error.response?.data || error;
  }
};

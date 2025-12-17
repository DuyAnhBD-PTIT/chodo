import api from "./index";

export interface TopSeller {
  fullName: string;
  avatarUrl: string | null;
  productCount: number;
  totalViews: number;
  userId: string;
}

export interface RatingItem {
  stars: number;
  comment: string;
  rater: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  };
  postId: string;
  createdAt: string;
}

export interface PostRatingSummary {
  ratings: RatingItem[];
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

export const getPostRatingSummary = async (
  postId: string
): Promise<PostRatingSummary> => {
  try {
    const response = await api.get(`/api/ratings/post/${postId}`);
    console.log("Get post rating summary response:", response.data);
    return response.data.data;
  } catch (error: any) {
    console.error("Get post rating summary error:", error);
    throw error.response?.data || error;
  }
};

export const updateUser = async (
  data: UpdateUserData & { avatarUri?: string }
) => {
  try {
    const formData = new FormData();

    // Add user info fields
    if (data.fullName) formData.append("fullName", data.fullName);
    if (data.phone) formData.append("phone", data.phone);
    if (data.gender) formData.append("gender", data.gender);
    if (data.address) formData.append("address", data.address);
    if (data.TinhThanh) formData.append("TinhThanh", data.TinhThanh);
    if (data.XaPhuong) formData.append("XaPhuong", data.XaPhuong);
    if (data.DateOfBirth) formData.append("DateOfBirth", data.DateOfBirth);
    if (data.password) formData.append("password", data.password);

    // Add avatar image if provided
    if (data.avatarUri) {
      const filename = data.avatarUri.split("/").pop() || "avatar.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      formData.append("avatar", {
        uri: data.avatarUri,
        name: filename,
        type,
      } as any);
    }

    console.log("Updating user with FormData");

    const response = await api.put("/api/users/update", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

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

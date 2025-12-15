import { Post } from "@/types";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();

  const handlePress = () => {
    router.push(`/post/${post._id}`);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatViews = (views: number) => {
    if (views > 25000) return "25000+";
    return views.toString();
  };

  const formatDate = (date: string | Date) => {
    if (!date) return "";

    try {
      // Handle both string and Date object
      const postDate = typeof date === "string" ? new Date(date) : date;

      // Check if date is valid
      if (isNaN(postDate.getTime())) {
        console.log("Invalid date in PostCard:", date, typeof date);
        return "";
      }

      const now = new Date();
      const diffInMs = now.getTime() - postDate.getTime();
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      if (diffInDays === 0) return "Hôm nay";
      if (diffInDays === 1) return "Hôm qua";
      if (diffInDays < 7) return `${diffInDays} ngày trước`;
      return postDate.toLocaleDateString("vi-VN");
    } catch (error) {
      console.error("Format date error:", error);
      return "";
    }
  };

  const imageUrl =
    post.images?.[0]?.imageUrl || "https://via.placeholder.com/120x120";

  const getStatusInfo = () => {
    switch (post.status) {
      case "approved":
        return {
          text: "Đã duyệt",
          color: colors.success,
          icon: "checkmark-circle" as const,
        };
      case "pending":
        return {
          text: "Chờ duyệt",
          color: "#FFA500",
          icon: "time" as const,
        };
      case "rejected":
        return {
          text: "Từ chối",
          color: colors.error,
          icon: "close-circle" as const,
        };
      default:
        return null;
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.card }]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Status Badge - Top Right of Card */}
      {statusInfo && (
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: statusInfo.color + "F0" },
          ]}
        >
          <Ionicons name={statusInfo.icon} size={12} color="#fff" />
          <Text style={styles.statusText}>{statusInfo.text}</Text>
        </View>
      )}

      {/* Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
        {post.images && post.images.length > 1 && (
          <View style={styles.imageCount}>
            <Ionicons name="images" size={14} color="#fff" />
            <Text style={styles.imageCountText}>{post.images.length}</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {post.title}
        </Text>

        <Text style={[styles.price, { color: colors.error }]}>
          {formatPrice(post.price)}
        </Text>

        <View style={styles.infoRow}>
          {post.category && (
            <View
              style={[styles.badge, { backgroundColor: colors.primary + "15" }]}
            >
              <Text
                style={[styles.badgeText, { color: colors.primary }]}
                numberOfLines={1}
              >
                {post.category.name}
              </Text>
            </View>
          )}
          <View
            style={[styles.badge, { backgroundColor: colors.success + "15" }]}
          >
            <Text style={[styles.badgeText, { color: colors.success }]}>
              {post.condition === "new" ? "Mới" : "Đã dùng"}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          {post.views != null && (
            <View style={styles.footerItem}>
              <Ionicons name="eye-outline" size={14} color={colors.tertiary} />
              <Text style={[styles.footerText, { color: colors.tertiary }]}>
                {formatViews(post.views)}
              </Text>
            </View>
          )}
          {post.createdAt && (
            <Text style={[styles.footerText, { color: colors.tertiary }]}>
              {formatDate(post.createdAt)}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: "relative",
  },
  statusBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
    zIndex: 10,
  },
  statusText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  imageContainer: {
    width: "100%",
    height: 200,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageCount: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.6)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
  },
  imageCountText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 6,
    lineHeight: 20,
  },
  price: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  footerText: {
    fontSize: 12,
  },
});

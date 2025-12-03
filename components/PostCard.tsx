import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Post } from "@/types";
import { Calendar, Eye, MapPin, Tag } from "lucide-react-native";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface PostCardProps {
  post: Post;
  onPress?: (post: Post) => void;
}

export default function PostCard({ post, onPress }: PostCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Hôm nay";
    if (days === 1) return "Hôm qua";
    if (days < 7) return `${days} ngày trước`;
    return date.toLocaleDateString("vi-VN");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "#34C759";
      case "pending":
        return "#FF9500";
      case "rejected":
        return "#FF3B30";
      case "sold":
        return "#8E8E93";
      default:
        return "#8E8E93";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "approved":
        return "Đã duyệt";
      case "pending":
        return "Chờ duyệt";
      case "rejected":
        return "Từ chối";
      case "sold":
        return "Đã bán";
      default:
        return status;
    }
  };

  const imageUrl =
    post.images?.[0]?.imageUrl || "https://via.placeholder.com/120x120";

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.cardBackground }]}
      onPress={() => onPress?.(post)}
      activeOpacity={0.7}
    >
      {/* Image bên trái */}
      <Image
        source={{ uri: imageUrl }}
        style={styles.image}
        resizeMode="cover"
      />

      {/* Content bên phải */}
      <View style={styles.content}>
        {/* Title và Status */}
        <View style={styles.header}>
          <Text
            style={[styles.title, { color: colors.text }]}
            numberOfLines={2}
          >
            {post.title}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(post.status) + "20" },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(post.status) },
              ]}
            >
              {getStatusLabel(post.status)}
            </Text>
          </View>
        </View>

        {/* Price */}
        <Text style={[styles.price, { color: colors.error }]}>
          {formatPrice(post.price)}
        </Text>

        {/* Category và Condition */}
        <View style={styles.infoRow}>
          <Tag size={14} color={colors.secondary} />
          <Text style={[styles.infoText, { color: colors.secondary }]}>
            {post.category?.name || "Chưa phân loại"} •{" "}
            {post.condition === "new" ? "Mới" : "Đã sử dụng"}
          </Text>
        </View>

        {/* Address */}
        {post.address && (
          <View style={styles.infoRow}>
            <MapPin size={14} color={colors.secondary} />
            <Text
              style={[styles.infoText, { color: colors.secondary }]}
              numberOfLines={1}
            >
              {post.address}
            </Text>
          </View>
        )}

        {/* Footer: Views và Date */}
        <View style={styles.footer}>
          <View style={styles.infoRow}>
            <Eye size={14} color={colors.tertiary} />
            <Text style={[styles.footerText, { color: colors.tertiary }]}>
              {post.views}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Calendar size={14} color={colors.tertiary} />
            <Text style={[styles.footerText, { color: colors.tertiary }]}>
              {formatDate(post.createdAt)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  content: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  price: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  footerText: {
    fontSize: 12,
  },
});

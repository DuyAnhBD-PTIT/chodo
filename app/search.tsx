import PostCard from "@/components/PostCard";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import * as postsService from "@/services/posts";
import type { Post } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SearchResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const searchQuery = (params.query as string) || "";
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAndFilterPosts = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const postsData = await postsService.getPosts();

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const filtered = postsData.filter(
          (post) =>
            post.title.toLowerCase().includes(query) ||
            post.description?.toLowerCase().includes(query) ||
            post.category?.name?.toLowerCase().includes(query)
        );
        setFilteredPosts(filtered);
      } else {
        setFilteredPosts(postsData);
      }
    } catch (error: any) {
      console.error("Load posts error:", error);
      Alert.alert("Lỗi", error.message || "Không thể tải dữ liệu");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    loadAndFilterPosts();
  }, [loadAndFilterPosts]);

  const handlePostPress = (post: Post) => {
    Alert.alert(
      post.title,
      `Giá: ${post.price.toLocaleString("vi-VN")} đ\nTrạng thái: ${
        post.status
      }`,
      [
        { text: "Đóng", style: "cancel" },
        {
          text: "Xem chi tiết",
          onPress: () => {
            console.log("Navigate to post:", post._id);
          },
        },
      ]
    );
  };

  const handleBack = () => {
    router.back();
  };

  const renderPostItem = ({ item }: { item: Post }) => (
    <PostCard post={item} onPress={handlePostPress} />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="search-outline"
        size={64}
        color={colors.tertiary}
        style={styles.emptyIcon}
      />
      <Text style={[styles.emptyText, { color: colors.tertiary }]}>
        Không tìm thấy kết quả cho từ khóa &ldquo;{searchQuery}&rdquo;
      </Text>
      <Text style={[styles.emptySubtext, { color: colors.tertiary }]}>
        Thử tìm kiếm với từ khóa khác
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.screenBackground }]}
      edges={["top"]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {isLoading ? "Đang tìm kiếm..." : `${filteredPosts.length} kết quả`}
          </Text>
          {!isLoading && searchQuery && (
            <Text style={[styles.headerSubtitle, { color: colors.secondary }]}>
              cho &ldquo;{searchQuery}&rdquo;
            </Text>
          )}
        </View>
      </View>

      {/* Results List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.secondary }]}>
            Đang tìm kiếm...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredPosts}
          renderItem={renderPostItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.postsList}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  postsList: {
    padding: 16,
    paddingTop: 8,
  },
  emptyContainer: {
    padding: 60,
    alignItems: "center",
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
  },
});

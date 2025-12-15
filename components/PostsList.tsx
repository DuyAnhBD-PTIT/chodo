import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import * as postsService from "@/services/api/posts";
import type { Post } from "@/types";
import PostCard from "./PostCard";
import { Ionicons } from "@expo/vector-icons";

interface PostsListProps {
  myPostsOnly?: boolean;
  categoryId?: string | null;
}

export default function PostsList({
  myPostsOnly = false,
  categoryId,
}: PostsListProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadPosts = useCallback(async () => {
    try {
      const params: any = {};

      if (categoryId) {
        params.category = categoryId;
      }

      const data = myPostsOnly
        ? await postsService.getMyPosts()
        : await postsService.getPosts(params);
      setPosts(data);
    } catch (error: any) {
      console.error("Load posts error:", error);
      Alert.alert("Lỗi", error.message || "Không thể tải danh sách bài đăng");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [myPostsOnly, categoryId]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadPosts();
  };

  const renderItem = ({ item }: { item: Post }) => <PostCard post={item} />;

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-outline" size={64} color={colors.tertiary} />
      <Text style={[styles.emptyText, { color: colors.tertiary }]}>
        {myPostsOnly ? "Bạn chưa có bài đăng nào" : "Chưa có bài đăng nào"}
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.secondary }]}>
          Đang tải...
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      renderItem={renderItem}
      keyExtractor={(item) => item._id}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
      ListEmptyComponent={renderEmpty}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 20,
  },
  emptyContainer: {
    padding: 60,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 16,
  },
});

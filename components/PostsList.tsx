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
  scrollEnabled?: boolean;
}

export default function PostsList({
  myPostsOnly = false,
  categoryId,
  scrollEnabled = true,
}: PostsListProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 10;

  const loadPosts = useCallback(
    async (pageNum: number = 1, append: boolean = false) => {
      try {
        if (!append) {
          setIsLoading(true);
        }

        const params: any = {
          page: pageNum,
          limit: LIMIT,
        };

        if (categoryId) {
          params.category = categoryId;
        }

        const data = myPostsOnly
          ? await postsService.getMyPosts(params)
          : await postsService.getPosts(params);

        if (append) {
          setPosts((prev) => [...prev, ...data]);
        } else {
          setPosts(data);
        }

        setHasMore(data.length === LIMIT);
      } catch (error: any) {
        console.error("Load posts error:", error);
        Alert.alert("Lỗi", error.message || "Không thể tải danh sách bài đăng");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
      }
    },
    [myPostsOnly, categoryId]
  );

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    loadPosts(1, false);
  }, [loadPosts]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setPage(1);
    setHasMore(true);
    loadPosts(1, false);
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore && !isLoading) {
      setIsLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      loadPosts(nextPage, true);
    }
  };

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  const renderItem = ({ item }: { item: Post }) => (
    <PostCard post={item} from={myPostsOnly ? "profile" : "home"} />
  );

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

      scrollEnabled={false}        // ✅ TẮT SCROLL
      nestedScrollEnabled={false}  // ✅ FIX CỨNG WARNING

      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
      ListEmptyComponent={renderEmpty}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFooter}
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
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
});

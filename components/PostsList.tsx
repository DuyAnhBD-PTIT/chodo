import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import * as postsService from "@/services/posts";
import { Post } from "@/types";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import PostCard from "./PostCard";

interface PostsListProps {
  myPostsOnly?: boolean; // true = hiển thị posts của user, false = tất cả posts
  onPostPress?: (post: Post) => void;
}

export default function PostsList({
  myPostsOnly = false,
  onPostPress,
}: PostsListProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    try {
      setError(null);
      const data = myPostsOnly
        ? await postsService.getMyPosts()
        : await postsService.getPosts();
      setPosts(data);
    } catch (error: any) {
      console.error("Load posts error:", error);
      setError(error.message || "Không thể tải danh sách bài đăng");
      Alert.alert("Lỗi", error.message || "Không thể tải danh sách bài đăng");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [myPostsOnly]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadPosts();
  };

  const renderItem = ({ item }: { item: Post }) => (
    <PostCard post={item} onPress={onPostPress} />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: colors.tertiary }]}>
        {myPostsOnly ? "Bạn chưa có bài đăng nào" : "Chưa có bài đăng nào"}
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!isLoading) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  if (isLoading && !isRefreshing) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.screenBackground },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.secondary }]}>
          Đang tải...
        </Text>
      </View>
    );
  }

  if (error && posts.length === 0) {
    return (
      <View
        style={[
          styles.errorContainer,
          { backgroundColor: colors.screenBackground },
        ]}
      >
        <Text style={[styles.errorText, { color: colors.error }]}>
          ❌ {error}
        </Text>
        <Text
          style={[styles.retryText, { color: colors.primary }]}
          onPress={loadPosts}
        >
          Thử lại
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      renderItem={renderItem}
      keyExtractor={(item) => item._id}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
      ListEmptyComponent={renderEmpty}
      ListFooterComponent={renderFooter}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingTop: 8,
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 12,
  },
  retryText: {
    fontSize: 16,
    fontWeight: "600",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
});

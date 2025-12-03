import PostCard from "@/components/PostCard";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import * as categoriesService from "@/services/categories";
import * as postsService from "@/services/posts";
import type { Category, Post } from "@/types";
import { X } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ExploreScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [debounceTimer, setDebounceTimer] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [postsData, categoriesData] = await Promise.all([
        postsService.getPosts(),
        categoriesService.getCategories(),
      ]);
      setPosts(postsData);
      setFilteredPosts(postsData);
      setCategories(categoriesData);
    } catch (error: any) {
      console.error("Load data error:", error);
      setError(error.message || "Không thể tải dữ liệu");
      Alert.alert("Lỗi", error.message || "Không thể tải dữ liệu");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filterPosts = useCallback(
    (search: string, categoryId: string | null) => {
      let result = [...posts];

      if (categoryId) {
        result = result.filter((post) => post.category?.id === categoryId);
      }

      // Filter by search query
      if (search.trim()) {
        const query = search.toLowerCase();
        result = result.filter(
          (post) =>
            post.title.toLowerCase().includes(query) ||
            post.description?.toLowerCase().includes(query)
        );
      }

      setFilteredPosts(result);
    },
    [posts]
  );

  // Handle search with debounce
  const handleSearch = (text: string) => {
    setSearchQuery(text);

    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const timer = setTimeout(() => {
      filterPosts(text, selectedCategory);
    }, 300);

    setDebounceTimer(timer);
  };

  // Handle category selection
  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    filterPosts(searchQuery, categoryId);
  };

  // Handle refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    setSelectedCategory(null);
    setSearchQuery("");
    loadData();
  };

  // Handle post press
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
            // TODO: Navigate to post detail screen
            console.log("Navigate to post:", post._id);
          },
        },
      ]
    );
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchQuery("");
    filterPosts("", selectedCategory);
  };

  // Render category tag
  const renderCategoryTag = ({ item }: { item: Category }) => {
    const isSelected = selectedCategory === item._id;
    return (
      <TouchableOpacity
        style={[
          styles.categoryTag,
          {
            backgroundColor: isSelected
              ? colors.primary
              : colors.cardBackground,
            borderColor: isSelected ? colors.primary : colors.border,
          },
        ]}
        onPress={() => handleCategorySelect(isSelected ? null : item._id)}
      >
        <Text
          style={[
            styles.categoryTagText,
            { color: isSelected ? "#fff" : colors.text },
          ]}
        >
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  // Render post item
  const renderPostItem = ({ item }: { item: Post }) => (
    <PostCard post={item} onPress={handlePostPress} />
  );

  // Render empty state
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: colors.tertiary }]}>
        {searchQuery || selectedCategory
          ? "Không tìm thấy bài đăng phù hợp"
          : "Chưa có bài đăng nào"}
      </Text>
    </View>
  );

  // Loading state
  if (isLoading && !isRefreshing) {
    return (
      <SafeAreaView
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.screenBackground },
        ]}
        edges={["top"]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.secondary }]}>
          Đang tải...
        </Text>
      </SafeAreaView>
    );
  }

  // Error state
  if (error && posts.length === 0) {
    return (
      <SafeAreaView
        style={[
          styles.errorContainer,
          { backgroundColor: colors.screenBackground },
        ]}
        edges={["top"]}
      >
        <Text style={[styles.errorText, { color: colors.error }]}>
          ❌ {error}
        </Text>
        <TouchableOpacity onPress={loadData}>
          <Text style={[styles.retryText, { color: colors.primary }]}>
            Thử lại
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.screenBackground }]}
      edges={["top"]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            // backgroundColor: colors.cardBackground,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Khám phá
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
            },
          ]}
        >
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Tìm kiếm bài đăng..."
            placeholderTextColor={colors.tertiary}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={handleClearSearch}
              style={styles.clearButton}
            >
              <X size={20} color={colors.tertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Tags */}
      {categories.length > 0 && (
        <View style={styles.categoriesContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          >
            {/* All categories tag */}
            <TouchableOpacity
              style={[
                styles.categoryTag,
                {
                  backgroundColor:
                    selectedCategory === null
                      ? colors.primary
                      : colors.cardBackground,
                  borderColor:
                    selectedCategory === null ? colors.primary : colors.border,
                },
              ]}
              onPress={() => handleCategorySelect(null)}
            >
              <Text
                style={[
                  styles.categoryTagText,
                  {
                    color: selectedCategory === null ? "#fff" : colors.text,
                  },
                ]}
              >
                Tất cả
              </Text>
            </TouchableOpacity>

            {/* Category tags */}
            <FlatList
              data={categories}
              renderItem={renderCategoryTag}
              keyExtractor={(item) => item._id}
              horizontal
              showsHorizontalScrollIndicator={false}
              scrollEnabled={false}
            />
          </ScrollView>
        </View>
      )}

      {/* Posts List */}
      <FlatList
        data={filteredPosts}
        renderItem={renderPostItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.postsList}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  categoriesList: {
    gap: 8,
  },
  categoryTag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  categoryTagText: {
    fontSize: 14,
    fontWeight: "600",
  },
  postsList: {
    padding: 16,
    paddingTop: 8,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
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
});

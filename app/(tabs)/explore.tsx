import PostCard from "@/components/PostCard";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import * as categoriesService from "@/services/categories";
import * as postsService from "@/services/posts";
import type { Category, Post } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Keyboard,
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
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const searchInputRef = useRef<TextInput>(null);

  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchWidth = useRef(new Animated.Value(0)).current;

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

  // Handle search icon press - expand search bar
  const handleSearchIconPress = () => {
    setIsSearchExpanded(true);
    Animated.timing(searchWidth, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      searchInputRef.current?.focus();
    });
  };

  // Handle search submit
  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      Keyboard.dismiss();
      router.push(`/search?query=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Handle search cancel
  const handleSearchCancel = () => {
    setIsSearchExpanded(false);
    setSearchQuery("");
    Animated.timing(searchWidth, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
    Keyboard.dismiss();
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
      <View style={styles.header}>
        {!isSearchExpanded ? (
          <>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Explore
            </Text>
            <TouchableOpacity
              style={styles.searchButton}
              onPress={handleSearchIconPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="search-outline" size={24} color={colors.text} />
            </TouchableOpacity>
          </>
        ) : (
          <Animated.View
            style={[
              styles.expandedSearchContainer,
              {
                opacity: searchWidth,
              },
            ]}
          >
            <TouchableOpacity
              onPress={handleSearchCancel}
              style={styles.cancelButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <TextInput
              ref={searchInputRef}
              style={[styles.expandedSearchInput, { color: colors.text }]}
              placeholder="Tìm kiếm bài đăng..."
              placeholderTextColor={colors.tertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="search"
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                style={styles.clearButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={colors.tertiary}
                />
              </TouchableOpacity>
            )}
          </Animated.View>
        )}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  searchButton: {
    padding: 4,
  },
  expandedSearchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cancelButton: {
    padding: 4,
  },
  expandedSearchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
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

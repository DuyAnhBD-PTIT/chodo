import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import * as postsService from "@/services/api/posts";
import * as categoriesService from "@/services/api/categories";
import PostCard from "@/components/PostCard";
import type { Post, Category } from "@/types";

export default function SearchScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await categoriesService.getCategories();
      const activeCategories = data.filter((cat) => cat.isActive);
      setCategories(activeCategories);
    } catch (error: any) {
      console.error("Load categories error:", error);
    } finally {
      setIsCategoriesLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() && !selectedCategory) {
      return;
    }

    try {
      setIsLoading(true);
      setHasSearched(true);

      const params: any = {
        limit: 50,
      };

      if (searchQuery.trim()) {
        params.title = searchQuery.trim();
      }

      if (selectedCategory) {
        params.category = selectedCategory;
      }

      const data = await postsService.getPosts(params);
      setPosts(data);
    } catch (error: any) {
      console.error("Search error:", error);
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedCategory(null);
    setPosts([]);
    setHasSearched(false);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Title with Clear Button */}
        <View style={styles.headerSection}>
          <Text style={[styles.pageTitle, { color: colors.text }]}>
            Tìm kiếm
          </Text>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearFilters}
          >
            <Text style={[styles.clearButtonText, { color: colors.primary }]}>
              Xóa bộ lọc
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View style={styles.searchSection}>
          <View
            style={[
              styles.searchInputContainer,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Ionicons name="search" size={20} color={colors.tertiary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Tìm kiếm theo tiêu đề..."
              placeholderTextColor={colors.tertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={colors.tertiary}
                />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Category Filter */}
        <View style={styles.filterSection}>
          <Text style={[styles.filterLabel, { color: colors.text }]}>
            Danh mục
          </Text>
          {isCategoriesLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}
            >
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  {
                    backgroundColor:
                      selectedCategory === null ? colors.primary : colors.card,
                    borderColor:
                      selectedCategory === null
                        ? colors.primary
                        : colors.border,
                  },
                ]}
                onPress={() => setSelectedCategory(null)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    {
                      color:
                        selectedCategory === null ? "#fff" : colors.secondary,
                    },
                  ]}
                >
                  Tất cả
                </Text>
              </TouchableOpacity>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category._id}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor:
                        selectedCategory === category._id
                          ? colors.primary
                          : colors.card,
                      borderColor:
                        selectedCategory === category._id
                          ? colors.primary
                          : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedCategory(category._id)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      {
                        color:
                          selectedCategory === category._id
                            ? "#fff"
                            : colors.secondary,
                      },
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Results */}
        {hasSearched && (
          <View style={styles.resultsSection}>
            <Text style={[styles.resultsTitle, { color: colors.text }]}>
              Kết quả ({posts.length})
            </Text>
            {posts.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons
                  name="search-outline"
                  size={64}
                  color={colors.tertiary}
                />
                <Text style={[styles.emptyText, { color: colors.tertiary }]}>
                  Không tìm thấy bài đăng nào
                </Text>
              </View>
            ) : (
              <View style={styles.postsList}>
                {posts.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))}
              </View>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  headerSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  clearButton: {
    padding: 4,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  searchSection: {
    padding: 16,
    paddingTop: 8,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  filterSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  filterScroll: {
    flexDirection: "row",
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    gap: 4,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: "600",
  },
  searchButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  searchButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  resultsSection: {
    marginTop: 24,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: "700",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  postsList: {
    gap: 0,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
});

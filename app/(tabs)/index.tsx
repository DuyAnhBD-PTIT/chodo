import { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import PostsList from "@/components/PostsList";
import * as categoriesService from "@/services/api/categories";
import type { Category } from "@/types";
import { useNotifications } from "@/contexts/NotificationContext";

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const { unreadCount } = useNotifications();

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);

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

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.screenBackground }]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Chợ Trao Đổi
        </Text>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => router.push("/notifications")}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name="notifications-outline"
            size={24}
            color={colors.text}
          />
          {unreadCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.error }]}>
              <Text style={styles.badgeText}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Categories Filter */}
      <View style={styles.categoriesContainer}>
        {isCategoriesLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
          >
            {/* Tag "Tất cả" */}
            <TouchableOpacity
              style={[
                styles.categoryTag,
                {
                  backgroundColor:
                    selectedCategory === null ? colors.primary : colors.card,
                  borderColor:
                    selectedCategory === null ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text
                style={[
                  styles.categoryTagText,
                  {
                    color:
                      selectedCategory === null ? "#fff" : colors.secondary,
                  },
                ]}
              >
                Tất cả
              </Text>
            </TouchableOpacity>

            {/* Categories từ API */}
            {categories.map((category) => (
              <TouchableOpacity
                key={category._id}
                style={[
                  styles.categoryTag,
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
                <Ionicons
                  name="pricetag"
                  size={14}
                  color={
                    selectedCategory === category._id ? "#fff" : colors.tertiary
                  }
                />
                <Text
                  style={[
                    styles.categoryTagText,
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

      <PostsList myPostsOnly={false} categoryId={selectedCategory} />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => router.push("/create-post")}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
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
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  notificationButton: {
    position: "relative",
    padding: 4,
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  categoriesContainer: {
    paddingVertical: 8,
  },
  loadingContainer: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  categoriesScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 6,
  },
  categoryTagText: {
    fontSize: 14,
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

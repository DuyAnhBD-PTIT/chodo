import { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import PostsList from "@/components/PostsList";
import * as categoriesService from "@/services/api/categories";
import * as usersService from "@/services/api/users";
import type { Category } from "@/types";
import type { TopSeller } from "@/services/api/users";

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const dividerColor =
    colorScheme === "dark" ? "rgba(255,255,255,0.08)" : "#E5E7EB";

  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);

  const [topSellers, setTopSellers] = useState<TopSeller[]>([]);
  const [isTopSellersLoading, setIsTopSellersLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);
  const [postsKey, setPostsKey] = useState(0);

  // 🔹 STATE CHO "KHÁC"
  const [showMoreCategories, setShowMoreCategories] = useState(false);

  useEffect(() => {
    loadCategories();
    loadTopSellers();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadCategories(), loadTopSellers()]);
    setPostsKey((p) => p + 1);
    setRefreshing(false);
  };

  const loadCategories = async () => {
    try {
      const data = await categoriesService.getCategories();
      setCategories(data.filter((c) => c.isActive));
    } finally {
      setIsCategoriesLoading(false);
    }
  };

  const loadTopSellers = async () => {
    try {
      const data = await usersService.getTopSellers(5);
      setTopSellers(data);
    } finally {
      setIsTopSellersLoading(false);
    }
  };

  // 🔹 CHIA DANH MỤC
  const mainCategories = categories.slice(0, 4);
  const extraCategories = categories.slice(4);

  /* ================= BXH (GIỮ NGUYÊN) ================= */

  const renderTopCard = (seller: TopSeller, rank: number) => {
    const isFirst = rank === 1;
    const avatarSize = isFirst ? 64 : 48;

    return (
      <View
        style={[
          styles.topCard,
          isFirst && styles.topCardFirst,
          {
            backgroundColor: isFirst
              ? colors.primary + "15"
              : colors.card,
            borderColor: isFirst ? colors.primary : colors.border,
          },
        ]}
      >
        {isFirst && (
          <View style={styles.crown}>
            <Ionicons name="trophy" size={22} color="#FACC15" />
          </View>
        )}

        <Text style={[styles.rank, { color: colors.primary }]}>#{rank}</Text>

        {seller.avatarUrl ? (
          <Image
            source={{ uri: seller.avatarUrl }}
            style={{
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
              marginBottom: 6,
            }}
          />
        ) : (
          <View
            style={{
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
              backgroundColor: colors.border,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 6,
            }}
          >
            <Ionicons
              name="person"
              size={isFirst ? 36 : 24}
              color={colors.secondary}
            />
          </View>
        )}

        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {seller.fullName}
        </Text>

        <Text style={[styles.score, { color: colors.secondary }]}>
          {seller.totalViews} lượt xem
        </Text>
      </View>
    );
  };

  const renderRunnerUp = (seller: TopSeller, rank: number) => (
    <View
      style={[
        styles.runnerRow,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.runnerRank, { color: colors.text }]}>#{rank}</Text>

      {seller.avatarUrl ? (
        <Image
          source={{ uri: seller.avatarUrl }}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            marginRight: 8,
          }}
        />
      ) : (
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.border,
            justifyContent: "center",
            alignItems: "center",
            marginRight: 8,
          }}
        >
          <Ionicons name="person" size={20} color={colors.secondary} />
        </View>
      )}

      <View style={{ flex: 1 }}>
        <Text style={[styles.runnerName, { color: colors.text }]} numberOfLines={1}>
          {seller.fullName}
        </Text>
        <Text style={[styles.runnerStats, { color: colors.secondary }]}>
          {seller.productCount} SP • {seller.totalViews} lượt xem
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.screenBackground }]}
      edges={["top"]}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Trang chủ
        </Text>

        <TouchableOpacity onPress={() => router.push("/notifications")}>
          <Ionicons name="notifications-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* BXH */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Bảng xếp hạng
          </Text>
        </View>

        {isTopSellersLoading ? (
          <ActivityIndicator style={{ marginVertical: 40 }} />
        ) : (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push("/top-sellers")}
          >
            <View style={[styles.leaderboardWrapper, { backgroundColor: colors.card }]}>
              <View style={styles.podium}>
                {topSellers[1] && renderTopCard(topSellers[1], 2)}
                {topSellers[0] && renderTopCard(topSellers[0], 1)}
                {topSellers[2] && renderTopCard(topSellers[2], 3)}
              </View>

              <View style={styles.runnerList}>
                {topSellers[3] && renderRunnerUp(topSellers[3], 4)}
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* ================= DANH MỤC ================= */}
        <View
          style={[
            styles.categoriesWrapper,
            { borderBottomColor: dividerColor },
          ]}
        >
          {isCategoriesLoading ? (
            <ActivityIndicator />
          ) : (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  style={[
                    styles.categoryTag,
                    selectedCategory === null && {
                      backgroundColor: colors.primary,
                      borderColor: colors.primary,
                    },
                  ]}
                  onPress={() => setSelectedCategory(null)}
                >
                  <Text style={{ color: selectedCategory === null ? "#fff" : colors.text }}>
                    Tất cả
                  </Text>
                </TouchableOpacity>

                {mainCategories.map((cat) => (
                  <TouchableOpacity
                    key={cat._id}
                    style={[
                      styles.categoryTag,
                      selectedCategory === cat._id && {
                        backgroundColor: colors.primary,
                        borderColor: colors.primary,
                      },
                    ]}
                    onPress={() => setSelectedCategory(cat._id)}
                  >
                    <Text
                      style={{
                        color:
                          selectedCategory === cat._id ? "#fff" : colors.text,
                      }}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}

                {/* KHÁC – LUÔN HIỆN */}
                <TouchableOpacity
                  style={styles.categoryTag}
                  onPress={() => setShowMoreCategories((p) => !p)}
                >
                  <Text style={{ color: colors.text }}>
                    {showMoreCategories ? "Thu gọn" : "Khác"}
                  </Text>
                </TouchableOpacity>
              </ScrollView>

              {showMoreCategories && (
                <View style={styles.extraCategories}>
                  {extraCategories.length === 0 ? (
                    <Text style={{ color: colors.secondary }}>
                      Chưa có danh mục khác
                    </Text>
                  ) : (
                    extraCategories.map((cat) => (
                      <TouchableOpacity
                        key={cat._id}
                        style={styles.extraCategoryTag}
                        onPress={() => {
                          setSelectedCategory(cat._id);
                          setShowMoreCategories(false);
                        }}
                      >
                        <Text style={{ color: colors.text }}>{cat.name}</Text>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}
            </>
          )}
        </View>

        {/* POSTS */}
        <PostsList
          key={postsKey}
          myPostsOnly={false}
          categoryId={selectedCategory}
          scrollEnabled={false}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headerTitle: { fontSize: 28, fontWeight: "700" },

  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700" },

  leaderboardWrapper: {
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 20,
    padding: 16,
  },

  podium: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    gap: 12,
  },

  crown: {
    position: "absolute",
    top: -18,
    padding: 6,
    borderRadius: 999,
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FACC15",
  },

  topCard: {
    width: 100,
    alignItems: "center",
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1,
  },
  topCardFirst: {
    width: 130,
    paddingVertical: 20,
  },

  rank: { fontWeight: "700", marginBottom: 6 },
  name: { fontWeight: "600", fontSize: 13 },
  score: { fontSize: 12 },

  runnerList: { marginTop: 16 },

  runnerRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
  },

  runnerRank: { width: 32, fontWeight: "700", textAlign: "center" },
  runnerName: { fontWeight: "600" },
  runnerStats: { fontSize: 12 },

  categoriesWrapper: {
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  categoryTag: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginHorizontal: 6,
  },

  extraCategories: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 8,
  },
  extraCategoryTag: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
});

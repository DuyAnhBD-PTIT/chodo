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
import { useRouter, useLocalSearchParams } from "expo-router";
import PostsList from "@/components/PostsList";
import * as categoriesService from "@/services/api/categories";
import * as usersService from "@/services/api/users";
import type { Category } from "@/types";
import type { TopSeller } from "@/services/api/users";
import { useNotifications } from "@/contexts/NotificationContext";

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const { unreadCount } = useNotifications();
  const params = useLocalSearchParams();

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  const [topSellers, setTopSellers] = useState<TopSeller[]>([]);
  const [isTopSellersLoading, setIsTopSellersLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [postsKey, setPostsKey] = useState(0);

  useEffect(() => {
    loadCategories();
    loadTopSellers();
  }, []);

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

  /* ========= LEADERBOARD ========= */

  const renderTopCard = (seller: TopSeller, rank: number) => {
    const isFirst = rank === 1;

    return (
      <View style={[styles.topCard, isFirst && styles.topCardFirst]}>
        {/* 👑 VƯƠNG MIỆN TOP 1 */}
        {isFirst && (
          <View style={styles.crown}>
            <Ionicons name="trophy" size={22} color="#FACC15" />
          </View>
        )}

        <Text style={styles.rank}>#{rank}</Text>
          {seller.avatarUrl ? (
            <Image
              source={{ uri: seller.avatarUrl }}
              style={[styles.avatar, isFirst && styles.avatarFirst]}
            />
          ) : (
            <View
              style={[
                styles.avatarPlaceholder,
                isFirst && styles.avatarFirst,
              ]}
            >
              <Ionicons
                name="person"
                size={isFirst ? 36 : 24}
                color="#9CA3AF"
              />
            </View>
          )}  
          <Text style={styles.name} numberOfLines={1}>
            {seller.fullName}
          </Text>

          <Text style={styles.score}>
            {seller.totalViews} lượt xem
          </Text>
      </View>
    );
  };


  const renderRunnerUp = (seller: TopSeller, rank: number) => (
    <View style={styles.runnerRow}>
      <Text style={styles.runnerRank}>#{rank}</Text>

      {seller.avatarUrl ? (
        <Image
          source={{ uri: seller.avatarUrl }}
          style={styles.runnerAvatar}
        />
      ) : (
        <View style={styles.runnerAvatarPlaceholder}>
          <Ionicons name="person" size={20} color="#999" />
        </View>
      )}

      <View style={{ flex: 1 }}>
        <Text style={styles.runnerName} numberOfLines={1}>
          {seller.fullName}
        </Text>
        <Text style={styles.runnerStats}>
          {seller.productCount} SP • {seller.totalViews} lượt xem
        </Text>
      </View>
    </View>
  );


  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Trang chủ</Text>
        <TouchableOpacity onPress={() => router.push("/notifications")}>
          <Ionicons name="notifications-outline" size={24} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadTopSellers} />
        }
      >
        {/* ===== LEADERBOARD ===== */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Bảng xếp hạng</Text>
          <TouchableOpacity onPress={() => router.push("/top-sellers")}>
            
          </TouchableOpacity>
        </View>

        {isTopSellersLoading ? (
          <ActivityIndicator />
        ) : (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push("/top-sellers")}
          >
            <View style={styles.leaderboardWrapper}>
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


        {/* POSTS */}
        <PostsList key={postsKey} myPostsOnly={false} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6F7F9" },

  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headerTitle: { fontSize: 28, fontWeight: "700" },

  badge: {
    position: "absolute",
    top: -4,
    right: -6,
    backgroundColor: "red",
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  badgeText: { color: "#fff", fontSize: 10 },

  section: { paddingVertical: 12 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700" },
  viewAll: { color: "#4F6BED", fontWeight: "600" },

  leaderboard: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 16,
    overflow: "hidden",
  },

  leaderboardWrapper: {
    marginHorizontal: 20,
    marginTop: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },

  runnerList: {
    marginTop: 16,
  },

  crown: {
    position: "absolute",
    top: -18,
    zIndex: 20,
    backgroundColor: "#FFF7ED",
    padding: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#FACC15",
  },

  podium: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    gap: 12,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  runnerAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  topCard: {
    width: 100,
    alignItems: "center",
    backgroundColor: "#F5F6FA",
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },


  topCardFirst: {
    width: 130,
    paddingVertical: 20,
    backgroundColor: "#EEF2FF", // xanh nhạt
    borderColor: "#4F6BED",
  },
  
  rank: {
    color: "#4F6BED",
    fontWeight: "700",
    marginBottom: 6,
  },


  avatar: { width: 48, height: 48, borderRadius: 24, marginBottom: 6 },
  avatarFirst: { width: 64, height: 64, borderRadius: 32 },

  name: {
    color: "#111827",
    fontWeight: "600",
    fontSize: 13,
  },
    score: {
    color: "#6B7280",
    fontSize: 12,
  },


  runnerRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  runnerAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 8 },
  runnerRank: { width: 32, fontWeight: "700", textAlign: "center" },
  
  runnerName: { fontWeight: "600" },
  runnerStats: { fontSize: 12, color: "#666" }
});

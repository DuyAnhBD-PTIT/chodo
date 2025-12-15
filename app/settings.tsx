import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Switch,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { themeMode, setThemeMode } = useTheme();

  const handleThemeChange = async (theme: "light" | "dark" | "system") => {
    try {
      await setThemeMode(theme);
    } catch (error) {
      console.error("Save theme error:", error);
      Alert.alert("Lỗi", "Không thể thay đổi theme");
    }
  };

  const handleEditProfile = () => {
    Alert.alert(
      "Thông báo",
      "Chức năng chỉnh sửa thông tin đang được phát triển"
    );
  };

  const handleLogout = async () => {
    Alert.alert("Đăng xuất", "Bạn có chắc muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
            router.replace("/landing");
          } catch (error: any) {
            Alert.alert("Lỗi", error.message || "Không thể đăng xuất");
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Cài đặt
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Info Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.userInfo}>
            <View
              style={[
                styles.avatar,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={[styles.userName, { color: colors.text }]}>
                {user?.fullName}
              </Text>
              <Text style={[styles.userEmail, { color: colors.secondary }]}>
                {user?.email}
              </Text>
            </View>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.secondary }]}>
            TÀI KHOẢN
          </Text>
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: colors.border }]}
              onPress={handleEditProfile}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons
                  name="person-outline"
                  size={22}
                  color={colors.primary}
                />
                <Text style={[styles.menuItemText, { color: colors.text }]}>
                  Chỉnh sửa thông tin cá nhân
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.tertiary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Appearance Section */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.secondary }]}>
            GIAO DIỆN
          </Text>
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: colors.border }]}
              onPress={() => handleThemeChange("light")}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons
                  name="sunny-outline"
                  size={22}
                  color={colors.primary}
                />
                <Text style={[styles.menuItemText, { color: colors.text }]}>
                  Sáng
                </Text>
              </View>
              {themeMode === "light" && (
                <Ionicons name="checkmark" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: colors.border }]}
              onPress={() => handleThemeChange("dark")}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons
                  name="moon-outline"
                  size={22}
                  color={colors.primary}
                />
                <Text style={[styles.menuItemText, { color: colors.text }]}>
                  Tối
                </Text>
              </View>
              {themeMode === "dark" && (
                <Ionicons name="checkmark" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleThemeChange("system")}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons
                  name="phone-portrait-outline"
                  size={22}
                  color={colors.primary}
                />
                <Text style={[styles.menuItemText, { color: colors.text }]}>
                  Theo hệ thống
                </Text>
              </View>
              {themeMode === "system" && (
                <Ionicons name="checkmark" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Section */}
        <View style={styles.sectionContainer}>
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <View style={styles.menuItemLeft}>
                <Ionicons
                  name="log-out-outline"
                  size={22}
                  color={colors.error}
                />
                <Text style={[styles.menuItemText, { color: colors.error }]}>
                  Đăng xuất
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  content: {
    flex: 1,
  },
  section: {
    borderRadius: 12,
    overflow: "hidden",
  },
  sectionContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    marginLeft: 4,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "700",
  },
  userDetails: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
  },
});

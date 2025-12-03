import { Colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const { user, logout, updateUserProfile } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const handleLogout = async () => {
    Alert.alert("Đăng xuất", "Bạn có chắc muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
          } catch (error: any) {
            Alert.alert("Lỗi", error.message || "Không thể đăng xuất");
          }
        },
      },
    ]);
  };

  console.log(user);

  const handleUpdateProfile = async () => {
    try {
      await updateUserProfile({ name: "Updated Name" });
      Alert.alert("Thành công", "Cập nhật profile thành công");
    } catch (error: any) {
      Alert.alert("Lỗi", error.message || "Không thể cập nhật profile");
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.screenBackground }]}
      edges={["top"]}
    >
      <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.title, { color: colors.text }]}>
          Thông tin người dùng
        </Text>

        <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.secondary }]}>
            User ID:
          </Text>
          <Text style={[styles.value, { color: colors.text }]}>
            {user?.userId}
          </Text>
        </View>

        <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.secondary }]}>
            Email:
          </Text>
          <Text style={[styles.value, { color: colors.text }]}>
            {user?.email}
          </Text>
        </View>

        <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.secondary }]}>Role:</Text>
          <Text style={[styles.value, { color: colors.text }]}>
            {user?.role}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={handleUpdateProfile}
      >
        <Text style={styles.buttonText}>Cập nhật Profile (API có token)</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.error }]}
        onPress={handleLogout}
      >
        <Text style={styles.buttonText}>Đăng xuất</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  card: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
  },
  value: {
    fontSize: 16,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

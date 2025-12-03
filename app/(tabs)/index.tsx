import PostsList from "@/components/PostsList";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Post } from "@/types";
import React from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

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

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.screenBackground }]}
      edges={["top"]}
    >
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.cardBackground,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Bài đăng của tôi
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.secondary }]}>
          {user?.fullName || user?.email}
        </Text>
      </View>

      <PostsList myPostsOnly={true} onPostPress={handlePostPress} />
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
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
});

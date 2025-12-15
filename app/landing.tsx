import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

export default function LandingScreen() {
  const router = useRouter();

  return (
    <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Chợ Trao Đổi</Text>
          <Text style={styles.subtitle}>
            Nền tảng mua bán và trao đổi hàng hóa trực tuyến
          </Text>
        </View>

        <View style={styles.illustration}>
          <Text style={styles.emoji}>🛍️</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={() => router.push("/auth/register")}
          >
            <Text style={styles.primaryButtonText}>Bắt đầu ngay</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => router.push("/auth/login")}
          >
            <Text style={styles.secondaryButtonText}>Đã có tài khoản</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 60,
  },
  header: {
    alignItems: "center",
    marginTop: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#f0f0f0",
    textAlign: "center",
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  illustration: {
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: {
    fontSize: 120,
  },
  buttonContainer: {
    gap: 16,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#fff",
  },
  primaryButtonText: {
    color: "#667eea",
    fontSize: 18,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#fff",
  },
  secondaryButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});

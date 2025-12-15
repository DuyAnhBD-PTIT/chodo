import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { authService } from "@/services/api/auth";
import { useAuth } from "@/contexts/AuthContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";

export default function VerifyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { login } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const email = params.email as string;

  useEffect(() => {
    if (!email) {
      Alert.alert("Lỗi", "Email không hợp lệ", [
        { text: "OK", onPress: () => router.back() },
      ]);
    }
  }, [email]);

  const handleVerify = async () => {
    if (!code) {
      Alert.alert("Lỗi", "Vui lòng nhập mã xác thực");
      return;
    }

    if (code.length !== 6) {
      Alert.alert("Lỗi", "Mã xác thực phải có 6 ký tự");
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.verify({ email, code });
      await login(response);

      Alert.alert(
        "Xác thực thành công",
        "Tài khoản của bạn đã được kích hoạt",
        [
          {
            text: "OK",
            onPress: () => router.replace("/(tabs)"),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        "Xác thực thất bại",
        error instanceof Error ? error.message : "Đã xảy ra lỗi"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    Alert.alert(
      "Gửi lại mã",
      "Chức năng này cần được implement ở backend. Bạn có muốn đăng ký lại không?",
      [
        { text: "Hủy", style: "cancel" },
        { text: "Đăng ký lại", onPress: () => router.back() },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/landing")}
        >
          <Text style={[styles.backButtonText, { color: colors.primary }]}>
            ← Quay lại
          </Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Xác thực email
          </Text>
          <Text style={[styles.subtitle, { color: colors.secondary }]}>
            Mã xác thực đã được gửi đến
          </Text>
          <Text style={[styles.email, { color: colors.primary }]}>{email}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>
              Mã xác thực
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                  color: colors.text,
                },
              ]}
              placeholder="Nhập mã 6 chữ số"
              placeholderTextColor={colors.tertiary}
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: colors.primary },
              isLoading && styles.buttonDisabled,
            ]}
            onPress={handleVerify}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Xác thực</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.secondary }]}>
              Không nhận được mã?{" "}
            </Text>
            <TouchableOpacity onPress={handleResendCode}>
              <Text style={[styles.link, { color: colors.primary }]}>
                Gửi lại
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  backButton: {
    marginTop: 20,
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    marginTop: 60,
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
  },
  email: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 4,
  },
  form: {
    gap: 24,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 24,
    textAlign: "center",
    letterSpacing: 8,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
  },
  link: {
    fontSize: 14,
    fontWeight: "600",
  },
});

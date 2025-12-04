import { Colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import React, { forwardRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";

interface RegisterBottomSheetProps {
  onSwitchToLogin?: () => void;
}

const RegisterBottomSheet = forwardRef<BottomSheet, RegisterBottomSheetProps>(
  ({ onSwitchToLogin }, ref) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [name, setName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { register } = useAuth();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? "light"];

    const hasUnsavedChanges = () => {
      return (
        email.trim() !== "" ||
        password.trim() !== "" ||
        confirmPassword.trim() !== "" ||
        name.trim() !== ""
      );
    };

    const handleClose = () => {
      if (hasUnsavedChanges()) {
        Alert.alert(
          "Bạn có thay đổi chưa lưu",
          "Bạn có chắc muốn thoát? Các thông tin đã nhập sẽ bị mất.",
          [
            { text: "Tiếp tục nhập", style: "cancel" },
            {
              text: "Thoát",
              style: "destructive",
              onPress: () => {
                if (ref && typeof ref !== "function" && "current" in ref) {
                  ref.current?.close();
                }
              },
            },
          ]
        );
      } else {
        if (ref && typeof ref !== "function" && "current" in ref) {
          ref.current?.close();
        }
      }
    };

    const handleRegister = async () => {
      if (!email || !password || !confirmPassword) {
        Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin");
        return;
      }

      if (password !== confirmPassword) {
        Alert.alert("Lỗi", "Mật khẩu xác nhận không khớp");
        return;
      }

      if (password.length < 6) {
        Alert.alert("Lỗi", "Mật khẩu phải có ít nhất 6 ký tự");
        return;
      }

      setIsLoading(true);
      try {
        await register(email, password, name);
        Alert.alert(
          "Đăng ký thành công",
          "Vui lòng kiểm tra email để xác thực tài khoản",
          [
            {
              text: "OK",
              onPress: () => {
                router.push({
                  pathname: "/(auth)/verify",
                  params: { email },
                });
              },
            },
          ]
        );
      } catch (error: any) {
        Alert.alert(
          "Đăng ký thất bại",
          error.message || "Có lỗi xảy ra. Vui lòng thử lại."
        );
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={["80%"]}
        enablePanDownToClose={true}
        onChange={(index) => {
          if (index === -1) {
            handleClose();
          }
        }}
        backgroundStyle={{
          backgroundColor: colors.background,
        }}
        handleIndicatorStyle={{
          backgroundColor: colors.tertiary,
        }}
      >
        <BottomSheetScrollView style={styles.contentContainer}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardView}
          >
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>
                Đăng ký
              </Text>
              <Text style={[styles.subtitle, { color: colors.secondary }]}>
                Tạo tài khoản mới để bắt đầu
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Họ tên (Tùy chọn)
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    { backgroundColor: colors.inputBackground },
                  ]}
                >
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={colors.tertiary}
                  />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Nguyễn Văn A"
                    placeholderTextColor={colors.tertiary}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Email
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    { backgroundColor: colors.inputBackground },
                  ]}
                >
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={colors.tertiary}
                  />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="example@email.com"
                    placeholderTextColor={colors.tertiary}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Mật khẩu
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    { backgroundColor: colors.inputBackground },
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={colors.tertiary}
                  />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="••••••••"
                    placeholderTextColor={colors.tertiary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? "eye-outline" : "eye-off-outline"}
                      size={20}
                      color={colors.tertiary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Xác nhận mật khẩu
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    { backgroundColor: colors.inputBackground },
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={colors.tertiary}
                  />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="••••••••"
                    placeholderTextColor={colors.tertiary}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Ionicons
                      name={
                        showConfirmPassword ? "eye-outline" : "eye-off-outline"
                      }
                      size={20}
                      color={colors.tertiary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.registerButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={handleRegister}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.registerButtonText}>Đăng ký</Text>
                )}
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={[styles.footerText, { color: colors.secondary }]}>
                  Đã có tài khoản?{" "}
                </Text>
                <TouchableOpacity onPress={onSwitchToLogin}>
                  <Text style={[styles.linkText, { color: colors.primary }]}>
                    Đăng nhập ngay
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </BottomSheetScrollView>
      </BottomSheet>
    );
  }
);

RegisterBottomSheet.displayName = "RegisterBottomSheet";

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  form: {
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
  },
  registerButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  registerButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  footerText: {
    fontSize: 14,
  },
  linkText: {
    fontSize: 14,
    fontWeight: "600",
  },
});

export default RegisterBottomSheet;

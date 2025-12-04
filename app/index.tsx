import { Colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import LoginBottomSheet from "@/components/LoginBottomSheet";
import RegisterBottomSheet from "@/components/RegisterBottomSheet";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomSheet from "@gorhom/bottom-sheet";

export default function WelcomeScreen() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  // Bottom sheet refs
  const loginSheetRef = useRef<BottomSheet>(null);
  const registerSheetRef = useRef<BottomSheet>(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Start animations when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim, slideAnim]);

  const handleLoginSuccess = useCallback(() => {
    // Animate out and navigate
    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.replace("/(tabs)/explore" as any);
    });
  }, [contentOpacity, scaleAnim, router]);

  const handleGetStarted = useCallback(() => {
    registerSheetRef.current?.snapToIndex(0);
  }, []);

  const handleLogin = useCallback(() => {
    loginSheetRef.current?.snapToIndex(0);
  }, []);

  const handleSwitchToLogin = useCallback(() => {
    registerSheetRef.current?.close();
    setTimeout(() => {
      loginSheetRef.current?.snapToIndex(0);
    }, 300);
  }, []);

  const handleSwitchToRegister = useCallback(() => {
    loginSheetRef.current?.close();
    setTimeout(() => {
      registerSheetRef.current?.snapToIndex(0);
    }, 300);
  }, []);

  if (isLoading) {
    return null;
  }

  if (user) {
    return null;
  }

  return (
    <>
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.screenBackground }]}
        edges={["top", "bottom"]}
      >
        <Animated.View style={[styles.content, { opacity: contentOpacity }]}>
          {/* Logo/Icon Section */}
          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: colors.primary + "15" },
              ]}
            >
              <View
                style={[
                  styles.iconInner,
                  { backgroundColor: colors.primary + "30" },
                ]}
              >
                <Ionicons name="bag-handle" size={80} color={colors.primary} />
              </View>
            </View>
          </Animated.View>

          {/* Title Section */}
          <Animated.View
            style={[
              styles.titleContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={[styles.title, { color: colors.text }]}>Chodo</Text>
            <Text style={[styles.subtitle, { color: colors.secondary }]}>
              Mua bán đồ cũ dễ dàng
            </Text>
            <Text style={[styles.description, { color: colors.tertiary }]}>
              Nơi kết nối người mua và người bán{"\n"}
              đồ cũ chất lượng
            </Text>
          </Animated.View>

          {/* Buttons Section */}
          <Animated.View
            style={[
              styles.buttonsContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.primaryButton,
                { backgroundColor: colors.primary },
              ]}
              onPress={handleGetStarted}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Bắt đầu ngay</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleLogin}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.secondaryButtonText, { color: colors.tertiary }]}
              >
                Đã có tài khoản
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {/* Bottom Sheets */}
        <LoginBottomSheet
          ref={loginSheetRef}
          onSwitchToRegister={handleSwitchToRegister}
          onLoginSuccess={handleLoginSuccess}
        />
        <RegisterBottomSheet
          ref={registerSheetRef}
          onSwitchToLogin={handleSwitchToLogin}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 30,
    paddingVertical: 40,
  },
  logoContainer: {
    marginTop: 60,
    alignItems: "center",
  },
  iconCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  iconInner: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  titleContainer: {
    alignItems: "center",
    marginTop: 40,
  },
  title: {
    fontSize: 48,
    fontWeight: "800",
    marginBottom: 12,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
  },
  description: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 24,
  },
  buttonsContainer: {
    width: "100%",
    gap: 16,
    marginBottom: 20,
  },
  primaryButton: {
    width: "100%",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "700",
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "500",
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
});

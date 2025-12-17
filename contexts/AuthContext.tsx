import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User, AuthResponse } from "@/types/auth";
import { socketService } from "@/services/socket";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (authResponse: AuthResponse) => Promise<void>;
  logout: () => Promise<void>;
  setAuthData: (authResponse: AuthResponse) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "@marketplace_token";
const USER_KEY = "@marketplace_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const [storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem(TOKEN_KEY),
        AsyncStorage.getItem(USER_KEY),
      ]);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        // Connect socket when auth is restored
        await socketService.connect();
      }
    } catch (error) {
      console.error("Error loading auth data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const setAuthData = async (authResponse: AuthResponse) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(TOKEN_KEY, authResponse.token),
        AsyncStorage.setItem(USER_KEY, JSON.stringify(authResponse.user)),
      ]);
      setToken(authResponse.token);
      setUser(authResponse.user);
    } catch (error) {
      console.error("Error saving auth data:", error);
      throw error;
    }
  };

  const login = async (authResponse: AuthResponse) => {
    await setAuthData(authResponse);
    // Connect socket after successful login
    await socketService.connect();
  };

  const logout = async () => {
    try {
      // Disconnect socket before clearing auth
      socketService.disconnect();
      await Promise.all([
        AsyncStorage.removeItem(TOKEN_KEY),
        AsyncStorage.removeItem(USER_KEY),
      ]);
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error("Error clearing auth data:", error);
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem(USER_KEY);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        logout,
        setAuthData,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

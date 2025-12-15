import {
  LoginRequest,
  RegisterRequest,
  VerifyRequest,
  AuthResponse,
} from "@/types/auth";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

class AuthService {
  private async fetchWithError(
    url: string,
    options: RequestInit
  ): Promise<Response> {
    const response = await fetch(url, options);

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "An error occurred" }));
      throw new Error(
        error.message || `HTTP error! status: ${response.status}`
      );
    }

    return response;
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.fetchWithError(
      `${API_BASE_URL}/api/users/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    const result = await response.json();
    // Handle API response with data wrapper
    if (result.data) {
      return result.data;
    }
    return result;
  }

  async register(
    data: RegisterRequest
  ): Promise<{ message: string; email: string }> {
    const response = await this.fetchWithError(
      `${API_BASE_URL}/api/users/register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    const result = await response.json();
    // Handle API response with data wrapper
    if (result.data) {
      return result.data;
    }
    return result;
  }

  async verify(data: VerifyRequest): Promise<AuthResponse> {
    const response = await this.fetchWithError(
      `${API_BASE_URL}/api/users/verify`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    const result = await response.json();
    // Handle API response with data wrapper
    if (result.data) {
      return result.data;
    }
    return result;
  }
}

export const authService = new AuthService();

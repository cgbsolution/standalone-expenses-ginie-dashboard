import axios, { AxiosError, type AxiosInstance } from "axios";
import { API_BASE_URL } from "@/lib/constants";

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const raw = window.localStorage.getItem("expg.auth");
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { state?: { session?: { token?: string } } };
        const token = parsed?.state?.session?.token;
        if (token) {
          config.headers.set?.("Authorization", `Bearer ${token}`);
        }
      } catch {
        // ignore malformed persisted state
      }
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (r) => r,
  (error: AxiosError<{ error?: string }>) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      window.localStorage.removeItem("expg.auth");
      document.cookie = "expg_session=; Path=/; Max-Age=0";
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;

export function apiErrorMessage(err: unknown, fallback = "Something went wrong"): string {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.error ?? err.message ?? fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

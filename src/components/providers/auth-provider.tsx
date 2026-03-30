"use client";

import {
  AUTH_CHANGE_EVENT,
  type AuthUser,
  clearStoredAuthToken,
  clearStoredAuthUser,
  getStoredAuthToken,
  getStoredAuthUser,
  setStoredAuthToken,
  setStoredAuthUser,
} from "@/lib/auth-session";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticating: boolean;
  authError: string;
  login: () => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  clearAuthError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const AUTH_BASE_URL =
  process.env.NEXT_PUBLIC_AUTH_BASE_URL || "http://localhost:3000";
const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  "310385587632-no4coue08773ds1l3qb4ofa8gt7njs6b.apps.googleusercontent.com";
const BACKEND_REDIRECT_URI =
  process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI ||
  `${AUTH_BASE_URL}/prod-api/g/callback`;
const MIN_REFRESH_INTERVAL = 2000;

function getAuthOrigin(baseUrl: string): string {
  try {
    return new URL(baseUrl).origin;
  } catch {
    return "";
  }
}

function parseLoginMessagePayload(rawData: unknown): {
  token: string;
  user: AuthUser;
} | null {
  let encodedPayload: string | null = null;

  if (rawData && typeof rawData === "object") {
    const tokenValue = (rawData as { token?: unknown }).token;
    if (typeof tokenValue === "string") {
      encodedPayload = tokenValue;
    }
  } else if (typeof rawData === "string") {
    encodedPayload = rawData;
  }

  if (!encodedPayload) return null;

  try {
    const parsed = JSON.parse(encodedPayload) as {
      token?: string;
      user?: AuthUser;
    };
    if (!parsed?.token || !parsed?.user?.email) {
      return null;
    }

    const normalizedUser = normalizeAuthUser(parsed.user);

    return {
      token: parsed.token,
      user: normalizedUser,
    };
  } catch {
    return null;
  }
}

function normalizeAuthUser(user: AuthUser): AuthUser {
  const rawCredits = user.credits;
  const parsedCredits =
    typeof rawCredits === "number"
      ? rawCredits
      : typeof rawCredits === "string"
      ? Number(rawCredits)
      : undefined;

  return {
    ...user,
    id: user.id || user.googleUserId || user.email,
    avatarUrl: user.avatarUrl || user.picture,
    picture: user.picture || user.avatarUrl,
    credits: Number.isFinite(parsedCredits) ? parsedCredits : undefined,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredAuthUser());
  const [isLoading, setIsLoading] = useState<boolean>(() =>
    Boolean(getStoredAuthToken())
  );
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState("");

  const refreshRunningRef = useRef(false);
  const lastRefreshAtRef = useRef(0);
  const popupRef = useRef<Window | null>(null);
  const popupPollTimerRef = useRef<number | null>(null);
  const messageHandlerRef = useRef<((event: MessageEvent) => void) | null>(
    null
  );

  const clearAuthError = useCallback(() => setAuthError(""), []);

  const cleanupPopupFlow = useCallback(() => {
    if (messageHandlerRef.current) {
      window.removeEventListener("message", messageHandlerRef.current);
      messageHandlerRef.current = null;
    }
    if (popupPollTimerRef.current !== null) {
      window.clearInterval(popupPollTimerRef.current);
      popupPollTimerRef.current = null;
    }
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close();
    }
    popupRef.current = null;
  }, []);

  const logout = useCallback(() => {
    cleanupPopupFlow();
    clearStoredAuthToken();
    clearStoredAuthUser();
    setUser(null);
    setIsAuthenticating(false);
    setAuthError("");
  }, [cleanupPopupFlow]);

  const refreshUser = useCallback(async () => {
    const token = getStoredAuthToken();
    if (!token) return;

    const now = Date.now();
    if (refreshRunningRef.current) return;
    if (now - lastRefreshAtRef.current < MIN_REFRESH_INTERVAL) return;

    refreshRunningRef.current = true;
    lastRefreshAtRef.current = now;

    try {
      const response = await fetch(`${AUTH_BASE_URL}/prod-api/g/getUser`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          logout();
        }
        return;
      }

      const payload = (await response.json()) as { data?: AuthUser };
      const latestUser = payload?.data;
      if (!latestUser?.email) return;

      const normalized = normalizeAuthUser(latestUser);

      setStoredAuthUser(normalized);
      setUser(normalized);
      setAuthError("");
    } catch {
      // Ignore transient refresh failures to avoid breaking UI.
    } finally {
      refreshRunningRef.current = false;
    }
  }, [logout]);

  const login = useCallback(async () => {
    if (!GOOGLE_CLIENT_ID || !BACKEND_REDIRECT_URI || !AUTH_BASE_URL) {
      setAuthError("Google login is not configured.");
      return;
    }

    setAuthError("");
    setIsAuthenticating(true);
    cleanupPopupFlow();

    const googleAuthUrl = "https://accounts.google.com/o/oauth2/v2/auth";
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: BACKEND_REDIRECT_URI,
      response_type: "code",
      scope: "openid email profile",
      prompt: "select_account",
      state: `${Date.now()}_transcripthub`,
    });

    const width = 600;
    const height = 640;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const popup = window.open(
      `${googleAuthUrl}?${params.toString()}`,
      "GoogleLogin",
      `width=${width},height=${height},left=${left},top=${top}`
    );

    if (!popup) {
      setIsAuthenticating(false);
      setAuthError("Popup blocked. Please allow popups and retry.");
      return;
    }

    popupRef.current = popup;

    const expectedOrigin = getAuthOrigin(AUTH_BASE_URL);
    const onMessage = (event: MessageEvent) => {
      if (!expectedOrigin || event.origin !== expectedOrigin) return;

      const parsed = parseLoginMessagePayload(event.data);
      if (!parsed) return;

      setStoredAuthToken(parsed.token);
      setStoredAuthUser(parsed.user);
      setUser(parsed.user);
      setIsAuthenticating(false);
      setAuthError("");
      cleanupPopupFlow();
      void refreshUser();
    };

    messageHandlerRef.current = onMessage;
    window.addEventListener("message", onMessage);

    popupPollTimerRef.current = window.setInterval(() => {
      if (!popupRef.current || popupRef.current.closed) {
        cleanupPopupFlow();
        setIsAuthenticating(false);
      }
    }, 500);
  }, [cleanupPopupFlow, refreshUser]);

  useEffect(() => {
    const token = getStoredAuthToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    void refreshUser().finally(() => setIsLoading(false));
  }, [refreshUser]);

  useEffect(() => {
    const syncUser = () => setUser(getStoredAuthUser());
    window.addEventListener("storage", syncUser);
    window.addEventListener(AUTH_CHANGE_EVENT, syncUser);
    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener(AUTH_CHANGE_EVENT, syncUser);
    };
  }, []);

  useEffect(() => {
    return () => cleanupPopupFlow();
  }, [cleanupPopupFlow]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticating,
      authError,
      login,
      logout,
      refreshUser,
      clearAuthError,
    }),
    [
      authError,
      clearAuthError,
      isAuthenticating,
      isLoading,
      login,
      logout,
      refreshUser,
      user,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }
  return context;
}

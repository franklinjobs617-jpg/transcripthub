export type AuthUser = {
  id?: string;
  name: string;
  email: string;
  picture?: string;
  avatarUrl?: string;
  credits?: number;
  plan?: string;
  billingCycle?: string;
  nextBillingAt?: string;
  googleUserId?: string;
};

export const AUTH_STORAGE_KEY = "loggedInUser";
export const AUTH_LEGACY_STORAGE_KEY = "transcripthub_auth_user";
export const AUTH_TOKEN_STORAGE_KEY = "auth_token";
export const AUTH_CHANGE_EVENT = "transcripthub-auth-change";
export const AUTH_LOGIN_SUCCESS_FLAG = "transcripthub-login-success";

function notifyAuthChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export function getStoredAuthUser(): AuthUser | null {
  if (typeof window === "undefined") return null;

  try {
    const raw =
      window.localStorage.getItem(AUTH_STORAGE_KEY) ||
      window.localStorage.getItem(AUTH_LEGACY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    if (!parsed || !parsed.email) return null;
    const normalized: AuthUser = {
      ...parsed,
      id: parsed.id || parsed.googleUserId || parsed.email,
      avatarUrl: parsed.avatarUrl || parsed.picture,
      picture: parsed.picture || parsed.avatarUrl,
    };
    return normalized;
  } catch {
    return null;
  }
}

export function setStoredAuthUser(user: AuthUser): void {
  if (typeof window === "undefined") return;
  const normalized: AuthUser = {
    ...user,
    id: user.id || user.googleUserId || user.email,
    avatarUrl: user.avatarUrl || user.picture,
    picture: user.picture || user.avatarUrl,
  };
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(normalized));
  window.localStorage.removeItem(AUTH_LEGACY_STORAGE_KEY);
  notifyAuthChanged();
}

export function clearStoredAuthUser(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  window.localStorage.removeItem(AUTH_LEGACY_STORAGE_KEY);
  notifyAuthChanged();
}

export function getStoredAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

export function setStoredAuthToken(token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  notifyAuthChanged();
}

export function clearStoredAuthToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  notifyAuthChanged();
}

export function markLoginSuccessFlag(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(AUTH_LOGIN_SUCCESS_FLAG, "1");
}

export function consumeLoginSuccessFlag(): boolean {
  if (typeof window === "undefined") return false;
  const flagged = window.sessionStorage.getItem(AUTH_LOGIN_SUCCESS_FLAG) === "1";
  if (flagged) {
    window.sessionStorage.removeItem(AUTH_LOGIN_SUCCESS_FLAG);
  }
  return flagged;
}

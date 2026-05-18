import type { Session, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/src/core/database.types";

type AuthSession = Session | null;
type AuthSessionStorage = Pick<Storage, "getItem" | "removeItem" | "setItem">;

let cachedAuthSession: AuthSession | undefined;
const SESSION_REFRESH_BUFFER_SECONDS = 60;
const AUTO_LOGIN_DURATION_MS = 24 * 60 * 60 * 1000;
const AUTO_LOGIN_EXPIRES_AT_KEY = "animal-map:auto-login-expires-at";
const AUTH_SESSION_STORAGE_MODE_KEY = "animal-map:auth-storage-mode";
const AUTH_SESSION_STORAGE_MODE_LOCAL = "local";
const AUTH_SESSION_STORAGE_MODE_SESSION = "session";

function getBrowserLocalStorage() {
  return typeof window === "undefined" ? null : window.localStorage;
}

function getBrowserSessionStorage() {
  return typeof window === "undefined" ? null : window.sessionStorage;
}

function canUseCachedAuthSession(session: AuthSession) {
  if (!session?.expires_at) {
    return true;
  }

  return Date.now() / 1000 < session.expires_at - SESSION_REFRESH_BUFFER_SECONDS;
}

export function clearAutoLogin() {
  getBrowserLocalStorage()?.removeItem(AUTO_LOGIN_EXPIRES_AT_KEY);
}

export function enableAutoLoginFor24Hours() {
  getBrowserLocalStorage()?.setItem(
    AUTO_LOGIN_EXPIRES_AT_KEY,
    String(Date.now() + AUTO_LOGIN_DURATION_MS),
  );
}

export function hasActiveAutoLogin() {
  const storage = getBrowserLocalStorage();
  const expiresAt = Number(storage?.getItem(AUTO_LOGIN_EXPIRES_AT_KEY));

  if (!expiresAt || Number.isNaN(expiresAt)) {
    return false;
  }

  if (Date.now() >= expiresAt) {
    clearAutoLogin();
    return false;
  }

  return true;
}

export function setAuthSessionStorageMode(isAutoLoginEnabled: boolean) {
  getBrowserLocalStorage()?.setItem(
    AUTH_SESSION_STORAGE_MODE_KEY,
    isAutoLoginEnabled
      ? AUTH_SESSION_STORAGE_MODE_LOCAL
      : AUTH_SESSION_STORAGE_MODE_SESSION,
  );

  if (isAutoLoginEnabled) {
    enableAutoLoginFor24Hours();
  } else {
    clearAutoLogin();
  }
}

export function clearAuthSessionStorageMode() {
  clearAutoLogin();
  getBrowserLocalStorage()?.removeItem(AUTH_SESSION_STORAGE_MODE_KEY);
}

function shouldUseLocalAuthStorage() {
  const storage = getBrowserLocalStorage();
  const storageMode = storage?.getItem(AUTH_SESSION_STORAGE_MODE_KEY) ?? null;

  return (
    hasActiveAutoLogin() &&
    (storageMode === null || storageMode === AUTH_SESSION_STORAGE_MODE_LOCAL)
  );
}

export function createAuthSessionStorage(): AuthSessionStorage {
  return {
    getItem(key) {
      const sessionStorage = getBrowserSessionStorage();
      const sessionValue = sessionStorage?.getItem(key) ?? null;

      if (sessionValue !== null) {
        return sessionValue;
      }

      const localStorage = getBrowserLocalStorage();
      const localValue = localStorage?.getItem(key) ?? null;

      if (localValue !== null && shouldUseLocalAuthStorage()) {
        return localValue;
      }

      localStorage?.removeItem(key);
      return null;
    },
    setItem(key, value) {
      const localStorage = getBrowserLocalStorage();
      const sessionStorage = getBrowserSessionStorage();

      if (shouldUseLocalAuthStorage()) {
        localStorage?.setItem(key, value);
        sessionStorage?.removeItem(key);
        return;
      }

      sessionStorage?.setItem(key, value);
      localStorage?.removeItem(key);
    },
    removeItem(key) {
      getBrowserLocalStorage()?.removeItem(key);
      getBrowserSessionStorage()?.removeItem(key);
    },
  };
}

export function getCachedAuthSession() {
  return cachedAuthSession;
}

export function setCachedAuthSession(session: AuthSession) {
  cachedAuthSession = session;
}

export async function loadAuthSession(
  supabase: SupabaseClient<Database>,
): Promise<AuthSession> {
  if (
    cachedAuthSession !== undefined &&
    canUseCachedAuthSession(cachedAuthSession)
  ) {
    return cachedAuthSession;
  }

  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error(`Supabase 세션 조회 실패: ${error.message}`);
  }

  cachedAuthSession = data.session;
  return cachedAuthSession;
}

export function subscribeToAuthSession(
  supabase: SupabaseClient<Database>,
  onChange: (session: AuthSession) => void,
) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, nextSession) => {
    cachedAuthSession = nextSession;
    onChange(nextSession);
  });

  return () => {
    subscription.unsubscribe();
  };
}

import type { Session, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/src/shared/lib/database.types";

type AuthSession = Session | null;

let cachedAuthSession: AuthSession | undefined;
const SESSION_REFRESH_BUFFER_SECONDS = 60;
const AUTO_LOGIN_DURATION_MS = 24 * 60 * 60 * 1000;
const AUTO_LOGIN_EXPIRES_AT_KEY = "animal-map:auto-login-expires-at";

function getAutoLoginStorage() {
  return typeof window === "undefined" ? null : window.localStorage;
}

function canUseCachedAuthSession(session: AuthSession) {
  if (!session?.expires_at) {
    return true;
  }

  return Date.now() / 1000 < session.expires_at - SESSION_REFRESH_BUFFER_SECONDS;
}

export function clearAutoLogin() {
  getAutoLoginStorage()?.removeItem(AUTO_LOGIN_EXPIRES_AT_KEY);
}

export function enableAutoLoginFor24Hours() {
  getAutoLoginStorage()?.setItem(
    AUTO_LOGIN_EXPIRES_AT_KEY,
    String(Date.now() + AUTO_LOGIN_DURATION_MS),
  );
}

export function hasActiveAutoLogin() {
  const storage = getAutoLoginStorage();
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

  if (data.session && !hasActiveAutoLogin()) {
    await supabase.auth.signOut();
    cachedAuthSession = null;
    return cachedAuthSession;
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

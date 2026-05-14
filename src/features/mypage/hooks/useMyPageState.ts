import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import {
  getSupabaseBrowserClient,
  supabase,
} from "@/src/core/supabase";
import {
  clearAutoLogin,
  enableAutoLoginFor24Hours,
  hasActiveAutoLogin,
  setCachedAuthSession,
} from "@/src/core/authSession";
import { MAX_DISPLAY_NAME_LENGTH } from "@/src/core/userProfiles";
import {
  clearAuthErrorFromUrl,
  getAuthRedirectErrorMessage,
} from "@/src/features/mypage/authRedirect";
import { useAuthSessionState } from "@/src/features/auth/hooks/useAuthSessionState";
import { useBookmarkedHospitals } from "@/src/features/mypage/hooks/useBookmarkedHospitals";
import { useMyActivity } from "@/src/features/mypage/hooks/useMyActivity";
import { useProfileEditor } from "@/src/features/mypage/hooks/useProfileEditor";
import type { AuthMode } from "@/src/features/mypage/types";
import { useAuthStore } from "@/src/store/authStore";

export function useMyPageState() {
  const isSupabaseConfigured = Boolean(supabase);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const isAuthReady = useAuthStore((state) => state.isAuthReady);
  const session = useAuthStore((state) => state.session);
  const setAuthReady = useAuthStore((state) => state.setAuthReady);
  const setSession = useAuthStore((state) => state.setSession);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAutoLoginChecked, setIsAutoLoginChecked] = useState(() =>
    hasActiveAutoLogin(),
  );
  const [authMessage, setAuthMessage] = useState("");
  const [authDialogMessage, setAuthDialogMessage] = useState("");
  const {
    canSaveProfile,
    clearProfileFeedback,
    displayName,
    handleDisplayNameChange,
    handleProfileSubmit,
    isProfileLoading,
    isProfileSaving,
    profile,
    profileError,
    profileMessage,
    resetProfileState,
  } = useProfileEditor(session);
  const {
    bookmarkedHospitals,
    bookmarkError,
    closeBookmarkSheet,
    isBookmarkLoading,
    isBookmarkSheetOpen,
    openBookmarkSheet: openBookmarkSheetWithSession,
    resetBookmarks,
  } = useBookmarkedHospitals();
  const {
    activityError,
    activityTab,
    closeActivitySheet,
    handleActivityTabChange,
    isActivityLoading,
    isActivitySheetOpen,
    myComments,
    myPosts,
    myReports,
    openActivitySheet,
    resetActivity,
  } = useMyActivity();

  const openAuthDialog = useCallback((message: string) => {
    setAuthDialogMessage(message);
  }, []);

  const closeAuthDialog = useCallback(() => {
    setAuthDialogMessage("");
  }, []);

  const clearAuthFeedback = useCallback(() => {
    setAuthMessage("");
    closeAuthDialog();
  }, [closeAuthDialog]);

  const clearSignedOutState = useCallback(() => {
    resetProfileState();
    resetBookmarks();
    resetActivity();
  }, [resetActivity, resetBookmarks, resetProfileState]);

  useAuthSessionState({
    onError: openAuthDialog,
    onSignOut: clearSignedOutState,
  });

  useEffect(() => {
    let nextAuthDialogMessage = "";

    if (!isSupabaseConfigured) {
      nextAuthDialogMessage =
        "Supabase 환경변수 NEXT_PUBLIC_SUPABASE_URL 또는 NEXT_PUBLIC_SUPABASE_ANON_KEY가 없습니다.";
    } else {
      nextAuthDialogMessage = getAuthRedirectErrorMessage();
    }

    if (!nextAuthDialogMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      openAuthDialog(nextAuthDialogMessage);
    }, 0);

    if (isSupabaseConfigured) {
      clearAuthErrorFromUrl();
    }

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isSupabaseConfigured, openAuthDialog]);

  const canSubmit = useMemo(() => {
    const hasValidEmail = email.trim().includes("@");
    const hasValidPassword = password.length >= 6;

    if (authMode === "login") {
      return hasValidEmail && hasValidPassword;
    }

    return (
      hasValidEmail &&
      hasValidPassword &&
      passwordConfirm.length >= 6 &&
      password === passwordConfirm
    );
  }, [authMode, email, password, passwordConfirm]);

  const handleAuthModeChange = useCallback(
    (nextAuthMode: AuthMode) => {
      setAuthMode(nextAuthMode);
      setPassword("");
      setPasswordConfirm("");
      setAuthMessage("");
      closeAuthDialog();
    },
    [closeAuthDialog],
  );

  const handleEmailChange = useCallback(
    (value: string) => {
      setEmail(value);
      clearAuthFeedback();
    },
    [clearAuthFeedback],
  );

  const handlePasswordChange = useCallback(
    (value: string) => {
      setPassword(value);
      clearAuthFeedback();
    },
    [clearAuthFeedback],
  );

  const handlePasswordConfirmChange = useCallback(
    (value: string) => {
      setPasswordConfirm(value);
      clearAuthFeedback();
    },
    [clearAuthFeedback],
  );

  const handleAutoLoginChange = useCallback(
    (checked: boolean) => {
      setIsAutoLoginChecked(checked);
      closeAuthDialog();
    },
    [closeAuthDialog],
  );

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!canSubmit) return;

      setIsSubmitting(true);
      setAuthMessage("");
      closeAuthDialog();

      try {
        const supabase = getSupabaseBrowserClient();
        const redirectTo =
          typeof window !== "undefined"
            ? `${window.location.origin}/mypage`
            : undefined;
        const trimmedEmail = email.trim();

        if (authMode === "login") {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: trimmedEmail,
            password,
          });

          if (error) {
            openAuthDialog(`Supabase 로그인 실패: ${error.message}`);
            return;
          }

          if (!data.user.email_confirmed_at) {
            await supabase.auth.signOut();
            clearAutoLogin();
            setCachedAuthSession(null);
            clearAuth();
            openAuthDialog("이메일 인증을 완료한 뒤 로그인해주세요.");
            return;
          }

          if (isAutoLoginChecked) {
            enableAutoLoginFor24Hours();
          } else {
            clearAutoLogin();
          }

          setCachedAuthSession(data.session);
          setSession(data.session);
          setAuthReady(true);
          setAuthMessage("로그인했습니다.");
        } else {
          const { data, error } = await supabase.auth.signUp({
            email: trimmedEmail,
            password,
            options: {
              emailRedirectTo: redirectTo,
            },
          });

          if (error) {
            openAuthDialog(`Supabase 회원가입 실패: ${error.message}`);
            return;
          }

          if (data.session) {
            await supabase.auth.signOut();
            clearAutoLogin();
            setCachedAuthSession(null);
            clearAuth();
          }

          setAuthMessage("회원가입 인증 메일을 보냈습니다. 인증 후 로그인하세요.");
        }
      } catch (error) {
        openAuthDialog(
          error instanceof Error
            ? error.message
            : "인증 요청 중 알 수 없는 오류가 발생했습니다.",
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      authMode,
      canSubmit,
      closeAuthDialog,
      email,
      isAutoLoginChecked,
      clearAuth,
      openAuthDialog,
      password,
      setAuthReady,
      setSession,
    ],
  );

  const handleLogout = useCallback(async () => {
    setAuthMessage("");
    closeAuthDialog();
    clearProfileFeedback();

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        openAuthDialog(`Supabase 로그아웃 실패: ${error.message}`);
        return;
      }

      clearAutoLogin();
      setCachedAuthSession(null);
      clearAuth();
      resetProfileState();
      resetBookmarks();
      resetActivity();
      setPassword("");
      setPasswordConfirm("");
    } catch (error) {
      openAuthDialog(
        error instanceof Error
          ? error.message
          : "로그아웃 중 알 수 없는 오류가 발생했습니다.",
      );
    }
  }, [
    clearProfileFeedback,
    closeAuthDialog,
    clearAuth,
    openAuthDialog,
    resetActivity,
    resetBookmarks,
    resetProfileState,
  ]);

  const openBookmarkSheet = useCallback(() => {
    openBookmarkSheetWithSession(session);
  }, [openBookmarkSheetWithSession, session]);

  return {
    activityError,
    activityTab,
    authDialogMessage,
    authMessage,
    authMode,
    bookmarkedHospitals,
    bookmarkError,
    canSaveProfile,
    canSubmit,
    closeActivitySheet,
    closeAuthDialog,
    closeBookmarkSheet,
    displayName,
    email,
    handleActivityTabChange,
    handleAuthModeChange,
    handleAutoLoginChange,
    handleDisplayNameChange,
    handleEmailChange,
    handleLogout,
    handlePasswordChange,
    handlePasswordConfirmChange,
    handleProfileSubmit,
    handleSubmit,
    isActivityLoading,
    isActivitySheetOpen,
    isAuthReady,
    isAutoLoginChecked,
    isBookmarkLoading,
    isBookmarkSheetOpen,
    isProfileLoading,
    isProfileSaving,
    isSubmitting,
    maxDisplayNameLength: MAX_DISPLAY_NAME_LENGTH,
    myComments,
    myPosts,
    myReports,
    openActivitySheet,
    openBookmarkSheet,
    password,
    passwordConfirm,
    profile,
    profileError,
    profileMessage,
    session,
  };
}

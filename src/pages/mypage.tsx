import Head from "next/head";
import Link from "next/link";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session } from "@supabase/supabase-js";
import ActivitySheet from "@/src/components/mypage/ActivitySheet";
import AuthDialog from "@/src/components/mypage/AuthDialog";
import BookmarkSheet from "@/src/components/mypage/BookmarkSheet";
import HospitalReportSheet from "@/src/shared/components/HospitalReportSheet";
import TopNav from "@/src/shared/components/TopNav";
import CommonFooter from "@/src/shared/components/CommonFooter";
import {
  getSupabaseBrowserClient,
  supabase,
} from "@/src/shared/lib/supabase";
import {
  clearAutoLogin,
  enableAutoLoginFor24Hours,
  getCachedAuthSession,
  hasActiveAutoLogin,
  loadAuthSession,
  setCachedAuthSession,
  subscribeToAuthSession,
} from "@/src/shared/lib/authSession";
import { MAX_DISPLAY_NAME_LENGTH } from "@/src/shared/lib/userProfiles";
import {
  clearAuthErrorFromUrl,
  getAuthRedirectErrorMessage,
} from "@/src/features/mypage/authRedirect";
import { formatProfileDate } from "@/src/features/mypage/formatters";
import { useBookmarkedHospitals } from "@/src/features/mypage/hooks/useBookmarkedHospitals";
import { useMyActivity } from "@/src/features/mypage/hooks/useMyActivity";
import { useProfileEditor } from "@/src/features/mypage/hooks/useProfileEditor";
import type { AuthMode } from "@/src/features/mypage/types";
import styles from "@/src/components/mypage/MyPage.module.css";

export default function MyPage() {
  const isSupabaseConfigured = Boolean(supabase);
  const initialAuthSession = getCachedAuthSession();
  const [activeMenu, setActiveMenu] = useState("마이페이지");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [session, setSession] = useState<Session | null>(
    initialAuthSession ?? null,
  );
  const [isAuthReady, setIsAuthReady] = useState(
    !isSupabaseConfigured || initialAuthSession !== undefined,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAutoLoginChecked, setIsAutoLoginChecked] = useState(() =>
    hasActiveAutoLogin(),
  );
  const [authMessage, setAuthMessage] = useState("");
  const [authDialogMessage, setAuthDialogMessage] = useState("");
  const [isReportSheetOpen, setIsReportSheetOpen] = useState(false);
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
  } = useProfileEditor(session, initialAuthSession);
  const {
    bookmarkedHospitals,
    bookmarkError,
    closeBookmarkSheet,
    isBookmarkLoading,
    isBookmarkSheetOpen,
    openBookmarkSheet,
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

  const closeAuthDialog = () => {
    setAuthDialogMessage("");
  };

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

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let isMounted = true;

    const unsubscribe = subscribeToAuthSession(supabase, (nextSession) => {
      if (isMounted) {
        setSession(nextSession);
        setIsAuthReady(true);

        if (!nextSession) {
          resetProfileState();
          resetBookmarks();
          resetActivity();
        }
      }
    });

    void loadAuthSession(supabase)
      .then((nextSession) => {
        if (!isMounted) return;
        setSession(nextSession);

        if (!nextSession) {
          resetProfileState();
          resetBookmarks();
          resetActivity();
        }
      })
      .catch((error) => {
        if (!isMounted) return;
        openAuthDialog(
          error instanceof Error
            ? error.message
            : "Supabase 세션 조회 중 알 수 없는 오류가 발생했습니다.",
        );
      })
      .finally(() => {
        if (isMounted) {
          setIsAuthReady(true);
        }
      });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [openAuthDialog, resetActivity, resetBookmarks, resetProfileState]);

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
  const handleAuthModeChange = (nextAuthMode: AuthMode) => {
    setAuthMode(nextAuthMode);
    setPassword("");
    setPasswordConfirm("");
    setAuthMessage("");
    closeAuthDialog();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
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
          setSession(null);
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
  };

  const handleLogout = async () => {
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

      setSession(null);
      clearAutoLogin();
      setCachedAuthSession(null);
      resetProfileState();
      setPassword("");
      setPasswordConfirm("");
    } catch (error) {
      openAuthDialog(
        error instanceof Error
          ? error.message
          : "로그아웃 중 알 수 없는 오류가 발생했습니다.",
      );
    }
  };

  const closeReportSheet = () => {
    setIsReportSheetOpen(false);
    setActiveMenu("마이페이지");
  };

  return (
    <>
      <Head>
        <title>마이페이지 | 우동</title>
        <meta
          name="description"
          content="우동 마이페이지 이메일 비밀번호 로그인 화면입니다."
        />
      </Head>
      <main className={styles.page}>
        <TopNav
          activeMenu={activeMenu}
          onSelectMenu={setActiveMenu}
          onOpenReport={() => {
            setActiveMenu("병원제보");
            setIsReportSheetOpen(true);
          }}
        />

        <section className={styles.authSection}>
          <div className={styles.copyWrap}>
            <h1>특수동물 병원 정보는 <br />우동에서 확인하세요</h1>
            <p className={styles.description}>
             우동은 특수동물 병원 정보를 한 곳에서 확인할 수 있는 서비스입니다. <br />
             특수동물 반려자들의 제보들을 통해서 데이터를 모으고 있습니다.
            </p>
            {session ? (
              <div className={styles.benefitGrid} aria-label="마이페이지 기능 요약">
                <button
                  type="button"
                  onClick={() => openBookmarkSheet(session)}
                >
                  찜한 병원
                </button>
                <button
                  type="button"
                  onClick={() => openActivitySheet("reports")}
                >
                  내 제보
                </button>
                <button
                  type="button"
                  onClick={() => openActivitySheet("posts")}
                >
                  내 게시글
                </button>
                <button
                  type="button"
                  onClick={() => openActivitySheet("comments")}
                >
                  내 댓글
                </button>
              </div>
            ) : null}
          </div>

          {session ? (
            <section className={styles.authCard}>
              <div className={styles.cardHeader}>
                <h2>마이페이지</h2>
              </div>
              <div className={styles.accountBox}>
                <span>로그인 이메일</span>
                <strong>{session.user.email}</strong>
              </div>
              <div className={styles.profileMetaGrid}>
                <div>
                  <span>가입일</span>
                  <strong>{formatProfileDate(profile?.created_at)}</strong>
                </div>
              </div>

              <form
                className={styles.profileForm}
                onSubmit={handleProfileSubmit}
              >
                <label className={styles.field}>
                  <span>닉네임</span>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(event) => {
                      handleDisplayNameChange(event.currentTarget.value);
                    }}
                    placeholder="닉네임을 입력하세요"
                    autoComplete="nickname"
                    maxLength={MAX_DISPLAY_NAME_LENGTH}
                    disabled={isProfileLoading}
                  />
                </label>
                <p className={styles.profileHint}>
                  {displayName.trim().length}/{MAX_DISPLAY_NAME_LENGTH}
                </p>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={!canSaveProfile}
                >
                  {isProfileSaving ? "저장 중" : "프로필 저장"}
                </button>
              </form>

              {isProfileLoading ? (
                <p className={styles.submitMessage}>프로필을 불러오는 중입니다.</p>
              ) : null}

              {profileMessage ? (
                <p className={styles.submitMessage}>{profileMessage}</p>
              ) : null}

              {profileError ? (
                <p className={styles.errorMessage}>{profileError}</p>
              ) : null}

              <button
                type="button"
                className={styles.submitButton}
                onClick={handleLogout}
              >
                로그아웃
              </button>
            </section>
          ) : (
            <form className={styles.authCard} onSubmit={handleSubmit}>
              <div className={styles.cardHeader}>
                <h2>우동 시작하기</h2>
              </div>

              <div className={styles.modeTabs} aria-label="인증 방식">
                <button
                  type="button"
                  className={`${styles.modeTab} ${
                    authMode === "login" ? styles.modeTabActive : ""
                  }`}
                  aria-pressed={authMode === "login"}
                  onClick={() => handleAuthModeChange("login")}
                >
                  로그인
                </button>
                <button
                  type="button"
                  className={`${styles.modeTab} ${
                    authMode === "signup" ? styles.modeTabActive : ""
                  }`}
                  aria-pressed={authMode === "signup"}
                  onClick={() => handleAuthModeChange("signup")}
                >
                  회원가입
                </button>
              </div>

              <label className={styles.field}>
                <span>이메일</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setAuthMessage("");
                    closeAuthDialog();
                  }}
                  placeholder="이메일을 입력하세요"
                  autoComplete="email"
                  required
                />
              </label>

              <label className={styles.field}>
                <span>비밀번호</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setAuthMessage("");
                    closeAuthDialog();
                  }}
                  placeholder="비밀번호를 입력하세요"
                  autoComplete={
                    authMode === "login" ? "current-password" : "new-password"
                  }
                  minLength={6}
                  required
                />
              </label>

              {authMode === "signup" ? (
                <label className={styles.field}>
                  <span>비밀번호 확인</span>
                  <input
                    type="password"
                    value={passwordConfirm}
                    onChange={(event) => {
                      setPasswordConfirm(event.target.value);
                      setAuthMessage("");
                      closeAuthDialog();
                    }}
                    placeholder="비밀번호를 다시 입력하세요"
                    autoComplete="new-password"
                    minLength={6}
                    required
                  />
                </label>
              ) : null}

              {authMode === "login" ? (
                <label className={styles.checkboxField}>
                  <input
                    type="checkbox"
                    checked={isAutoLoginChecked}
                    onChange={(event) => {
                      setIsAutoLoginChecked(event.currentTarget.checked);
                      closeAuthDialog();
                    }}
                  />
                  <span>자동로그인</span>
                </label>
              ) : null}

              <button
                type="submit"
                className={styles.submitButton}
                disabled={!canSubmit || isSubmitting || !isAuthReady}
              >
                {isSubmitting
                  ? "처리 중"
                  : authMode === "login"
                    ? "로그인"
                    : "회원가입"}
              </button>

              <Link href="/" className={styles.secondaryButton}>
                비회원으로 둘러보기
              </Link>

              {!isAuthReady ? (
                <p className={styles.submitMessage}>로그인 상태 확인 중입니다.</p>
              ) : null}

              {authMessage ? (
                <p className={styles.submitMessage}>{authMessage}</p>
              ) : null}
            </form>
          )}
        </section>
        <HospitalReportSheet
          isOpen={isReportSheetOpen}
          onClose={closeReportSheet}
        />
        {isBookmarkSheetOpen ? (
          <BookmarkSheet
            bookmarkedHospitals={bookmarkedHospitals}
            error={bookmarkError}
            isLoading={isBookmarkLoading}
            onClose={closeBookmarkSheet}
          />
        ) : null}
        {isActivitySheetOpen ? (
          <ActivitySheet
            activeTab={activityTab}
            comments={myComments}
            error={activityError}
            isLoading={isActivityLoading}
            onClose={closeActivitySheet}
            onTabChange={handleActivityTabChange}
            posts={myPosts}
            reports={myReports}
          />
        ) : null}
        <CommonFooter className={styles.pageFooter} />
        {authDialogMessage ? (
          <AuthDialog message={authDialogMessage} onClose={closeAuthDialog} />
        ) : null}
      </main>
    </>
  );
}

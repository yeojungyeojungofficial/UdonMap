import Head from "next/head";
import Link from "next/link";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Session } from "@supabase/supabase-js";
import HospitalReportSheet from "@/src/shared/components/HospitalReportSheet";
import TopNav from "@/src/shared/components/TopNav";
import CommonFooter from "@/src/shared/components/CommonFooter";
import {
  clearCachedCurrentUserProfile,
  fetchCurrentUserProfile,
  getCachedCurrentUserProfile,
  saveCurrentUserProfile,
  setCachedCurrentUserProfile,
} from "@/src/mypage/profileApi";
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
import {
  MAX_DISPLAY_NAME_LENGTH,
  type UserProfile,
} from "@/src/shared/lib/userProfiles";
import {
  fetchBookmarkedHospitals,
  type BookmarkedHospital,
} from "@/src/mypage/bookmarksApi";
import {
  fetchMyActivity,
  type MyActivityTab,
  type MyComment,
  type MyPost,
  type MyReport,
} from "@/src/mypage/activityApi";
import styles from "@/src/mypage/MyPage.module.css";

type AuthMode = "login" | "signup";
type ActivityTab = MyActivityTab;

const INVALID_AUTH_CODE_MESSAGE = "잘못된 인증번호입니다";
const AUTH_ERROR_QUERY_KEYS = [
  "error",
  "error_code",
  "error_description",
] as const;
const REPORT_STATUS_LABELS = {
  pending: "접수",
  in_review: "검토중",
  approved: "승인",
  rejected: "반려",
} as const;
const COMMENT_STATUS_LABELS = {
  visible: "공개",
  hidden: "숨김",
  deleted: "삭제됨",
} as const;

function formatProfileDate(value: string | null | undefined) {
  if (!value) {
    return "확인 중";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "확인 중";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
  }).format(date);
}

function getAuthErrorParam(key: (typeof AUTH_ERROR_QUERY_KEYS)[number]) {
  if (typeof window === "undefined") {
    return null;
  }

  const searchParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));

  return searchParams.get(key) ?? hashParams.get(key);
}

function getAuthRedirectErrorMessage() {
  const error = getAuthErrorParam("error");
  const errorCode = getAuthErrorParam("error_code");
  const errorDescription = getAuthErrorParam("error_description");
  const authErrorText = `${error ?? ""} ${errorCode ?? ""} ${
    errorDescription ?? ""
  }`.toLowerCase();

  if (!authErrorText.trim()) {
    return "";
  }

  if (
    authErrorText.includes("otp") ||
    authErrorText.includes("expired") ||
    authErrorText.includes("invalid") ||
    authErrorText.includes("token")
  ) {
    return INVALID_AUTH_CODE_MESSAGE;
  }

  return errorDescription || "인증 처리 중 오류가 발생했습니다.";
}

function clearAuthErrorFromUrl() {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);
  let hasAuthError = false;

  AUTH_ERROR_QUERY_KEYS.forEach((key) => {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      hasAuthError = true;
    }
  });

  const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
  AUTH_ERROR_QUERY_KEYS.forEach((key) => {
    if (hashParams.has(key)) {
      hashParams.delete(key);
      hasAuthError = true;
    }
  });

  if (!hasAuthError) {
    return;
  }

  const nextHash = hashParams.toString();
  url.hash = nextHash ? `#${nextHash}` : "";
  window.history.replaceState(null, "", url.toString());
}

export default function MyPage() {
  const isSupabaseConfigured = Boolean(supabase);
  const initialAuthSession = getCachedAuthSession();
  const initialProfile = initialAuthSession
    ? getCachedCurrentUserProfile(initialAuthSession.user.id)
    : null;
  const [activeMenu, setActiveMenu] = useState("마이페이지");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [session, setSession] = useState<Session | null>(
    initialAuthSession ?? null,
  );
  const [profile, setProfile] = useState<UserProfile | null>(initialProfile);
  const [displayName, setDisplayName] = useState(
    initialProfile?.display_name ?? "",
  );
  const [isAuthReady, setIsAuthReady] = useState(
    !isSupabaseConfigured || initialAuthSession !== undefined,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isAutoLoginChecked, setIsAutoLoginChecked] = useState(() =>
    hasActiveAutoLogin(),
  );
  const [authMessage, setAuthMessage] = useState("");
  const [authDialogMessage, setAuthDialogMessage] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [isReportSheetOpen, setIsReportSheetOpen] = useState(false);
  const [isBookmarkSheetOpen, setIsBookmarkSheetOpen] = useState(false);
  const [bookmarkedHospitals, setBookmarkedHospitals] = useState<
    BookmarkedHospital[]
  >([]);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);
  const [bookmarkError, setBookmarkError] = useState("");
  const [isActivitySheetOpen, setIsActivitySheetOpen] = useState(false);
  const [activityTab, setActivityTab] = useState<ActivityTab>("comments");
  const [myReports, setMyReports] = useState<MyReport[]>([]);
  const [myPosts, setMyPosts] = useState<MyPost[]>([]);
  const [myComments, setMyComments] = useState<MyComment[]>([]);
  const [isActivityLoading, setIsActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState("");
  const activityRequestIdRef = useRef(0);

  const openAuthDialog = useCallback((message: string) => {
    setAuthDialogMessage(message);
  }, []);

  const closeAuthDialog = () => {
    setAuthDialogMessage("");
  };

  const resetProfileState = useCallback(() => {
    setProfile(null);
    setDisplayName("");
    clearCachedCurrentUserProfile();
    setProfileMessage("");
    setProfileError("");
    setIsProfileLoading(false);
  }, []);

  const closeBookmarkSheet = () => {
    setIsBookmarkSheetOpen(false);
  };

  const closeActivitySheet = () => {
    setIsActivitySheetOpen(false);
  };

  const loadBookmarkedHospitals = useCallback(async (activeSession: Session) => {
    setIsBookmarkLoading(true);
    setBookmarkError("");

    try {
      const nextBookmarkedHospitals =
        await fetchBookmarkedHospitals(activeSession);
      setBookmarkedHospitals(nextBookmarkedHospitals);
    } catch (error) {
      setBookmarkedHospitals([]);
      setBookmarkError(
        error instanceof Error
          ? error.message
          : "찜한 병원 조회 중 알 수 없는 오류가 발생했습니다.",
      );
    } finally {
      setIsBookmarkLoading(false);
    }
  }, []);

  const loadMyActivity = useCallback(async (tab: ActivityTab) => {
    const requestId = activityRequestIdRef.current + 1;
    activityRequestIdRef.current = requestId;
    setIsActivityLoading(true);
    setActivityError("");

    try {
      const nextActivity = await fetchMyActivity(tab);
      if (activityRequestIdRef.current !== requestId) {
        return;
      }
      if (tab === "reports") {
        setMyReports(nextActivity.reports);
      }
      if (tab === "posts") {
        setMyPosts(nextActivity.posts);
      }
      if (tab === "comments") {
        setMyComments(nextActivity.comments);
      }
    } catch (error) {
      if (activityRequestIdRef.current !== requestId) {
        return;
      }
      if (tab === "reports") {
        setMyReports([]);
      }
      if (tab === "posts") {
        setMyPosts([]);
      }
      if (tab === "comments") {
        setMyComments([]);
      }
      setActivityError(
        error instanceof Error
          ? error.message
          : "내 활동 내역 조회 중 알 수 없는 오류가 발생했습니다.",
      );
    } finally {
      if (activityRequestIdRef.current === requestId) {
        setIsActivityLoading(false);
      }
    }
  }, []);

  const openBookmarkSheet = () => {
    if (!session) {
      return;
    }

    setIsBookmarkSheetOpen(true);
    void loadBookmarkedHospitals(session);
  };

  const openActivitySheet = (nextTab: ActivityTab) => {
    if (!session) {
      return;
    }

    setActivityTab(nextTab);
    setIsActivitySheetOpen(true);
    void loadMyActivity(nextTab);
  };

  const handleActivityTabChange = (nextTab: ActivityTab) => {
    setActivityTab(nextTab);
    void loadMyActivity(nextTab);
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
          activityRequestIdRef.current += 1;
          resetProfileState();
          setIsBookmarkSheetOpen(false);
          setBookmarkedHospitals([]);
          setBookmarkError("");
          setIsActivitySheetOpen(false);
          setIsActivityLoading(false);
          setMyReports([]);
          setMyPosts([]);
          setMyComments([]);
          setActivityError("");
        }
      }
    });

    void loadAuthSession(supabase)
      .then((nextSession) => {
        if (!isMounted) return;
        setSession(nextSession);

        if (!nextSession) {
          activityRequestIdRef.current += 1;
          resetProfileState();
          setIsBookmarkSheetOpen(false);
          setBookmarkedHospitals([]);
          setBookmarkError("");
          setIsActivitySheetOpen(false);
          setIsActivityLoading(false);
          setMyReports([]);
          setMyPosts([]);
          setMyComments([]);
          setActivityError("");
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
  }, [openAuthDialog, resetProfileState]);

  useEffect(() => {
    if (!session) {
      return;
    }

    let isMounted = true;
    const activeSession = session;
    const cachedProfile = getCachedCurrentUserProfile(activeSession.user.id);

    if (cachedProfile) {
      return;
    }

    async function loadProfile() {
      setIsProfileLoading(true);
      setProfileMessage("");
      setProfileError("");

      try {
        const nextProfile = await fetchCurrentUserProfile(activeSession);
        if (!isMounted) return;
        setCachedCurrentUserProfile(nextProfile);
        setProfile(nextProfile);
        setDisplayName(nextProfile.display_name ?? "");
      } catch (error) {
        if (!isMounted) return;
        setProfileError(
          error instanceof Error
            ? error.message
            : "프로필 조회 중 알 수 없는 오류가 발생했습니다.",
        );
      } finally {
        if (isMounted) {
          setIsProfileLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, [session]);

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
  const currentDisplayName = profile?.display_name ?? "";
  const canSaveProfile = useMemo(
    () =>
      Boolean(session) &&
      !isProfileLoading &&
      !isProfileSaving &&
      displayName.trim() !== currentDisplayName &&
      displayName.trim().length <= MAX_DISPLAY_NAME_LENGTH,
    [
      currentDisplayName,
      displayName,
      isProfileLoading,
      isProfileSaving,
      session,
    ],
  );

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

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!session || !canSaveProfile) {
      return;
    }

    setIsProfileSaving(true);
    setProfileMessage("");
    setProfileError("");

    try {
      const nextProfile = await saveCurrentUserProfile(session, displayName);
      setCachedCurrentUserProfile(nextProfile);
      setProfile(nextProfile);
      setDisplayName(nextProfile.display_name ?? "");
      setProfileMessage("프로필을 저장했습니다.");
    } catch (error) {
      setProfileError(
        error instanceof Error
          ? error.message
          : "프로필 저장 중 알 수 없는 오류가 발생했습니다.",
      );
    } finally {
      setIsProfileSaving(false);
    }
  };

  const handleLogout = async () => {
    setAuthMessage("");
    closeAuthDialog();
    setProfileMessage("");
    setProfileError("");

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
      setProfile(null);
      clearCachedCurrentUserProfile();
      setDisplayName("");
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
                <button type="button" onClick={openBookmarkSheet}>
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
                      setDisplayName(event.currentTarget.value);
                      setProfileMessage("");
                      setProfileError("");
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
          <div
            className={styles.sheetBackdrop}
            role="presentation"
            onClick={closeBookmarkSheet}
          >
            <section
              className={styles.bookmarkSheet}
              role="dialog"
              aria-modal="true"
              aria-labelledby="bookmark-sheet-title"
              onClick={(event) => event.stopPropagation()}
            >
              <div className={styles.sheetHandle} />
              <div className={styles.bookmarkSheetHeader}>
                <div>
                  <h2 id="bookmark-sheet-title">찜한 병원</h2>
                  <p>{bookmarkedHospitals.length}개</p>
                </div>
                <button
                  type="button"
                  className={styles.sheetCloseButton}
                  onClick={closeBookmarkSheet}
                  aria-label="찜한 병원 닫기"
                >
                  닫기
                </button>
              </div>

              {isBookmarkLoading ? (
                <p className={styles.bookmarkState}>
                  찜한 병원을 불러오는 중입니다.
                </p>
              ) : null}

              {bookmarkError ? (
                <p className={styles.bookmarkError}>{bookmarkError}</p>
              ) : null}

              {!isBookmarkLoading &&
              !bookmarkError &&
              bookmarkedHospitals.length === 0 ? (
                <p className={styles.bookmarkState}>아직 찜한 병원이 없습니다.</p>
              ) : null}

              {!isBookmarkLoading &&
              !bookmarkError &&
              bookmarkedHospitals.length > 0 ? (
                <ul className={styles.bookmarkList}>
                  {bookmarkedHospitals.map((hospital) => (
                    <li key={hospital.id} className={styles.bookmarkItem}>
                      <span>{hospital.region}</span>
                      <strong>{hospital.name}</strong>
                      <p>{hospital.address}</p>
                      <div className={styles.bookmarkTags}>
                        {hospital.animals.slice(0, 4).map((animal) => (
                          <em key={`${hospital.id}-${animal}`}>{animal}</em>
                        ))}
                        {hospital.isEmergency ? <em>응급 진료</em> : null}
                        {hospital.isSpecialty ? <em>특수동물 진료</em> : null}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          </div>
        ) : null}
        {isActivitySheetOpen ? (
          <div
            className={styles.sheetBackdrop}
            role="presentation"
            onClick={closeActivitySheet}
          >
            <section
              className={styles.bookmarkSheet}
              role="dialog"
              aria-modal="true"
              aria-labelledby="activity-sheet-title"
              onClick={(event) => event.stopPropagation()}
            >
              <div className={styles.sheetHandle} />
              <div className={styles.bookmarkSheetHeader}>
                <div>
                  <h2 id="activity-sheet-title">내 활동 내역</h2>
                  <p>
                    제보 {myReports.length}개 · 게시글 {myPosts.length}개 · 댓글 {myComments.length}개
                  </p>
                </div>
                <button
                  type="button"
                  className={styles.sheetCloseButton}
                  onClick={closeActivitySheet}
                  aria-label="내 활동 내역 닫기"
                >
                  닫기
                </button>
              </div>

              <div className={styles.activityTabs} aria-label="활동 내역 구분">
                <button
                  type="button"
                  className={`${styles.activityTab} ${
                    activityTab === "reports" ? styles.activityTabActive : ""
                  }`}
                  aria-pressed={activityTab === "reports"}
                  onClick={() => handleActivityTabChange("reports")}
                >
                  내 제보
                </button>
                <button
                  type="button"
                  className={`${styles.activityTab} ${
                    activityTab === "posts" ? styles.activityTabActive : ""
                  }`}
                  aria-pressed={activityTab === "posts"}
                  onClick={() => handleActivityTabChange("posts")}
                >
                  내 게시글
                </button>
                <button
                  type="button"
                  className={`${styles.activityTab} ${
                    activityTab === "comments" ? styles.activityTabActive : ""
                  }`}
                  aria-pressed={activityTab === "comments"}
                  onClick={() => handleActivityTabChange("comments")}
                >
                  내 댓글
                </button>
              </div>

              {isActivityLoading ? (
                <p className={styles.bookmarkState}>
                  내 활동 내역을 불러오는 중입니다.
                </p>
              ) : null}

              {activityError ? (
                <p className={styles.bookmarkError}>{activityError}</p>
              ) : null}

              {!isActivityLoading &&
              !activityError &&
              activityTab === "reports" &&
              myReports.length === 0 ? (
                <p className={styles.bookmarkState}>아직 제보 내역이 없습니다.</p>
              ) : null}

              {!isActivityLoading &&
              !activityError &&
              activityTab === "posts" &&
              myPosts.length === 0 ? (
                <p className={styles.bookmarkState}>아직 작성한 게시글이 없습니다.</p>
              ) : null}

              {!isActivityLoading &&
              !activityError &&
              activityTab === "comments" &&
              myComments.length === 0 ? (
                <p className={styles.bookmarkState}>
                  아직 작성한 댓글이 없습니다.
                </p>
              ) : null}

              {!isActivityLoading &&
              !activityError &&
              activityTab === "reports" &&
              myReports.length > 0 ? (
                <ul className={styles.activityList}>
                  {myReports.map((report) => (
                    <li key={report.id} className={styles.activityItem}>
                      <div className={styles.activityMeta}>
                        <span>{formatProfileDate(report.createdAt)}</span>
                        <em>{REPORT_STATUS_LABELS[report.status]}</em>
                      </div>
                      <strong>{report.hospitalName}</strong>
                      <p>{report.address}</p>
                      {report.details ? (
                        <p className={styles.activityBody}>{report.details}</p>
                      ) : null}
                      <div className={styles.bookmarkTags}>
                        {report.animalCategories.map((animal) => (
                          <em key={`${report.id}-${animal}`}>{animal}</em>
                        ))}
                        {report.animalSpecies ? (
                          <em>{report.animalSpecies}</em>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}

              {!isActivityLoading &&
              !activityError &&
              activityTab === "posts" &&
              myPosts.length > 0 ? (
                <ul className={styles.activityList}>
                  {myPosts.map((post) => (
                    <li key={post.id} className={styles.activityItem}>
                      <div className={styles.activityMeta}>
                        <span>{formatProfileDate(post.createdAt)}</span>
                        <em>{post.board}</em>
                      </div>
                      <strong>{post.title}</strong>
                    </li>
                  ))}
                </ul>
              ) : null}

              {!isActivityLoading &&
              !activityError &&
              activityTab === "comments" &&
              myComments.length > 0 ? (
                <ul className={styles.activityList}>
                  {myComments.map((comment) => (
                    <li key={comment.id} className={styles.activityItem}>
                      <div className={styles.activityMeta}>
                        <span>{formatProfileDate(comment.createdAt)}</span>
                        <em>{COMMENT_STATUS_LABELS[comment.status]}</em>
                      </div>
                      <strong>{comment.hospitalName}</strong>
                      {comment.hospitalAddress ? (
                        <p>{comment.hospitalAddress}</p>
                      ) : null}
                      <p className={styles.activityBody}>{comment.content}</p>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          </div>
        ) : null}
        <CommonFooter className={styles.pageFooter} />
        {authDialogMessage ? (
          <div className={styles.dialogBackdrop} role="presentation">
            <section
              className={styles.authDialog}
              role="dialog"
              aria-modal="true"
              aria-labelledby="auth-error-title"
            >
              <h2 id="auth-error-title">인증 오류</h2>
              <p>{authDialogMessage}</p>
              <button
                type="button"
                className={styles.dialogButton}
                onClick={closeAuthDialog}
              >
                확인
              </button>
            </section>
          </div>
        ) : null}
      </main>
    </>
  );
}

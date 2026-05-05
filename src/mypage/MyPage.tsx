import Head from "next/head";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import HospitalReportSheet from "@/src/shared/components/HospitalReportSheet";
import TopNav from "@/src/shared/components/TopNav";
import {
  fetchCurrentUserProfile,
  saveCurrentUserProfile,
} from "@/src/mypage/profileApi";
import {
  getSupabaseBrowserClient,
  supabase,
} from "@/src/shared/lib/supabase";
import {
  MAX_DISPLAY_NAME_LENGTH,
  type UserProfile,
} from "@/src/shared/lib/userProfiles";
import styles from "@/src/mypage/MyPage.module.css";

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

export default function MyPage() {
  const isSupabaseConfigured = Boolean(supabase);
  const [activeMenu, setActiveMenu] = useState("마이페이지");
  const [email, setEmail] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [isAuthReady, setIsAuthReady] = useState(!isSupabaseConfigured);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [authError, setAuthError] = useState(() =>
    isSupabaseConfigured
      ? ""
      : "Supabase 환경변수 NEXT_PUBLIC_SUPABASE_URL 또는 NEXT_PUBLIC_SUPABASE_ANON_KEY가 없습니다.",
  );
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [isReportSheetOpen, setIsReportSheetOpen] = useState(false);

  const resetProfileState = useCallback(() => {
    setProfile(null);
    setDisplayName("");
    setProfileMessage("");
    setProfileError("");
    setIsProfileLoading(false);
  }, []);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let isMounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (isMounted) {
        setSession(nextSession);

        if (!nextSession) {
          resetProfileState();
        }
      }
    });

    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (error) {
          setAuthError(`Supabase 세션 조회 실패: ${error.message}`);
          return;
        }
        setSession(data.session);

        if (!data.session) {
          resetProfileState();
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsAuthReady(true);
        }
      });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [resetProfileState]);

  useEffect(() => {
    if (!session) {
      return;
    }

    let isMounted = true;
    const activeSession = session;

    async function loadProfile() {
      setIsProfileLoading(true);
      setProfileMessage("");
      setProfileError("");

      try {
        const nextProfile = await fetchCurrentUserProfile(activeSession);
        if (!isMounted) return;
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

  const canSubmit = useMemo(() => email.trim().includes("@"), [email]);
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setAuthMessage("");
    setAuthError("");

    try {
      const supabase = getSupabaseBrowserClient();
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/mypage`
          : undefined;
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: redirectTo,
          shouldCreateUser: true,
        },
      });

      if (error) {
        setAuthError(`Supabase 이메일 로그인 실패: ${error.message}`);
        return;
      }

      setAuthMessage("로그인 링크를 이메일로 보냈습니다.");
    } catch (error) {
      setAuthError(
        error instanceof Error
          ? error.message
          : "이메일 로그인 요청 중 알 수 없는 오류가 발생했습니다.",
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
    setAuthError("");
    setProfileMessage("");
    setProfileError("");

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        setAuthError(`Supabase 로그아웃 실패: ${error.message}`);
        return;
      }

      setSession(null);
      setProfile(null);
      setDisplayName("");
    } catch (error) {
      setAuthError(
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
          content="우동 마이페이지 이메일 로그인 화면입니다."
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
            <div className={styles.benefitGrid} aria-label="마이페이지 기능 요약">
              <div>찜한 병원</div>
              <div>제보 내역</div>
              <div>후원 내역</div>
            </div>
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
              <Link href="/" className={styles.secondaryButton}>
                비회원으로 둘러보기
              </Link>
            </section>
          ) : (
            <form className={styles.authCard} onSubmit={handleSubmit}>
              <div className={styles.cardHeader}>
                <h2>우동 시작하기</h2>
              </div>

              <label className={styles.field}>
                <span>이메일</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setAuthMessage("");
                    setAuthError("");
                  }}
                  placeholder="이메일을 입력하세요"
                  autoComplete="email"
                />
              </label>

              <button
                type="submit"
                className={styles.submitButton}
                disabled={!canSubmit || isSubmitting || !isAuthReady}
              >
                {isSubmitting ? "전송 중" : "이메일로 로그인 링크 받기"}
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

              {authError ? (
                <p className={styles.errorMessage}>{authError}</p>
              ) : null}
            </form>
          )}
        </section>
        <HospitalReportSheet
          isOpen={isReportSheetOpen}
          onClose={closeReportSheet}
        />
      </main>
    </>
  );
}

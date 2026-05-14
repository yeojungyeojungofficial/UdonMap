import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect } from "react";
import TopNav from "@/src/components/common/TopNav";
import CommonFooter from "@/src/components/common/CommonFooter";
import { formatProfileDate } from "@/src/features/mypage/formatters";
import { useMyPageState } from "@/src/features/mypage/hooks/useMyPageState";
import { useMyPageShellStyles } from "@/src/features/mypage/useMyPageShellStyles";

export default function AccountPage() {
  const router = useRouter();
  const shell = useMyPageShellStyles();

  const {
    authMessage,
    authMode,
    canSaveProfile,
    canSubmit,
    displayName,
    email,
    handleAuthModeChange,
    handleAutoLoginChange,
    handleDisplayNameChange,
    handleEmailChange,
    handleLogout,
    handlePasswordChange,
    handlePasswordConfirmChange,
    handleProfileSubmit,
    handleSubmit,
    isAuthReady,
    isAutoLoginChecked,
    isProfileLoading,
    isProfileSaving,
    isSubmitting,
    maxDisplayNameLength,
    password,
    passwordConfirm,
    profile,
    profileError,
    profileMessage,
    session,
  } = useMyPageState();

  const handleLogoutAndRedirect = async () => {
    await handleLogout();
    void router.push("/mypage");
  };

  return (
    <>
      <Head>
        <title>계정 관리 | 우동</title>
      </Head>
      <main className={shell.page}>
        <TopNav activeMenu="마이페이지" />

        <section className={shell.heroCard}>
          <h1 className={shell.heroTitle}>계정 관리</h1>
          {session ? (
            <p className={shell.sessionEmail}>{session.user.email}</p>
          ) : null}
        </section>

        {session ? (
          <>
            {/* 계정 정보 */}
            <div className={shell.menuCard}>
              <div className={shell.accountInfo}>
                <span>로그인 이메일</span>
                <strong>{session.user.email}</strong>
                {profile?.created_at ? (
                  <span className={shell.joinDate}>
                    가입일 {formatProfileDate(profile.created_at)}
                  </span>
                ) : null}
              </div>
            </div>

            {/* 프로필 수정 */}
            <div className={shell.menuCard}>
              <form
                className={shell.profileFormSection}
                onSubmit={handleProfileSubmit}
              >
                <p className={shell.sectionLabel}>프로필 정보 수정</p>
                <label className={shell.field}>
                  <span>닉네임</span>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => handleDisplayNameChange(e.currentTarget.value)}
                    placeholder="닉네임을 입력하세요"
                    autoComplete="nickname"
                    maxLength={maxDisplayNameLength}
                    disabled={isProfileLoading}
                  />
                </label>
                <p className={shell.profileHint}>
                  {displayName.trim().length}/{maxDisplayNameLength}
                </p>
                {profileMessage ? (
                  <p className={shell.submitMessage}>{profileMessage}</p>
                ) : null}
                {profileError ? (
                  <p className={shell.errorMessage}>{profileError}</p>
                ) : null}
                <button
                  type="submit"
                  className={shell.submitButton}
                  disabled={!canSaveProfile}
                >
                  {isProfileSaving ? "저장 중" : "프로필 저장"}
                </button>
              </form>
            </div>

            {/* 로그아웃 / 회원탈퇴 */}
            <div className={shell.menuCard}>
              <button
                type="button"
                className={shell.menuItem}
                onClick={handleLogoutAndRedirect}
              >
                <span>로그아웃</span>
              </button>
              <div className={shell.divider} />
              <button
                type="button"
                className={`${shell.menuItem} ${shell.menuItemDanger}`}
              >
                <span>회원탈퇴</span>
              </button>
            </div>
          </>
        ) : (
          /* 비로그인 → 로그인 폼 */
          <div className={shell.menuCard}>
            <div className={shell.authInline}>
              <div className={shell.modeTabs} aria-label="인증 방식">
                <button
                  type="button"
                  className={`${shell.modeTab} ${authMode === "login" ? shell.modeTabActive : ""}`}
                  aria-pressed={authMode === "login"}
                  onClick={() => handleAuthModeChange("login")}
                >
                  로그인
                </button>
                <button
                  type="button"
                  className={`${shell.modeTab} ${authMode === "signup" ? shell.modeTabActive : ""}`}
                  aria-pressed={authMode === "signup"}
                  onClick={() => handleAuthModeChange("signup")}
                >
                  회원가입
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <label className={shell.field}>
                  <span>이메일</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    placeholder="이메일을 입력하세요"
                    autoComplete="email"
                    required
                  />
                </label>
                <label className={shell.field}>
                  <span>비밀번호</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    placeholder="비밀번호를 입력하세요"
                    autoComplete={authMode === "login" ? "current-password" : "new-password"}
                    minLength={6}
                    required
                  />
                </label>
                {authMode === "signup" ? (
                  <label className={shell.field}>
                    <span>비밀번호 확인</span>
                    <input
                      type="password"
                      value={passwordConfirm}
                      onChange={(e) => handlePasswordConfirmChange(e.target.value)}
                      placeholder="비밀번호를 다시 입력하세요"
                      autoComplete="new-password"
                      minLength={6}
                      required
                    />
                  </label>
                ) : null}
                {authMode === "login" ? (
                  <label className={shell.checkboxField}>
                    <input
                      type="checkbox"
                      checked={isAutoLoginChecked}
                      onChange={(e) => handleAutoLoginChange(e.currentTarget.checked)}
                    />
                    <span>자동로그인</span>
                  </label>
                ) : null}
                {!isAuthReady ? (
                  <p className={shell.submitMessage}>로그인 상태 확인 중입니다.</p>
                ) : null}
                {authMessage ? (
                  <p className={shell.submitMessage}>{authMessage}</p>
                ) : null}
                <button
                  type="submit"
                  className={shell.submitButton}
                  disabled={!canSubmit || isSubmitting || !isAuthReady}
                >
                  {isSubmitting
                    ? "처리 중"
                    : authMode === "login"
                    ? "로그인"
                    : "회원가입"}
                </button>
                <Link href="/" className={shell.secondaryButton}>
                  비회원으로 둘러보기
                </Link>
              </form>
            </div>
          </div>
        )}

        <CommonFooter className={shell.pageFooter} />
      </main>
    </>
  );
}

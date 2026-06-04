import Head from "next/head";
import { useRouter } from "next/router";
import TopNav from "@/src/components/common/TopNav";
import CommonFooter from "@/src/components/common/CommonFooter";
import AccountAuthInline from "@/src/components/mypage/AccountAuthInline";
import AuthDialog from "@/src/components/mypage/AuthDialog";
import MyPageBackLink from "@/src/components/mypage/MyPageBackLink";
import { formatProfileDate } from "@/src/features/mypage/formatters";
import { useMyPageState } from "@/src/features/mypage/hooks/useMyPageState";
import { useMyPageShellStyles } from "@/src/features/mypage/useMyPageShellStyles";

export default function AccountPage() {
  const router = useRouter();
  const shell = useMyPageShellStyles();

  const {
    authDialogMessage,
    authDialogTitle,
    isAuthDialogOpen,
    authMessage,
    authMode,
    canSaveProfile,
    canSubmit,
    closeAuthDialog,
    displayName,
    email,
    handleAuthModeChange,
    handleAutoLoginChange,
    handleDisplayNameChange,
    handleEmailChange,
    handleLogout,
    handlePasswordChange,
    handlePasswordConfirmChange,
    handlePrivacyPolicyAgreementChange,
    handleProfileSubmit,
    handleSubmit,
    isAuthReady,
    isAutoLoginChecked,
    isPrivacyPolicyAgreed,
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
        <MyPageBackLink />

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
                  {isProfileSaving ? "수정 중" : "프로필 수정"}
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
            <AccountAuthInline
              authMessage={authMessage}
              authMode={authMode}
              canSubmit={canSubmit}
              classNames={shell}
              email={email}
              handleAuthModeChange={handleAuthModeChange}
              handleAutoLoginChange={handleAutoLoginChange}
              handleEmailChange={handleEmailChange}
              handlePasswordChange={handlePasswordChange}
              handlePasswordConfirmChange={handlePasswordConfirmChange}
              handlePrivacyPolicyAgreementChange={
                handlePrivacyPolicyAgreementChange
              }
              handleSubmit={handleSubmit}
              isAuthReady={isAuthReady}
              isAutoLoginChecked={isAutoLoginChecked}
              isPrivacyPolicyAgreed={isPrivacyPolicyAgreed}
              isSubmitting={isSubmitting}
              password={password}
              passwordConfirm={passwordConfirm}
            />
          </div>
        )}

        <CommonFooter className={shell.pageFooter} />
        {isAuthDialogOpen ? (
          <AuthDialog
            message={authDialogMessage}
            title={authDialogTitle}
            onClose={closeAuthDialog}
          />
        ) : null}
      </main>
    </>
  );
}

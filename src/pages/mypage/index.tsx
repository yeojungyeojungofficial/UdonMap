import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import ActivitySheet from "@/src/components/mypage/ActivitySheet";
import AuthDialog from "@/src/components/mypage/AuthDialog";
import BookmarkSheet from "@/src/components/mypage/BookmarkSheet";
import HospitalReportSheet from "@/src/components/common/HospitalReportSheet";
import TopNav from "@/src/components/common/TopNav";
import CommonFooter from "@/src/components/common/CommonFooter";
import { formatProfileDate } from "@/src/features/mypage/formatters";
import { useMyPageState } from "@/src/features/mypage/hooks/useMyPageState";
import styles from "@/src/components/mypage/MyPage.module.css";

export default function MyPage() {
  const [activeMenu, setActiveMenu] = useState("마이페이지");
  const [isReportSheetOpen, setIsReportSheetOpen] = useState(false);
  const {
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
    maxDisplayNameLength,
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
  } = useMyPageState();

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
                  onClick={openBookmarkSheet}
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
                    maxLength={maxDisplayNameLength}
                    disabled={isProfileLoading}
                  />
                </label>
                <p className={styles.profileHint}>
                  {displayName.trim().length}/{maxDisplayNameLength}
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
                    handleEmailChange(event.target.value);
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
                    handlePasswordChange(event.target.value);
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
                      handlePasswordConfirmChange(event.target.value);
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
                      handleAutoLoginChange(event.currentTarget.checked);
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

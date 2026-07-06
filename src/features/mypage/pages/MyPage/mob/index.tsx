import Head from "next/head";
import Link from "next/link";
import { useState, type CSSProperties } from "react";
import chevronDownIcon from "@/src/assets/chevronDown.png";
import chevronRightIcon from "@/src/assets/chevronRight.png";
import AuthDialog from "@/src/features/mypage/components/AuthDialog";
import AccountAuthInline from "@/src/features/mypage/components/AccountAuthInline";
import HospitalReportSheet from "@/src/components/common/HospitalReportSheet";
import TopNav from "@/src/components/common/TopNav";
import CommonFooter from "@/src/components/common/CommonFooter";
import { useMyPageState } from "@/src/features/mypage/hooks/useMyPageState";
import styles from "./MyPage.module.css";

type SectionKey = "activity" | "account" | "policy" | null;

type ChevronIconStyle = CSSProperties & {
  "--mypage-chevron-url"?: string;
};

const chevronRightIconStyle: ChevronIconStyle = {
  "--mypage-chevron-url": `url(${chevronRightIcon.src})`,
};

const chevronDownIconStyle: ChevronIconStyle = {
  "--mypage-chevron-url": `url(${chevronDownIcon.src})`,
};

function ChevronRight() {
  return (
    <span
      className={styles.chevron}
      style={chevronRightIconStyle}
      aria-hidden="true"
    />
  );
}

function ChevronDown() {
  return (
    <span
      className={`${styles.chevron} ${styles.chevronDown}`}
      style={chevronDownIconStyle}
      aria-hidden="true"
    />
  );
}

export default function MobileMyPage() {
  const [activeMenu, setActiveMenu] = useState("마이페이지");
  const [isReportSheetOpen, setIsReportSheetOpen] = useState(false);
  const [openSection, setOpenSection] = useState<SectionKey>(null);

  const toggleSection = (key: SectionKey) =>
    setOpenSection((prev) => (prev === key ? null : key));

  const {
    authDialogMessage,
    authDialogTitle,
    isAuthDialogOpen,
    authMessage,
    authMode,
    canSubmit,
    closeAuthDialog,
    email,
    handleAuthModeChange,
    handleAutoLoginChange,
    handleEmailChange,
    handlePasswordChange,
    handlePasswordConfirmChange,
    handlePrivacyPolicyAgreementChange,
    handleSubmit,
    isAuthReady,
    isAutoLoginChecked,
    isPrivacyPolicyAgreed,
    isSubmitting,
    password,
    passwordConfirm,
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

        {/* 히어로 */}
        <section className={styles.heroCard}>
          <h1 className={styles.heroTitle}>
            특수동물 병원 정보는 <br />우동에서 확인하세요
          </h1>
          <p className={styles.heroDesc}>
            우동은 특수동물 병원 정보를 한 곳에서 확인할 수 있는 서비스입니다.
            특수동물 반려자들의 제보들을 통해서 데이터를 모으고 있습니다.
          </p>
          {session ? (
            <p className={styles.sessionEmail}>{session.user.email}</p>
          ) : null}
        </section>

        {!session ? (
          <div className={styles.menuCard}>
            <AccountAuthInline
              authMessage={authMessage}
              authMode={authMode}
              canSubmit={canSubmit}
              classNames={styles}
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
        ) : null}

        {/* 메뉴 카드 */}
        <div className={styles.menuCard}>

          {/* 내 활동 — 아코디언 */}
          <button
            type="button"
            className={styles.menuItem}
            onClick={() => toggleSection("activity")}
            aria-expanded={openSection === "activity"}
          >
            <span>내 활동</span>
            {openSection === "activity" ? <ChevronDown /> : <ChevronRight />}
          </button>
          {openSection === "activity" ? (
            <div className={styles.subItems}>
              {[
                { label: "찜한 병원", href: "/mypage/activity/bookmarks" },
                { label: "내 제보",   href: "/mypage/activity/reports" },
                { label: "내 게시글", href: "/mypage/activity/posts" },
                { label: "내 댓글",   href: "/mypage/activity/comments" },
              ].map((item, idx) => (
                <div key={item.href}>
                  {idx > 0 ? <div className={styles.subDivider} /> : null}
                  <Link href={item.href} className={styles.subItem}>
                    <span>{item.label}</span>
                    <ChevronRight />
                  </Link>
                </div>
              ))}
            </div>
          ) : null}

          <div className={styles.divider} />

          {/* 계정 관리 */}
          <Link href="/mypage/account" className={styles.menuItem}>
            <span>계정 관리</span>
            <ChevronRight />
          </Link>

          <div className={styles.divider} />

          {/* 고객센터 */}
          <Link href="/mypage/support" className={styles.menuItem}>
            <span>고객센터</span>
            <ChevronRight />
          </Link>

          <div className={styles.divider} />

          {/* 약관 및 정책 */}
          <Link href="/mypage/policy" className={styles.menuItem}>
            <span>약관 및 정책</span>
            <ChevronRight />
          </Link>

        </div>

        <HospitalReportSheet isOpen={isReportSheetOpen} onClose={closeReportSheet} />
        <CommonFooter className={styles.pageFooter} />
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

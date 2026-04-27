import Head from "next/head";
import { FormEvent, useMemo, useState } from "react";
import HospitalReportSheet from "@/src/shared/components/HospitalReportSheet";
import TopNav from "@/src/shared/components/TopNav";
import styles from "@/src/mypage/MyPage.module.css";

export default function MyPage() {
  const [activeMenu, setActiveMenu] = useState("마이페이지");
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isReportSheetOpen, setIsReportSheetOpen] = useState(false);

  const canSubmit = useMemo(
    () => userId.trim().length > 0 && password.trim().length > 0,
    [userId, password],
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitted(true);
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
          content="우동 마이페이지 로그인 및 회원가입 화면입니다."
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
              <div>내 후기</div>
              <div>제보 내역</div>
            </div>
          </div>

          <form className={styles.authCard} onSubmit={handleSubmit}>
            <div className={styles.cardHeader}>
              <p>로그인 전</p>
              <h2>우동 시작하기</h2>
            </div>

            <label className={styles.field}>
              <span>아이디</span>
              <input
                type="text"
                value={userId}
                onChange={(event) => {
                  setUserId(event.target.value);
                  setSubmitted(false);
                }}
                placeholder="아이디를 입력하세요"
                autoComplete="username"
              />
            </label>

            <label className={styles.field}>
              <span>비밀번호</span>
              <input
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setSubmitted(false);
                }}
                placeholder="비밀번호를 입력하세요"
                autoComplete="new-password"
              />
            </label>

            <button type="submit" className={styles.submitButton} disabled={!canSubmit}>
              가입하고 마이페이지 보기
            </button>

            <button type="button" className={styles.secondaryButton}>
              이미 계정이 있어요
            </button>

            {submitted ? (
              <p className={styles.submitMessage}>
                입력값 확인 완료. 실제 인증 API가 연결되면 여기서 마이페이지로 전환됩니다.
              </p>
            ) : null}
          </form>
        </section>
        <HospitalReportSheet
          isOpen={isReportSheetOpen}
          onClose={closeReportSheet}
        />
      </main>
    </>
  );
}

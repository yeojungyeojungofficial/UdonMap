import Head from "next/head";
import { useState } from "react";
import HospitalReportSheet from "@/src/shared/components/HospitalReportSheet";
import TopNav from "@/src/shared/components/TopNav";
import styles from "@/src/components/support/SupportPage.module.css";

const DONATION_ACCOUNT = {
  bank: "카카오뱅크",
  number: "3333367781692 ",
  holder: "박*권",
};

export default function SupportPage() {
  const [activeMenu, setActiveMenu] = useState("후원하기");
  const [isReportSheetOpen, setIsReportSheetOpen] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");

  const closeReportSheet = () => {
    setIsReportSheetOpen(false);
    setActiveMenu("후원하기");
  };

  const handleCopyAccount = async () => {
    try {
      await navigator.clipboard.writeText(DONATION_ACCOUNT.number);
      setCopyMessage("계좌번호가 복사되었습니다.");
    } catch {
      setCopyMessage("복사하지 못했습니다. 계좌번호를 직접 확인해주세요.");
    }
  };

  return (
    <>
      <Head>
        <title>후원하기 | 우동</title>
        <meta
          name="description"
          content="우동 운영을 위한 후원 계좌 정보를 확인합니다."
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

        <section className={styles.supportSection}>
          <div className={styles.copyWrap}>
            <h1 className={styles.title}>후원하기</h1>
            <p className={styles.description}>
              우동은 특수동물 보호자들이 병원 정보를 더 쉽게 찾을 수 있도록 <br />
              제보와 후원으로 운영됩니다.
            </p>
          </div>

          <div className={styles.accountCard} aria-label="후원 계좌">
            <div className={styles.cardHeader}>
              <h2>{DONATION_ACCOUNT.bank}</h2>
            </div>

            <dl className={styles.accountInfo}>
              <div>
                <dt>계좌번호</dt>
                <dd>{DONATION_ACCOUNT.number}</dd>
              </div>
              <div>
                <dt>예금주</dt>
                <dd>{DONATION_ACCOUNT.holder}</dd>
              </div>
            </dl>

            <button
              type="button"
              className={styles.copyButton}
              onClick={handleCopyAccount}
            >
              계좌번호 복사
            </button>

            {copyMessage ? (
              <p className={styles.copyMessage}>{copyMessage}</p>
            ) : null}
          </div>
        </section>

        <HospitalReportSheet
          isOpen={isReportSheetOpen}
          onClose={closeReportSheet}
        />
      </main>
    </>
  );
}

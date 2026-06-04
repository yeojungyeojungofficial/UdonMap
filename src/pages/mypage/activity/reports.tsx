import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect } from "react";
import TopNav from "@/src/components/common/TopNav";
import CommonFooter from "@/src/components/common/CommonFooter";
import LoadingScreen from "@/src/components/common/LoadingScreen";
import MyPageBackLink from "@/src/components/mypage/MyPageBackLink";
import { REPORT_STATUS_LABELS } from "@/src/features/mypage/activityLabels";
import { useMyActivity } from "@/src/features/mypage/hooks/useMyActivity";
import { formatProfileDate } from "@/src/features/mypage/formatters";
import { useAuthStore } from "@/src/store/authStore";
import { useMyPageShellStyles } from "@/src/features/mypage/useMyPageShellStyles";
import sheetStyles from "@/src/components/mypage/MyPage.module.css";

export default function ReportsPage() {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const { myReports, isActivityLoading, activityError, openActivitySheet } = useMyActivity();
  const shell = useMyPageShellStyles();

  useEffect(() => {
    if (!session) {
      void router.replace("/mypage");
      return;
    }
    openActivitySheet("reports");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!session) return null;

  return (
    <>
      <Head><title>내 제보 | 우동</title></Head>
      <main className={shell.page}>
        <TopNav activeMenu="마이페이지" />
        <MyPageBackLink />
        <section className={shell.heroCard}>
          <h1 className={shell.heroTitle}>내 제보</h1>
          {!isActivityLoading && !activityError ? (
            <p className={shell.heroDesc}>{myReports.length}개</p>
          ) : null}
        </section>

        <div className={shell.contentArea}>
          {isActivityLoading ? (
            <LoadingScreen
              message="내 제보를 불러오는 중입니다."
              variant="inline"
            />
          ) : null}
          {activityError ? (
            <p className={sheetStyles.bookmarkError}>{activityError}</p>
          ) : null}
          {!isActivityLoading && !activityError && myReports.length === 0 ? (
            <p className={sheetStyles.bookmarkState}>아직 제보 내역이 없습니다.</p>
          ) : null}
          {!isActivityLoading && !activityError && myReports.length > 0 ? (
            <ul className={sheetStyles.activityList}>
              {myReports.map((report) => (
                <li key={report.id} className={sheetStyles.activityItem}>
                  <div className={sheetStyles.activityMeta}>
                    <span>{formatProfileDate(report.createdAt)}</span>
                    <em>{REPORT_STATUS_LABELS[report.status]}</em>
                  </div>
                  <strong>{report.hospitalName}</strong>
                  <p>{report.address}</p>
                  {report.details ? (
                    <p className={sheetStyles.activityBody}>{report.details}</p>
                  ) : null}
                  <div className={sheetStyles.bookmarkTags}>
                    {report.animalCategories.map((animal) => (
                      <em key={`${report.id}-${animal}`}>{animal}</em>
                    ))}
                    {report.animalSpecies ? <em>{report.animalSpecies}</em> : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <CommonFooter className={shell.pageFooter} />
      </main>
    </>
  );
}

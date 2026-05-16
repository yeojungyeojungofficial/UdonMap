import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect } from "react";
import TopNav from "@/src/components/common/TopNav";
import CommonFooter from "@/src/components/common/CommonFooter";
import LoadingScreen from "@/src/components/common/LoadingScreen";
import { useBookmarkedHospitals } from "@/src/features/mypage/hooks/useBookmarkedHospitals";
import { useAuthStore } from "@/src/store/authStore";
import { useMyPageShellStyles } from "@/src/features/mypage/useMyPageShellStyles";
import sheetStyles from "@/src/components/mypage/MyPage.module.css";

export default function BookmarksPage() {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const shell = useMyPageShellStyles();

  const {
    bookmarkedHospitals,
    bookmarkError,
    isBookmarkLoading,
    openBookmarkSheet,
  } = useBookmarkedHospitals();

  useEffect(() => {
    if (!session) {
      void router.replace("/mypage");
      return;
    }
    openBookmarkSheet(session);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!session) return null;

  return (
    <>
      <Head><title>찜한 병원 | 우동</title></Head>
      <main className={shell.page}>
        <TopNav activeMenu="마이페이지" />
        <section className={shell.heroCard}>
          <h1 className={shell.heroTitle}>찜한 병원</h1>
          {!isBookmarkLoading && !bookmarkError ? (
            <p className={shell.heroDesc}>{bookmarkedHospitals.length}개</p>
          ) : null}
        </section>

        <div className={shell.contentArea}>
          {isBookmarkLoading ? (
            <LoadingScreen
              message="찜한 병원을 불러오는 중입니다."
              variant="inline"
            />
          ) : null}
          {bookmarkError ? (
            <p className={sheetStyles.bookmarkError}>{bookmarkError}</p>
          ) : null}
          {!isBookmarkLoading && !bookmarkError && bookmarkedHospitals.length === 0 ? (
            <p className={sheetStyles.bookmarkState}>아직 찜한 병원이 없습니다.</p>
          ) : null}
          {!isBookmarkLoading && !bookmarkError && bookmarkedHospitals.length > 0 ? (
            <ul className={sheetStyles.bookmarkList}>
              {bookmarkedHospitals.map((hospital) => (
                <li key={hospital.id} className={sheetStyles.bookmarkItem}>
                  <span>{hospital.region}</span>
                  <strong>{hospital.name}</strong>
                  <p>{hospital.address}</p>
                  <div className={sheetStyles.bookmarkTags}>
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
        </div>
        <CommonFooter className={shell.pageFooter} />
      </main>
    </>
  );
}

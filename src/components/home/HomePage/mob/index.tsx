import Head from "next/head";
import { useState } from "react";
import HospitalBottomSheet from "@/src/components/home/HospitalBottomSheet";
import HospitalList from "@/src/components/home/HospitalList";
import MapPanel from "@/src/components/home/MapPanel";
import RegionFilter from "@/src/components/home/RegionFilter";
import HospitalReportSheet from "@/src/components/common/HospitalReportSheet";
import LoadingScreen from "@/src/components/common/LoadingScreen";
import TopNav from "@/src/components/common/TopNav";
import CommonFooter from "@/src/components/common/CommonFooter";
import { useHospitalDirectory } from "@/src/features/hospitals/hooks/useHospitalDirectory";
import styles from "./HomePage.module.css";

export default function MobileHomePage() {
  const [activeMenu, setActiveMenu] = useState("병원찾기");
  const [isReportSheetOpen, setIsReportSheetOpen] = useState(false);
  const {
    effectiveSelectedRegion,
    filteredHospitals,
    handleBookmarkChanged,
    handleCloseHospital,
    handleCommentCreated,
    handleCommentDeleted,
    handleCommentReactionChanged,
    handleHospitalReactionChanged,
    handleSelectHospital,
    hasHospitalLoadError,
    isLoadingHospitals,
    loadingCommentsHospitalId,
    mapLevel,
    mapHospitals,
    mapSelectedRegion,
    query,
    regionOptions,
    selectedHospital,
    selectedHospitalCommentLoadError,
    selectedHospitalId,
    setMapLevel,
    setQuery,
    setSelectedRegion,
  } = useHospitalDirectory();

  const closeReportSheet = () => {
    setIsReportSheetOpen(false);
    setActiveMenu("병원찾기");
  };

  return (
    <>
      <Head>
        <title>우리동네 동물병원</title>
        <meta
          name="description"
          content="동물병원 지도, 지역 필터, 후기와 좋아요를 한 화면에서 확인합니다."
        />
      </Head>
      <div className={styles.page}>
        <TopNav
          activeMenu={activeMenu}
          onSelectMenu={setActiveMenu}
          onOpenReport={() => {
            setActiveMenu("병원제보");
            setIsReportSheetOpen(true);
          }}
        />
        <div className={styles.searchWrap}>
          <label htmlFor="hospital-search" className={styles.searchLabel}>
            병원 검색
          </label>
          <div className={styles.searchField}>
            <input
              id="hospital-search"
              type="search"
              placeholder="병원명, 주소, 진료동물 검색"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className={styles.searchInput}
            />
            <span className={styles.searchIconWrap} aria-hidden="true">
              <svg
                className={styles.searchIcon}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M16.5 16.5 21 21"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>
        </div>
        {isLoadingHospitals ? (
          <LoadingScreen
            message="병원 목록을 불러오는 중입니다."
            variant="plainInline"
            className={`${styles.statusBanner} ${styles.statusLoading}`}
          />
        ) : null}
        {!isLoadingHospitals && hasHospitalLoadError ? (
          <div className={styles.statusBanner}>
            병원 목록을 불러오지 못했습니다.
          </div>
        ) : null}
        <div className={styles.heroSection}>
          <MapPanel
            hospitals={mapHospitals}
            mapLevel={mapLevel}
            selectedHospitalId={selectedHospitalId}
            selectedRegion={mapSelectedRegion}
            onMapLevelChange={setMapLevel}
            onSelectHospital={handleSelectHospital}
          />
        </div>

        <main className={styles.mainSection}>
          <RegionFilter
            regions={regionOptions}
            selectedRegion={effectiveSelectedRegion}
            onSelectRegion={setSelectedRegion}
            expandable
          />

          <section className={styles.listSection}>
            <div className={styles.sectionHeader}>
              <p className={styles.sectionCount}>{filteredHospitals.length}개 병원 표시 중</p>
            </div>
            <HospitalList
              hospitals={filteredHospitals}
              selectedHospitalId={selectedHospitalId}
              onSelectHospital={handleSelectHospital}
            />
          </section>
        </main>

        <HospitalBottomSheet
          key={selectedHospital?.id ?? "empty-hospital-sheet"}
          hospital={selectedHospital}
          onClose={handleCloseHospital}
          onCommentCreated={handleCommentCreated}
          onCommentDeleted={handleCommentDeleted}
          onHospitalReactionChanged={handleHospitalReactionChanged}
          onCommentReactionChanged={handleCommentReactionChanged}
          onBookmarkChanged={handleBookmarkChanged}
          isLoadingComments={loadingCommentsHospitalId === selectedHospital?.id}
          commentLoadError={selectedHospitalCommentLoadError}
        />
        <HospitalReportSheet
          isOpen={isReportSheetOpen}
          onClose={closeReportSheet}
        />
        <CommonFooter />
      </div>
    </>
  );
}

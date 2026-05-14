import Head from "next/head";
import { useState } from "react";
import HospitalBottomSheet from "@/src/components/home/HospitalBottomSheet";
import HospitalList from "@/src/components/home/HospitalList";
import MapPanel from "@/src/components/home/MapPanel";
import RegionFilter from "@/src/components/home/RegionFilter";
import HospitalReportSheet from "@/src/components/common/HospitalReportSheet";
import TopNav from "@/src/components/common/TopNav";
import CommonFooter from "@/src/components/common/CommonFooter";
import { useHospitalDirectory } from "@/src/features/hospitals/hooks/useHospitalDirectory";
import styles from "@/src/components/home/Home.module.css";

export default function HomePage() {
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
        <title>우리들의 동물병원</title>
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
          <input
            id="hospital-search"
            type="search"
            placeholder="병원명, 주소, 진료동물 검색"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className={styles.searchInput}
          />
        </div>
        {isLoadingHospitals || hasHospitalLoadError ? (
          <div className={styles.statusBanner}>
            {hasHospitalLoadError
              ? "병원목록을 불러오지 못했습니다."
              : "병원목록을 불러오는중입니다"}
          </div>
        ) : null}
        <div className={styles.heroSection}>
          <MapPanel
            hospitals={filteredHospitals}
            mapLevel={mapLevel}
            selectedHospitalId={selectedHospitalId}
            onMapLevelChange={setMapLevel}
            onSelectHospital={handleSelectHospital}
          />
        </div>

        <main className={styles.mainSection}>
          <RegionFilter
            regions={regionOptions}
            selectedRegion={effectiveSelectedRegion}
            onSelectRegion={setSelectedRegion}
          />

          <section className={styles.listSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>병원 리스트</h2>
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

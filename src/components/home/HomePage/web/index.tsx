import Head from "next/head";
import { type FormEvent, useState } from "react";
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

export default function DesktopHomePage() {
  const [activeMenu, setActiveMenu] = useState("병원찾기");
  const [isReportSheetOpen, setIsReportSheetOpen] = useState(false);
  const [reportInitialValues, setReportInitialValues] = useState({
    hospitalName: "",
    streetAddress: "",
  });
  const {
    effectiveSelectedRegion,
    handleBookmarkChanged,
    handleCloseHospital,
    handleCommentCreated,
    handleCommentDeleted,
    handleCommentReactionChanged,
    handleCurrentLocationResolved,
    handleHospitalReactionChanged,
    handleSelectHospitalGroup,
    handleSelectHospital,
    hasHospitalLoadError,
    initialMapFocusRegion,
    isHospitalGroupFocused,
    isLoadingHospitals,
    listHospitals,
    loadingCommentsHospitalId,
    mapLevel,
    mapHospitals,
    mapResetVersion,
    mapSelectedRegion,
    query,
    regionOptions,
    resetSearch,
    searchInput,
    selectedHospital,
    selectedHospitalCommentLoadError,
    selectedHospitalId,
    setMapLevel,
    setQuery,
    setSearchInput,
    setSelectedRegion,
  } = useHospitalDirectory();

  const handleSelectMenu = (menu: string) => {
    setActiveMenu(menu);
    if (menu === "병원찾기") {
      setIsReportSheetOpen(false);
      setReportInitialValues({ hospitalName: "", streetAddress: "" });
    }
  };

  const closeReportSheet = () => {
    setIsReportSheetOpen(false);
    setActiveMenu("병원찾기");
    setReportInitialValues({ hospitalName: "", streetAddress: "" });
  };

  const openEmptyReportSheet = () => {
    setReportInitialValues({ hospitalName: "", streetAddress: "" });
    setActiveMenu("병원제보");
    setIsReportSheetOpen(true);
  };

  const openHospitalReportSheet = (
    targetHospital: NonNullable<typeof selectedHospital>,
  ) => {
    setReportInitialValues({
      hospitalName: targetHospital.name,
      streetAddress: targetHospital.address,
    });
    setActiveMenu("병원제보");
    handleCloseHospital();
    setIsReportSheetOpen(true);
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setQuery(searchInput.trim());
  };

  const handleSearchInputChange = (value: string) => {
    if (value === "") {
      resetSearch();
      return;
    }

    setSearchInput(value);
  };

  return (
    <>
      <Head>
        <title>우동맵 | 우리동네 동물병원 지도</title>
        <meta
          name="description"
          content="우동맵에서 특수동물 진료 병원, 동물병원 지도, 지역 필터, 후기와 좋아요를 한 화면에서 확인합니다."
        />
      </Head>
      <div className={styles.page}>
        <TopNav
          activeMenu={activeMenu}
          onSelectMenu={handleSelectMenu}
          onOpenReport={openEmptyReportSheet}
        />
        <form
          className={styles.searchWrap}
          role="search"
          onSubmit={handleSearchSubmit}
        >
          <label htmlFor="hospital-search" className={styles.searchLabel}>
            병원 검색
          </label>
          <input
            id="hospital-search"
            type="search"
            enterKeyHint="search"
            placeholder="병원명, 주소, 진료동물 검색"
            value={searchInput}
            onChange={(event) => handleSearchInputChange(event.target.value)}
            className={styles.searchInput}
          />
        </form>
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
            key={mapResetVersion}
            hospitals={mapHospitals}
            initialFocusRegion={initialMapFocusRegion}
            isHospitalGroupFocused={isHospitalGroupFocused}
            isSearchActive={query.trim().length > 0}
            mapLevel={mapLevel}
            selectedHospitalId={selectedHospitalId}
            selectedRegion={mapSelectedRegion}
            onCurrentLocationResolved={handleCurrentLocationResolved}
            onMapLevelChange={setMapLevel}
            onSelectHospitalGroup={handleSelectHospitalGroup}
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
              <p className={styles.sectionCount}>{listHospitals.length}개 병원 표시 중</p>
            </div>
            <HospitalList
              hospitals={listHospitals}
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
          onOpenReport={openHospitalReportSheet}
          isLoadingComments={loadingCommentsHospitalId === selectedHospital?.id}
          commentLoadError={selectedHospitalCommentLoadError}
        />
        <HospitalReportSheet
          initialHospitalName={reportInitialValues.hospitalName}
          initialStreetAddress={reportInitialValues.streetAddress}
          isOpen={isReportSheetOpen}
          onClose={closeReportSheet}
        />
        <CommonFooter />
      </div>
    </>
  );
}

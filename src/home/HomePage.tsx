import Head from "next/head";
import { useMemo, useState } from "react";
import HospitalBottomSheet from "@/src/home/components/HospitalBottomSheet";
import HospitalList from "@/src/home/components/HospitalList";
import MapPanel from "@/src/home/components/MapPanel";
import RegionFilter from "@/src/home/components/RegionFilter";
import HospitalReportSheet from "@/src/shared/components/HospitalReportSheet";
import TopNav from "@/src/shared/components/TopNav";
import { HOSPITALS, REGION_OPTIONS } from "@/src/home/data";
import type { Region } from "@/src/home/types";
import styles from "@/src/home/Home.module.css";

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<Region>("전체");
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(
    null,
  );
  const [activeMenu, setActiveMenu] = useState("병원찾기");
  const [isReportSheetOpen, setIsReportSheetOpen] = useState(false);

  const filteredHospitals = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return HOSPITALS.filter((hospital) => {
      if (selectedRegion !== "전체" && hospital.region !== selectedRegion) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const searchableText = [
        hospital.name,
        hospital.address,
        hospital.summary,
        ...hospital.animals,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }, [query, selectedRegion]);

  const selectedHospital = useMemo(
    () =>
      filteredHospitals.find((hospital) => hospital.id === selectedHospitalId) ??
      null,
    [filteredHospitals, selectedHospitalId],
  );

  const closeReportSheet = () => {
    setIsReportSheetOpen(false);
    setActiveMenu("병원찾기");
  };

  return (
    <>
      <Head>
        <title>우동</title>
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
        <div className={styles.heroSection}>
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
          <MapPanel
            hospitals={filteredHospitals}
            selectedHospitalId={selectedHospitalId}
            onSelectHospital={(hospital) => setSelectedHospitalId(hospital.id)}
          />
        </div>

        <main className={styles.mainSection}>
          <RegionFilter
            regions={REGION_OPTIONS}
            selectedRegion={selectedRegion}
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
              onSelectHospital={(hospital) => setSelectedHospitalId(hospital.id)}
            />
          </section>
        </main>

        <HospitalBottomSheet
          hospital={selectedHospital}
          onClose={() => setSelectedHospitalId(null)}
        />
        <HospitalReportSheet
          isOpen={isReportSheetOpen}
          onClose={closeReportSheet}
        />
      </div>
    </>
  );
}

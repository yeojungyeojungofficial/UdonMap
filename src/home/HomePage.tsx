import Head from "next/head";
import { useCallback, useEffect, useMemo, useState } from "react";
import HospitalBottomSheet from "@/src/home/components/HospitalBottomSheet";
import HospitalList from "@/src/home/components/HospitalList";
import MapPanel from "@/src/home/components/MapPanel";
import RegionFilter from "@/src/home/components/RegionFilter";
import HospitalReportSheet from "@/src/shared/components/HospitalReportSheet";
import TopNav from "@/src/shared/components/TopNav";
import { fetchHospitals } from "@/src/home/hospitalsApi";
import { OTHER_REGION_FILTER, REGION_FILTERS } from "@/src/home/regions";
import type {
  Hospital,
  HospitalComment,
  ReactionSnapshot,
  Region,
} from "@/src/home/types";
import styles from "@/src/home/Home.module.css";

export default function HomePage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [isLoadingHospitals, setIsLoadingHospitals] = useState(true);
  const [hasHospitalLoadError, setHasHospitalLoadError] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<Region>("서울");
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(
    null,
  );
  const [activeMenu, setActiveMenu] = useState("병원찾기");
  const [isReportSheetOpen, setIsReportSheetOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadHospitals = async () => {
      try {
        const nextHospitals = await fetchHospitals();
        if (!isMounted) return;
        setHospitals(nextHospitals);
        setHasHospitalLoadError(false);
      } catch {
        if (!isMounted) return;
        setHospitals([]);
        setHasHospitalLoadError(true);
      } finally {
        if (isMounted) {
          setIsLoadingHospitals(false);
        }
      }
    };

    void loadHospitals();

    return () => {
      isMounted = false;
    };
  }, []);

  const regionOptions = useMemo<Region[]>(() => {
    const hasOtherRegions = hospitals.some(
      (hospital) => hospital.regionFilter === OTHER_REGION_FILTER,
    );

    return hasOtherRegions
      ? [...REGION_FILTERS, OTHER_REGION_FILTER]
      : [...REGION_FILTERS];
  }, [hospitals]);

  const effectiveSelectedRegion =
    selectedRegion === "전체" || regionOptions.includes(selectedRegion)
      ? selectedRegion
      : "전체";

  const filteredHospitals = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return hospitals.filter((hospital) => {
      if (
        effectiveSelectedRegion !== "전체" &&
        hospital.regionFilter !== effectiveSelectedRegion
      ) {
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
  }, [effectiveSelectedRegion, hospitals, query]);

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

  const handleSelectHospital = useCallback((hospital: Hospital) => {
    setSelectedHospitalId(hospital.id);
  }, []);

  const handleCommentCreated = useCallback(
    (hospitalId: string, comment: HospitalComment) => {
      setHospitals((currentHospitals) =>
        currentHospitals.map((hospital) =>
          hospital.id === hospitalId
            ? {
                ...hospital,
                comments: [comment, ...hospital.comments],
                reviewCount: hospital.reviewCount + 1,
              }
            : hospital,
        ),
      );
    },
    [],
  );

  const handleCommentDeleted = useCallback(
    (hospitalId: string, commentId: string) => {
      setHospitals((currentHospitals) =>
        currentHospitals.map((hospital) =>
          hospital.id === hospitalId
            ? {
                ...hospital,
                comments: hospital.comments.filter(
                  (comment) => comment.id !== commentId,
                ),
                reviewCount: Math.max(0, hospital.reviewCount - 1),
              }
            : hospital,
        ),
      );
    },
    [],
  );

  const handleHospitalReactionChanged = useCallback(
    (hospitalId: string, reaction: ReactionSnapshot) => {
      setHospitals((currentHospitals) =>
        currentHospitals.map((hospital) =>
          hospital.id === hospitalId
            ? {
                ...hospital,
                likes: reaction.likes,
                dislikes: reaction.dislikes,
                reaction: reaction.reaction,
              }
            : hospital,
        ),
      );
    },
    [],
  );

  const handleCommentReactionChanged = useCallback(
    (hospitalId: string, commentId: string, reaction: ReactionSnapshot) => {
      setHospitals((currentHospitals) =>
        currentHospitals.map((hospital) =>
          hospital.id === hospitalId
            ? {
                ...hospital,
                comments: hospital.comments.map((comment) =>
                  comment.id === commentId
                    ? {
                        ...comment,
                        likes: reaction.likes,
                        dislikes: reaction.dislikes,
                        reaction: reaction.reaction,
                      }
                    : comment,
                ),
              }
            : hospital,
        ),
      );
    },
    [],
  );

  const handleBookmarkChanged = useCallback(
    (hospitalId: string, isBookmarked: boolean) => {
      setHospitals((currentHospitals) =>
        currentHospitals.map((hospital) =>
          hospital.id === hospitalId
            ? {
                ...hospital,
                isBookmarked,
              }
            : hospital,
        ),
      );
    },
    [],
  );

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
            selectedHospitalId={selectedHospitalId}
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
          onClose={() => setSelectedHospitalId(null)}
          onCommentCreated={handleCommentCreated}
          onCommentDeleted={handleCommentDeleted}
          onHospitalReactionChanged={handleHospitalReactionChanged}
          onCommentReactionChanged={handleCommentReactionChanged}
          onBookmarkChanged={handleBookmarkChanged}
        />
        <HospitalReportSheet
          isOpen={isReportSheetOpen}
          onClose={closeReportSheet}
        />
      </div>
    </>
  );
}

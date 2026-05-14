import { useState } from "react";
import expandableFilter from "@/src/components/common/mob/expandableFilter.module.css";
import type { Region } from "@/src/features/hospitals/types";
import styles from "@/src/components/home/Home.module.css";

type RegionFilterProps = {
  regions: readonly Region[];
  selectedRegion: Region;
  onSelectRegion: (region: Region) => void;
  /** 접었다 펼치는 행 + 전체보기 토글 (모바일 홈 등) */
  expandable?: boolean;
};

export default function RegionFilter({
  regions,
  selectedRegion,
  onSelectRegion,
  expandable = false,
}: RegionFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (expandable) {
    return (
      <>
        <div className={expandableFilter.filterRow}>
          {isOpen ? null : (
            <span className={expandableFilter.filterHint}>
              지역 필터링을 할 수 있습니다
            </span>
          )}
          <button
            type="button"
            className={`${expandableFilter.filterToggle} ${isOpen ? expandableFilter.filterToggleOpen : ""}`}
            onClick={() => setIsOpen((v) => !v)}
            aria-expanded={isOpen}
          >
            {isOpen ? "접기" : "전체보기"}
          </button>
        </div>
        {isOpen ? (
          <div className={expandableFilter.filterChips} aria-label="지역 필터">
            {regions.map((region) => {
              const isActive = selectedRegion === region;
              return (
                <button
                  key={region}
                  type="button"
                  className={`${expandableFilter.filterChip} ${
                    isActive ? expandableFilter.filterChipActive : ""
                  }`}
                  onClick={() => {
                    onSelectRegion(region);
                    setIsOpen(false);
                  }}
                >
                  {region}
                </button>
              );
            })}
          </div>
        ) : null}
      </>
    );
  }

  return (
    <div className={styles.regionRow} aria-label="지역 필터">
      {regions.map((region) => {
        const isActive = selectedRegion === region;
        return (
          <button
            key={region}
            type="button"
            className={`${styles.regionButton} ${
              isActive ? styles.regionButtonActive : ""
            }`}
            onClick={() => onSelectRegion(region)}
          >
            {region}
          </button>
        );
      })}
    </div>
  );
}

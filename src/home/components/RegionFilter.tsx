import type { Region } from "@/src/features/hospitals/types";
import styles from "@/src/home/Home.module.css";

type RegionFilterProps = {
  regions: readonly Region[];
  selectedRegion: Region;
  onSelectRegion: (region: Region) => void;
};

export default function RegionFilter({
  regions,
  selectedRegion,
  onSelectRegion,
}: RegionFilterProps) {
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

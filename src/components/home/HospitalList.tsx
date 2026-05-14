import { useState } from "react";
import type { Hospital } from "@/src/features/hospitals/types";
import styles from "@/src/components/home/Home.module.css";

/** 접힌 상태에서 보이는 진료동물 칩 개수 */
const COLLAPSED_ANIMAL_COUNT = 10;

function HospitalCardAnimals({
  hospitalId,
  animals,
}: {
  hospitalId: string;
  animals: readonly string[];
}) {
  const [expanded, setExpanded] = useState(false);

  if (animals.length === 0) {
    return null;
  }

  const needsToggle = animals.length > COLLAPSED_ANIMAL_COUNT;
  const visible =
    expanded || !needsToggle
      ? animals
      : animals.slice(0, COLLAPSED_ANIMAL_COUNT);
  const hiddenCount = animals.length - COLLAPSED_ANIMAL_COUNT;

  return (
    <div className={styles.animalTags}>
      {visible.map((animal) => (
        <span key={`${hospitalId}-${animal}`} className={styles.tag}>
          {animal}
        </span>
      ))}
      {needsToggle ? (
        <button
          type="button"
          className={styles.animalTagsToggle}
          onClick={(event) => {
            event.stopPropagation();
            setExpanded((value) => !value);
          }}
          aria-expanded={expanded}
        >
          {expanded ? "접기" : `${hiddenCount}개 더보기`}
        </button>
      ) : null}
    </div>
  );
}

type HospitalListProps = {
  hospitals: Hospital[];
  selectedHospitalId: string | null;
  onSelectHospital: (hospital: Hospital) => void;
};

export default function HospitalList({
  hospitals,
  selectedHospitalId,
  onSelectHospital,
}: HospitalListProps) {
  if (hospitals.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>검색 조건에 맞는 병원이 없습니다.</p>
      </div>
    );
  }

  return (
    <ul className={styles.hospitalList}>
      {hospitals.map((hospital) => {
        const isActive = hospital.id === selectedHospitalId;
        return (
          <li key={hospital.id}>
            <div
              role="button"
              tabIndex={0}
              className={`${styles.hospitalCard} ${
                isActive ? styles.hospitalCardActive : ""
              }`}
              onClick={() => onSelectHospital(hospital)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelectHospital(hospital);
                }
              }}
              aria-label={`${hospital.name} 상세 보기`}
            >
              <div className={styles.hospitalCardTop}>
                <span className={styles.hospitalRegion}>{hospital.region}</span>
                <span className={styles.hospitalStats}>
                  좋아요 {hospital.likes} · 후기 {hospital.reviewCount}
                </span>
              </div>
              <h3 className={styles.hospitalName}>{hospital.name}</h3>
              <p className={styles.hospitalAddress}>{hospital.address}</p>
              <p className={styles.hospitalSummary}>{hospital.summary}</p>
              <HospitalCardAnimals
                hospitalId={hospital.id}
                animals={hospital.animals}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

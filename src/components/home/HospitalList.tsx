import { useState } from "react";
import type { Hospital } from "@/src/features/hospitals/types";
import {
  getHospitalOperationStatus,
  isClosedOperationStatus,
} from "@/src/features/hospitals/operationStatus";
import styles from "@/src/components/home/Home.module.css";

/** 접힌 상태에서 보이는 진료동물 칩 개수 */
const COLLAPSED_ANIMAL_COUNT = 10;
const EMERGENCY_SUMMARY_TEXT = "응급 진료 가능";

function getOrderedHospitals(
  hospitals: Hospital[],
  selectedHospitalId: string | null,
) {
  if (!selectedHospitalId) {
    return hospitals;
  }

  const selectedIndex = hospitals.findIndex(
    (hospital) => hospital.id === selectedHospitalId,
  );

  if (selectedIndex <= 0) {
    return hospitals;
  }

  const selectedHospital = hospitals[selectedIndex];

  return [
    selectedHospital,
    ...hospitals.slice(0, selectedIndex),
    ...hospitals.slice(selectedIndex + 1),
  ];
}

function HospitalCardSummary({ summary }: { summary: string }) {
  if (!summary) {
    return null;
  }

  const emergencyIndex = summary.indexOf(EMERGENCY_SUMMARY_TEXT);

  if (emergencyIndex === -1) {
    return <p className={styles.hospitalSummary}>{summary}</p>;
  }

  const beforeEmergency = summary.slice(0, emergencyIndex);
  const afterEmergency = summary.slice(
    emergencyIndex + EMERGENCY_SUMMARY_TEXT.length,
  );

  return (
    <p className={styles.hospitalSummary}>
      {beforeEmergency}
      <span className={styles.hospitalSummaryEmergency}>
        {EMERGENCY_SUMMARY_TEXT}
      </span>
      {afterEmergency}
    </p>
  );
}

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
  const orderedHospitals = getOrderedHospitals(hospitals, selectedHospitalId);

  if (hospitals.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>검색 조건에 맞는 병원이 없습니다.</p>
      </div>
    );
  }

  return (
    <ul className={styles.hospitalList}>
      {orderedHospitals.map((hospital) => {
        const isActive = hospital.id === selectedHospitalId;
        const operationStatus = getHospitalOperationStatus(hospital.hours);
        const shouldShowOperationStatus = operationStatus !== "운영정보";
        const operationStatusClassName = [
          styles.hospitalOperationStatus,
          operationStatus === "운영중"
            ? styles.hospitalOperationStatusOpen
            : "",
          isClosedOperationStatus(operationStatus)
            ? styles.hospitalOperationStatusClosed
            : "",
        ]
          .filter(Boolean)
          .join(" ");

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
              aria-current={isActive ? "true" : undefined}
              aria-label={`${hospital.name} 상세 보기`}
            >
              <div className={styles.hospitalCardTop}>
                <div className={styles.hospitalCardBadges}>
                  {isActive ? (
                    <span className={styles.selectedBadge}>선택됨</span>
                  ) : null}
                  <span className={styles.hospitalRegion}>
                    {hospital.region}
                  </span>
                  {shouldShowOperationStatus ? (
                    <span className={operationStatusClassName}>
                      {operationStatus}
                    </span>
                  ) : null}
                </div>
                <span className={styles.hospitalStats}>
                  좋아요 {hospital.likes} · 후기 {hospital.reviewCount}
                </span>
              </div>
              <h3 className={styles.hospitalName}>{hospital.name}</h3>
              <p className={styles.hospitalAddress}>{hospital.address}</p>
              <HospitalCardSummary summary={hospital.summary} />
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

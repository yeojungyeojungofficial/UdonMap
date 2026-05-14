import type { Hospital } from "@/src/features/hospitals/types";
import styles from "@/src/components/home/Home.module.css";

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
            <button
              type="button"
              className={`${styles.hospitalCard} ${
                isActive ? styles.hospitalCardActive : ""
              }`}
              onClick={() => onSelectHospital(hospital)}
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
              <div className={styles.animalTags}>
                {hospital.animals.map((animal) => (
                  <span key={`${hospital.id}-${animal}`} className={styles.tag}>
                    {animal}
                  </span>
                ))}
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

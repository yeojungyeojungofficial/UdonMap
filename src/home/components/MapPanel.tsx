import type { Hospital } from "@/src/home/types";
import styles from "@/src/home/Home.module.css";

type MapPanelProps = {
  hospitals: Hospital[];
  selectedHospitalId: string | null;
  onSelectHospital: (hospital: Hospital) => void;
};

export default function MapPanel({
  hospitals,
  selectedHospitalId,
  onSelectHospital,
}: MapPanelProps) {
  return (
    <section className={styles.mapPanel} aria-label="병원 지도">
      {hospitals.map((hospital) => {
        const isActive = hospital.id === selectedHospitalId;
        return (
          <button
            key={hospital.id}
            type="button"
            className={`${styles.marker} ${isActive ? styles.markerActive : ""}`}
            style={{
              left: `${hospital.mapPosition.x}%`,
              top: `${hospital.mapPosition.y}%`,
            }}
            onClick={() => onSelectHospital(hospital)}
            aria-label={`${hospital.name} 마커`}
          >
            <span className={styles.markerDot} />
            <span className={styles.markerLabel}>{hospital.name}</span>
          </button>
        );
      })}
    </section>
  );
}

import type { BookmarkedHospital } from "@/src/features/mypage/types";
import LoadingScreen from "@/src/components/common/LoadingScreen";
import styles from "@/src/features/mypage/components/MyPage.module.css";

type BookmarkSheetProps = {
  bookmarkedHospitals: BookmarkedHospital[];
  error: string;
  isLoading: boolean;
  onClose: () => void;
};

export default function BookmarkSheet({
  bookmarkedHospitals,
  error,
  isLoading,
  onClose,
}: BookmarkSheetProps) {
  return (
    <div className={styles.sheetBackdrop} role="presentation" onClick={onClose}>
      <section
        className={styles.bookmarkSheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bookmark-sheet-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.sheetHandle} />
        <div className={styles.bookmarkSheetHeader}>
          <div>
            <h2 id="bookmark-sheet-title">찜한 병원</h2>
            <p>{bookmarkedHospitals.length}개</p>
          </div>
          <button
            type="button"
            className={styles.sheetCloseButton}
            onClick={onClose}
            aria-label="찜한 병원 닫기"
          >
            닫기
          </button>
        </div>

        {isLoading ? (
          <LoadingScreen
            message="찜한 병원을 불러오는 중입니다."
            variant="inline"
          />
        ) : null}

        {error ? <p className={styles.bookmarkError}>{error}</p> : null}

        {!isLoading && !error && bookmarkedHospitals.length === 0 ? (
          <p className={styles.bookmarkState}>아직 찜한 병원이 없습니다.</p>
        ) : null}

        {!isLoading && !error && bookmarkedHospitals.length > 0 ? (
          <ul className={styles.bookmarkList}>
            {bookmarkedHospitals.map((hospital) => (
              <li key={hospital.id} className={styles.bookmarkItem}>
                <span>{hospital.region}</span>
                <strong>{hospital.name}</strong>
                <p>{hospital.address}</p>
                <div className={styles.bookmarkTags}>
                  {hospital.animals.slice(0, 4).map((animal) => (
                    <em key={`${hospital.id}-${animal}`}>{animal}</em>
                  ))}
                  {hospital.isEmergency ? <em>응급 진료</em> : null}
                  {hospital.isSpecialty ? <em>특수동물 진료</em> : null}
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}

import type { Hospital } from "@/src/home/types";
import styles from "@/src/home/Home.module.css";

type HospitalBottomSheetProps = {
  hospital: Hospital | null;
  onClose: () => void;
};

export default function HospitalBottomSheet({
  hospital,
  onClose,
}: HospitalBottomSheetProps) {
  if (!hospital) {
    return null;
  }

  return (
    <div className={styles.sheetOverlay} role="presentation" onClick={onClose}>
      <section
        className={styles.bottomSheet}
        role="dialog"
        aria-modal="true"
        aria-label="병원 상세 정보"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.sheetHandle} />
        <header className={styles.sheetHeader}>
          <div>
            <p className={styles.sheetRegion}>{hospital.region}</p>
            <h3 className={styles.sheetTitle}>{hospital.name}</h3>
            <p className={styles.sheetAddress}>{hospital.address}</p>
          </div>
          <button
            type="button"
            className={styles.sheetCloseButton}
            onClick={onClose}
          >
            닫기
          </button>
        </header>
        <div className={styles.sheetMetrics}>
          <p className={styles.sheetMetric}>좋아요 {hospital.likes}</p>
          <p className={styles.sheetMetric}>후기 {hospital.reviewCount}</p>
          <p className={styles.sheetMetric}>진료동물 {hospital.animals.join(", ")}</p>
        </div>
        <p className={styles.sheetSummary}>{hospital.summary}</p>
        <div className={styles.commentWrap}>
          <h4 className={styles.commentTitle}>이용자 댓글</h4>
          <ul className={styles.commentList}>
            {hospital.comments.map((comment) => (
              <li key={comment.id} className={styles.commentItem}>
                <p className={styles.commentAuthor}>{comment.author}</p>
                <p className={styles.commentBody}>{comment.content}</p>
                <p className={styles.commentLikes}>좋아요 {comment.likes}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

import { useMapPopups } from "@/src/features/mapPopups/hooks/useMapPopups";
import styles from "./MapPopupModal.module.css";

const BADGE_LABEL: Record<string, string> = {
  notice: "공지",
  update: "업데이트",
  maintenance: "점검",
};

const BADGE_CLASS: Record<string, string> = {
  notice: styles.badgeNotice,
  update: styles.badgeUpdate,
  maintenance: styles.badgeMaintenance,
};

export default function MapPopupModal() {
  const { popup, isDismissForToday, setIsDismissForToday, onClose } =
    useMapPopups();

  if (!popup) return null;

  return (
    <div
      className={styles.backdrop}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="map-popup-title"
      >
        <div className={styles.header}>
          <div className={styles.titleWrap}>
            <span
              className={`${styles.badge} ${BADGE_CLASS[popup.popup_type] ?? styles.badgeNotice}`}
            >
              {BADGE_LABEL[popup.popup_type] ?? popup.popup_type}
            </span>
            <h2 id="map-popup-title" className={styles.title}>
              {popup.title}
            </h2>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="팝업 닫기"
          >
            ✕
          </button>
        </div>

        {popup.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={popup.image_url}
            alt={popup.title}
            className={styles.image}
          />
        ) : null}

        <p className={styles.body}>{popup.body}</p>

        {popup.link_url ? (
          <a
            href={popup.link_url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.linkButton}
            onClick={onClose}
          >
            {popup.link_label ?? "자세히 보기"}
          </a>
        ) : null}

        <div className={styles.footer}>
          <label className={styles.dismissLabel}>
            <input
              type="checkbox"
              checked={isDismissForToday}
              onChange={(e) => setIsDismissForToday(e.target.checked)}
            />
            오늘 하루 안보기
          </label>
          <button type="button" className={styles.confirmButton} onClick={onClose}>
            닫기
          </button>
        </div>
      </section>
    </div>
  );
}

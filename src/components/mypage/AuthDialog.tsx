import styles from "@/src/components/mypage/MyPage.module.css";

type AuthDialogProps = {
  message: string;
  onClose: () => void;
  title: string;
};

export default function AuthDialog({ message, onClose, title }: AuthDialogProps) {
  return (
    <div className={styles.dialogBackdrop} role="presentation">
      <section
        className={styles.authDialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-error-title"
      >
        <h2 id="auth-error-title">{title}</h2>
        {message ? <p>{message}</p> : null}
        <button
          type="button"
          className={styles.dialogButton}
          onClick={onClose}
        >
          확인
        </button>
      </section>
    </div>
  );
}

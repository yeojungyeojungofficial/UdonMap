import styles from "@/src/components/mypage/MyPage.module.css";

type AuthDialogProps = {
  message: string;
  onClose: () => void;
};

export default function AuthDialog({ message, onClose }: AuthDialogProps) {
  return (
    <div className={styles.dialogBackdrop} role="presentation">
      <section
        className={styles.authDialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-error-title"
      >
        <h2 id="auth-error-title">인증 오류</h2>
        <p>{message}</p>
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

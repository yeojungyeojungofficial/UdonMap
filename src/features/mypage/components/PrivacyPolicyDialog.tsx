import { useEffect } from "react";
import PrivacyPolicyContent from "@/src/features/mypage/components/PrivacyPolicyContent";
import styles from "@/src/features/mypage/components/MyPage.module.css";

type PrivacyPolicyDialogProps = {
  onClose: () => void;
};

export default function PrivacyPolicyDialog({
  onClose,
}: PrivacyPolicyDialogProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className={styles.dialogBackdrop} role="presentation" onClick={onClose}>
      <section
        className={styles.policyDialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-policy-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.policyDialogHeader}>
          <h2 id="privacy-policy-dialog-title">개인정보 처리방침</h2>
          <button
            type="button"
            className={styles.sheetCloseButton}
            onClick={onClose}
          >
            닫기
          </button>
        </header>
        <div className={styles.policyDialogBody}>
          <PrivacyPolicyContent classNames={styles} />
        </div>
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

import styles from "@/src/shared/components/LoadingScreen.module.css";

type LoadingScreenProps = {
  message?: string;
  className?: string;
};

export default function LoadingScreen({
  message = "불러오는 중입니다.",
  className,
}: LoadingScreenProps) {
  const screenClassName = className
    ? `${styles.screen} ${className}`
    : styles.screen;

  return (
    <div className={screenClassName} role="status" aria-live="polite">
      <span className={styles.spinner} aria-hidden="true" />
      <span className={styles.message}>{message}</span>
    </div>
  );
}

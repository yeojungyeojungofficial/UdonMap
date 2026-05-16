import styles from "@/src/components/common/LoadingScreen.module.css";

type LoadingScreenProps = {
  message?: string;
  variant?: "page" | "inline" | "plainInline";
  className?: string;
};

export default function LoadingScreen({
  message = "불러오는 중입니다.",
  variant = "page",
  className,
}: LoadingScreenProps) {
  const screenClassName = [
    styles.screen,
    styles[variant],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={screenClassName} role="status" aria-live="polite">
      <span className={styles.spinner} aria-hidden="true" />
      <span className={styles.message}>{message}</span>
    </div>
  );
}

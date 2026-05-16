import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import styles from "@/src/components/common/AppToast.module.css";

type AppToastTone = "success" | "error" | "info";

type AppToastInput = {
  message: string;
  tone?: AppToastTone;
  durationMs?: number;
};

type AppToastItem = Required<Pick<AppToastInput, "message" | "tone">> & {
  id: string;
};

type AppToastContextValue = (toast: AppToastInput) => void;

const AppToastContext = createContext<AppToastContextValue | null>(null);

export function AppToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<AppToastItem[]>([]);
  const counterRef = useRef(0);
  const timersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismissToast = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((currentToasts) =>
      currentToasts.filter((toast) => toast.id !== id),
    );
  }, []);

  const showToast = useCallback(
    ({ message, tone = "info", durationMs = 2800 }: AppToastInput) => {
      counterRef.current += 1;
      const id = `${Date.now()}-${counterRef.current}`;
      setToasts((currentToasts) => [
        ...currentToasts,
        {
          id,
          message,
          tone,
        },
      ]);

      if (durationMs > 0) {
        const timer = setTimeout(() => dismissToast(id), durationMs);
        timersRef.current.set(id, timer);
      }
    },
    [dismissToast],
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  return (
    <AppToastContext.Provider value={showToast}>
      {children}
      <div className={styles.viewport} aria-label="알림" role="region">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`${styles.toast} ${styles[toast.tone]}`}
            role={toast.tone === "error" ? "alert" : "status"}
          >
            <span className={styles.indicator} aria-hidden="true" />
            <span className={styles.message}>{toast.message}</span>
            <button
              type="button"
              className={styles.closeButton}
              onClick={() => dismissToast(toast.id)}
              aria-label="알림 닫기"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
        ))}
      </div>
    </AppToastContext.Provider>
  );
}

export function useAppToast() {
  const showToast = useContext(AppToastContext);

  if (!showToast) {
    throw new Error("useAppToast must be used within AppToastProvider.");
  }

  return showToast;
}

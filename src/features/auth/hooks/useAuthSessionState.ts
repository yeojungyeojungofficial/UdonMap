import { useEffect, useRef } from "react";
import {
  getCachedAuthSession,
  loadAuthSession,
  subscribeToAuthSession,
} from "@/src/core/authSession";
import { supabase } from "@/src/core/supabase";
import { useAuthStore } from "@/src/store/authStore";

type UseAuthSessionStateOptions = {
  onError?: (message: string) => void;
  onSignOut?: () => void;
};

export function useAuthSessionState({
  onError,
  onSignOut,
}: UseAuthSessionStateOptions = {}) {
  const currentUserId = useAuthStore((state) => state.currentUserId);
  const isAuthReady = useAuthStore((state) => state.isAuthReady);
  const isLoggedIn = useAuthStore((state) => Boolean(state.session));
  const setAuthReady = useAuthStore((state) => state.setAuthReady);
  const setSession = useAuthStore((state) => state.setSession);

  // ref로 콜백을 저장해 effect 재실행 없이 최신 값 참조
  const onErrorRef = useRef(onError);
  const onSignOutRef = useRef(onSignOut);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    onSignOutRef.current = onSignOut;
  }, [onSignOut]);

  useEffect(() => {
    const initialAuthSession = getCachedAuthSession();
    setSession(initialAuthSession ?? null);
    setAuthReady(!supabase || initialAuthSession !== undefined);

    if (!supabase) {
      return;
    }

    let isMounted = true;

    const unsubscribe = subscribeToAuthSession(supabase, (nextSession) => {
      if (isMounted) {
        setSession(nextSession);
        setAuthReady(true);
        if (!nextSession) {
          onSignOutRef.current?.();
        }
      }
    });

    void loadAuthSession(supabase)
      .then((nextSession) => {
        if (!isMounted) return;
        setSession(nextSession);
        if (!nextSession) {
          onSignOutRef.current?.();
        }
      })
      .catch((error) => {
        if (!isMounted) return;
        onErrorRef.current?.(
          error instanceof Error
            ? error.message
            : "로그인 상태 확인 중 알 수 없는 오류가 발생했습니다.",
        );
      })
      .finally(() => {
        if (isMounted) {
          setAuthReady(true);
        }
      });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [setAuthReady, setSession]);

  return {
    currentUserId,
    isAuthReady,
    isLoggedIn,
  };
}

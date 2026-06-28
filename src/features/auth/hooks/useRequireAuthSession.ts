import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuthStore } from "@/src/store/authStore";

export function useRequireAuthSession(redirectPath = "/mypage") {
  const router = useRouter();
  const isAuthReady = useAuthStore((state) => state.isAuthReady);
  const session = useAuthStore((state) => state.session);

  useEffect(() => {
    if (!router.isReady || !isAuthReady || session) {
      return;
    }

    void router.replace(redirectPath);
  }, [isAuthReady, redirectPath, router, session]);

  return {
    isAuthReady,
    session,
    shouldRender: isAuthReady && Boolean(session),
  };
}

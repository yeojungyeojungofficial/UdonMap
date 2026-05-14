import { useSyncExternalStore } from "react";
import { MOBILE_BREAKPOINT } from "@/src/constants/responsive";

function subscribeToResize(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("resize", onStoreChange);

  return () => {
    window.removeEventListener("resize", onStoreChange);
  };
}

function isViewportMobile(breakpoint: number) {
  return typeof window !== "undefined" && window.innerWidth <= breakpoint;
}

export function useIsMobile(breakpoint = MOBILE_BREAKPOINT) {
  return useSyncExternalStore(
    subscribeToResize,
    () => isViewportMobile(breakpoint),
    () => false,
  );
}

import { MOBILE_BREAKPOINT } from "@/src/constants/responsive";
import { useIsMobile } from "@/src/features/responsive/useIsMobile";
import mobStyles from "@/src/components/mypage/MyPage/mob/MyPage.module.css";
import webStyles from "@/src/components/mypage/MyPage/web/MyPage.module.css";

/** 마이페이지·서브 라우트 공통 레이아웃 (뷰포트에 따라 mob / web CSS 모듈 선택) */
export function useMyPageShellStyles() {
  const isMobile = useIsMobile(MOBILE_BREAKPOINT);
  return isMobile ? mobStyles : webStyles;
}

import { MOBILE_BREAKPOINT } from "@/src/constants/responsive";
import { useIsMobile } from "@/src/features/responsive/useIsMobile";
import MobileMyPage from "./mob";
import DesktopMyPage from "./web";

export default function MyPage() {
  const isMobile = useIsMobile(MOBILE_BREAKPOINT);

  if (isMobile) {
    return <MobileMyPage />;
  }

  return <DesktopMyPage />;
}

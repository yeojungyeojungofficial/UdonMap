import { MOBILE_BREAKPOINT } from "@/src/constants/responsive";
import { useIsMobile } from "@/src/features/responsive/useIsMobile";
import MobilePostDetailPage from "./mob";
import DesktopPostDetailPage from "./web";

export default function PostDetailPage() {
  const isMobile = useIsMobile(MOBILE_BREAKPOINT);

  if (isMobile) {
    return <MobilePostDetailPage />;
  }

  return <DesktopPostDetailPage />;
}

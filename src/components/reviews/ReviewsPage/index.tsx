import { MOBILE_BREAKPOINT } from "@/src/constants/responsive";
import { useIsMobile } from "@/src/features/responsive/useIsMobile";
import MobileReviewsPage from "./mob";
import DesktopReviewsPage from "./web";

export default function ReviewsPage() {
  const isMobile = useIsMobile(MOBILE_BREAKPOINT);

  if (isMobile) {
    return <MobileReviewsPage />;
  }

  return <DesktopReviewsPage />;
}

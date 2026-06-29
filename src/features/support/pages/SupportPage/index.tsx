import { MOBILE_BREAKPOINT } from "@/src/constants/responsive";
import { useIsMobile } from "@/src/features/responsive/useIsMobile";
import MobileSupportPage from "./mob";
import DesktopSupportPage from "./web";

export default function SupportPage() {
  const isMobile = useIsMobile(MOBILE_BREAKPOINT);

  if (isMobile) {
    return <MobileSupportPage />;
  }

  return <DesktopSupportPage />;
}

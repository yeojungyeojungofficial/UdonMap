import { MOBILE_BREAKPOINT } from "@/src/constants/responsive";
import { useIsMobile } from "@/src/features/responsive/useIsMobile";
import MobileHomePage from "./mob";
import DesktopHomePage from "./web";

export default function HomePage() {
  const isMobile = useIsMobile(MOBILE_BREAKPOINT);

  if (isMobile) {
    return <MobileHomePage />;
  }

  return <DesktopHomePage />;
}

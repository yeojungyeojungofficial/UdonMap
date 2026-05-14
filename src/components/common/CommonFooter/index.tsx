import { FOOTER_BREAKPOINT } from "@/src/constants/responsive";
import { useIsMobile } from "@/src/features/responsive/useIsMobile";
import MobileFooter from "@/src/components/common/mob/CommonFooter";
import DesktopFooter from "./web";

type CommonFooterProps = {
  className?: string;
};

export default function CommonFooter({ className }: CommonFooterProps) {
  const isMobileFooter = useIsMobile(FOOTER_BREAKPOINT);

  if (isMobileFooter) {
    return <MobileFooter className={className} />;
  }

  return <DesktopFooter className={className} />;
}

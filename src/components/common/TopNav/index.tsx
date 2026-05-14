import { MOBILE_BREAKPOINT } from "@/src/constants/responsive";
import { useIsMobile } from "@/src/features/responsive/useIsMobile";
import MobileTopNav from "@/src/components/common/mob/TopNav";
import DesktopTopNav from "./web";

type TopNavProps = {
  activeMenu: string;
  onSelectMenu?: (menu: string) => void;
  onOpenReport?: () => void;
};

export default function TopNav(props: TopNavProps) {
  const isMobile = useIsMobile(MOBILE_BREAKPOINT);

  if (isMobile) {
    return <MobileTopNav {...props} />;
  }

  return <DesktopTopNav {...props} />;
}

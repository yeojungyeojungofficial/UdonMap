import { MOBILE_BREAKPOINT } from "@/src/constants/responsive";
import { useIsMobile } from "@/src/features/responsive/useIsMobile";
import type { BoardPostSummary, BoardTab } from "@/src/features/reviews/boardPosts";
import MobilePostComposeSheetContent from "./mob";
import DesktopPostComposeSheetContent from "./web";

type PostComposeSheetProps = {
  isOpen: boolean;
  defaultBoard?: BoardTab;
  onClose: () => void;
  onCreated?: (post: BoardPostSummary) => void;
};

export default function PostComposeSheet({
  isOpen,
  defaultBoard,
  onClose,
  onCreated,
}: PostComposeSheetProps) {
  const isMobile = useIsMobile(MOBILE_BREAKPOINT);

  if (!isOpen) {
    return null;
  }

  const ContentComponent = isMobile
    ? MobilePostComposeSheetContent
    : DesktopPostComposeSheetContent;

  return (
    <ContentComponent
      key={defaultBoard ?? "자유게시판"}
      defaultBoard={defaultBoard}
      onClose={onClose}
      onCreated={onCreated}
    />
  );
}

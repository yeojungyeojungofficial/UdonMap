import { MOBILE_BREAKPOINT } from "@/src/constants/responsive";
import { useIsMobile } from "@/src/features/responsive/useIsMobile";
import type {
  BoardPostDetail,
  BoardPostSummary,
  BoardTab,
} from "@/src/features/reviews/boardPosts";
import MobilePostComposeSheetContent from "./mob";
import DesktopPostComposeSheetContent from "./web";

type PostComposeSheetProps = {
  isOpen: boolean;
  defaultBoard?: BoardTab;
  editPost?: BoardPostDetail | null;
  onClose: () => void;
  onCreated?: (post: BoardPostSummary) => void;
  onUpdated?: (post: BoardPostDetail) => void;
};

export default function PostComposeSheet({
  isOpen,
  defaultBoard,
  editPost = null,
  onClose,
  onCreated,
  onUpdated,
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
      key={editPost?.id ?? defaultBoard ?? "자유게시판"}
      defaultBoard={defaultBoard}
      editPost={editPost}
      onClose={onClose}
      onCreated={onCreated}
      onUpdated={onUpdated}
    />
  );
}

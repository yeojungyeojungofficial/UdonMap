import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/src/core/database.types";
import {
  getDefaultDisplayName,
  type UserProfile,
} from "@/src/core/userProfiles";

export function getBoardPostCommentAuthorName(
  profile: UserProfile,
  user: User,
) {
  return (
    profile.display_name?.trim() ||
    getDefaultDisplayName(profile.email) ||
    getDefaultDisplayName(user.email) ||
    "익명 사용자"
  );
}

export async function updateBoardPostCommentAuthorNames(
  supabase: SupabaseClient<Database>,
  user: User,
  profile: UserProfile,
) {
  const authorName = getBoardPostCommentAuthorName(profile, user);
  const { error } = await supabase
    .from("board_post_comments")
    .update({ author_name: authorName })
    .eq("user_id", user.id)
    .neq("author_name", authorName);

  if (error) {
    throw new Error(
      `Supabase board_post_comments 작성자명 동기화 실패: ${error.message}`,
    );
  }
}

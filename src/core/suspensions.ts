import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/src/core/database.types";

export type ActiveSuspension =
  Database["public"]["Functions"]["get_user_active_suspension"]["Returns"][number];

export async function getUserActiveSuspension(
  supabase: SupabaseClient<Database>,
  userId: string,
) {
  const { data, error } = await supabase
    .rpc("get_user_active_suspension", {
      p_user_id: userId,
    })
    .maybeSingle();

  if (error) {
    throw new Error(`Supabase user_suspensions 조회 실패: ${error.message}`);
  }

  return data as ActiveSuspension | null;
}

export function getSuspensionBlockedMessage(
  suspension: ActiveSuspension,
  blockedAction: string,
) {
  if (suspension.duration === "permanent" || !suspension.ends_at) {
    return `영구 정지된 계정입니다. ${blockedAction}`;
  }

  return `${new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(new Date(suspension.ends_at))}까지 정지된 계정입니다. ${blockedAction}`;
}

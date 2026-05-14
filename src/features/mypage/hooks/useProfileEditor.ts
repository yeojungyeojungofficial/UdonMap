import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import type { Session } from "@supabase/supabase-js";
import {
  clearCachedCurrentUserProfile,
  fetchCurrentUserProfile,
  getCachedCurrentUserProfile,
  saveCurrentUserProfile,
  setCachedCurrentUserProfile,
} from "@/src/core/api/mypage/profileApi";
import {
  MAX_DISPLAY_NAME_LENGTH,
  type UserProfile,
} from "@/src/shared/lib/userProfiles";

export function useProfileEditor(
  session: Session | null,
  initialSession: Session | null | undefined,
) {
  const initialProfile = initialSession
    ? getCachedCurrentUserProfile(initialSession.user.id)
    : null;
  const [profile, setProfile] = useState<UserProfile | null>(initialProfile);
  const [displayName, setDisplayName] = useState(
    initialProfile?.display_name ?? "",
  );
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");

  const resetProfileState = useCallback(() => {
    setProfile(null);
    setDisplayName("");
    clearCachedCurrentUserProfile();
    setProfileMessage("");
    setProfileError("");
    setIsProfileLoading(false);
    setIsProfileSaving(false);
  }, []);

  const clearProfileFeedback = useCallback(() => {
    setProfileMessage("");
    setProfileError("");
  }, []);

  const handleDisplayNameChange = useCallback((value: string) => {
    setDisplayName(value);
    setProfileMessage("");
    setProfileError("");
  }, []);

  useEffect(() => {
    if (!session) {
      return;
    }

    let isMounted = true;
    const activeSession = session;
    const cachedProfile = getCachedCurrentUserProfile(activeSession.user.id);

    if (cachedProfile) {
      return;
    }

    async function loadProfile() {
      setIsProfileLoading(true);
      setProfileMessage("");
      setProfileError("");

      try {
        const nextProfile = await fetchCurrentUserProfile(activeSession);
        if (!isMounted) return;
        setCachedCurrentUserProfile(nextProfile);
        setProfile(nextProfile);
        setDisplayName(nextProfile.display_name ?? "");
      } catch (error) {
        if (!isMounted) return;
        setProfileError(
          error instanceof Error
            ? error.message
            : "프로필 조회 중 알 수 없는 오류가 발생했습니다.",
        );
      } finally {
        if (isMounted) {
          setIsProfileLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, [session]);

  const currentDisplayName = profile?.display_name ?? "";
  const canSaveProfile = useMemo(
    () =>
      Boolean(session) &&
      !isProfileLoading &&
      !isProfileSaving &&
      displayName.trim() !== currentDisplayName &&
      displayName.trim().length <= MAX_DISPLAY_NAME_LENGTH,
    [
      currentDisplayName,
      displayName,
      isProfileLoading,
      isProfileSaving,
      session,
    ],
  );

  const handleProfileSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!session || !canSaveProfile) {
        return;
      }

      setIsProfileSaving(true);
      setProfileMessage("");
      setProfileError("");

      try {
        const nextProfile = await saveCurrentUserProfile(session, displayName);
        setCachedCurrentUserProfile(nextProfile);
        setProfile(nextProfile);
        setDisplayName(nextProfile.display_name ?? "");
        setProfileMessage("프로필을 저장했습니다.");
      } catch (error) {
        setProfileError(
          error instanceof Error
            ? error.message
            : "프로필 저장 중 알 수 없는 오류가 발생했습니다.",
        );
      } finally {
        setIsProfileSaving(false);
      }
    },
    [canSaveProfile, displayName, session],
  );

  return {
    canSaveProfile,
    clearProfileFeedback,
    displayName,
    handleDisplayNameChange,
    handleProfileSubmit,
    isProfileLoading,
    isProfileSaving,
    profile,
    profileError,
    profileMessage,
    resetProfileState,
  };
}

import { useAuthSessionState } from "@/src/features/auth/hooks/useAuthSessionState";

export default function AuthSessionBootstrap() {
  useAuthSessionState();

  return null;
}

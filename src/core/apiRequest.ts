import type { NextApiRequest } from "next";

export function getBearerToken(req: NextApiRequest) {
  const authorization = req.headers.authorization;
  const header = Array.isArray(authorization)
    ? authorization[0]
    : authorization;

  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  const token = header.slice("Bearer ".length).trim();

  if (!token || token === "undefined" || token === "null") {
    return null;
  }

  return token;
}

export function getAuthUserErrorMessage(error?: { message?: string } | null) {
  const message = error?.message?.trim();

  if (!message) {
    return "로그인 사용자를 확인할 수 없습니다.";
  }

  if (
    message === "Auth session missing!" ||
    message.toLowerCase().includes("session")
  ) {
    return "로그인 세션이 만료되었습니다. 다시 로그인해주세요.";
  }

  return `Supabase 사용자 확인 실패: ${message}`;
}

export function getQueryValue(req: NextApiRequest, key: string) {
  const value = req.query[key];
  return Array.isArray(value) ? value[0] : value;
}

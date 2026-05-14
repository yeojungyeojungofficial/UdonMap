const INVALID_AUTH_CODE_MESSAGE = "잘못된 인증번호입니다";
const AUTH_ERROR_QUERY_KEYS = [
  "error",
  "error_code",
  "error_description",
] as const;

function getAuthErrorParam(key: (typeof AUTH_ERROR_QUERY_KEYS)[number]) {
  if (typeof window === "undefined") {
    return null;
  }

  const searchParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));

  return searchParams.get(key) ?? hashParams.get(key);
}

export function getAuthRedirectErrorMessage() {
  const error = getAuthErrorParam("error");
  const errorCode = getAuthErrorParam("error_code");
  const errorDescription = getAuthErrorParam("error_description");
  const authErrorText = `${error ?? ""} ${errorCode ?? ""} ${
    errorDescription ?? ""
  }`.toLowerCase();

  if (!authErrorText.trim()) {
    return "";
  }

  if (
    authErrorText.includes("otp") ||
    authErrorText.includes("expired") ||
    authErrorText.includes("invalid") ||
    authErrorText.includes("token")
  ) {
    return INVALID_AUTH_CODE_MESSAGE;
  }

  return errorDescription || "인증 처리 중 오류가 발생했습니다.";
}

export function clearAuthErrorFromUrl() {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);
  let hasAuthError = false;

  AUTH_ERROR_QUERY_KEYS.forEach((key) => {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      hasAuthError = true;
    }
  });

  const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
  AUTH_ERROR_QUERY_KEYS.forEach((key) => {
    if (hashParams.has(key)) {
      hashParams.delete(key);
      hasAuthError = true;
    }
  });

  if (!hasAuthError) {
    return;
  }

  const nextHash = hashParams.toString();
  url.hash = nextHash ? `#${nextHash}` : "";
  window.history.replaceState(null, "", url.toString());
}

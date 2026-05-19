import { NextResponse, type NextRequest } from "next/server";

const BLOCKED_API_USER_AGENT_PATTERN =
  /\b(curl|wget|python-requests|aiohttp|httpx|scrapy|go-http-client|java|okhttp|libwww-perl|httpclient|crawler|spider|bot)\b/i;

function isAllowedSearchBot(userAgent: string) {
  return /\b(Googlebot|Googlebot-Image|Google-InspectionTool)\b/i.test(
    userAgent,
  );
}

export function middleware(request: NextRequest) {
  const userAgent = request.headers.get("user-agent") ?? "";

  if (
    !isAllowedSearchBot(userAgent) &&
    (!userAgent || BLOCKED_API_USER_AGENT_PATTERN.test(userAgent))
  ) {
    return NextResponse.json(
      { error: "허용되지 않은 요청입니다." },
      { status: 403 },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/hospitals/:path*"],
};

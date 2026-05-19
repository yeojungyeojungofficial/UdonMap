import type { NextApiRequest } from "next";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  keyPrefix: string;
  limit: number;
  windowMs: number;
};

type RateLimitResult =
  | {
      ok: true;
      remaining: number;
      resetAt: number;
    }
  | {
      ok: false;
      retryAfterSeconds: number;
      resetAt: number;
    };

declare global {
  var animalMapRateLimitBuckets: Map<string, RateLimitBucket> | undefined;
}

const buckets =
  globalThis.animalMapRateLimitBuckets ??
  new Map<string, RateLimitBucket>();

globalThis.animalMapRateLimitBuckets = buckets;

function getHeaderValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function getClientIp(req: NextApiRequest) {
  const forwardedFor = getHeaderValue(req.headers["x-forwarded-for"]);
  const realIp = getHeaderValue(req.headers["x-real-ip"]);

  return (
    forwardedFor?.split(",")[0]?.trim() ||
    realIp?.trim() ||
    req.socket.remoteAddress ||
    "unknown"
  );
}

export function checkRateLimit(
  req: NextApiRequest,
  { keyPrefix, limit, windowMs }: RateLimitOptions,
): RateLimitResult {
  const now = Date.now();
  const key = `${keyPrefix}:${getClientIp(req)}`;
  const currentBucket = buckets.get(key);

  if (!currentBucket || currentBucket.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return {
      ok: true,
      remaining: Math.max(limit - 1, 0),
      resetAt,
    };
  }

  if (currentBucket.count >= limit) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(
        Math.ceil((currentBucket.resetAt - now) / 1000),
        1,
      ),
      resetAt: currentBucket.resetAt,
    };
  }

  currentBucket.count += 1;
  return {
    ok: true,
    remaining: Math.max(limit - currentBucket.count, 0),
    resetAt: currentBucket.resetAt,
  };
}

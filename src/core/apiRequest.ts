import type { NextApiRequest } from "next";

export function getBearerToken(req: NextApiRequest) {
  const authorization = req.headers.authorization;
  const header = Array.isArray(authorization)
    ? authorization[0]
    : authorization;

  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length).trim() || null;
}

export function getQueryValue(req: NextApiRequest, key: string) {
  const value = req.query[key];
  return Array.isArray(value) ? value[0] : value;
}

import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

function secret() {
  return (
    process.env.SESSION_SECRET ||
    process.env.AGENT_ROUTER_SYSTEM_ACCESS_TOKEN ||
    "unix-local-presence-secret-change-in-production"
  );
}
export function createPresenceToken(payload: {
  userId: string;
  workspaceId: string;
  name: string;
}) {
  const body = Buffer.from(
    JSON.stringify({ ...payload, expires: Date.now() + 60 * 60 * 1000 }),
  ).toString("base64url");
  return `${body}.${createHmac("sha256", secret()).update(body).digest("base64url")}`;
}
export function verifyPresenceToken(token: string) {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = createHmac("sha256", secret()).update(body).digest();
  const actual = Buffer.from(signature, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
    return null;
  const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as {
    userId: string;
    workspaceId: string;
    name: string;
    expires: number;
  };
  return payload.expires > Date.now() ? payload : null;
}

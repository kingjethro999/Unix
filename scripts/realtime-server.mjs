import { createHmac, timingSafeEqual } from "node:crypto";
import { WebSocketServer } from "ws";

const port = Number(process.env.REALTIME_PORT || 3001);
const secret =
  process.env.SESSION_SECRET ||
  process.env.AGENT_ROUTER_SYSTEM_ACCESS_TOKEN ||
  "unix-local-presence-secret-change-in-production";
const server = new WebSocketServer({
  port,
  host: process.env.REALTIME_HOST || "127.0.0.1",
});
const clients = new Map();
function verify(token) {
  try {
    const [body, signature] = token.split(".");
    const expected = createHmac("sha256", secret).update(body).digest();
    const actual = Buffer.from(signature, "base64url");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
      return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    return payload.expires > Date.now() ? payload : null;
  } catch {
    return null;
  }
}
function broadcast(workspaceId) {
  const people = [...clients.entries()]
    .filter(([, value]) => value.workspaceId === workspaceId)
    .map(([, value]) => value);
  const message = JSON.stringify({ type: "presence", people });
  for (const [socket, value] of clients)
    if (value.workspaceId === workspaceId && socket.readyState === 1)
      socket.send(message);
}
server.on("connection", (socket, request) => {
  const url = new URL(request.url || "/", `http://${request.headers.host}`);
  const identity = verify(url.searchParams.get("token") || "");
  if (!identity) return socket.close(1008, "Invalid presence token");
  clients.set(socket, {
    ...identity,
    documentId: null,
    from: null,
    to: null,
    color: "#22d3ee",
  });
  broadcast(identity.workspaceId);
  socket.on("message", (raw) => {
    try {
      const next = JSON.parse(raw.toString());
      const current = clients.get(socket);
      if (!current || next.type !== "cursor") return;
      clients.set(socket, {
        ...current,
        documentId: next.documentId || null,
        from: Number.isInteger(next.from) ? next.from : null,
        to: Number.isInteger(next.to) ? next.to : null,
        color:
          typeof next.color === "string"
            ? next.color.slice(0, 20)
            : current.color,
      });
      broadcast(current.workspaceId);
    } catch {}
  });
  socket.on("close", () => {
    clients.delete(socket);
    broadcast(identity.workspaceId);
  });
});
console.log(`Unix live collaboration listening on 127.0.0.1:${port}`);

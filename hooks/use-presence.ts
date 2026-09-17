"use client";

import { useEffect, useRef, useState } from "react";

export type Collaborator = {
  userId: string;
  name: string;
  documentId: string | null;
  from: number | null;
  to: number | null;
  color: string;
};
export function usePresence(
  workspaceId: string | null,
  documentId: string | undefined,
  selection?: { from: number; to: number },
) {
  const [people, setPeople] = useState<Collaborator[]>([]);
  const socket = useRef<WebSocket | null>(null);
  const latest = useRef({
    documentId,
    from: selection?.from ?? null,
    to: selection?.to ?? null,
  });
  latest.current = {
    documentId,
    from: selection?.from ?? null,
    to: selection?.to ?? null,
  };
  const sendCursor = (ws: WebSocket) => {
    if (ws.readyState === WebSocket.OPEN)
      ws.send(JSON.stringify({ type: "cursor", ...latest.current }));
  };
  useEffect(() => {
    if (!workspaceId) return;
    let stopped = false;
    let retry: number | undefined;
    const connect = async () => {
      try {
        const response = await fetch("/api/presence/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspaceId }),
        });
        if (!response.ok || stopped) return;
        const data = await response.json();
        const ws = new WebSocket(
          `${data.url}?token=${encodeURIComponent(data.token)}`,
        );
        socket.current = ws;
        ws.onopen = () => sendCursor(ws);
        ws.onmessage = (event) => {
          const message = JSON.parse(event.data);
          if (message.type === "presence") setPeople(message.people);
        };
        ws.onclose = () => {
          if (!stopped) retry = window.setTimeout(connect, 1500);
        };
      } catch {
        if (!stopped) retry = window.setTimeout(connect, 2000);
      }
    };
    void connect();
    return () => {
      stopped = true;
      if (retry) clearTimeout(retry);
      socket.current?.close();
    };
  }, [workspaceId]);
  useEffect(() => {
    if (socket.current) sendCursor(socket.current);
  }, [documentId, selection?.from, selection?.to]);
  return people;
}

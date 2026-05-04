/* EKLENDİ */
import { useEffect, useRef, type MutableRefObject } from "react";
import { io, type Socket } from "socket.io-client";
import { getSocketOrigin } from "@/services/chatApi.ts";

/* EKLENDİ */
type ChatSocketHandlers = {
  onMessageNew?: (payload: unknown) => void;
  onConversationUpdate?: (payload: unknown) => void;
  onMessageRead?: (payload: unknown) => void;
};

/* EKLENDİ */
export function useAdminChatSocket(
  token: string | null,
  enabled: boolean,
  handlersRef: MutableRefObject<ChatSocketHandlers>
): void {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!enabled || !token) return;
    const origin = getSocketOrigin();
    if (!origin) return;

    const socket = io(origin, {
      auth: { token },
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    const h = () => handlersRef.current;

    socket.on("message:new", (p) => h().onMessageNew?.(p));
    socket.on("conversation:update", (p) => h().onConversationUpdate?.(p));
    socket.on("message:read", (p) => h().onMessageRead?.(p));

    return () => {
      socket.off("message:new");
      socket.off("conversation:update");
      socket.off("message:read");
      socket.disconnect();
      socketRef.current = null;
    };
    /* EKLENDİ — handlersRef güncellenir; yeniden bağlanma yok */
  }, [enabled, token]);
}

/* EKLENDİ */
import { getApiBaseUrl } from "@/services/api.ts";

/* EKLENDİ */
export type ApiUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

/* EKLENDİ */
export type ConversationRow = {
  id: string;
  type: string;
  driver_id: string | null;
  rider_id: string | null;
  admin_id: string;
  peer_name: string;
  peer_email: string;
  unread_for_admin: number;
  last_message: {
    id: string;
    text: string;
    sender_type: string;
    created_at: string;
  } | null;
};

/* EKLENDİ */
export type ChatMessageRow = {
  id: string;
  conversation_id: string;
  sender_type: string;
  sender_id: string;
  sender_name: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

/* EKLENDİ */
function authHeaders(token: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

/* EKLENDİ */
export async function fetchConversations(token: string): Promise<{
  conversations: ConversationRow[];
  unreadTotal: number;
}> {
  const base = getApiBaseUrl().replace(/\/$/, "");
  const r = await fetch(`${base}/conversations`, {
    headers: authHeaders(token),
  });
  if (!r.ok) throw new Error("Konuşmalar yüklenemedi");
  return r.json();
}

/* EKLENDİ */
export async function fetchChatMessages(
  token: string,
  conversationId: string
): Promise<{ messages: ChatMessageRow[] }> {
  const base = getApiBaseUrl().replace(/\/$/, "");
  const r = await fetch(`${base}/messages/${conversationId}`, {
    headers: authHeaders(token),
  });
  if (!r.ok) throw new Error("Mesajlar yüklenemedi");
  return r.json();
}

/* EKLENDİ */
export async function sendChatMessage(
  token: string,
  body: {
    conversation_id?: string;
    message: string;
    driver_id?: string;
    rider_user_id?: string;
  }
): Promise<unknown> {
  const base = getApiBaseUrl().replace(/\/$/, "");
  const r = await fetch(`${base}/messages/send`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({
      conversation_id: body.conversation_id,
      message: body.message,
      driver_id: body.driver_id,
      rider_user_id: body.rider_user_id,
    }),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || "Gönderilemedi");
  }
  return r.json();
}

/* EKLENDİ */
export async function markChatRead(
  token: string,
  conversationId: string
): Promise<void> {
  const base = getApiBaseUrl().replace(/\/$/, "");
  const r = await fetch(`${base}/messages/mark-read`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ conversation_id: conversationId }),
  });
  if (!r.ok) throw new Error("Okundu işaretlenemedi");
}

/* EKLENDİ */
export async function fetchUnreadSummary(token: string): Promise<{
  chatUnread: number;
  notifUnread: number;
}> {
  const base = getApiBaseUrl().replace(/\/$/, "");
  const r = await fetch(`${base}/chat/unread-summary`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) return { chatUnread: 0, notifUnread: 0 };
  return r.json();
}

/* EKLENDİ */
export function getSocketOrigin(): string {
  const base = getApiBaseUrl().replace(/\/$/, "");
  if (!base) return "";
  try {
    return new URL(base).origin;
  } catch {
    return "";
  }
}

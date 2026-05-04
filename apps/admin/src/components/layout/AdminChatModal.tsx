/* EKLENDİ */
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { MessageCircle, X } from "lucide-react";
import {
  fetchChatMessages,
  fetchConversations,
  markChatRead,
  sendChatMessage,
  type ChatMessageRow,
  type ConversationRow,
} from "@/services/chatApi.ts";
import { useAdminChatSocket } from "@/hooks/useAdminChatSocket.ts";

/* EKLENDİ */
type Props = {
  open: boolean;
  onClose: () => void;
  token: string;
  onUnreadChange?: (n: number) => void;
};

/* EKLENDİ */
export default function AdminChatModal({
  open,
  onClose,
  token,
  onUnreadChange,
}: Props) {
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageRow[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(false);
  const [sendError, setSendError] = useState("");
  const [draft, setDraft] = useState("");
  const [newDriverId, setNewDriverId] = useState("");
  const listEndRef = useRef<HTMLDivElement | null>(null);

  const loadList = useCallback(async () => {
    if (!token) return;
    setLoadingList(true);
    try {
      const data = await fetchConversations(token);
      setConversations(data.conversations);
      setUnreadTotal(data.unreadTotal);
      onUnreadChange?.(data.unreadTotal);
    } catch {
      /* ignore */
    } finally {
      setLoadingList(false);
    }
  }, [token, onUnreadChange]);

  const loadMessages = useCallback(
    async (cid: string) => {
      if (!token) return;
      setLoadingMsg(true);
      setSendError("");
      try {
        const data = await fetchChatMessages(token, cid);
        setMessages(data.messages);
        await markChatRead(token, cid);
        await loadList();
      } catch {
        setMessages([]);
      } finally {
        setLoadingMsg(false);
      }
    },
    [token, loadList]
  );

  const handlersRef = useRef({
    onMessageNew: (_p: unknown) => {},
    onConversationUpdate: (_p: unknown) => {},
    onMessageRead: (_p: unknown) => {},
  });

  handlersRef.current = {
    onMessageNew: (p: unknown) => {
      const payload = p as {
        message?: { conversation_id?: string };
        conversation?: { id?: string };
      };
      const cid =
        payload?.message?.conversation_id ?? payload?.conversation?.id;
      void loadList();
      if (cid && cid === selectedId) {
        void loadMessages(cid);
      }
    },
    onConversationUpdate: () => {
      void loadList();
    },
    onMessageRead: () => {
      void loadList();
    },
  };

  useAdminChatSocket(token, open, handlersRef);

  useEffect(() => {
    if (!open) return;
    void loadList();
  }, [open, loadList]);

  useEffect(() => {
    if (!open || !selectedId) return;
    void loadMessages(selectedId);
  }, [open, selectedId, loadMessages]);

  useEffect(() => {
    if (!open) return;
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  /* EKLENDİ */
  const bodyOverflowPrev = useRef("");
  useEffect(() => {
    if (!open) return;
    bodyOverflowPrev.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = bodyOverflowPrev.current;
    };
  }, [open]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !token) return;
    setSendError("");
    try {
      /* EKLENDİ — yeni konuşmada state gecikmesi olmaması için */
      let reloadConvId: string | null = selectedId;
      if (selectedId) {
        await sendChatMessage(token, {
          conversation_id: selectedId,
          message: text,
        });
      } else if (newDriverId.trim()) {
        const res = (await sendChatMessage(token, {
          driver_id: newDriverId.trim(),
          message: text,
        })) as { conversation?: { id: string } };
        setNewDriverId("");
        if (res.conversation?.id) {
          reloadConvId = res.conversation.id;
          setSelectedId(res.conversation.id);
        }
      } else {
        setSendError("Önce bir konuşma seçin veya sürücü UUID girin.");
        return;
      }
      setDraft("");
      await loadList();
      if (reloadConvId) await loadMessages(reloadConvId);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Gönderilemedi");
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Sohbet"
    >
      <div
        className="absolute inset-0 bg-black/60"
        aria-hidden
        onClick={onClose}
      />
      <div
        className="relative flex w-full max-w-4xl max-h-[90vh] flex-col overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#0a0a0a] shadow-[0_0_40px_rgba(245,183,0,0.12)] sm:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex max-h-[40vh] w-full flex-col border-b border-[#2a2a2a] sm:max-h-none sm:w-[min(100%,280px)] sm:border-b-0 sm:border-r">
          <div className="flex items-center justify-between border-b border-[#2a2a2a] px-3 py-2">
            <div className="flex items-center gap-2 text-[#f5b700]">
              <MessageCircle size={18} />
              <span className="font-bold text-sm">Sohbetler</span>
              {unreadTotal > 0 ? (
                <span className="rounded-full bg-[#f5b700] px-2 py-0.5 text-[11px] font-bold text-black">
                  {unreadTotal}
                </span>
              ) : null}
            </div>
            <button
              type="button"
              aria-label="Kapat"
              className="rounded-lg p-1.5 text-gray-400 hover:bg-white/5 hover:text-white"
              onClick={onClose}
            >
              <X size={18} />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {loadingList ? (
              <p className="p-2 text-xs text-gray-500">Yükleniyor…</p>
            ) : conversations.length === 0 ? (
              <p className="p-2 text-xs text-gray-500">
                Henüz konuşma yok. Sürücü mesaj attığında burada görünür.
              </p>
            ) : (
              <ul className="space-y-1">
                {conversations.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(c.id)}
                      className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                        selectedId === c.id
                          ? "bg-[#f5b700]/20 text-white ring-1 ring-[#f5b700]/40"
                          : "text-gray-300 hover:bg-white/5"
                      }`}
                    >
                      <div className="font-semibold truncate">
                        {c.peer_name || "İsimsiz"}
                      </div>
                      <div className="text-[10px] uppercase text-gray-500">
                        {c.type === "driver_admin" ? "Sürücü" : "Yolcu"}
                      </div>
                      {c.unread_for_admin > 0 ? (
                        <span className="mt-1 inline-block rounded bg-[#f5b700] px-1.5 text-[10px] font-bold text-black">
                          {c.unread_for_admin} yeni
                        </span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="border-t border-[#2a2a2a] p-2">
            <p className="mb-1 text-[10px] uppercase text-gray-500">
              Yeni (sürücü UUID)
            </p>
            <input
              value={newDriverId}
              onChange={(e) => setNewDriverId(e.target.value)}
              placeholder="drivers.id"
              className="mb-2 w-full rounded-lg border border-[#2a2a2a] bg-black px-2 py-1.5 text-xs text-white outline-none focus:border-[#f5b700]/50"
            />
          </div>
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="border-b border-[#2a2a2a] px-3 py-2">
            <h3 className="text-sm font-semibold text-white">
              {selectedId
                ? conversations.find((x) => x.id === selectedId)?.peer_name ||
                  "Mesajlar"
                : "Mesaj seçin veya yeni başlatın"}
            </h3>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {loadingMsg ? (
              <p className="text-xs text-gray-500">Mesajlar yükleniyor…</p>
            ) : (
              <div className="flex flex-col gap-2">
                {messages.map((m) => {
                  const mine = m.sender_type === "admin";
                  return (
                    <div
                      key={m.id}
                      className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                        mine
                          ? "self-end bg-[#f5b700]/20 text-white border border-[#f5b700]/30"
                          : "self-start bg-[#161616] text-gray-200 border border-[#2a2a2a]"
                      }`}
                    >
                      <div className="text-[10px] text-gray-500 mb-0.5">
                        {m.sender_name} ·{" "}
                        {new Date(m.created_at).toLocaleString("tr-TR")}
                      </div>
                      <div className="whitespace-pre-wrap break-words">
                        {m.message}
                      </div>
                    </div>
                  );
                })}
                <div ref={listEndRef} />
              </div>
            )}
          </div>
          <form
            onSubmit={handleSend}
            className="border-t border-[#2a2a2a] p-3 flex flex-col gap-2"
          >
            {sendError ? (
              <p className="text-xs text-red-400">{sendError}</p>
            ) : null}
            <div className="flex gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Mesaj yazın…"
                className="min-w-0 flex-1 rounded-xl border border-[#2a2a2a] bg-black px-3 py-2 text-sm text-white outline-none focus:border-[#f5b700]/50"
              />
              <button
                type="submit"
                className="shrink-0 rounded-xl bg-[#f5b700] px-4 py-2 text-sm font-bold text-black hover:bg-[#ffd034]"
              >
                Gönder
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* EKLENDİ - 2026-04-04 — üst şerit AdminLayout’tan ayrıldı; sınıflar birebir */
import { Bell, Car, User, Menu, MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
/* EKLENDİ */
import { useAuth } from "@/store/AuthContext.tsx";
import { fetchUnreadSummary } from "@/services/chatApi.ts";
import AdminChatModal from "@/components/layout/AdminChatModal.tsx";

/* EKLENDİ */
export default function Topbar({
  onMenuClick,
}: {
  onMenuClick?: () => void;
}) {
  const { t } = useTranslation();
  /* EKLENDİ */
  const { token, isSuperAdmin, user } = useAuth();
  /* EKLENDİ */
  const [open, setOpen] = useState(false);
  /* EKLENDİ */
  const [chatOpen, setChatOpen] = useState(false);
  /* EKLENDİ */
  const [chatUnread, setChatUnread] = useState(0);
  const displayName = user?.role === "super_admin" ? "Super Admin" : (user?.name || "Admin");
  const displayEmail = (user?.email || "admin@vipstar.com").toLowerCase();

  /* EKLENDİ */
  useEffect(() => {
    if (!token) {
      setChatUnread(0);
      return;
    }
    let cancelled = false;
    const tick = async () => {
      try {
        const s = await fetchUnreadSummary(token);
        if (!cancelled) setChatUnread(s.chatUnread);
      } catch {
        /* ignore */
      }
    };
    void tick();
    const id = window.setInterval(tick, 45000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [token]);

  /* EKLENDİ */
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  /* EKLENDİ */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    /* EKLENDİ */
    <div className="h-18 px-3 lg:px-6 border-b border-[#2a2a2a] flex items-center justify-between gap-3 relative z-50 shrink-0 bg-black w-full max-w-full">
      {/* EKLENDİ */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          aria-label={t("sidebar.openMenu")}
          className="lg:hidden shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-[#161616] border border-[#262626] text-white"
          onClick={() => onMenuClick?.()}
        >
          <Menu size={20} />
        </button>
        <p className="t-value text-gray-300 truncate">{t("topbar.controlCenter")}</p>
      </div>
      {/* EKLENDİ */}

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* EKLENDİ */}
        <div className="relative">
          <button
            type="button"
            aria-label={t("topbar.chat")}
            title={
              !isSuperAdmin
                ? t("topbar.chatReadonlyHint")
                : token
                  ? t("topbar.liveChat")
                  : t("topbar.chatLoginHint")
            }
            disabled={!token || !isSuperAdmin}
            onClick={() => token && isSuperAdmin && setChatOpen(true)}
            className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-[#161616] border border-[#262626] text-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <MessageCircle size={18} />
            {token && chatUnread > 0 ? (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] rounded-full bg-[#f5b700] px-1 text-center text-[10px] font-bold leading-[18px] text-black">
                {chatUnread > 99 ? "99+" : chatUnread}
              </span>
            ) : null}
          </button>
        </div>

        <div className="relative">
          <button
            type="button"
            aria-label={t("topbar.notifications")}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#161616] border border-[#262626]"
          >
            <Bell size={18} />
          </button>

          {/* EKLENDİ — bildirimler ortalanmış modal */}
          {open && (
            <div
              className="fixed inset-0 flex items-center justify-center z-[100] p-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="topbar-notifications-title"
            >
              <div
                className="absolute inset-0 bg-black/50"
                aria-hidden
                onClick={() => setOpen(false)}
              />

              <div
                className="relative bg-black rounded-xl w-[90%] max-w-md max-h-[85vh] overflow-y-auto p-4 border border-[#262626] shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  id="topbar-notifications-title"
                  className="pb-3 mb-3 border-b border-[#262626] t-value font-semibold text-white"
                >
                  {t("topbar.notifications")}
                </div>

                <div>
                  <div className="p-3 -mx-1 rounded-xl border-b border-[#1f1f1f] hover:bg-[#1c1c1c] cursor-pointer flex items-center gap-2 t-value">
                    <Car size={16} />
                    {t("topbar.driverSupportRequest")}
                  </div>

                  <div className="p-3 -mx-1 rounded-xl hover:bg-[#1c1c1c] cursor-pointer flex items-center gap-2 t-value">
                    <User size={16} />
                    {t("topbar.passengerSupportRequest")}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 bg-[#161616] border border-[#262626] px-4 py-2 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-[#f5b700] flex items-center justify-center text-black font-bold">
            {displayName.slice(0, 1).toUpperCase()}
          </div>

          <div className="flex flex-col">
            <span className="t-value font-semibold">{displayName}</span>
            <span className="text-[11px] text-gray-400 leading-tight">{displayEmail}</span>
          </div>
        </div>
      </div>

      {/* EKLENDİ */}
      {token ? (
        <AdminChatModal
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          token={token}
          onUnreadChange={setChatUnread}
        />
      ) : null}
    </div>
  );
}

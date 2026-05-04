import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { Outlet } from "react-router-dom"; /* EKLENDİ */
import { useState } from "react"; /* EKLENDİ */
import { useAuth } from "@/store/AuthContext.tsx";
import { useTranslation } from "react-i18next";

/* KAPATILDI - 2026-04-04 — üst şerit (Bell, bildirimler, Admin rozeti) Topbar.tsx içine taşındı; aynı Tailwind sınıfları korunur */
/*
import { Bell, Car, User } from "lucide-react";
import { useState } from "react";
...
        <div className="h-18 px-6 border-b border-[#2a2a2a] flex items-center justify-between">
          ...
        </div>
*/

export default function AdminLayout({ children }: any) {
  /* EKLENDİ */
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { isSuperAdmin } = useAuth();
  const { i18n } = useTranslation();
  const isEn = i18n.language.startsWith("en");
  /* EKLENDİ */

  return (
    /* EKLENDİ */
    <div className="min-h-screen bg-black text-white flex w-full h-screen overflow-hidden overflow-x-hidden">
      {/* EKLENDİ */}
      {mobileNavOpen ? (
        <button
          type="button"
          aria-label="Menüyü kapat"
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}
      {/* EKLENDİ */}

      <Sidebar
        mobileOpen={mobileNavOpen}
        onNavigate={() => setMobileNavOpen(false)}
      />

      {/* EKLENDİ */}
      <div className="ml-0 lg:ml-55 flex min-h-screen flex-col min-w-0 w-full max-w-full h-screen overflow-hidden relative z-0">
        <Topbar onMenuClick={() => setMobileNavOpen(true)} />

        {/* CONTENT */}
        {/* EKLENDİ */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 lg:p-6 min-h-0 w-full max-w-full relative z-0 flex flex-col">
          {/* EKLENDİ */}
          {!isSuperAdmin ? (
            <div className="mb-3 shrink-0 rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              {isEn ? (
                <>
                  <strong className="text-amber-300">Demo / Manager mode:</strong> You can browse the panel;
                  save, delete, and configuration actions are restricted to the super admin.
                  You can only change your own password from the{" "}
                  <span className="font-semibold text-white">Sub-administrators</span> page.
                </>
              ) : (
                <>
                  <strong className="text-amber-300">Demo / Yönetici modu:</strong> Paneli gezebilirsiniz;
                  kaydetme, silme ve yapılandırma yalnızca süper admin içindir.
                  Kendi şifrenizi yalnızca{" "}
                  <span className="font-semibold text-white">Alt Yöneticiler</span> sayfasından
                  değiştirebilirsiniz.
                </>
              )}
            </div>
          ) : null}
          <div className="w-full max-w-full min-w-0 min-h-0 flex-1 flex flex-col overflow-x-hidden">
            <Outlet />
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

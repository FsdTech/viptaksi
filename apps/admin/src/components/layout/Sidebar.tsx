import { NavLink, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState } from "react"; /* EKLENDİ */
/* ADDED */
import { useEffect } from "react";
/* EKLENDİ */
import { useAuth } from "@/store/AuthContext.tsx";
import { useAdminSettings } from "@/hooks/useAdminSettings.ts";
import {
  LayoutDashboard,
  Map,
  Car,
  Users,
  User,
  CreditCard,
  Settings,
  Wallet,
  ChevronDown, /* EKLENDİ */
  UserCheck, /* EKLENDİ */
  /* EKLENDİ - 2026-04-04 */
  Tags,
} from "lucide-react";

/* EKLENDİ */
export type SidebarProps = {
  mobileOpen?: boolean;
  onNavigate?: () => void;
};
/* EKLENDİ */
const ACTIVE_ADMINS_STORAGE_KEY = "activeAdmins";
const ACTIVE_ADMINS_TTL_MS = 5000;
type ActiveAdmin = { id: number; name: string; email: string; lastSeen: number };

function toUserId(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : -1;
}

function readActiveAdminsFromStorage(): ActiveAdmin[] {
  try {
    const stored = window.localStorage.getItem(ACTIVE_ADMINS_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? (parsed as ActiveAdmin[]) : [];
  } catch (_error) {
    return [];
  }
}

function dedupeById(list: ActiveAdmin[]) {
  const byId = new globalThis.Map<number, ActiveAdmin>();
  for (const admin of list) {
    const id = toUserId(admin?.id);
    if (id < 0) continue;
    byId.set(id, { ...admin, id, lastSeen: Number(admin.lastSeen) || Date.now() });
  }
  return Array.from(byId.values());
}

function pruneExpired(list: ActiveAdmin[]) {
  const now = Date.now();
  return list.filter((u) => now - Number(u.lastSeen || 0) < ACTIVE_ADMINS_TTL_MS);
}

export default function Sidebar({
  mobileOpen = false,
  onNavigate,
}: SidebarProps) {
  const { t } = useTranslation();
  const settings = useAdminSettings();
  /* EKLENDİ - Ayarlar Alt Menü Kontrolü */
  const [settingsOpen, setSettingsOpen] = useState(false);
  /* EKLENDİ */
  const { logout, user } = useAuth();
  /* EKLENDİ */
  const navigate = useNavigate();
  const displayName = user?.role === "super_admin" ? "Super Admin" : (user?.name || "Admin");
  const displayEmail = user?.email?.toLowerCase() || "";  
  const [sessionTime, setSessionTime] = useState("");
  /* ADDED */
  const [activeAdmins, setActiveAdmins] = useState<ActiveAdmin[]>(() => readActiveAdminsFromStorage());

  const updateActiveAdmins = (updater: (list: ActiveAdmin[]) => ActiveAdmin[]) => {
    const current = pruneExpired(dedupeById(readActiveAdminsFromStorage()));
    const updated = pruneExpired(dedupeById(updater(current)));
    window.localStorage.setItem(ACTIVE_ADMINS_STORAGE_KEY, JSON.stringify(updated));
    setActiveAdmins(updated);
  };

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== ACTIVE_ADMINS_STORAGE_KEY) return;
      setActiveAdmins(pruneExpired(dedupeById(readActiveAdminsFromStorage())));
    };
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    const currentUser = user;
    if (!currentUser) return;
    const currentUserId = toUserId(currentUser.id);
    if (currentUserId < 0) return;
    const heartbeat = () => {
      const now = Date.now();
      updateActiveAdmins((list) => {
        const withoutCurrent = list.filter((u) => u.id !== currentUserId);
        return [
          ...withoutCurrent,
          {
            id: currentUserId,
            name: currentUser.name || "Admin",
            email: currentUser.email || "admin@vipstar.com",
            lastSeen: now,
          },
        ];
      });
    };
    heartbeat();
    const interval = window.setInterval(heartbeat, 2000);
    return () => window.clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const cleanup = () => {
      updateActiveAdmins((list) => pruneExpired(list));
    };
    cleanup();
    const interval = window.setInterval(cleanup, 3000);
    return () => window.clearInterval(interval);
  }, []);

  const onlineAdmins = pruneExpired(activeAdmins);
  /* ADDED */
  useEffect(() => {
    const updateSessionTime = () => {
      const loginTime = window.localStorage.getItem("loginTime");
      if (!loginTime) return;
      const diff = Date.now() - Number.parseInt(loginTime, 10);
      const minutes = Math.floor(diff / 60000);
      setSessionTime(t("sidebar.sessionAgo", { minutes }));
    };
    updateSessionTime();
    const interval = window.setInterval(updateSessionTime, 60000);
    return () => window.clearInterval(interval);
  }, [t]);
  return (
    /* EKLENDİ — mobilde translateX; lg+ masaüstü aynı */
    <div
      className={`w-55 h-screen bg-[#0f0f0f] text-white flex flex-col justify-between border-r border-[#2a2a2a] fixed left-0 top-0 z-50 transition-transform duration-300 ease-out will-change-transform ${
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0`}
    >
      <div>
        {/* LOGO SATIRI — HEADER İLE AYNI YÜKSEKLİK */}
        <div className="h-18 px-6 border-b border-[#2a2a2a] flex items-center">
          <h1 className="text-[#f5b700] font-bold text-lg tracking-wide">
            🚕 {settings.site_name || t("sidebar.brand")}
          </h1>
        </div>

        {/* MENÜ */}
        <div className="px-4 mt-4 text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider">{t("common.menu")}</div>

        <nav className="flex flex-col gap-1 px-2">
          {/* EKLENDİ — mobil menü kapanışı */}
          <NavItem
            to="/"
            label={t("sidebar.controlCenter")}
            icon={<LayoutDashboard size={16} />}
            onNavigate={onNavigate}
          />
          <NavItem
            to="/map"
            label={t("sidebar.liveMap")}
            icon={<Map size={16} />}
            onNavigate={onNavigate}
          />
          <NavItem
            to="/trips"
            label={t("sidebar.trips")}
            icon={<Car size={16} />}
            onNavigate={onNavigate}
          />
          <NavItem
            to="/drivers"
            label={t("sidebar.drivers")}
            icon={<Users size={16} />}
            onNavigate={onNavigate}
          />
          {/* EKLENDİ - 2026-04-04 */}
          <NavItem
            to="/vehicle-types"
            label={t("sidebar.vehicleTypes")}
            icon={<Tags size={16} />}
            onNavigate={onNavigate}
          />
          <NavItem
            to="/passengers"
            label={t("sidebar.passengers")}
            icon={<User size={16} />}
            onNavigate={onNavigate}
          />
          <NavItem
            to="/pricing"
            label={t("sidebar.pricing")}
            icon={<CreditCard size={16} />}
            onNavigate={onNavigate}
          />
          {/* EKLENDİ */}

       
          <div className="my-2 border-t border-[#2a2a2a] mx-4"></div>

          <NavItem
            to="/payments"
            label={t("sidebar.payments")}
            icon={<Wallet size={16} />}
            onNavigate={onNavigate}
          />

        
          <div className="space-y-1">
            <button 
              onClick={() => setSettingsOpen(!settingsOpen)}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all text-sm font-medium ${settingsOpen ? 'bg-[#f5b700] text-black font-bold' : 'text-gray-400 hover:bg-white/5'}`}
            >
              <div className="flex items-center gap-3">
                <Settings size={16} />
                <span>{t("sidebar.settings")}</span>
              </div>
              <ChevronDown size={14} className={`transition-transform duration-200 ${settingsOpen ? 'rotate-180' : ''}`} />
            </button>

            {settingsOpen && (
              <div className="ml-7 mt-1 space-y-1 border-l border-[#262626] pl-2 animate-in slide-in-from-top-2 duration-200">
                {/* EKLENDİ */}
                <Link
                  to="/settings"
                  onClick={() => onNavigate?.()}
                  className="flex items-center gap-2 px-3 py-2 text-[13px] text-gray-400 hover:text-[#f5b700] transition-colors font-medium"
                >
                   <Settings size={12} /> {t("sidebar.generalSettings")}
                </Link>
                <Link
                  to="/admins"
                  onClick={() => onNavigate?.()}
                  className="flex items-center gap-2 px-3 py-2 text-[13px] text-gray-400 hover:text-[#f5b700] transition-colors font-medium"
                >
                   <UserCheck size={12} /> {t("sidebar.subAdmins")}
                </Link>
                {/* EKLENDİ */}
              </div>
            )}
          </div>
        

        </nav>
      </div>

      {/* ALT PANEL - SENİN KODUN, SIFIR DEĞİŞİKLİK */}
      <div className="p-4 border-t border-[#2a2a2a]">
        <div className="bg-[#161616] border border-[#262626] rounded-xl p-3 mb-3">
          <div className="text-xs text-gray-400 mb-1 font-bold uppercase tracking-widest">{t("sidebar.activeSession")}</div>

          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <span>{displayName}</span>
            <span className="w-2.5 h-2.5 bg-green-500 rounded-full shadow-[0_0_6px_rgba(34,197,94,0.8)]"></span>
          </div>

          <div className="text-xs text-gray-400 mt-1 font-medium">{displayEmail}</div>
          <div className="text-[11px] text-gray-500 mt-1">{settings.support_email.toLowerCase()}</div>
          <div className="text-[11px] text-gray-500">{settings.phone}</div>
          {/* REMOVED */}
          <div className="hidden">
            <div>{displayName}</div>
            <div className="text-xs opacity-60">{displayEmail}</div>
          </div>

          <div className="text-xs text-[#f5b700] mt-2 font-bold italic tracking-wider">
          
          </div>
          {/* ADDED */}
          <div className="text-xs text-yellow-400">{sessionTime}</div><br/>
          {/* ADDED */}
          <div className="mt-2 text-xs">{t("sidebar.activeAdminsLine", { count: onlineAdmins.length })}</div>
          {/* ADDED */}
          {onlineAdmins.length === 0 ? (
            <div className="text-xs text-gray-400">No active admins</div>
          ) : (
            onlineAdmins.map((a) => (
              <div key={a.id} className="text-xs text-green-400">
                ● {a.name}
              </div>
            ))
          )}

          <div className="text-xs text-green-400 mt-2 font-bold uppercase tracking-tight">{t("sidebar.online")}</div>
        </div>

        {/* EKLENDİ — oturum kapatma */}
        <button
          type="button"
          onClick={() => {
            const currentUserId = toUserId(user?.id);
            if (currentUserId >= 0) {
              updateActiveAdmins((list) => list.filter((u) => u.id !== currentUserId));
            }
            /* EKLENDİ */
            onNavigate?.();
            logout();
            navigate("/", { replace: true });
          }}
          className="w-full bg-red-600 hover:bg-red-700 text-white text-sm py-2 rounded-lg transition font-bold uppercase tracking-tighter shadow-lg shadow-red-600/10"
        >
          {t("sidebar.logout")}
        </button>
      </div>
    </div>
  );
}

/* EKLENDİ */
function NavItem({
  to,
  label,
  icon,
  onNavigate,
}: {
  to: string;
  label: string;
  icon: any;
  onNavigate?: () => void;
}) {
  return (
    <NavLink
      to={to}
      onClick={() => onNavigate?.()}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm font-medium ${
          isActive
            ? "bg-[#f5b700] text-black font-bold shadow-lg shadow-[#f5b700]/10"
            : "text-gray-400 hover:bg-white/5 hover:text-white"
        }`
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}
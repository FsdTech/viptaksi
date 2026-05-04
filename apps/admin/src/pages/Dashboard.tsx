import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  DollarSign,
  Users,
  User,
  Server,
  Radio,
  ShieldCheck,
  CarFront,
} from "lucide-react";
import LiveMap from "@/components/map/LiveMap.tsx";
import { api } from "@/services/api.ts";
import { useAdminSettings } from "@/hooks/useAdminSettings.ts";
import { toDriverAlias } from "@/utils/driverRoute.ts";
import { useAuth } from "@/store/AuthContext.tsx";

type DashboardSummary = {
  totalDrivers: number;
  onlineDrivers: number;
  totalPassengers: number;
  totalRevenue: number;
  totalTrips: number;
};

type RecentDriver = {
  id: string;
  name: string;
  phone: string;
  plate: string;
  status: string;
  isOnline: boolean;
  createdAt?: string | null;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isEn = i18n.language.toLowerCase().startsWith("en");
  const { user } = useAuth();
  const isDemoUser = String(user?.email || "").toLowerCase() === "demo@user.com";
  const settings = useAdminSettings();
  const currencySymbol = settings.currency === "USD" ? "$" : settings.currency === "EUR" ? "€" : "₺";
  const [summary, setSummary] = useState<DashboardSummary>({
    totalDrivers: 0,
    onlineDrivers: 0,
    totalPassengers: 0,
    totalRevenue: 0,
    totalTrips: 0,
  });
  const [recentDrivers, setRecentDrivers] = useState<RecentDriver[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [summaryRes, recentRes] = await Promise.all([
          api.get<DashboardSummary>("/dashboard/summary"),
          api.get<{ drivers?: RecentDriver[] }>("/dashboard/recent-drivers"),
        ]);
        if (!cancelled && summaryRes.data) setSummary(summaryRes.data);
        if (!cancelled) setRecentDrivers(Array.isArray(recentRes.data?.drivers) ? recentRes.data.drivers : []);
      } catch (error) {
        console.error("Dashboard summary load error:", error);
      }
    };
    void load();
    const timer = window.setInterval(load, 15000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <div className="space-y-8">

      {/* BAŞLIK */}
      <div className="pt-1">
        <h1 className="text-[35px] font-extrabold text-white">{t("dashboard.systemStatus")}</h1>
        <p className="text-[#8f8f8f] mt-2">
          {t("dashboard.fleetSummary")}
        </p>
      </div>

      <section>
        <div className="flex items-center gap-2 mb-5">
          <Activity className="text-yellow-400" size={22} />
          <h2 className="text-white text-xl font-bold">{t("dashboard.systemStatusSection")}</h2>
        </div>

        {/* EKLENDİ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div
            className="rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-5 flex items-center gap-4 transition hover:border-yellow-400/30 hover:shadow-[0_0_20px_rgba(250,204,21,0.4)]"
          >
            <div className="rounded-2xl bg-green-500/15 text-green-400 p-3 border border-green-500/25">
              <Server size={20} />
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase font-semibold">
                {t("dashboard.apiServer")}
              </p>
              <p className="text-white font-bold">{t("dashboard.running")}</p>
            </div>
          </div>

          <div
            className="rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-5 flex items-center gap-4 transition hover:border-yellow-400/30 hover:shadow-[0_0_20px_rgba(250,204,21,0.4)]"
          >
            <div className="rounded-2xl bg-yellow-400/10 text-yellow-400 p-3 border border-yellow-400/20">
              <Radio size={20} />
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase font-semibold">
                {t("dashboard.liveLocation")}
              </p>
              <p className="text-white font-bold">{t("dashboard.active")}</p>
            </div>
          </div>

          <div
            className="rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-5 flex items-center gap-4 transition hover:border-yellow-400/30 hover:shadow-[0_0_20px_rgba(250,204,21,0.4)]"
          >
            <div className="rounded-2xl bg-yellow-400/10 text-yellow-400 p-3 border border-yellow-400/20">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase font-semibold">
                {t("dashboard.security")}
              </p>
              <p className="text-white font-bold">{t("dashboard.protected")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* EKLENDİ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-6">
        <div className="rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-5 flex items-center gap-4 transition hover:border-yellow-400/30 hover:shadow-[0_0_20px_rgba(250,204,21,0.4)]">
          <div className="rounded-2xl bg-yellow-400/10 text-yellow-400 p-3 border border-yellow-400/20">
            <Users size={20} />
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase font-semibold">
              {t("dashboard.totalDrivers")}
            </p>
            <p className="text-white font-bold text-2xl">{summary.totalDrivers}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-5 flex items-center gap-4 transition hover:border-yellow-400/30 hover:shadow-[0_0_20px_rgba(250,204,21,0.4)]">
          <div className="rounded-2xl bg-yellow-400/10 text-yellow-400 p-3 border border-yellow-400/20">
            <Activity size={20} />
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase font-semibold">
              {t("dashboard.onlineDrivers")}
            </p>
            <p className="text-white font-bold text-2xl">{summary.onlineDrivers}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-5 flex items-center gap-4 transition hover:border-yellow-400/30 hover:shadow-[0_0_20px_rgba(250,204,21,0.4)]">
          <div className="rounded-2xl bg-yellow-400/10 text-yellow-400 p-3 border border-yellow-400/20">
            <User size={20} />
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase font-semibold">
              {t("dashboard.totalPassengers")}
            </p>
            <p className="text-white font-bold text-2xl">{summary.totalPassengers}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-5 flex items-center gap-4 transition hover:border-yellow-400/30 hover:shadow-[0_0_20px_rgba(250,204,21,0.4)]">
          <div className="rounded-2xl bg-yellow-400/10 text-yellow-400 p-3 border border-yellow-400/20">
            <DollarSign size={20} />
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase font-semibold">
              {t("dashboard.expectedDue")}
            </p>
            <p className="text-yellow-400 font-bold text-2xl">{currencySymbol}{summary.totalRevenue.toLocaleString("tr-TR")}</p>
          </div>
        </div>
      </div>

      {/* ALT BÖLÜM */}
      <div className="grid grid-cols-12 gap-6">

        {/* EKLENDİ */}
        <div className="col-span-12 lg:col-span-8 rounded-2xl bg-[#161616] border border-[#262626] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white text-2xl font-bold">
              {isEn ? "Last 5 Drivers Joined" : "Son 5 Kaydolan Sürücü"}
            </h3>
            <span className="rounded-lg bg-[#111111] border border-[#2a2a2a] px-3 py-1 text-sm text-[#b5b5b5]">
              {isEn ? "Live" : "Canli"}
            </span>
          </div>

          <div className="w-full min-h-[240px] rounded-xl bg-[#111111] border border-[#2a2a2a] p-4">
            <div className="space-y-3">
              {recentDrivers.length === 0 ? (
                <div className="h-[180px] flex items-center justify-center text-sm text-gray-500">
                  {isEn ? "No recent driver record found." : "Son sürücü kaydı bulunamadı."}
                </div>
              ) : (
                recentDrivers.map((d, idx) => (
                  <div
                    key={d.id}
                    className="rounded-xl border border-[#262626] bg-[#0c0c0c] px-4 py-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 flex items-center justify-center">
                        <CarFront size={16} />
                      </div>
                      <div>
                        <p className="text-white font-semibold leading-none">{d.name}</p>
                        <p className="text-xs text-gray-400 mt-1">{d.phone} · {d.plate}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2.5 py-1 rounded-lg border font-semibold ${
                        d.isOnline
                          ? "text-green-400 border-green-500/35 bg-green-500/10"
                          : "text-red-400 border-red-500/35 bg-red-500/10"
                      }`}>
                        {d.isOnline ? (isEn ? "Online" : "Cevrim ici") : (isEn ? "Offline" : "Cevrim disi")}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (isDemoUser) return;
                          navigate(`/drivers/${toDriverAlias(idx)}`);
                        }}
                        disabled={isDemoUser}
                        title={isDemoUser ? "Demo mode - action disabled" : ""}
                        className={`text-xs px-2.5 py-1 rounded-lg border border-yellow-500/35 bg-yellow-500/10 text-yellow-300 hover:bg-yellow-500/20 transition ${isDemoUser ? "opacity-50 cursor-not-allowed hover:bg-yellow-500/10" : ""}`}
                      >
                        {isEn ? "View Details" : "Detaylari Gor"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* EKLENDİ */}
        <div className="col-span-12 lg:col-span-4 rounded-2xl bg-[#161616] border border-[#262626] p-6 flex flex-col">
          <h3 className="text-white text-2xl font-bold mb-4">
            {t("dashboard.liveVehicleMap")}
          </h3>

          {/* EKLENDİ */}
          {/* EKLENDİ */}
          <div className="w-full max-w-full h-[300px] lg:h-57.5 rounded-xl bg-[#0f0f0f] border border-[#262626] overflow-hidden relative z-0">
            <LiveMap />
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-[#9c9c9c] text-sm font-semibold">
              {t("dashboard.onlineVehicles")}
            </span>

            <span className="text-[#f5b700] text-3xl font-extrabold">
              {summary.onlineDrivers}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}

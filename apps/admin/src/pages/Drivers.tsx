import { useEffect, useMemo, useState } from "react";
import { Search, Settings, Star, Plus, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "@/services/api.ts";
import type { BillingDriver } from "@/store/BillingSyncContext.tsx";
import { toDriverAlias } from "@/utils/driverRoute.ts";
import { useAuth } from "@/store/AuthContext.tsx";

type PaymentStatus = "pending" | "approved" | "rejected";
type DriverRow = {
  id: string;
  user?: { name?: string; email?: string };
  isOnline: boolean;
  status?: "active" | "passive" | "banned" | string | null;
  rating: number | null;
  phone?: string | null;
  plate?: string | null;
  vehicle?: string | null;
  vehicleType?: { name?: string };
  payment?: {
    status: PaymentStatus;
    expireAt?: string | null;
    amount?: number | null;
    planType?: "weekly" | "monthly" | null;
  } | null;
};
type VehicleTypeOption = { id: string; name: string };

function getAccountState(driver: DriverRow) {
  const status = String(driver.status ?? "active");
  if (status === "banned") return "banned";
  if (status === "passive") return "passive";
  const payment = driver.payment;
  if (!payment) return "passive";
  if (payment.status === "pending") return "pending";
  if (payment.status === "rejected") return "passive";
  if (payment.status === "approved") {
    const exp = payment.expireAt ? new Date(payment.expireAt).getTime() : 0;
    return exp > Date.now() ? "active" : "expired";
  }
  return "passive";
}

function formatRemaining(expireAt: string | null | undefined, isEn: boolean) {
  if (!expireAt) return null;
  const diff = new Date(expireAt).getTime() - Date.now();
  if (diff <= 0) return isEn ? "Expired" : "Süre doldu";
  const d = Math.floor(diff / (24 * 60 * 60 * 1000));
  const h = Math.floor((diff / (60 * 60 * 1000)) % 24);
  const m = Math.floor((diff / (60 * 1000)) % 60);
  return isEn ? `${d}d ${h}h ${m}m` : `${d}g ${h}s ${m}dk`;
}

function vehicleGlowClass(name: string) {
  const n = name.toLowerCase();
  if (n.includes("vip")) return "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-400/35 shadow-[0_0_14px_rgba(217,70,239,0.28)]";
  if (n.includes("premium")) return "bg-yellow-500/15 text-yellow-300 border-yellow-400/35 shadow-[0_0_14px_rgba(245,183,0,0.30)]";
  if (n.includes("motor")) return "bg-cyan-500/15 text-cyan-300 border-cyan-400/35 shadow-[0_0_14px_rgba(34,211,238,0.28)]";
  return "bg-gray-500/15 text-gray-200 border-gray-400/30 shadow-[0_0_10px_rgba(148,163,184,0.22)]";
}

function mapToBillingDriverState(d: DriverRow): BillingDriver {
  const vtName = String(d.vehicleType?.name ?? "normal").toLowerCase();
  const vt = vtName.includes("vip")
    ? "vip"
    : vtName.includes("premium")
    ? "premium"
    : vtName.includes("motor")
    ? "motor"
    : "normal";

  return {
    id: Number(d.id) || 0,
    name: d.user?.name ?? "Sürücü",
    phone: d.phone ?? "-",
    plate: d.plate ?? "-",
    vehicle: d.vehicle ?? "-",
    vehicleType: vt,
    type: vt === "premium" || vt === "vip" ? "premium" : "normal",
    status: getAccountState(d) === "active" ? "active" : "passive",
    online: d.isOnline,
    rating: Number(d.rating ?? 0),
    payment: {
      status: d.payment?.status ?? "pending",
      plan: d.payment?.planType === "weekly" ? "Haftalık" : "Aylık",
      amount: Number(d.payment?.amount ?? (d.payment?.planType === "weekly" ? 2000 : 6000)),
      receipt: "",
      approvedAt: null,
      expireAt: d.payment?.expireAt ? new Date(d.payment.expireAt) : null,
    },
  };
}

function getStatusLabel(state: string, isEn: boolean) {
  if (state === "active") return isEn ? "Active" : "Aktif";
  if (state === "pending") return isEn ? "Pending Approval" : "Onay Bekliyor";
  if (state === "banned") return isEn ? "Suspended" : "Askıya Alındı";
  if (state === "expired") return isEn ? "Expired" : "Süresi Doldu";
  return isEn ? "Passive" : "Pasif";
}

export default function Drivers() {
  const { i18n } = useTranslation();
  const isEn = i18n.language.startsWith("en");
  const { user } = useAuth();
  const isDemoUser = String(user?.email || "").toLowerCase() === "demo@user.com";
  const navigate = useNavigate();
  const location = useLocation();
  const [drivers, setDrivers] = useState<DriverRow[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [openModal, setOpenModal] = useState(false);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleTypeOption[]>([]);
  const [savingNew, setSavingNew] = useState(false);
  const [newDriver, setNewDriver] = useState({
    name: "",
    email: "",
    phone: "",
    plate: "",
    vehicle: "",
    license_no: "",
    vehicle_type_id: "",
  });

  const load = async () => {
    try {
      const [driversRes, typesRes] = await Promise.all([
        api.get<{ drivers: DriverRow[] }>("/drivers"),
        api.get<{ vehicleTypes: VehicleTypeOption[] }>("/vehicle-types"),
      ]);
      setDrivers(driversRes.data?.drivers ?? []);
      setVehicleTypes(typesRes.data?.vehicleTypes ?? []);
    } catch (error) {
      console.error("Drivers load error:", error);
    }
  };

  useEffect(() => {
    void load();
    const interval = window.setInterval(load, 15000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if ((location.state as { refreshAt?: number } | null)?.refreshAt) {
      void load();
    }
  }, [location.state]);

  const filteredDrivers = useMemo(() => {
    return drivers.filter((d) => {
      const q = search.trim().toLowerCase();
      if (q) {
        const name = String(d.user?.name ?? "").toLowerCase();
        const email = String(d.user?.email ?? "").toLowerCase();
        const type = String(d.vehicleType?.name ?? "").toLowerCase();
        if (!name.includes(q) && !email.includes(q) && !type.includes(q)) return false;
      }
      const account = getAccountState(d);
      const online = account === "active" && d.isOnline;
      if (statusFilter === "active" && account !== "active") return false;
      if (statusFilter === "passive" && !["passive", "expired", "banned"].includes(account)) return false;
      if (statusFilter === "online" && !online) return false;
      if (statusFilter === "offline" && online) return false;
      return true;
    });
  }, [drivers, search, statusFilter]);

  return (
    <div className="space-y-6 w-full max-w-full min-w-0 overflow-x-hidden">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-[35px] leading-none font-extrabold text-white tracking-tight">{isEn ? "Drivers" : "Sürücüler"}</h1>
          <p className="text-[#9a9a9a] mt-2 text-[16px]">{isEn ? "Premium UI + real API data flow." : "Eski premium UI + gerçek API veri akışı."}</p>
        </div>
        <button
          onClick={() => setOpenModal(true)}
          disabled={isDemoUser}
          title={isDemoUser ? "Demo mode - action disabled" : ""}
          className={`flex items-center gap-2 bg-[#f5b700] hover:bg-[#ffd034] text-black px-5 py-3 rounded-2xl font-bold shadow-[0_0_16px_rgba(245,183,0,0.25)] transition ${isDemoUser ? "opacity-50 cursor-not-allowed hover:bg-[#f5b700]" : ""}`}
        >
          <Plus size={18} />
          {isEn ? "New Driver / Vehicle" : "Yeni Sürücü / Araç"}
        </button>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4 w-full max-w-full min-w-0">
        <div className="flex items-center gap-2 flex-wrap w-full min-w-0">
          {[
            { key: "all", label: isEn ? "All" : "Tümü" },
            { key: "active", label: isEn ? "Active Account" : "Aktif Hesap" },
            { key: "passive", label: isEn ? "Passive Account" : "Pasif Hesap" },
            { key: "online", label: isEn ? "Online" : "Çevrimiçi" },
            { key: "offline", label: isEn ? "Offline" : "Çevrimdışı" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setStatusFilter(item.key)}
              className={`px-4 py-2.5 rounded-2xl font-semibold transition ${
                statusFilter === item.key
                  ? "bg-[#f5b700] text-black shadow-[0_0_12px_rgba(245,183,0,0.35)]"
                  : "bg-[#1a1a1a] text-gray-300 hover:bg-[#2a2a2a]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center bg-[#161616] border border-[#262626] px-4 py-3 rounded-2xl min-w-0 w-full max-w-full lg:min-w-[320px] lg:w-auto lg:max-w-none">
          <Search size={18} className="text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isEn ? "Name, email or vehicle type..." : "İsim, e-posta veya araç tipi..."}
            className="bg-transparent outline-none text-white ml-3 w-full"
          />
        </div>
      </div>

      <div className="bg-[#0d0d0d] border border-[#232323] rounded-3xl overflow-y-auto overflow-x-hidden shadow-[0_0_24px_rgba(0,0,0,0.35)] w-full max-w-full min-w-0">
        <div className="overflow-x-auto w-full max-w-full min-w-0">
          <table className="w-full max-w-full lg:table-fixed">
            <thead className="text-[#909090] bg-[#0c0c0c] text-xs tracking-[0.08em] uppercase hidden lg:table-header-group">
              <tr>
                <th className="p-4 text-left w-[28%]">{isEn ? "Driver" : "Sürücü"}</th>
                <th className="p-4 text-left w-[18%]">{isEn ? "Vehicle Type / Plate" : "Araç Tipi / Plaka"}</th>
                <th className="p-4 text-left w-[18%]">{isEn ? "Account Status" : "Hesap Durumu"}</th>
                <th className="p-4 text-left w-[15%]">{isEn ? "Online" : "Çevrimiçi"}</th>
                <th className="p-4 text-left w-[8%]">{isEn ? "Rating" : "Puan"}</th>
                <th className="p-4 text-center w-[13%]">{isEn ? "Actions" : "İşlemler"}</th>
              </tr>
            </thead>

            <tbody>
              {filteredDrivers.map((d) => {
                const account = getAccountState(d);
                const online = account === "active" && d.isOnline;
                const name = d.user?.name ?? "Sürücü";
                const email = d.user?.email ?? "-";
                const type = d.vehicleType?.name ?? "-";
                const rating = d.rating ?? 0;
                const remain = formatRemaining(d.payment?.expireAt, isEn);
                const plan =
                  d.payment?.planType === "weekly"
                    ? (isEn ? "Weekly" : "Haftalık")
                    : d.payment?.planType === "monthly"
                    ? (isEn ? "Monthly" : "Aylık")
                    : Number(d.payment?.amount ?? 0) <= 2000
                    ? (isEn ? "Weekly" : "Haftalık")
                    : (isEn ? "Monthly" : "Aylık");
                return (
                  <tr
                    key={d.id}
                    className="border-t border-[#1b1b1b] transition-all duration-300 hover:bg-[#141414] hover:shadow-[inset_0_0_0_1px_rgba(245,183,0,0.18),0_0_32px_rgba(245,183,0,0.14)] max-lg:flex max-lg:flex-col max-lg:w-full overflow-hidden lg:table-row"
                  >
                    <td className="p-3 lg:p-4 align-middle max-lg:block max-lg:w-full overflow-hidden lg:table-cell">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-11 h-11 shrink-0 rounded-full bg-linear-to-br from-cyan-500 to-cyan-700 flex items-center justify-center font-bold text-white text-[20px]">
                          {name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-bold text-[16px] leading-tight truncate">{name}</p>
                          <p className="text-sm text-gray-300 font-medium tracking-wide truncate">{d.phone ?? "-"}</p>
                          <p className="text-xs text-gray-500 truncate">{email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-3 lg:p-4 align-middle max-lg:block max-lg:w-full lg:table-cell">
                      <p className="text-white font-bold tracking-[0.08em] mb-1">{d.plate ?? "-"}</p>
                      <p className="text-xs text-gray-400 mb-2">{d.vehicle ?? "-"}</p>
                      <span className={`inline-flex items-center text-xs px-2.5 py-1 rounded-xl border ${vehicleGlowClass(type)}`}>
                        {type}
                      </span>
                    </td>

                    <td className="p-3 lg:p-4 align-middle max-lg:block max-lg:w-full lg:table-cell">
                      <span
                        className={`font-semibold ${
                          account === "active"
                            ? "text-green-400"
                            : account === "pending"
                            ? "text-yellow-400"
                            : account === "expired"
                            ? "text-red-400"
                            : account === "banned"
                            ? "text-orange-400"
                            : "text-blue-400"
                        }`}
                      >
                        {getStatusLabel(account, isEn)}
                      </span>
                      {account === "active" && remain ? (
                        <p className="text-[12px] mt-1 text-yellow-400 font-semibold">
                          {plan} · {remain}
                        </p>
                      ) : null}
                    </td>

                    <td className="p-3 lg:p-4 align-middle max-lg:block max-lg:w-full lg:table-cell">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            online
                              ? "bg-green-400 shadow-[0_0_10px_rgba(34,197,94,0.95)] animate-pulse"
                              : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)]"
                          }`}
                        />
                        <span className={online ? "text-green-400 font-semibold" : "text-red-400 font-semibold"}>
                          {online ? (isEn ? "Online" : "Çevrimiçi") : (isEn ? "Offline" : "Çevrimdışı")}
                        </span>
                      </div>
                    </td>

                    <td className="hidden lg:table-cell p-3 lg:p-4 align-middle">
                      <span className="text-yellow-400 font-bold">{Number(rating).toFixed(1)}</span>
                      <Star size={12} className="inline ml-1 text-yellow-400 fill-yellow-400" />
                    </td>

                    <td className="p-3 lg:p-4 align-middle text-left max-lg:block max-lg:w-full lg:text-center lg:table-cell">
                      <div className="mt-2 flex w-full flex-row items-center justify-between gap-2 lg:mt-0 lg:justify-center">
                        <span className="text-yellow-400 font-bold lg:hidden shrink-0">
                          {Number(rating).toFixed(1)}★
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const idx = drivers.findIndex((x) => x.id === d.id);
                            const routeId = idx >= 0 ? toDriverAlias(idx) : d.id;
                            navigate(`/drivers/${routeId}`, { state: mapToBillingDriverState(d) });
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] text-white hover:bg-[#252525] hover:border-[#3a3a3a] transition shrink-0"
                        >
                          <Settings size={14} />
                          {isEn ? "Manage" : "Yönet"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {openModal ? (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-[#0b0b0b] border border-[#2a2a2a] rounded-[28px] w-full max-w-2xl p-7 shadow-[0_0_40px_rgba(245,183,0,0.08)]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white text-[30px] leading-none font-extrabold">{isEn ? "Add New Driver / Vehicle" : "Yeni Sürücü / Araç Ekle"}</h2>
              <button onClick={() => setOpenModal(false)} className="w-9 h-9 rounded-full flex items-center justify-center bg-[#161616] border border-[#2a2a2a] text-gray-300 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input className="input-dark" placeholder="Ad Soyad" value={newDriver.name} onChange={(e) => setNewDriver((p) => ({ ...p, name: e.target.value }))} />
              <input className="input-dark" placeholder="Telefon" value={newDriver.phone} onChange={(e) => setNewDriver((p) => ({ ...p, phone: e.target.value }))} />
              <input className="input-dark" placeholder="E-posta" value={newDriver.email} onChange={(e) => setNewDriver((p) => ({ ...p, email: e.target.value }))} />
              <input className="input-dark" placeholder="Plaka" value={newDriver.plate} onChange={(e) => setNewDriver((p) => ({ ...p, plate: e.target.value }))} />
              <input className="input-dark" placeholder="Araç Modeli" value={newDriver.vehicle} onChange={(e) => setNewDriver((p) => ({ ...p, vehicle: e.target.value }))} />
              <select
                className="input-dark"
                value={newDriver.vehicle_type_id}
                onChange={(e) => setNewDriver((p) => ({ ...p, vehicle_type_id: e.target.value }))}
              >
                <option value="">Araç Tipi Seç</option>
                {vehicleTypes.map((vt) => (
                  <option key={vt.id} value={vt.id}>
                    {vt.name}
                  </option>
                ))}
              </select>
              <input className="input-dark sm:col-span-2" placeholder="Ehliyet No" value={newDriver.license_no} onChange={(e) => setNewDriver((p) => ({ ...p, license_no: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button className="text-gray-400 hover:text-white font-medium" onClick={() => setOpenModal(false)}>İptal</button>
              <button
                className={`bg-[#f5b700] hover:bg-[#ffd034] px-5 py-2.5 rounded-2xl font-bold text-black shadow-[0_0_12px_rgba(245,183,0,0.35)] disabled:opacity-60 ${isDemoUser ? "opacity-50 cursor-not-allowed hover:bg-[#f5b700]" : ""}`}
                disabled={savingNew || isDemoUser}
                title={isDemoUser ? "Demo mode - action disabled" : ""}
                onClick={async () => {
                  if (isDemoUser) return;
                  try {
                    setSavingNew(true);
                    await api.post("/drivers", newDriver);
                    const res = await api.get<{ drivers: DriverRow[] }>("/drivers");
                    setDrivers(res.data?.drivers ?? []);
                    setOpenModal(false);
                    setNewDriver({
                      name: "",
                      email: "",
                      phone: "",
                      plate: "",
                      vehicle: "",
                      license_no: "",
                      vehicle_type_id: "",
                    });
                  } catch (error) {
                    console.error("Create driver error:", error);
                    const message =
                      (error as { response?: { data?: { error?: string } } })?.response?.data?.error ??
                      "Sürücü eklenemedi.";
                    alert(message);
                  } finally {
                    setSavingNew(false);
                  }
                }}
              >
                {savingNew ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

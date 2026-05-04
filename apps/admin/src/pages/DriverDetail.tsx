import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  CarFront,
  FileText,
  IdCard,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  Star,
  Upload,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "@/services/api.ts";
import { parseDriverAlias } from "@/utils/driverRoute.ts";
import { useAuth } from "@/store/AuthContext.tsx";

type DriverDetailRow = {
  id: string;
  user?: { name?: string; email?: string };
  phone?: string | null;
  plate?: string | null;
  vehicle?: string | null;
  licenseNo?: string | null;
  rating: number | null;
  isOnline: boolean;
  status?: string | null;
  vehicleType?: {
    name?: string;
    baseFare?: number | null;
    perKmRate?: number | null;
    perMinRate?: number | null;
  };
};

type VehicleTypeApi = {
  id: string;
  name: string;
};

export default function DriverDetail() {
  const { i18n } = useTranslation();
  const isEn = i18n.language.startsWith("en");
  const { user } = useAuth();
  const isDemoUser = String(user?.email || "").toLowerCase() === "demo@user.com";
  const { id } = useParams();
  const navigate = useNavigate();
  const [driver, setDriver] = useState<DriverDetailRow | null>(null);
  const [types, setTypes] = useState<VehicleTypeApi[]>([]);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [docUploading, setDocUploading] = useState(false);
  const [resolvedId, setResolvedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    plate: "",
    vehicle: "",
    license_no: "",
    rating: "5",
    status: "active",
    is_online: false,
    vehicle_type_id: "",
  });

  const getApiErrorMessage = (error: unknown, fallback: string) => {
    return (
      (error as { response?: { data?: { error?: string } } })?.response?.data?.error ??
      fallback
    );
  };

  const notifyDemoDisabled = () => {
    window.alert(isEn ? "Demo mode - action disabled" : "Demo modda işlem kapalı");
  };

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        let finalId = id;
        const aliasNo = parseDriverAlias(id);
        if (aliasNo != null) {
          const listRes = await api.get<{ drivers: Array<{ id: string }> }>("/drivers");
          const list = Array.isArray(listRes.data?.drivers) ? listRes.data.drivers : [];
          const hit = list[aliasNo - 1];
          if (!hit?.id) {
            alert(isEn ? "Driver not found for this short URL." : "Bu kısa URL için sürücü bulunamadı.");
            return;
          }
          finalId = String(hit.id);
        }
        setResolvedId(finalId);
        const [driverRes, typesRes] = await Promise.all([
          api.get<{ driver: DriverDetailRow }>(`/drivers/${finalId}`),
          api.get<{ vehicleTypes: VehicleTypeApi[] }>("/vehicle-types"),
        ]);
        const d = driverRes.data?.driver ?? null;
        setDriver(d);
        setTypes(typesRes.data?.vehicleTypes ?? []);
        setForm({
          name: d?.user?.name ?? "",
          email: d?.user?.email ?? "",
          phone: d?.phone ?? "",
          plate: d?.plate ?? "",
          vehicle: d?.vehicle ?? "",
          license_no: d?.licenseNo ?? "",
          rating: String(d?.rating ?? 5),
          status: d?.status ?? "active",
          is_online: Boolean(d?.isOnline),
          vehicle_type_id: "",
        });
      } catch (error) {
        console.error("Driver detail load error:", error);
        alert(getApiErrorMessage(error, isEn ? "Driver detail could not be loaded." : "Sürücü detayı yüklenemedi."));
      }
    };
    void load();
  }, [id, isEn]);

  const saveAll = async () => {
    if (isDemoUser) {
      notifyDemoDisabled();
      return;
    }
    if (!resolvedId) return;
    try {
      setSaving(true);
      const ratingNum = Number(form.rating);
      const payload: Record<string, unknown> = {
        status: form.status,
        is_online: form.is_online,
      };
      if (form.name.trim()) payload.name = form.name.trim();
      if (form.email.trim()) payload.email = form.email.trim();
      if (form.phone.trim()) payload.phone = form.phone.trim();
      if (form.plate.trim()) payload.plate = form.plate.trim();
      if (form.vehicle.trim()) payload.vehicle = form.vehicle.trim();
      if (form.license_no.trim()) payload.license_no = form.license_no.trim();
      if (Number.isFinite(ratingNum) && ratingNum >= 0) payload.rating = ratingNum;
      if (form.vehicle_type_id) payload.vehicle_type_id = form.vehicle_type_id;
      const res = await api.put<{ driver: DriverDetailRow }>(`/drivers/${resolvedId}`, payload);
      const d = res.data?.driver ?? null;
      setDriver(d);
      alert(isEn ? "Driver details updated." : "Sürücü bilgileri güncellendi.");
    } catch (error) {
      console.error("Driver detail save error:", error);
      alert(getApiErrorMessage(error, isEn ? "An error occurred while updating." : "Güncelleme sırasında hata oluştu."));
    } finally {
      setSaving(false);
    }
  };

  const setOffline = async () => {
    if (isDemoUser) {
      notifyDemoDisabled();
      return;
    }
    if (!resolvedId) return;
    try {
      setActionLoading(true);
      const res = await api.put<{ driver: DriverDetailRow }>(`/drivers/${resolvedId}`, { is_online: false });
      const d = res.data?.driver ?? null;
      setDriver(d);
      setForm((p) => ({ ...p, is_online: false, status: d?.status ?? p.status }));
      alert(isEn ? "Driver is now offline." : "Sürücü çevrimdışı yapıldı.");
    } catch (error) {
      console.error("Set offline error:", error);
      alert(getApiErrorMessage(error, isEn ? "Operation failed." : "İşlem başarısız oldu."));
    } finally {
      setActionLoading(false);
    }
  };

  const setOnline = async () => {
    if (isDemoUser) {
      notifyDemoDisabled();
      return;
    }
    if (!resolvedId) return;
    try {
      setActionLoading(true);
      const res = await api.put<{ driver: DriverDetailRow }>(`/drivers/${resolvedId}`, { is_online: true, status: "active" });
      const d = res.data?.driver ?? null;
      setDriver(d);
      setForm((p) => ({ ...p, is_online: true, status: "active" }));
      alert(isEn ? "Driver is now online." : "Sürücü çevrimiçi yapıldı.");
    } catch (error) {
      console.error("Set online error:", error);
      alert(getApiErrorMessage(error, isEn ? "Operation failed." : "İşlem başarısız oldu."));
    } finally {
      setActionLoading(false);
    }
  };

  const suspend = async () => {
    if (isDemoUser) {
      notifyDemoDisabled();
      return;
    }
    if (!resolvedId) return;
    try {
      setActionLoading(true);
      const res = await api.put<{ driver: DriverDetailRow }>(`/drivers/${resolvedId}`, { status: "banned", is_online: false });
      const d = res.data?.driver ?? null;
      setDriver(d);
      setForm((p) => ({ ...p, status: "banned", is_online: false }));
      alert(isEn ? "Account suspended." : "Hesap askıya alındı.");
    } catch (error) {
      console.error("Suspend error:", error);
      alert(getApiErrorMessage(error, isEn ? "Operation failed." : "İşlem başarısız oldu."));
    } finally {
      setActionLoading(false);
    }
  };

  const setPassive = async () => {
    if (isDemoUser) {
      notifyDemoDisabled();
      return;
    }
    if (!resolvedId) return;
    try {
      setActionLoading(true);
      const res = await api.put<{ driver: DriverDetailRow }>(`/drivers/${resolvedId}`, { status: "passive", is_online: false });
      const d = res.data?.driver ?? null;
      setDriver(d);
      setForm((p) => ({ ...p, status: "passive", is_online: false }));
      alert(isEn ? "Account set to passive." : "Hesap pasif yapıldı.");
    } catch (error) {
      console.error("Set passive error:", error);
      alert(getApiErrorMessage(error, isEn ? "Operation failed." : "İşlem başarısız oldu."));
    } finally {
      setActionLoading(false);
    }
  };

  const currentTypeName = driver?.vehicleType?.name ?? "Normal";

  const uploadDriverDocument = async () => {
    if (isDemoUser) {
      notifyDemoDisabled();
      return;
    }
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".jpg,.jpeg,.png,.webp,.pdf";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        setDocUploading(true);
        const body = new FormData();
        body.append("document", file);
        await api.post("/uploads/driver-document", body, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        alert(isEn ? "Document uploaded." : "Belge yüklendi.");
      } catch (error) {
        console.error("Driver document upload error:", error);
        alert(getApiErrorMessage(error, isEn ? "Document upload failed." : "Belge yüklenemedi."));
      } finally {
        setDocUploading(false);
      }
    };
    input.click();
  };

  return (
    <div className="w-full max-w-full text-white overflow-x-hidden">
      <div className="w-full max-w-full lg:max-w-300 mx-auto space-y-6 text-[14px]">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate("/drivers", { state: { refreshAt: Date.now() } })}
            className="w-10 h-10 rounded-full bg-[#171717] border border-[#2a2a2a] flex items-center justify-center hover:bg-[#1f1f1f] transition"
          >
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-[30px] font-extrabold tracking-tight">{form.name || (isEn ? "Driver Detail" : "Sürücü Detay")}</h1>
          <span className="text-xs px-3 py-1 rounded-xl border bg-yellow-500/15 text-yellow-300 border-yellow-400/35 shadow-[0_0_14px_rgba(245,183,0,0.30)]">
            {currentTypeName}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={() => void setOffline()} disabled={actionLoading} className="px-4 py-2 rounded-xl bg-red-500/15 text-red-400 border border-red-500/25 hover:bg-red-500/20 transition text-sm disabled:opacity-60">
            {isEn ? "Set Offline" : "Çevrimdışı Yap"}
          </button>
          <button onClick={() => void setOnline()} disabled={actionLoading} className="px-4 py-2 rounded-xl bg-green-500/15 text-green-400 border border-green-500/25 hover:bg-green-500/20 transition text-sm disabled:opacity-60">
            {isEn ? "Set Online" : "Çevrimiçi Yap"}
          </button>
          <button onClick={() => void suspend()} disabled={actionLoading} className="px-4 py-2 rounded-xl bg-yellow-500/15 text-yellow-400 border border-yellow-500/25 hover:bg-yellow-500/20 transition text-sm disabled:opacity-60">
            {isEn ? "Suspend" : "Askıya Al"}
          </button>
          <button onClick={() => void saveAll()} disabled={saving} className="px-4 py-2 rounded-xl bg-[#f5b700] text-black font-bold hover:bg-[#ffd034] transition disabled:opacity-60 inline-flex items-center gap-2">
            <Save size={14} /> {saving ? (isEn ? "Saving..." : "Kaydediliyor...") : (isEn ? "Save All" : "Tümünü Kaydet")}
          </button>
        </div>

        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-12 lg:col-span-8 space-y-5">
            <div className="bg-[#0f0f0f] border border-[#252525] rounded-[26px] p-4 lg:p-5">
              <div className="flex items-center gap-2 mb-5">
                <IdCard size={16} className="text-[#f5b700]" />
                <h2 className="text-[20px] font-bold tracking-tight">{isEn ? "Profile Summary (Editable)" : "Profil Özeti (Düzenlenebilir)"}</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Field icon={<IdCard size={13} />} label={isEn ? "Full Name" : "Ad Soyad"} value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} />
                <Field icon={<Mail size={13} />} label={isEn ? "Email" : "E-posta"} value={form.email} onChange={(v) => setForm((p) => ({ ...p, email: v }))} />
                <Field icon={<Phone size={13} />} label={isEn ? "Phone" : "Telefon"} value={form.phone} onChange={(v) => setForm((p) => ({ ...p, phone: v }))} />
                <Field icon={<Star size={13} />} label={isEn ? "Rating" : "Puan"} value={form.rating} onChange={(v) => setForm((p) => ({ ...p, rating: v }))} />
                <Field label={isEn ? "Plate" : "Plaka"} value={form.plate} onChange={(v) => setForm((p) => ({ ...p, plate: v }))} />
                <Field label={isEn ? "Model" : "Model"} value={form.vehicle} onChange={(v) => setForm((p) => ({ ...p, vehicle: v }))} />
                <Field label={isEn ? "License No" : "Ehliyet No"} value={form.license_no} onChange={(v) => setForm((p) => ({ ...p, license_no: v }))} />
                <div>
                  <p className="text-gray-400 mb-2">{isEn ? "Status" : "Durum"}</p>
                  <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} className="input-dark w-full">
                    <option value="active">{isEn ? "Active" : "Aktif"}</option>
                    <option value="passive">{isEn ? "Passive" : "Pasif"}</option>
                    <option value="banned">{isEn ? "Suspended" : "Askıda"}</option>
                  </select>
                </div>
                <div>
                  <p className="text-gray-400 mb-2">{isEn ? "Vehicle Type" : "Araç Tipi"}</p>
                  <select value={form.vehicle_type_id} onChange={(e) => setForm((p) => ({ ...p, vehicle_type_id: e.target.value }))} className="input-dark w-full">
                    <option value="">{isEn ? "Current" : "Mevcut"}: {currentTypeName}</option>
                    {types.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-[#0f0f0f] border border-[#252525] rounded-[26px] p-4 lg:p-5">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-[#f5b700]" />
                  <h2 className="text-[20px] font-bold tracking-tight">{isEn ? "Documents" : "Belgeler"}</h2>
                </div>
                <button
                  onClick={() => void uploadDriverDocument()}
                  disabled={docUploading}
                  className="inline-flex items-center gap-2 bg-[#f5b700] hover:bg-[#ffd034] text-black px-4 py-2 rounded-2xl font-bold text-sm shadow-[0_0_12px_rgba(245,183,0,0.3)] disabled:opacity-60"
                >
                  <Upload size={14} /> {docUploading ? (isEn ? "Uploading..." : "Yükleniyor...") : (isEn ? "Upload" : "Yükle")}
                </button>
              </div>
              <p className="text-sm text-gray-400">{isEn ? "Uploaded files are stored in backend uploads." : "Yüklenen dosyalar backend uploads klasorune kaydedilir."}</p>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4 space-y-5">
            <div className="bg-[#0f0f0f] border border-[#f5b700]/25 rounded-[26px] p-4 lg:p-5 shadow-[0_0_20px_rgba(245,183,0,0.08)]">
              <div className="flex items-center gap-2 mb-5">
                <CarFront size={16} className="text-[#f5b700]" />
                <h2 className="text-[20px] font-bold tracking-tight">{isEn ? "Vehicle Details" : "Araç Bilgileri"}</h2>
              </div>
              <div className="space-y-3">
                <Info label={isEn ? "Vehicle Type" : "Araç Tipi"} value={currentTypeName} />
                <Info label={isEn ? "Plate" : "Plaka"} value={form.plate || "-"} />
                <Info label={isEn ? "Model" : "Model"} value={form.vehicle || "-"} />
                <Info label={isEn ? "License" : "Ehliyet"} value={form.license_no || "-"} />
              </div>
            </div>

            <div className="bg-[#0f0f0f] border border-[#252525] rounded-[26px] p-4 lg:p-5">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck size={16} className="text-[#f5b700]" />
                <h2 className="text-[18px] font-bold tracking-tight">{isEn ? "Account Management" : "Hesap Yönetimi"}</h2>
              </div>
              <div className="space-y-3">
                <button onClick={() => void suspend()} disabled={actionLoading} className="w-full py-3 rounded-2xl bg-yellow-500/15 text-yellow-400 border border-yellow-500/20 font-semibold text-sm hover:bg-yellow-500/20 transition disabled:opacity-60">
                  {isEn ? "Suspend Account" : "Hesabı Askıya Al"}
                </button>
                <button onClick={() => void setPassive()} disabled={actionLoading} className="w-full py-3 rounded-2xl bg-[#1b1b1b] text-gray-300 border border-[#2a2a2a] font-semibold text-sm hover:bg-[#232323] transition disabled:opacity-60">
                  {isEn ? "Set Account Passive" : "Hesabı Pasif Yap"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, icon }: { label: string; value: string; onChange: (v: string) => void; icon?: ReactNode }) {
  return (
    <div>
      <p className="text-gray-400 flex items-center gap-2 mb-2">{icon}{label}</p>
      <input className="input-dark w-full" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="pb-3 border-b border-[#252525] last:border-0">
      <p className="text-gray-400 text-[13px] mb-1">{label}</p>
      <p className="text-white font-semibold">{value}</p>
    </div>
  );
}

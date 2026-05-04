import { useEffect, useMemo, useState } from "react";
import { Tags, Pencil, Power, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { api } from "@/services/api.ts";
import { VehicleTypeIcon } from "@/components/vehicle/VehicleTypeIcon.tsx";
import { useAuth } from "@/store/AuthContext.tsx";

type VehicleTypeId = "normal" | "premium" | "vip" | "motor";
type VehicleTypeRow = {
  id: string;
  name: string;
  baseFare: number;
  isActive: boolean;
};

export default function VehicleTypes() {
  const { i18n } = useTranslation();
  const isEn = i18n.language.startsWith("en");
  const { user } = useAuth();
  const isDemoUser = String(user?.email || "").toLowerCase() === "demo@user.com";
  const [rows, setRows] = useState<Array<{ id: VehicleTypeId; label: string; active: boolean; baseFare: number }>>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<VehicleTypeId | null>(null);
  const [draftLabel, setDraftLabel] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [typesRes, driversRes] = await Promise.all([
          api.get<{ vehicleTypes: VehicleTypeRow[] }>("/vehicle-types"),
          api.get<{ drivers: any[] }>("/drivers"),
        ]);
        setRows(
          (typesRes.data?.vehicleTypes ?? [])
            .map((x) => ({
              id: String(x.name).toLowerCase() as VehicleTypeId,
              label: x.name,
              active: Boolean(x.isActive),
              baseFare: Number(x.baseFare ?? 0),
            }))
            .filter((x) => ["normal", "premium", "vip", "motor"].includes(x.id))
        );
        setDrivers(driversRes.data?.drivers ?? []);
      } catch (error) {
        console.error("Vehicle types load error:", error);
      }
    };
    void load();
  }, []);

  const usageById = useMemo(() => {
    const m: Record<VehicleTypeId, number> = { normal: 0, premium: 0, vip: 0, motor: 0 };
    for (const d of drivers) {
      const name = String(d?.vehicleType?.name ?? "").toLowerCase() as VehicleTypeId;
      if (name in m) m[name] += 1;
    }
    return m;
  }, [drivers]);

  async function persist(row: { id: VehicleTypeId; label: string; active: boolean; baseFare: number }) {
    await api.put("/vehicle-types/update", [
      {
        id: row.id,
        name: row.label,
        is_active: row.active,
        base_fare: row.baseFare,
      },
    ]);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[35px] leading-none font-extrabold text-white tracking-tight flex items-center gap-3">
          <Tags className="text-[#f5b700]" size={36} />
          {isEn ? "Vehicle Types" : "Araç Tipleri"}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {rows.map((row) => (
          <div key={row.id} className={`rounded-2xl border p-6 ${row.active ? "border-[#2a2a2a] bg-[#0f0f0f]" : "border-[#3a2a2a] bg-[#0a0a0a] opacity-80"}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <VehicleTypeIcon id={row.id} size={28} />
                <div>
                  <p className="text-[#f5b700] font-mono text-sm">{row.id}</p>
                  {editingId === row.id ? (
                    <div className="flex gap-2 mt-2">
                      <input value={draftLabel} onChange={(e) => setDraftLabel(e.target.value)} className="rounded-xl bg-[#161616] border border-[#2a2a2a] text-white px-3 py-1" />
                      <button
                        type="button"
                        className="rounded-xl bg-[#f5b700] text-black font-bold px-3 py-1"
                        onClick={() => {
                          const next = rows.map((r) => (r.id === row.id ? { ...r, label: draftLabel.trim() || r.label } : r));
                          const selected = next.find((r) => r.id === row.id);
                          setRows(next);
                          setEditingId(null);
                          if (selected) void persist(selected);
                        }}
                      >
                        {isEn ? "Save" : "Kaydet"}
                      </button>
                    </div>
                  ) : (
                    <h2 className="text-2xl font-extrabold text-white">{row.label}</h2>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Users size={16} className="text-[#f5b700]" />
                <span>{usageById[row.id] ?? 0} {isEn ? "drivers" : "sürücü"}</span>
              </div>
            </div>

            <p className="mt-2 text-sm text-gray-400">
              {isEn ? "Current base fare:" : "Güncel açılış ücreti:"} <span className="text-[#f5b700] font-bold">₺{row.baseFare.toLocaleString(isEn ? "en-US" : "tr-TR")}</span>
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  if (isDemoUser) return;
                  setEditingId(row.id);
                  setDraftLabel(row.label);
                }}
                disabled={isDemoUser}
                title={isDemoUser ? "Demo mode - action disabled" : ""}
                className={`inline-flex items-center gap-2 rounded-xl bg-[#161616] border border-[#2a2a2a] px-4 py-2 text-sm font-semibold text-white ${isDemoUser ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <Pencil size={16} className="text-[#f5b700]" />
                {isEn ? "Edit name" : "Adı düzenle"}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (isDemoUser) return;
                  const nextRow = { ...row, active: !row.active };
                  setRows((prev) => prev.map((r) => (r.id === row.id ? nextRow : r)));
                  void persist(nextRow);
                }}
                disabled={isDemoUser}
                title={isDemoUser ? "Demo mode - action disabled" : ""}
                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold ${row.active ? "border-amber-500/40 text-amber-400" : "border-green-500/40 text-green-400"} ${isDemoUser ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <Power size={16} />
                {row.active ? (isEn ? "Deactivate" : "Pasifleştir") : (isEn ? "Activate" : "Aktifleştir")}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

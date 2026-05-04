import { useEffect, useMemo, useState } from "react";
import { api } from "@/services/api.ts";
import { useTranslation } from "react-i18next";
/* EKLENDİ - 2026-04-04 */
import type { VehicleTypeId } from "@/types/vehicleTypes.ts";
/* EKLENDİ - 2026-04-04 */
import { VEHICLE_TYPE_IDS } from "@/types/vehicleTypes.ts";
/* EKLENDİ - 2026-04-04 */
import { VehicleTypeIcon } from "@/components/vehicle/VehicleTypeIcon.tsx";

export default function DriverApplication() {
  const { i18n } = useTranslation();
  const isEn = i18n.language.startsWith("en");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    plate: "",
    vehicle: "",
    licenseImage: "",
    receipt: "",
    /* EKLENDİ - 2026-04-04 */
    vehicleType: "normal" as VehicleTypeId,
  });

  const [records, setRecords] = useState<Array<{ id: VehicleTypeId; label: string; active: boolean }>>([]);
  const [baseFareById, setBaseFareById] = useState<Record<string, number>>({});

  /* EKLENDİ - 2026-04-04 — yalnızca aktif katalog satırları; hepsi kapalıysa tam liste */
  const selectableTypeIds = useMemo<VehicleTypeId[]>(() => {
    const active = records.filter((r) => r.active).map((r) => r.id);
    return active.length > 0 ? active : [...VEHICLE_TYPE_IDS];
  }, [records]);

  const getLabelForId = (id: VehicleTypeId) => records.find((x) => x.id === id)?.label ?? id;
  const getBaseFare = (id: VehicleTypeId) => Number(baseFareById[id] ?? 0);

  useEffect(() => {
    const load = async () => {
      try {
        const [typesRes, pricingRes] = await Promise.all([
          api.get<{ vehicleTypes: Array<{ id: string; name: string; isActive?: boolean }> }>("/vehicle-types"),
          api.get<Array<{ id: string; base_fare?: number; baseFare?: number }>>("/vehicle-types/pricing"),
        ]);
        const nextRecords = (typesRes.data?.vehicleTypes ?? [])
          .map((row) => ({
            id: row.id as VehicleTypeId,
            label: row.name,
            active: row.isActive !== false,
          }))
          .filter((row) => VEHICLE_TYPE_IDS.includes(row.id));
        setRecords(nextRecords);

        const nextFares: Record<string, number> = {};
        for (const row of pricingRes.data ?? []) {
          nextFares[String(row.id)] = Number(row.baseFare ?? row.base_fare ?? 0);
        }
        setBaseFareById(nextFares);
      } catch (error) {
        console.error("Driver application bootstrap failed:", error);
      }
    };
    void load();
  }, []);

  /* EKLENDİ - 2026-04-04 — seçim artık listede yoksa ilk geçerli tipe çek */
  useEffect(() => {
    setForm((f) => {
      if (selectableTypeIds.includes(f.vehicleType)) return f;
      const next = selectableTypeIds[0] ?? "normal";
      return { ...f, vehicleType: next };
    });
  }, [selectableTypeIds]);

  const handleSubmit = async () => {
    if (
      !form.name.trim() ||
      !form.phone.trim() ||
      !form.plate.trim() ||
      !form.vehicle.trim()
    ) {
      window.alert(isEn ? "Full name, phone, plate and vehicle are required." : "Ad soyad, telefon, plaka ve araç bilgisi zorunludur.");
      return;
    }

    const vt = selectableTypeIds.includes(form.vehicleType)
      ? form.vehicleType
      : selectableTypeIds[0] ?? "normal";

    try {
      await api.post("/driver-applications", {
        name: form.name.trim(),
        phone: form.phone.trim(),
        plate: form.plate.trim(),
        vehicle: form.vehicle.trim(),
        vehicle_type: vt,
        license_image: form.licenseImage.trim() || null,
        receipt_url: form.receipt.trim() || null,
      });
    } catch (error) {
      console.error("Driver application submit failed:", error);
      window.alert(isEn ? "Application could not be submitted. Please try again." : "Başvuru gönderilemedi. Lütfen tekrar deneyin.");
      return;
    }

    window.alert(isEn ? "Application submitted." : "Başvuru gönderildi");

    setForm({
      name: "",
      phone: "",
      plate: "",
      vehicle: "",
      licenseImage: "",
      receipt: "",
      vehicleType: "normal",
    });
  };

  return (
    <div className="max-w-xl mx-auto mt-10 space-y-4 px-4 pb-16">
      <h1 className="text-white text-2xl font-bold">{isEn ? "Driver Application" : "Sürücü Başvuru"}</h1>

      <input
        className="input-dark"
        placeholder={isEn ? "Full Name" : "Ad Soyad"}
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />

      <input
        className="input-dark"
        placeholder={isEn ? "Phone" : "Telefon"}
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
      />

      <input
        className="input-dark"
        placeholder={isEn ? "Plate" : "Plaka"}
        value={form.plate}
        onChange={(e) => setForm({ ...form, plate: e.target.value })}
      />

      <input
        className="input-dark"
        placeholder={isEn ? "Vehicle" : "Araç"}
        value={form.vehicle}
        onChange={(e) => setForm({ ...form, vehicle: e.target.value })}
      />

      {/* EKLENDİ - 2026-04-04 */}
      <div className="rounded-2xl border border-[#2a2a2a] bg-[#0b0b0b] p-4 space-y-3">
        <p className="text-[#f5b700] text-sm font-semibold">{isEn ? "Vehicle Type" : "Araç tipi"}</p>
        <div className="grid grid-cols-2 gap-3">
          {/* EKLENDİ - 2026-04-04 — Car/Bike ikonları + güncel açılış */}
          {VEHICLE_TYPE_IDS.filter((id) => selectableTypeIds.includes(id)).map(
            (id) => (
              <button
                key={id}
                type="button"
                onClick={() => setForm({ ...form, vehicleType: id })}
                className={`rounded-2xl p-4 border transition text-left ${
                  form.vehicleType === id
                    ? "border-[#f5b700] bg-[#f5b700]/10 text-[#f5b700] shadow-[0_0_10px_rgba(245,183,0,0.25)]"
                    : "border-[#2a2a2a] text-gray-400 hover:border-[#f5b700]/40"
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <VehicleTypeIcon id={id} size={20} />
                  <span className="font-semibold text-sm">
                    {getLabelForId(id)}
                  </span>
                  <span className="text-[10px] text-gray-500">
                    {isEn ? "Base Fare" : "Açılış"} ₺{getBaseFare(id).toLocaleString("tr-TR")}
                  </span>
                </div>
              </button>
            )
          )}
        </div>
      </div>

      <input
        className="input-dark"
        placeholder={isEn ? "Driver license image URL" : "Ehliyet görsel link"}
        value={form.licenseImage}
        onChange={(e) => setForm({ ...form, licenseImage: e.target.value })}
      />

      <input
        className="input-dark"
        placeholder={isEn ? "Payment receipt URL" : "Ödeme dekont link"}
        value={form.receipt}
        onChange={(e) => setForm({ ...form, receipt: e.target.value })}
      />

      <button
        type="button"
        onClick={() => void handleSubmit()}
        className="bg-[#f5b700] text-black px-4 py-2 rounded-xl font-bold w-full sm:w-auto"
      >
        {isEn ? "Submit Application" : "Başvuru Gönder"}
      </button>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Clock, Save } from "lucide-react";
import { useTranslation } from "react-i18next";
import { api } from "@/services/api.ts";
import { useAdminSettings } from "@/hooks/useAdminSettings.ts";

type PricingRow = {
  id: string;
  name: string;
  baseFare: number;
  perKmRate: number;
  perMinRate: number;
  isActive: boolean;
};

type ExtraPricing = {
  short_distance_min_fare: number;
  free_wait_minutes: number;
  wait_fee_per_min: number;
};

const TARGETS: Record<string, { base: number; km: number }> = {
  motor: { base: 25, km: 25 },
  normal: { base: 35, km: 35 },
  premium: { base: 45, km: 45 },
  vip: { base: 60, km: 60 },
};

function keyOf(row: PricingRow) {
  return String(row.name || row.id).toLowerCase();
}

export default function Pricing() {
  const { i18n } = useTranslation();
  const isEn = i18n.language.startsWith("en");
  const settings = useAdminSettings();
  const currencyLabel =
    settings.currency === "USD" ? "USD" : settings.currency === "EUR" ? "EUR" : "TRY";
  const [rows, setRows] = useState<PricingRow[]>([]);
  const [extra, setExtra] = useState<ExtraPricing>({
    short_distance_min_fare: 200,
    free_wait_minutes: 10,
    wait_fee_per_min: 5,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [typesRes, extraRes] = await Promise.all([
          api.get<{ vehicleTypes: PricingRow[] }>("/vehicle-types"),
          api.get<ExtraPricing>("/settings/pricing"),
        ]);
        setRows(typesRes.data?.vehicleTypes ?? []);
        setExtra({
          short_distance_min_fare: Number(extraRes.data?.short_distance_min_fare ?? 200),
          free_wait_minutes: Number(extraRes.data?.free_wait_minutes ?? 10),
          wait_fee_per_min: Number(extraRes.data?.wait_fee_per_min ?? 5),
        });
      } catch (error) {
        console.error("Pricing load error:", error);
      }
    };
    void load();
  }, []);

  const sorted = useMemo(() => {
    const order = ["motor", "normal", "premium", "vip"];
    return [...rows].sort((a, b) => order.indexOf(keyOf(a)) - order.indexOf(keyOf(b)));
  }, [rows]);

  const applyRequestedDefaults = () => {
    setRows((prev) =>
      prev.map((r) => {
        const k = keyOf(r);
        const t = TARGETS[k];
        return t ? { ...r, baseFare: t.base, perKmRate: t.km } : r;
      })
    );
    setExtra((p) => ({ ...p, short_distance_min_fare: 200, free_wait_minutes: 10, wait_fee_per_min: 5 }));
  };

  const saveAll = async () => {
    try {
      setSaving(true);
      await Promise.all([
        api.put(
          "/vehicle-types/update",
          rows.map((r) => ({
            id: r.id,
            name: r.name,
            base_fare: Number(r.baseFare),
            per_km_rate: Number(r.perKmRate),
            per_min_rate: Number(r.perMinRate),
            is_active: Boolean(r.isActive),
          }))
        ),
        api.post("/settings/pricing", {
          short_distance_min_fare: Number(extra.short_distance_min_fare),
          free_wait_minutes: Number(extra.free_wait_minutes),
          wait_fee_per_min: Number(extra.wait_fee_per_min),
        }),
      ]);
      window.alert(isEn ? "Pricing settings saved." : "Ücret ayarları kaydedildi.");
    } catch (error) {
      console.error("Pricing save error:", error);
      window.alert(isEn ? "This operation is restricted to Super Admins." : "Bu işlem sadece süper adminler için geçerlidir.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-275 mx-auto space-y-10">
      <div className="text-center space-y-3">
        <h1 className="t-page">{isEn ? "Pricing Algorithm Rules" : "Ücret Algoritması Kuralları"}</h1>
        <p className="t-desc">{isEn ? "All values are managed via DB + API and mobile integration-friendly endpoints." : "Tüm değerler DB + API bağlı ve mobil entegrasyon dostu endpointlerden yönetilir."}</p>
      </div>

      <div className="flex justify-end">
        <button type="button" onClick={applyRequestedDefaults} className="px-4 py-2 rounded-xl border border-[#f5b700]/40 text-[#f5b700] hover:bg-[#f5b700]/10 transition">
          {isEn ? "Apply Requested Defaults" : "İstenen Varsayılanları Uygula"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {sorted.map((row) => {
          const k = keyOf(row);
          return (
            <div key={row.id} className="rounded-2xl border border-[#2a2a2a] bg-[#141414] p-5 card-glow">
              <p className="text-white font-extrabold text-xl mb-4 capitalize">{k}</p>
              <div className="space-y-3">
                <label className="block text-sm text-gray-300">
                  {isEn ? `Base Fare (${currencyLabel})` : `Açılış Ücreti (${currencyLabel})`}
                  <input
                    type="number"
                    className="input input-glow w-full mt-1"
                    value={row.baseFare}
                    onChange={(e) => setRows((prev) => prev.map((x) => (x.id === row.id ? { ...x, baseFare: Number(e.target.value) } : x)))}
                  />
                </label>
                <label className="block text-sm text-gray-300">
                  {isEn ? `Per Km Fare (${currencyLabel})` : `Km Başı Ücret (${currencyLabel})`}
                  <input
                    type="number"
                    className="input input-glow w-full mt-1"
                    value={row.perKmRate}
                    onChange={(e) => setRows((prev) => prev.map((x) => (x.id === row.id ? { ...x, perKmRate: Number(e.target.value) } : x)))}
                  />
                </label>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-6 space-y-5 card-glow">
        <label className="block text-sm text-gray-300">
          {isEn ? `Short Distance Minimum Fare (${currencyLabel})` : `Kısa Mesafe Minimum Ücret (${currencyLabel})`}
          <input
            type="number"
            className="input input-glow w-full mt-1"
            value={extra.short_distance_min_fare}
            onChange={(e) => setExtra((p) => ({ ...p, short_distance_min_fare: Number(e.target.value) }))}
          />
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block text-sm text-gray-300">
            {isEn ? "Free Waiting Time (min)" : "Ücretsiz Bekleme Süresi (dk)"}
            <input
              type="number"
              className="input input-glow w-full mt-1"
              value={extra.free_wait_minutes}
              onChange={(e) => setExtra((p) => ({ ...p, free_wait_minutes: Number(e.target.value) }))}
            />
          </label>
          <label className="block text-sm text-gray-300">
            {isEn ? `Per Minute Waiting Fee (${currencyLabel})` : `Dakika Başı Bekleme Ücreti (${currencyLabel})`}
            <input
              type="number"
              className="input input-glow w-full mt-1"
              value={extra.wait_fee_per_min}
              onChange={(e) => setExtra((p) => ({ ...p, wait_fee_per_min: Number(e.target.value) }))}
            />
          </label>
        </div>

        <div className="text-sm text-gray-400 flex items-start gap-2">
          <Clock size={16} className="mt-0.5 text-[#f5b700]" />
          <span>
            {isEn
              ? `Trip starts after driver assignment and match code entry; first ${extra.free_wait_minutes} minutes are free, then ₺${extra.wait_fee_per_min} per minute waiting fee is applied.`
              : `Sürücü alınıp eşleşme kodu girildikten sonra yolculuk başlar; ilk ${extra.free_wait_minutes} dakika ücretsiz, sonrasında dakika başı ₺${extra.wait_fee_per_min} bekleme ücreti uygulanır.`}
          </span>
        </div>
      </div>

      <div className="flex justify-center">
        <button type="button" onClick={() => void saveAll()} disabled={saving} className="btn-primary btn-glow flex items-center gap-2 disabled:opacity-60">
          <Save size={18} />
          {saving ? (isEn ? "Saving..." : "Kaydediliyor...") : (isEn ? "Save Settings" : "Ayarları Kaydet")}
        </button>
      </div>
    </div>
  );
}

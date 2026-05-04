/* ADDED */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
/* ADDED */
import { api } from "@/services/api.ts";

/* ADDED */
type MapProvider = "leaflet" | "google_maps";

type MapSettings = {
  map_provider: MapProvider;
  google_maps_api_key: string;
  default_lat: string;
  default_lng: string;
  country: string;
  city: string;
  default_zoom: string;
};

type CountryOption = { countryCode: string; country: string };
type CityOption = { name: string; slug: string };

/* ADDED */
export default function MapSettings({ readOnly = false }: { readOnly?: boolean }) {
  const { t } = useTranslation();
  const [form, setForm] = useState<MapSettings>({
    map_provider: "leaflet",
    google_maps_api_key: "",
    default_lat: "",
    default_lng: "",
    country: "",
    city: "",
    default_zoom: "13",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState("");
  const [countryOptions, setCountryOptions] = useState<CountryOption[]>([]);
  const [cityOptions, setCityOptions] = useState<CityOption[]>([]);

  const resolveCountryCode = async (countryName: string): Promise<string> => {
    const q = String(countryName || "").trim();
    if (!q) return "";
    try {
      const res = await api.get("/settings/geo/countries", { params: { q } });
      const items = (res.data?.countries ?? []) as CountryOption[];
      const exact = items.find(
        (item) => item.country.toLowerCase() === q.toLowerCase()
      );
      return exact?.countryCode ?? "";
    } catch {
      return "";
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get("/settings/map");
        if (res.data) {
          const p = res.data.map_provider;
          const provider: MapProvider =
            p === "google_maps" || p === "leaflet" ? p : "leaflet";
          setForm({
            map_provider: provider,
            google_maps_api_key: res.data.google_maps_api_key ?? "",
            default_lat: String(res.data.default_lat ?? ""),
            default_lng: String(res.data.default_lng ?? ""),
            country: String(res.data.country ?? ""),
            city: String(res.data.city ?? ""),
            default_zoom: String(res.data.default_zoom ?? 13),
          });
          const nextCountryCode = await resolveCountryCode(String(res.data.country ?? ""));
          setCountryCode(nextCountryCode);
        }
      } catch (err) {
        console.error("Map settings load error:", err);
        setError(t("harita.loadError"));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [t]);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      try {
        const res = await api.get("/settings/geo/countries", {
          params: { q: form.country.trim() },
        });
        const items = (res.data?.countries ?? []) as CountryOption[];
        setCountryOptions(items);
        const exact = items.find(
          (item) => item.country.toLowerCase() === form.country.trim().toLowerCase()
        );
        setCountryCode(exact?.countryCode ?? "");
      } catch {
        setCountryOptions([]);
      }
    }, 180);
    return () => window.clearTimeout(timer);
  }, [form.country]);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      if (!countryCode) {
        setCityOptions([]);
        return;
      }
      try {
        const res = await api.get("/settings/geo/cities", {
          params: { countryCode, q: form.city.trim() },
        });
        setCityOptions((res.data?.cities ?? []) as CityOption[]);
      } catch {
        setCityOptions([]);
      }
    }, 180);
    return () => window.clearTimeout(timer);
  }, [countryCode, form.city]);

  const onSave = async () => {
    if (readOnly) return;
    try {
      setSaving(true);
      setError(null);
      await api.post("/settings/map", {
        map_provider: form.map_provider,
        google_maps_api_key: form.google_maps_api_key,
        default_lat: Number(form.default_lat) || 0,
        default_lng: Number(form.default_lng) || 0,
        country: form.country.trim(),
        city: form.city.trim(),
        default_zoom: Number(form.default_zoom) || 13,
      });
    } catch (err) {
      console.error("Map settings save error:", err);
      setError(t("harita.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const findCoordinates = async () => {
    if (readOnly) return;
    const q = [form.city.trim(), form.country.trim()].filter(Boolean).join(", ");
    if (!q) {
      setError(t("harita.locationRequired"));
      return;
    }
    try {
      setError(null);
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
      const r = await fetch(url, { headers: { Accept: "application/json" } });
      const data = (await r.json().catch(() => [])) as Array<{ lat?: string; lon?: string }>;
      const hit = data[0];
      const lat = Number(hit?.lat);
      const lng = Number(hit?.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        setError(t("harita.locationNotFound"));
        return;
      }
      setForm((p) => ({ ...p, default_lat: String(lat), default_lng: String(lng) }));
    } catch (err) {
      console.error("Map geocode error:", err);
      setError(t("harita.locationFindError"));
    }
  };

  return (
    <div className="bg-[#161616] border border-[#262626] rounded-2xl p-6 shadow-[0_0_24px_rgba(245,183,0,0.06)] space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4 border-b border-[#262626] pb-3">
        {t("harita.title")}
      </h3>
      {loading ? <p className="text-xs text-gray-500">{t("common.loading")}</p> : null}
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
      <div className="space-y-2">
        <p className="text-xs text-gray-400">{t("harita.providerLabel")}</p>
        <div className="flex flex-wrap gap-3" role="radiogroup" aria-label={t("harita.providerLabel")}>
          <label className="flex items-center gap-2.5 cursor-pointer text-sm text-white select-none">
            <input
              type="radio"
              name="map_provider"
              checked={form.map_provider === "leaflet"}
              onChange={() => setForm((p) => ({ ...p, map_provider: "leaflet" }))}
              disabled={readOnly}
              className="h-4 w-4 shrink-0 accent-[#f5b700] cursor-pointer"
            />
            {t("harita.providerLeaflet")}
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer text-sm text-white select-none">
            <input
              type="radio"
              name="map_provider"
              checked={form.map_provider === "google_maps"}
              onChange={() => setForm((p) => ({ ...p, map_provider: "google_maps" }))}
              disabled={readOnly}
              className="h-4 w-4 shrink-0 accent-[#f5b700] cursor-pointer"
            />
            {t("harita.providerGoogle")}
          </label>
        </div>
      </div>
      <input
        value={form.google_maps_api_key}
        onChange={(e) => setForm((p) => ({ ...p, google_maps_api_key: e.target.value }))}
        disabled={readOnly}
        className="w-full bg-black border border-[#262626] rounded-xl px-4 py-3 text-white outline-none focus:border-[#f5b700]"
        placeholder={t("harita.apiKey")}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          value={form.country}
          onChange={(e) => {
            const nextCountry = e.target.value;
            setForm((p) => ({ ...p, country: nextCountry, city: "" }));
            const exact = countryOptions.find(
              (item) => item.country.toLowerCase() === nextCountry.trim().toLowerCase()
            );
            setCountryCode(exact?.countryCode ?? "");
          }}
          disabled={readOnly}
          list="country-list"
          autoComplete="off"
          className="w-full bg-black border border-[#262626] rounded-xl px-4 py-3 text-white outline-none focus:border-[#f5b700]"
          placeholder={t("harita.country")}
        />
        <datalist id="country-list">
          {countryOptions.map((country) => (
            <option key={country.countryCode} value={country.country} />
          ))}
        </datalist>
        <input
          value={form.city}
          onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
          disabled={readOnly}
          list="city-list"
          autoComplete="off"
          className="w-full bg-black border border-[#262626] rounded-xl px-4 py-3 text-white outline-none focus:border-[#f5b700]"
          placeholder={countryCode ? t("harita.city") : t("harita.selectCountryFirst")}
        />
        <datalist id="city-list">
          {cityOptions.map((city) => (
            <option key={city.slug} value={city.name} />
          ))}
        </datalist>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          value={form.default_lat}
          onChange={(e) => setForm((p) => ({ ...p, default_lat: e.target.value }))}
          disabled={readOnly}
          className="w-full bg-black border border-[#262626] rounded-xl px-4 py-3 text-white outline-none focus:border-[#f5b700]"
          placeholder={t("harita.lat")}
        />
        <input
          value={form.default_lng}
          onChange={(e) => setForm((p) => ({ ...p, default_lng: e.target.value }))}
          disabled={readOnly}
          className="w-full bg-black border border-[#262626] rounded-xl px-4 py-3 text-white outline-none focus:border-[#f5b700]"
          placeholder={t("harita.lng")}
        />
        <input
          value={form.default_zoom}
          onChange={(e) => setForm((p) => ({ ...p, default_zoom: e.target.value }))}
          disabled={readOnly}
          className="w-full bg-black border border-[#262626] rounded-xl px-4 py-3 text-white outline-none focus:border-[#f5b700]"
          placeholder={t("harita.zoom")}
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={findCoordinates}
          disabled={readOnly}
          className="bg-[#222] text-white px-4 py-2 rounded-xl font-bold hover:bg-[#2f2f2f] transition-all disabled:opacity-60"
        >
          {t("harita.findLocation")}
        </button>
        <button
          onClick={onSave}
          disabled={saving || readOnly}
          className="bg-[#f5b700] text-black px-4 py-2 rounded-xl font-bold hover:bg-[#eab308] transition-all disabled:opacity-60"
        >
          {saving ? t("common.saving") : t("common.save")}
        </button>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import type { LatLngExpression } from "leaflet";
import { api } from "@/services/api.ts";
import LiveMapGoogle from "@/components/map/LiveMapGoogle.tsx";
import LiveMapLeaflet from "@/components/map/LiveMapLeaflet.tsx";

type MapRow = {
  map_provider?: string | null;
  google_maps_api_key?: string | null;
  default_lat?: number | null;
  default_lng?: number | null;
  country?: string | null;
  city?: string | null;
  default_zoom?: number | null;
};

const FALLBACK_LAT = 36.8969;
const FALLBACK_LNG = 30.7133;

export default function LiveMap() {
  const [row, setRow] = useState<MapRow | null | undefined>(undefined);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<MapRow | null>("/settings/map");
        if (!cancelled) {
          setRow(res.data ?? null);
          setLoadError(false);
        }
      } catch {
        if (!cancelled) {
          setRow(null);
          setLoadError(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const centerLeaflet: LatLngExpression = useMemo(() => {
    const lat = Number(row?.default_lat);
    const lng = Number(row?.default_lng);
    const useCustom =
      row != null && Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0);
    return [useCustom ? lat : FALLBACK_LAT, useCustom ? lng : FALLBACK_LNG];
  }, [row]);

  const centerGoogle = useMemo(() => {
    const lat = Number(row?.default_lat);
    const lng = Number(row?.default_lng);
    const useCustom =
      row != null && Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0);
    return {
      lat: useCustom ? lat : FALLBACK_LAT,
      lng: useCustom ? lng : FALLBACK_LNG,
    };
  }, [row]);
  const zoom = useMemo(() => {
    const z = Number(row?.default_zoom);
    return Number.isFinite(z) ? Math.max(3, Math.min(20, Math.round(z))) : 13;
  }, [row?.default_zoom]);

  if (row === undefined) {
    return (
      <div className="w-full h-[300px] max-w-full min-h-0 rounded-xl border border-[#262626] bg-[#161616] flex items-center justify-center text-sm text-gray-500 lg:h-full lg:flex-1">
        Harita yükleniyor…
      </div>
    );
  }

  const wantGoogle = row?.map_provider === "google_maps";
  const apiKey = (row?.google_maps_api_key ?? "").trim();

  if (wantGoogle && apiKey) {
    return <LiveMapGoogle apiKey={apiKey} center={centerGoogle} zoom={zoom} />;
  }

  return (
    <div className="w-full h-full min-h-[220px]">
      {wantGoogle && !apiKey ? (
        <p className="text-xs text-amber-400/90 mb-2 shrink-0">
          Google Haritalar seçili ancak API anahtarı yok; OpenStreetMap (Leaflet) gösteriliyor.
        </p>
      ) : null}
      {loadError ? (
        <p className="text-xs text-gray-500 mb-2 shrink-0">
          Harita ayarları alınamadı; varsayılan merkez kullanılıyor.
        </p>
      ) : null}
      {!loadError && (row?.country || row?.city) ? (
        <p className="text-xs text-gray-300 mb-2 shrink-0">
          {String(row?.city || "").trim()}
          {row?.city && row?.country ? ", " : ""}
          {String(row?.country || "").trim()} · zoom {zoom}
        </p>
      ) : null}
      <div className="w-full h-[calc(100%-26px)] min-h-[200px] min-w-0">
        <LiveMapLeaflet center={centerLeaflet} zoom={zoom} />
      </div>
    </div>
  );
}

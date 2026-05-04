import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  useMap,
} from "react-leaflet";
import type { LatLngTuple } from "leaflet";
import "leaflet/dist/leaflet.css";
import { api } from "@/services/api.ts";

type Ride = {
  id: string;
  passenger: string;
  driver: string;
  pickup: string;
  dropoff: string;
  km: number;
  price: number;
  status: "completed" | "ongoing" | "pending";
  time: string;
  coords: [number, number][];
};

type ApiTrip = {
  id: string;
  rider_name?: string | null;
  driver_name?: string | null;
  start_lat: number;
  start_lng: number;
  end_lat: number;
  end_lng: number;
  estimated_distance_km?: number | null;
  price?: number | null;
  status: string;
  created_at?: string | null;
};

/* ===================== */
/* AUTO ZOOM FIXED */
/* ===================== */
function FitBounds({ coords }: { coords: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (!coords.length) return;

    const bounds: LatLngTuple[] = coords.map(
      (c) => [c[0], c[1]] as LatLngTuple
    );

    map.fitBounds(bounds, {
      padding: [80, 80],
    });
  }, [coords, map]);

  return null;
}

/* ===================== */
/* MAIN */
/* ===================== */
export default function Trips() {
  const { i18n } = useTranslation();
  const isEn = i18n.language.startsWith("en");
  const [rides, setRides] = useState<Ride[]>([]);
  const [filter, setFilter] = useState("all");
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await api.get<{ trips: ApiTrip[] }>("/trips");
        const next = (res.data?.trips ?? []).map((t) => {
          const uiStatus: Ride["status"] =
            t.status === "completed"
              ? "completed"
              : t.status === "accepted" || t.status === "in_progress"
              ? "ongoing"
              : "pending";
          return {
            id: t.id,
            passenger: t.rider_name ?? (isEn ? "Passenger" : "Yolcu"),
            driver: t.driver_name ?? (isEn ? "Unassigned" : "Atanmadı"),
            pickup: `${Number(t.start_lat).toFixed(4)}, ${Number(t.start_lng).toFixed(4)}`,
            dropoff: `${Number(t.end_lat).toFixed(4)}, ${Number(t.end_lng).toFixed(4)}`,
            km: Number(t.estimated_distance_km ?? 0),
            price: Number(t.price ?? 0),
            status: uiStatus,
            time: t.created_at ? new Date(t.created_at).toLocaleString(isEn ? "en-US" : "tr-TR") : "-",
            coords: [
              [Number(t.start_lat), Number(t.start_lng)],
              [Number(t.end_lat), Number(t.end_lng)],
            ],
          } satisfies Ride;
        });
        if (!cancelled) setRides(next);
      } catch (error) {
        console.error("Trips load error:", error);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = rides.filter((r) => {
    if (filter === "all") return true;
    return r.status === filter;
  });

  return (
    <div className="p-6 text-white bg-black min-h-screen">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{isEn ? "Trips" : "Yolculuklar"}</h1>
          <p className="text-gray-400 text-sm">
            {isEn ? "Track all active and past trips." : "Tüm aktif ve geçmiş yolculukları izleyin."}
          </p>
        </div>

        <button
          onClick={() =>
            window.alert(
              isEn
                ? "New trip creation is available from the rider app flow."
                : "Yeni yolculuk olusturma islemi yolcu uygulamasi akisindan yapilir."
            )
          }
          className="bg-yellow-500 text-black px-4 py-2 rounded-lg font-semibold shadow-[0_0_20px_rgba(255,200,0,0.4)]"
        >
          {isEn ? "+ New Trip" : "+ Yeni Yolculuk"}
        </button>
      </div>

      {/* FILTER */}
      <div className="flex gap-2 mb-6">
        {[
          { key: "all", label: isEn ? "All" : "Tümü" },
          { key: "completed", label: isEn ? "Completed" : "Tamamlandı" },
          { key: "ongoing", label: isEn ? "Ongoing" : "Devam Ediyor" },
          { key: "pending", label: isEn ? "Pending" : "Beklemede" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-lg text-sm transition ${
              filter === f.key
                ? "bg-yellow-500 text-black shadow-[0_0_15px_rgba(255,200,0,0.7)]"
                : "bg-[#111] text-gray-400 border border-gray-800"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* LIST */}
      <div className="space-y-4">
        {filtered.map((ride) => (
          <div
            key={ride.id}
            onClick={() => setSelectedRide(ride)}
            className="flex justify-between items-center bg-[#0b0b0b] border border-gray-800 rounded-xl p-5 hover:border-yellow-500 cursor-pointer transition"
          >
            {/* LEFT */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center mt-1">
                <div className="w-3 h-3 bg-purple-500 rounded-full" />
                <div className="w-0.5 h-10 bg-gray-700" />
                <div className="w-3 h-3 bg-blue-400 rounded-full" />
              </div>

              <div>
                <div className="text-xs text-gray-500">{ride.time}</div>

                <div className="text-xs text-gray-500 mt-1">{isEn ? "PICKUP" : "ALIŞ"}</div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-purple-400" />
                  {ride.pickup}
                </div>

                <div className="text-xs text-gray-500 mt-2">{isEn ? "DROPOFF" : "BIRAKIŞ"}</div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-400" />
                  {ride.dropoff}
                </div>

                <div className="text-xs text-gray-500 mt-1">
                  {ride.km} km
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div className="text-right">
              <div className="text-purple-400 font-bold">
                ₺{ride.price}
              </div>

              <div
                className={`text-sm ${
                  ride.status === "completed"
                    ? "text-green-400"
                    : ride.status === "ongoing"
                    ? "text-yellow-400"
                    : "text-gray-400"
                }`}
              >
                {ride.status === "completed"
                  ? isEn ? "Completed" : "Tamamlandı"
                  : ride.status === "ongoing"
                  ? isEn ? "Ongoing" : "Devam Ediyor"
                  : isEn ? "Pending" : "Beklemede"}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL — body'ye portal: üst layout z-0 içinde kalsa bile sidebar (z-50) üstünde */}
      {selectedRide &&
        createPortal(
          <div className="fixed inset-0 z-[200] flex flex-col bg-black/90">

          {/* MAP */}
          {/* EKLENDİ */}
          <div className="h-[45%] sm:h-[55%] lg:h-[60%] w-full min-h-0">
            <MapContainer
              center={selectedRide.coords[0]}
              zoom={13}
              className="h-full w-full"
            >
              <TileLayer url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png" />

              <FitBounds coords={selectedRide.coords} />

              {/* GLOW */}
              <Polyline
                positions={selectedRide.coords}
                pathOptions={{
                  color: "#facc15",
                  weight: 12,
                  opacity: 0.2,
                }}
              />

              {/* MAIN */}
              <Polyline
                positions={selectedRide.coords}
                pathOptions={{
                  color: "#facc15",
                  weight: 5,
                }}
              />

              <Marker position={selectedRide.coords[0]} />
              <Marker
                position={
                  selectedRide.coords[selectedRide.coords.length - 1]
                }
              />
            </MapContainer>
          </div>

          {/* BOTTOM */}
          <div className="flex-1 min-h-0 overflow-y-auto bg-[#0b0b0b] rounded-t-3xl p-6 border-t border-yellow-500 sm:h-auto sm:max-h-[45%]">

            <div className="flex justify-between mb-4 gap-4">
              <h2 className="font-semibold">{isEn ? "Trip Detail" : "Yolculuk Detayı"}</h2>
              <button
                type="button"
                className="shrink-0 text-gray-400 hover:text-white px-2"
                onClick={() => setSelectedRide(null)}
              >
                ✕
              </button>
            </div>

            <div className="flex gap-4 mb-4">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 bg-purple-500 rounded-full" />
                <div className="w-0.5 h-10 bg-gray-700" />
                <div className="w-3 h-3 bg-blue-400 rounded-full" />
              </div>

              <div>
                <div className="text-sm text-gray-400">{isEn ? "Pickup Point" : "Alış Noktası"}</div>
                <div>{selectedRide.pickup}</div>

                <div className="text-sm text-gray-400 mt-2">
                  {isEn ? "Dropoff Point" : "Varış Noktası"}
                </div>
                <div>{selectedRide.dropoff}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black p-3 rounded-lg border border-gray-800 min-w-0">
                <div className="text-xs text-gray-400">{isEn ? "Passenger" : "Yolcu"}</div>
                <div className="truncate">{selectedRide.passenger}</div>
              </div>

              <div className="bg-black p-3 rounded-lg border border-gray-800 min-w-0">
                <div className="text-xs text-gray-400">{isEn ? "Driver" : "Sürücü"}</div>
                <div className="text-yellow-400 truncate">
                  {selectedRide.driver}
                </div>
              </div>

              <div className="bg-black p-3 rounded-lg border border-gray-800 min-w-0">
                <div className="text-xs text-gray-400">{isEn ? "Distance" : "Mesafe"}</div>
                <div>{selectedRide.km} km</div>
              </div>

              <div className="bg-black p-3 rounded-lg border border-gray-800 min-w-0">
                <div className="text-xs text-gray-400">{isEn ? "Fare" : "Ücret"}</div>
                <div className="text-purple-400 text-lg">
                  ₺{selectedRide.price}
                </div>
              </div>
            </div>

          </div>
        </div>,
          document.body
        )}
    </div>
  );
}
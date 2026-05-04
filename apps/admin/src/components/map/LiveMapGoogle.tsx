import { GoogleMap, InfoWindow, Marker, useJsApiLoader } from "@react-google-maps/api";
import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import type { VehicleTypeId } from "@/types/vehicleTypes.ts";
import { displaySpreadForMapVehicle } from "@/components/map/vehicleMapHelpers.ts";
import { useLiveMapCars } from "@/hooks/useLiveMapCars.ts";

const MAP_REFERENCE_LAT = 36.8969;

const VEHICLE_TYPE_POPUP_LABEL: Record<VehicleTypeId, string> = {
  normal: "Normal",
  premium: "Premium",
  vip: "VIP",
  motor: "Motor",
};

const mapContainerStyle: CSSProperties = {
  width: "100%",
  height: "100%",
};

type LatLngLiteral = { lat: number; lng: number };

type Props = {
  apiKey: string;
  center: LatLngLiteral;
  zoom?: number;
};

export default function LiveMapGoogle({ apiKey, center, zoom = 13 }: Props) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "admin-live-map-google",
    googleMapsApiKey: apiKey,
  });
  const { cars, drivers } = useLiveMapCars();
  const [openId, setOpenId] = useState<number | null>(null);

  const markers = useMemo(
    () =>
      cars.map((car, listIndex) => {
        const billing = drivers.find((d) => d.id === car.id);
        const name = billing?.name ?? `Sürücü #${car.id}`;
        const typePart =
          car.vehicleType != null ? VEHICLE_TYPE_POPUP_LABEL[car.vehicleType] : "Araç";
        const label = `${name} · ${typePart}`;
        const spread = displaySpreadForMapVehicle(car.id, listIndex, MAP_REFERENCE_LAT);
        return {
          id: car.id,
          position: {
            lat: car.lat + spread.lat,
            lng: car.lng + spread.lng,
          } satisfies LatLngLiteral,
          label,
        };
      }),
    [cars, drivers]
  );

  if (loadError) {
    return (
      <div className="w-full h-[300px] max-w-full min-h-0 rounded-xl border border-red-900/50 bg-[#161616] flex items-center justify-center text-sm text-red-400 lg:h-full lg:flex-1 px-4 text-center">
        Google Haritalar yüklenemedi. API anahtarını ve kısıtlamaları kontrol edin.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-[300px] max-w-full min-h-0 rounded-xl border border-[#262626] bg-[#161616] flex items-center justify-center text-sm text-gray-500 lg:h-full lg:flex-1">
        Harita yükleniyor…
      </div>
    );
  }

  return (
    <div className="w-full h-[300px] max-w-full min-h-0 rounded-xl overflow-hidden relative z-0 isolate border border-[#262626] lg:h-full lg:min-h-0 lg:flex-1">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={zoom}
        options={{
          fullscreenControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          backgroundColor: "#161616",
        }}
      >
        {markers.map((m) => (
          <Marker
            key={m.id}
            position={m.position}
            onClick={() => setOpenId(m.id)}
            title={m.label}
          >
            {openId === m.id ? (
              <InfoWindow onCloseClick={() => setOpenId(null)}>
                <div className="text-black text-sm">{m.label}</div>
              </InfoWindow>
            ) : null}
          </Marker>
        ))}
      </GoogleMap>
    </div>
  );
}

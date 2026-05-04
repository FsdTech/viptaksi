import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";
import { useLayoutEffect, useMemo, useRef } from "react";
import type { LatLngExpression, LatLngTuple } from "leaflet";
import type { Marker as LeafletMarker } from "leaflet";
import type { VehicleTypeId } from "@/types/vehicleTypes.ts";
import {
  applyRotationToMarkerElement,
  displaySpreadForMapVehicle,
  pickVehicleIcon,
} from "@/components/map/vehicleMapHelpers.ts";
import { useLiveMapCars } from "@/hooks/useLiveMapCars.ts";

const MAP_REFERENCE_LAT = 36.8969;

const VEHICLE_TYPE_POPUP_LABEL: Record<VehicleTypeId, string> = {
  normal: "Normal",
  premium: "Premium",
  vip: "VIP",
  motor: "Motor",
};

function RotatingVehicleMarker({
  carId,
  position,
  headingDeg,
  vehicleType,
  popupTitle,
}: {
  carId: number;
  position: LatLngTuple;
  headingDeg: number;
  vehicleType: VehicleTypeId | null;
  popupTitle: string;
}) {
  const isMotor = vehicleType === "motor";
  const icon = useMemo(() => pickVehicleIcon(isMotor), [isMotor]);
  const markerRef = useRef<LeafletMarker | null>(null);

  useLayoutEffect(() => {
    applyRotationToMarkerElement(markerRef.current, headingDeg);
    const id = requestAnimationFrame(() =>
      applyRotationToMarkerElement(markerRef.current, headingDeg)
    );
    return () => cancelAnimationFrame(id);
  }, [headingDeg]);

  useLayoutEffect(() => {
    applyRotationToMarkerElement(markerRef.current, headingDeg);
  }, [position, headingDeg]);

  return (
    <Marker
      ref={markerRef}
      position={position}
      icon={icon}
      zIndexOffset={carId % 500}
    >
      <Popup>{popupTitle}</Popup>
    </Marker>
  );
}

type Props = {
  center: LatLngExpression;
  zoom?: number;
};

export default function LiveMapLeaflet({ center, zoom = 13 }: Props) {
  const { cars, drivers } = useLiveMapCars();

  return (
    <div className="w-full h-[300px] max-w-full min-h-0 rounded-xl overflow-hidden relative z-0 isolate border border-[#262626] lg:h-full lg:min-h-0 lg:flex-1 [&_.leaflet-container]:!z-0 [&_.leaflet-container]:!relative">
      <MapContainer
        center={center}
        zoom={zoom}
        className="w-full h-full relative z-0"
        style={{
          height: "100%",
          width: "100%",
          background: "#161616",
          zIndex: 0,
          position: "relative",
        }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {cars.map((car, listIndex) => {
          const billing = drivers.find((d) => d.id === car.id);
          const name = billing?.name ?? `Sürücü #${car.id}`;
          const typePart =
            car.vehicleType != null ? VEHICLE_TYPE_POPUP_LABEL[car.vehicleType] : "Araç";
          const label = `${name} · ${typePart}`;
          const spread = displaySpreadForMapVehicle(car.id, listIndex, MAP_REFERENCE_LAT);
          const displayPos: LatLngTuple = [car.lat + spread.lat, car.lng + spread.lng];
          return (
            <RotatingVehicleMarker
              key={car.id}
              carId={car.id}
              position={displayPos}
              headingDeg={car.headingDeg}
              vehicleType={car.vehicleType}
              popupTitle={label}
            />
          );
        })}
      </MapContainer>
    </div>
  );
}

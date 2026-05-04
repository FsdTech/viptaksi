import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { getApiBaseUrl } from "@/services/api.ts";
import type { VehicleTypeId } from "@/types/vehicleTypes.ts";
import { isVehicleTypeId } from "@/types/vehicleTypes.ts";
import {
  distanceSqDeg,
  geographicBearingDeg,
  lerpHeadingDeg,
  smoothToward1D,
} from "@/components/map/vehicleMapHelpers.ts";

export type LiveMapCar = {
  id: number;
  lat: number;
  lng: number;
  targetLat: number;
  targetLng: number;
  headingDeg: number;
  vehicleType: VehicleTypeId | null;
};

const ANIM_INTERVAL_MS = 32;
const POSITION_TAU_MS = 340;
const ROTATION_TAU_MS = 260;
const TELEPORT_DIST2_DEG = 0.0025;

function resolveVehicleTypeFromPayload(
  raw: unknown,
  driver: { id: number; vehicleType: VehicleTypeId | null } | undefined
): VehicleTypeId | null {
  if (typeof raw === "string" && isVehicleTypeId(raw)) return raw;
  const fromDriver = driver?.vehicleType;
  if (fromDriver && isVehicleTypeId(fromDriver)) return fromDriver;
  return null;
}

function stepMapCar(car: LiveMapCar, dtMs: number): LiveMapCar {
  const dLat = car.targetLat - car.lat;
  const dLng = car.targetLng - car.lng;
  const dist2 = dLat * dLat + dLng * dLng;

  if (dist2 > TELEPORT_DIST2_DEG) {
    const snapBearing = geographicBearingDeg(
      car.lat,
      car.lng,
      car.targetLat,
      car.targetLng
    );
    return {
      ...car,
      lat: car.targetLat,
      lng: car.targetLng,
      headingDeg: snapBearing ?? car.headingDeg,
    };
  }

  const lat = smoothToward1D(car.lat, car.targetLat, dtMs, POSITION_TAU_MS);
  const lng = smoothToward1D(car.lng, car.targetLng, dtMs, POSITION_TAU_MS);

  const moved2 = distanceSqDeg(car.lat, car.lng, lat, lng);
  let headingDeg = car.headingDeg;

  const bearingToTarget = geographicBearingDeg(
    car.lat,
    car.lng,
    car.targetLat,
    car.targetLng
  );

  const rotT = 1 - Math.exp(-dtMs / ROTATION_TAU_MS);

  const motionBearing = geographicBearingDeg(car.lat, car.lng, lat, lng);
  if (motionBearing !== null && moved2 > 5e-16) {
    headingDeg = lerpHeadingDeg(headingDeg, motionBearing, Math.min(1, rotT * 1.2));
  } else if (bearingToTarget !== null && dist2 > 1e-13) {
    headingDeg = lerpHeadingDeg(headingDeg, bearingToTarget, rotT * 0.45);
  }

  const nearlyStopped = dist2 < 5e-15 && moved2 < 1e-16;
  if (nearlyStopped) {
    const idleDeg = (Math.abs(car.id) * 137.508) % 360;
    headingDeg = lerpHeadingDeg(headingDeg, idleDeg, 0.07);
  }

  return { ...car, lat, lng, headingDeg };
}

export function useLiveMapCars() {
  const [cars, setCars] = useState<LiveMapCar[]>([]);
  const [drivers, setDrivers] = useState<
    { id: number; name: string; vehicleType: VehicleTypeId | null }[]
  >([]);
  const driversRef = useRef(drivers);

  useEffect(() => {
    driversRef.current = drivers;
  }, [drivers]);

  useEffect(() => {
    setCars((prev) => {
      let changed = false;
      const next = prev.map((car) => {
        const d = drivers.find((x) => x.id === car.id);
        if (!d) return car;
        const vt = d.vehicleType;
        if (vt === car.vehicleType) return car;
        changed = true;
        return { ...car, vehicleType: vt };
      });
      return changed ? next : prev;
    });
  }, [drivers]);

  useEffect(() => {
    const token =
      window.localStorage.getItem("token") || window.localStorage.getItem("viptaksi-admin-token");
    if (!token) return;
    const apiBase = getApiBaseUrl();
    if (!apiBase) return;

    const mapVehicleTypeFromName = (name: unknown): VehicleTypeId | null => {
      const lower = String(name ?? "").toLowerCase();
      if (lower.includes("motor")) return "motor";
      if (lower.includes("vip")) return "vip";
      if (lower.includes("premium")) return "premium";
      if (lower.includes("normal")) return "normal";
      return null;
    };

    const hydrateDrivers = async () => {
      try {
        const res = await fetch(`${apiBase.replace(/\/$/, "")}/drivers`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = (await res.json().catch(() => ({}))) as {
          drivers?: Array<{ id?: number; user?: { name?: string }; vehicleType?: { name?: string } }>;
        };
        const rawDrivers = Array.isArray(data.drivers) ? data.drivers : [];
        const nextDrivers = rawDrivers
          .map((d) => ({
            id: Number(d.id),
            name: String(d.user?.name || `Sürücü #${Number(d.id)}`),
            vehicleType: mapVehicleTypeFromName(d.vehicleType?.name),
          }))
          .filter((d) => Number.isFinite(d.id));
        setDrivers(nextDrivers);

        // Socket event gecikirse harita boş kalmasın diye API snapshot'tan da marker üret.
        setCars((prev) =>
          rawDrivers
            .map((d) => {
              const id = Number(d.id);
              const lat = Number((d as { lat?: number }).lat);
              const lng = Number((d as { lng?: number }).lng);
              if (!Number.isFinite(id) || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
              const old = prev.find((p) => p.id === id);
              const startLat = old?.lat ?? lat;
              const startLng = old?.lng ?? lng;
              const heading = old?.headingDeg ?? geographicBearingDeg(startLat, startLng, lat, lng) ?? 0;
              return {
                id,
                lat: startLat,
                lng: startLng,
                targetLat: lat,
                targetLng: lng,
                headingDeg: heading,
                vehicleType: mapVehicleTypeFromName(d.vehicleType?.name),
              } satisfies LiveMapCar;
            })
            .filter((x): x is LiveMapCar => x != null)
        );
      } catch (err) {
        console.error(err);
      }
    };

    void hydrateDrivers();
    const pollTimer = window.setInterval(() => {
      void hydrateDrivers();
    }, 10000);

    const socket = io(apiBase, {
      transports: ["websocket"],
      auth: { token },
    });

    socket.on("admin:drivers:update", (payload: unknown) => {
      try {
        const packet = payload as {
          drivers?: Array<{
            id?: number;
            name?: string;
            lat?: number;
            lng?: number;
            vehicleTypeName?: string;
          }>;
        };
        const incoming = Array.isArray(packet.drivers) ? packet.drivers : [];
        setDrivers(
          incoming
            .map((d) => ({
              id: Number(d.id),
              name: String(d.name || `Sürücü #${Number(d.id)}`),
              vehicleType: mapVehicleTypeFromName(d.vehicleTypeName),
            }))
            .filter((d) => Number.isFinite(d.id))
        );
        setCars((prev) =>
          incoming
            .map((car: unknown) => {
              if (!car || typeof car !== "object") {
                return null;
              }
              const c = car as Record<string, unknown>;
              const id = Number(c.id);
              const lat = Number(c.lat);
              const lng = Number(c.lng);
              if (!Number.isFinite(id) || !Number.isFinite(lat) || !Number.isFinite(lng)) {
                return null;
              }
              const old = prev.find((p) => p.id === id);
              const driver = driversRef.current.find((d) => d.id === id);
              const vt = resolveVehicleTypeFromPayload(c.vehicleTypeName, driver);
              const startLat = old?.lat ?? lat;
              const startLng = old?.lng ?? lng;
              const initialHeading =
                old?.headingDeg ?? geographicBearingDeg(startLat, startLng, lat, lng) ?? 0;
              return {
                id,
                lat: startLat,
                lng: startLng,
                targetLat: lat,
                targetLng: lng,
                headingDeg: initialHeading,
                vehicleType: vt,
              } satisfies LiveMapCar;
            })
            .filter((x): x is LiveMapCar => x != null)
        );
      } catch (err) {
        console.error(err);
      }
    });

    return () => {
      window.clearInterval(pollTimer);
      socket.off("admin:drivers:update");
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCars((prev) => {
        if (prev.length === 0) return prev;
        return prev.map((car) => stepMapCar(car, ANIM_INTERVAL_MS));
      });
    }, ANIM_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, []);

  return { cars, drivers };
}

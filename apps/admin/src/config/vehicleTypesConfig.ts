/* EKLENDİ - 2026-04-04 */
import type { VehicleTypeId } from "@/types/vehicleTypes.ts";
import { VEHICLE_TYPE_IDS } from "@/types/vehicleTypes.ts";

/** lucide-react ile eşleşen anahtar (servis / API yanıtları için) */
export type VehicleTypeIconKey = "Car" | "Bike";

export type VehicleTypeDefinition = {
  id: VehicleTypeId;
  label: string;
  icon: VehicleTypeIconKey;
  /** VIP: aynı Car ikonu, ek vurgu sınıfları ile */
  highlight?: "vip";
  defaultBaseFare: number;
};

export const VEHICLE_TYPE_DEFINITIONS: readonly VehicleTypeDefinition[] = [
  {
    id: "normal",
    label: "Normal",
    icon: "Car",
    defaultBaseFare: 35,
  },
  {
    id: "premium",
    label: "Premium",
    icon: "Car",
    defaultBaseFare: 45,
  },
  {
    id: "vip",
    label: "VIP",
    icon: "Car",
    highlight: "vip",
    defaultBaseFare: 60,
  },
  {
    id: "motor",
    label: "Motor",
    icon: "Bike",
    defaultBaseFare: 25,
  },
] as const;

const defById = new Map(
  VEHICLE_TYPE_DEFINITIONS.map((d) => [d.id, d] as const)
);

export function getVehicleTypeDefinition(
  id: VehicleTypeId
): VehicleTypeDefinition | undefined {
  return defById.get(id);
}

export const DEFAULT_BASE_FARE_BY_TYPE: Record<VehicleTypeId, number> =
  VEHICLE_TYPE_IDS.reduce(
    (acc, id) => {
      const d = defById.get(id);
      acc[id] = d?.defaultBaseFare ?? 0;
      return acc;
    },
    {} as Record<VehicleTypeId, number>
  );

/** İkon rengi — rozet renkleriyle uyumlu */
export function vehicleTypeIconToneClass(id: VehicleTypeId): string {
  switch (id) {
    case "normal":
      return "text-slate-400";
    case "premium":
      return "text-blue-400";
    case "vip":
      return "text-[#f5b700]";
    case "motor":
      return "text-purple-400";
    default:
      return "text-gray-400";
  }
}

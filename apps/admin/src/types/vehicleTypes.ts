/* EKLENDİ - 2026-04-04 */
export type VehicleTypeId = "normal" | "premium" | "vip" | "motor";

export const VEHICLE_TYPE_IDS: readonly VehicleTypeId[] = [
  "normal",
  "premium",
  "vip",
  "motor",
] as const;

export type ManagedVehicleType = {
  id: VehicleTypeId;
  label: string;
  active: boolean;
  sortOrder: number;
};

export const DEFAULT_VEHICLE_TYPE_RECORDS: ManagedVehicleType[] = [
  { id: "normal", label: "Normal", active: true, sortOrder: 0 },
  { id: "premium", label: "Premium", active: true, sortOrder: 1 },
  { id: "vip", label: "VIP", active: true, sortOrder: 2 },
  { id: "motor", label: "Motor", active: true, sortOrder: 3 },
];

export function legacyBillingTypeToVehicleType(
  t: "normal" | "premium"
): VehicleTypeId {
  return t === "premium" ? "premium" : "normal";
}

export function vehicleTypeToLegacyBillingType(
  vt: VehicleTypeId
): "normal" | "premium" {
  return vt === "premium" || vt === "vip" ? "premium" : "normal";
}

export function vehicleTypeBadgeClasses(id: VehicleTypeId): string {
  switch (id) {
    case "normal":
      return "bg-slate-500/15 text-slate-300 border-slate-500/35";
    case "premium":
      return "bg-blue-500/15 text-blue-300 border-blue-500/35";
    case "vip":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/35 shadow-[0_0_10px_rgba(245,183,0,0.2)]";
    case "motor":
      return "bg-purple-500/15 text-purple-300 border-purple-500/35";
    default:
      return "bg-[#1b1b1b] text-gray-300 border-[#2a2a2a]";
  }
}

export function isVehicleTypeId(v: string): v is VehicleTypeId {
  return (VEHICLE_TYPE_IDS as readonly string[]).includes(v);
}

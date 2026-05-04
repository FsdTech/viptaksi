/* EKLENDİ - 2026-04-04 */
import { Bike, Car } from "lucide-react";
import type { VehicleTypeId } from "@/types/vehicleTypes.ts";
import {
  getVehicleTypeDefinition,
  vehicleTypeIconToneClass,
} from "@/config/vehicleTypesConfig.ts";

type Props = {
  id: VehicleTypeId;
  size?: number;
  className?: string;
};

export function VehicleTypeIcon({ id, size = 18, className = "" }: Props) {
  const def = getVehicleTypeDefinition(id);
  const Icon = def?.icon === "Bike" ? Bike : Car;
  const tone = vehicleTypeIconToneClass(id);
  const isVip = id === "vip";

  const inner = (
    <Icon
      size={size}
      className={`${tone} ${isVip ? "drop-shadow-[0_0_8px_rgba(245,183,0,0.55)]" : ""}`.trim()}
      aria-hidden
    />
  );

  if (isVip) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-full border border-[#f5b700]/45 bg-[#f5b700]/10 shadow-[0_0_14px_rgba(245,183,0,0.35)] p-1 ${className}`.trim()}
        title="VIP"
      >
        {inner}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center justify-center ${className}`.trim()}>
      {inner}
    </span>
  );
}

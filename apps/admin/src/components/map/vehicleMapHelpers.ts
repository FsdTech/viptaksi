/* EKLENDİ - 2026-04-04 — harita araç ikonları, bearing ve interpolasyon */
import L from "leaflet";

const DEG = Math.PI / 180;

/* EKLENDİ - 2026-04-04 */
export function geographicBearingDeg(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number | null {
  const φ1 = lat1 * DEG;
  const φ2 = lat2 * DEG;
  const Δλ = (lng2 - lng1) * DEG;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  const θ = Math.atan2(y, x);
  return ((θ * 180) / Math.PI + 360) % 360;
}

/* EKLENDİ - 2026-04-04 — derece cinsinden mesafe (yaklaşık, küçük mesafeler için) */
export function distanceSqDeg(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = lat2 - lat1;
  const dLng = lng2 - lng1;
  return dLat * dLat + dLng * dLng;
}

/* EKLENDİ - 2026-04-04 — en kısa yoldan açı farkı [-180, 180] */
export function shortestAngleDeltaDeg(fromDeg: number, toDeg: number): number {
  let d = (((toDeg - fromDeg) % 360) + 360) % 360;
  if (d > 180) d -= 360;
  return d;
}

/* EKLENDİ - 2026-04-04 */
export function lerpHeadingDeg(
  currentDeg: number,
  targetDeg: number,
  t: number
): number {
  const clamped = Math.max(0, Math.min(1, t));
  const delta = shortestAngleDeltaDeg(currentDeg, targetDeg);
  return (currentDeg + delta * clamped + 360) % 360;
}

/* EKLENDİ - 2026-04-04 — frame-bağımsız yumuşak yaklaşma (exponential) */
export function smoothToward1D(
  current: number,
  target: number,
  dtMs: number,
  tauMs: number
): number {
  if (tauMs <= 0) return target;
  const alpha = 1 - Math.exp(-dtMs / tauMs);
  return current + (target - current) * alpha;
}

/* KALDIRILDI - 2026-04-04 — çok küçük halka, liste sırası yok; displaySpreadForMapVehicle kullanılıyor */
/*
export function displayOffsetForVehicleId(id: number) { ... ~25–90 m ... }
*/

/* EKLENDİ - 2026-04-04 — altın açı spiralı + metre cinsinden büyük ofset (üst üste binmeyi keser) */
const GOLDEN_ANGLE_RAD = 2.39996322972865332;

export function displaySpreadForMapVehicle(
  id: number,
  listIndex: number,
  referenceLatDeg: number
): { lat: number; lng: number } {
  const latRad = referenceLatDeg * DEG;
  const cosLat = Math.max(0.28, Math.cos(latRad));
  const meters = 52 + listIndex * 78 + (Math.abs(id) % 13) * 11;
  const theta = listIndex * GOLDEN_ANGLE_RAD + id * 0.271828;
  const rLat = meters / 111_320;
  const rLng = meters / (111_320 * cosLat);
  return {
    lat: Math.cos(theta) * rLat,
    lng: Math.sin(theta) * rLng,
  };
}

/* EKLENDİ - 2026-04-04 — üstten görünüm sedan: ön kaput yukarıda (kuzey), gölgeli */
function carSvgHtml(): string {
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 48" width="36" height="48" aria-hidden="true">
  <ellipse cx="18" cy="40" rx="10" ry="5" fill="black" opacity="0.35"/>
  <path d="M10 38 L10 22 Q10 14 18 10 Q26 14 26 22 L26 38 Q26 42 18 42 Q10 42 10 38 Z"
        fill="#f5b700" stroke="#0a0a0a" stroke-width="1.6" stroke-linejoin="round"/>
  <path d="M12 22 Q18 16 24 22 L24 30 Q18 34 12 30 Z" fill="#1a1a1a" stroke="#f5b700" stroke-width="1"/>
  <line x1="18" y1="12" x2="18" y2="18" stroke="#0a0a0a" stroke-width="1.2" opacity="0.5"/>
  <rect x="11" y="34" width="6" height="4" rx="1" fill="#222" stroke="#000" stroke-width="0.8"/>
  <rect x="19" y="34" width="6" height="4" rx="1" fill="#222" stroke="#000" stroke-width="0.8"/>
</svg>`.trim();
}

/* EKLENDİ - 2026-04-04 — motor: ön teker yukarı (kuzey) */
function motorSvgHtml(): string {
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 42" width="32" height="42" aria-hidden="true">
  <ellipse cx="16" cy="38" rx="9" ry="4" fill="black" opacity="0.3"/>
  <g stroke="#0a0a0a" stroke-width="1.3" stroke-linecap="round" fill="none">
    <circle cx="9" cy="30" r="5" fill="#a78bfa" stroke="#0a0a0a"/>
    <circle cx="23" cy="30" r="5" fill="#a78bfa" stroke="#0a0a0a"/>
    <path d="M9 30 L15 14 L23 30" stroke="#e9d5ff" stroke-width="2" fill="none"/>
    <path d="M15 14 L20 9" stroke="#f5b700" stroke-width="2"/>
    <circle cx="20" cy="8" r="3" fill="#f5b700" stroke="#0a0a0a"/>
  </g>
</svg>`.trim();
}

const ICON_W = 42;
const ICON_H = 52;

/* EKLENDİ - 2026-04-04 — dönüş: alt-orta (dingil); flex-end ile gövde zemine oturur */
function buildVehicleIconHtml(svgInner: string): string {
  return `<div class="vm-stack" style="width:${ICON_W}px;height:${ICON_H}px;position:relative;">
    <div class="vm-rot" style="position:absolute;left:0;right:0;bottom:0;height:100%;display:flex;align-items:flex-end;justify-content:center;transform-origin:50% 92%;will-change:transform;">
      ${svgInner}
    </div>
  </div>`;
}

/* EKLENDİ - 2026-04-04 */
const ANCHOR_X = ICON_W / 2;
const ANCHOR_Y = ICON_H - 2;

/* EKLENDİ - 2026-04-04 — sabit DivIcon (rotasyon DOM ile) */
export const CACHED_VEHICLE_DIV_ICON_CAR: L.DivIcon = L.divIcon({
  className: "vehicle-leaflet-marker",
  html: buildVehicleIconHtml(carSvgHtml()),
  iconSize: [ICON_W, ICON_H],
  iconAnchor: [ANCHOR_X, ANCHOR_Y],
  popupAnchor: [0, -ANCHOR_Y + 6],
});

/* EKLENDİ - 2026-04-04 */
export const CACHED_VEHICLE_DIV_ICON_MOTOR: L.DivIcon = L.divIcon({
  className: "vehicle-leaflet-marker",
  html: buildVehicleIconHtml(motorSvgHtml()),
  iconSize: [ICON_W, ICON_H],
  iconAnchor: [ANCHOR_X, ANCHOR_Y],
  popupAnchor: [0, -ANCHOR_Y + 6],
});

/* EKLENDİ - 2026-04-04 */
export function pickVehicleIcon(isMotor: boolean): L.DivIcon {
  return isMotor ? CACHED_VEHICLE_DIV_ICON_MOTOR : CACHED_VEHICLE_DIV_ICON_CAR;
}

/* EKLENDİ - 2026-04-04 — Leaflet + SVG birleşimi için ince ayar (gerekirse 0 dışı denenebilir) */
const MAP_MARKER_ROTATION_OFFSET_DEG = 0;

/* EKLENDİ - 2026-04-04 — CSS saat yönü = coğrafi bearing (kuzey=0°) */
export function applyRotationToMarkerElement(
  marker: L.Marker | null,
  headingDeg: number
): void {
  if (!marker) return;
  const el = marker.getElement?.();
  if (!el) return;
  const rot = el.querySelector(".vm-rot");
  if (rot instanceof HTMLElement) {
    const a = headingDeg + MAP_MARKER_ROTATION_OFFSET_DEG;
    rot.style.transform = `rotate(${a}deg)`;
  }
}

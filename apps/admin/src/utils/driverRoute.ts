export function toDriverAlias(indexZeroBased: number): string {
  return `drivers${indexZeroBased + 1}`;
}

export function parseDriverAlias(value: string): number | null {
  const m = /^drivers(\d+)$/i.exec(String(value || "").trim());
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}


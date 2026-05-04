export type DemoLogChannel = "HEALTH" | "RESET" | "LOCK" | "ENTRY";

export function demoLog(channel: DemoLogChannel, message: string, ...extra: unknown[]): void {
  const suffix = extra.length ? ` ${JSON.stringify(extra)}` : "";
  console.log(`[DEMO][${channel}] ${message}${suffix}`);
}

/** Thrown when a model-level operation would wipe the entire demo user or driver population. */
export class DemoSafetyError extends Error {
  readonly code = "DEMO_SAFETY" as const;
  constructor(message: string) {
    super(message);
    this.name = "DemoSafetyError";
  }
}

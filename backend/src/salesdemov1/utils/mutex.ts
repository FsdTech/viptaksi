/**
 * In-process async mutex for demo critical sections (pairs with Postgres advisory lock).
 */
class DemoMutex {
  private locked = false;
  private readonly waiters: Array<() => void> = [];

  async acquire(): Promise<void> {
    if (!this.locked) {
      this.locked = true;
      return;
    }
    await new Promise<void>((resolve) => {
      this.waiters.push(() => {
        this.locked = true;
        resolve();
      });
    });
  }

  release(): void {
    const next = this.waiters.shift();
    if (next) next();
    else this.locked = false;
  }
}

/** Singleton mutex for sales demo write paths. */
export const demoMutex = new DemoMutex();

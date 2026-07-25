import type { SalvazionHealthPlugin } from './definitions';

/** Web stub — system health stores are native-only. */
export class SalvazionHealthWeb implements SalvazionHealthPlugin {
  async isAvailable() {
    return {
      platform: 'web' as const,
      healthKit: false,
      healthConnect: false,
    };
  }

  async requestAuthorization() {
    return { authorized: false };
  }

  async queryToday() {
    return {};
  }
}

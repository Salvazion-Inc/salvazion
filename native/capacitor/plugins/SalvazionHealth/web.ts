import type { SalvazionHealthPlugin } from './definitions';

/** Web stub — real data comes from OAuth / phone sensors / manual entry. */
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

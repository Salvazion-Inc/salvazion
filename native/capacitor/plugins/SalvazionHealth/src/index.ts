import { registerPlugin } from '@capacitor/core';
import type { SalvazionHealthPlugin } from './definitions';

const SalvazionHealth = registerPlugin<SalvazionHealthPlugin>('SalvazionHealth', {
  web: () => import('./web').then((m) => new m.SalvazionHealthWeb()),
});

export * from './definitions';
export { SalvazionHealth };

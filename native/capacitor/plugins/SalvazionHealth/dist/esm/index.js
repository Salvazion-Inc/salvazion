import { registerPlugin } from '@capacitor/core';
const SalvazionHealth = registerPlugin('SalvazionHealth', {
    web: () => import('./web').then((m) => new m.SalvazionHealthWeb()),
});
export * from './definitions';
export { SalvazionHealth };

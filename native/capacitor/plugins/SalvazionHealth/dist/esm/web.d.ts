import type { SalvazionHealthPlugin } from './definitions';
/** Web stub — system health stores are native-only. */
export declare class SalvazionHealthWeb implements SalvazionHealthPlugin {
    isAvailable(): Promise<{
        platform: "web";
        healthKit: boolean;
        healthConnect: boolean;
    }>;
    requestAuthorization(): Promise<{
        authorized: boolean;
    }>;
    queryToday(): Promise<{}>;
}

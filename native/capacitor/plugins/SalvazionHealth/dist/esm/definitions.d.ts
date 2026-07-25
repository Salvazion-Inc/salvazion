export interface SalvazionHealthPlugin {
    isAvailable(): Promise<{
        platform: 'ios' | 'android' | 'web';
        healthKit: boolean;
        healthConnect: boolean;
    }>;
    requestAuthorization(options?: {
        read?: string[];
    }): Promise<{
        authorized: boolean;
    }>;
    queryToday(): Promise<{
        steps?: number;
        activeMinutes?: number;
        distanceMeters?: number;
        activeCalories?: number;
        restingHeartRate?: number;
        heartRateAvg?: number;
        hrv?: number;
        sleepMinutes?: number;
        sleepBed?: string;
        sleepWake?: string;
        spo2?: number;
        weightKg?: number;
    }>;
}

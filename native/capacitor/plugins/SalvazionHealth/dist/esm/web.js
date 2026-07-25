/** Web stub — system health stores are native-only. */
export class SalvazionHealthWeb {
    async isAvailable() {
        return {
            platform: 'web',
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

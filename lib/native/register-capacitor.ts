/**
 * Client-side Capacitor registration for the Salvazion native shell.
 * Safe to import on web — no-ops when Capacitor is absent.
 */

export async function registerCapacitorShell(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const core = await import('@capacitor/core');
    if (!core.Capacitor.isNativePlatform()) {
      return;
    }

    // Register health plugin (web stub + native when synced)
    try {
      const { SalvazionHealth } = await import('@salvazion/capacitor-health');
      // Expose for bridge.ts discovery
      (window as unknown as { SalvazionHealth?: unknown }).SalvazionHealth =
        SalvazionHealth;
      if (window.Capacitor?.Plugins) {
        (window.Capacitor.Plugins as Record<string, unknown>).SalvazionHealth =
          SalvazionHealth;
      }
    } catch {
      // Plugin package not installed yet
    }

    // Status bar / splash — optional
    try {
      const { StatusBar, Style } = await import('@capacitor/status-bar');
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#040404' });
    } catch {
      /* optional */
    }

    try {
      const { SplashScreen } = await import('@capacitor/splash-screen');
      await SplashScreen.hide();
    } catch {
      /* optional */
    }
  } catch {
    // @capacitor/core not installed — pure web
  }
}

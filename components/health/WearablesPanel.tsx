'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  WEARABLE_CATALOG,
  addMetricSample,
  getBleHeartRateMonitor,
  getCatalogItem,
  getCombinedHealthIndicators,
  hrSessionToMetrics,
  isWebBluetoothAvailable,
  linkWearable,
  loadLinkedWearables,
  tryWearableAutoLogs,
  unlinkWearable,
  type LinkedWearable,
  type LiveHeartRateSession,
  type WearableBrandId,
  type WearableConnectMode,
  type WearableMetricKey,
} from '@/lib/health/wearables';
import { useI18n } from '@/components/I18nProvider';

interface Props {
  onAutoLog: (actionType: string, label: string) => void;
  onSleepSynced?: (bedTime: string, wakeTime: string) => void;
}

const MANUAL_FIELDS: { key: WearableMetricKey; labelKey: string; placeholder: string }[] = [
  { key: 'steps', labelKey: 'wearables.fieldSteps', placeholder: '8500' },
  { key: 'active_minutes', labelKey: 'wearables.fieldActive', placeholder: '35' },
  { key: 'heart_rate', labelKey: 'wearables.fieldHr', placeholder: '68' },
  { key: 'resting_hr', labelKey: 'wearables.fieldRhr', placeholder: '55' },
  { key: 'hrv', labelKey: 'wearables.fieldHrv', placeholder: '42' },
  { key: 'sleep_hours', labelKey: 'wearables.fieldSleepH', placeholder: '7.5' },
  { key: 'sleep_bed', labelKey: 'wearables.fieldBed', placeholder: '22:30' },
  { key: 'sleep_wake', labelKey: 'wearables.fieldWake', placeholder: '06:30' },
  { key: 'distance_km', labelKey: 'wearables.fieldDistance', placeholder: '4.2' },
  { key: 'calories', labelKey: 'wearables.fieldCalories', placeholder: '2200' },
  { key: 'spo2', labelKey: 'wearables.fieldSpo2', placeholder: '98' },
  { key: 'readiness', labelKey: 'wearables.fieldReadiness', placeholder: '85' },
  { key: 'weight_kg', labelKey: 'wearables.fieldWeight', placeholder: '75' },
];

export default function WearablesPanel({ onAutoLog, onSleepSynced }: Props) {
  const { t, lang } = useI18n();
  const [devices, setDevices] = useState<LinkedWearable[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<WearableBrandId>('generic_ble_hr');
  const [customLabel, setCustomLabel] = useState('');
  const [connectMode, setConnectMode] = useState<WearableConnectMode>('web_bluetooth_hr');
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null);
  const [manual, setManual] = useState<Partial<Record<WearableMetricKey, string>>>({});
  const [liveHr, setLiveHr] = useState<LiveHeartRateSession | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [combined, setCombined] = useState(() =>
    typeof window !== 'undefined' ? getCombinedHealthIndicators() : null
  );

  const bleOk = isWebBluetoothAvailable();

  const refresh = useCallback(() => {
    setDevices(loadLinkedWearables());
    setCombined(getCombinedHealthIndicators());
  }, []);

  useEffect(() => {
    refresh();
    const mon = getBleHeartRateMonitor();
    setLiveHr(mon.current);
    return mon.subscribe(setLiveHr);
  }, [refresh]);

  const catalogItem = useMemo(() => getCatalogItem(selectedBrand), [selectedBrand]);

  useEffect(() => {
    if (!catalogItem) return;
    const preferred = catalogItem.connectModes[0];
    setConnectMode(preferred);
  }, [catalogItem]);

  const runAutoLog = () => {
    const logged = tryWearableAutoLogs(onAutoLog, {
      hit: lang === 'en' ? 'Wearable activity ≥ 15 min' : 'Actividad wearable ≥ 15 min',
      outdoor: lang === 'en' ? 'Wearable distance / outdoor' : 'Distancia / exterior wearable',
      sleep: lang === 'en' ? 'Wearable sleep' : 'Sueño del wearable',
    });
    const c = getCombinedHealthIndicators();
    if (c.wearable.sleepBed && c.wearable.sleepWake) {
      onSleepSynced?.(c.wearable.sleepBed, c.wearable.sleepWake);
    }
    if (logged.length) {
      setNote(t('wearables.autoLogged'));
    }
    setCombined(c);
  };

  const handleLink = () => {
    setError(null);
    const device = linkWearable({
      brandId: selectedBrand,
      label: customLabel || undefined,
      connectMode,
    });
    setShowAdd(false);
    setCustomLabel('');
    setActiveDeviceId(device.id);
    refresh();
    setNote(t('wearables.linked'));
  };

  const handleUnlink = (id: string) => {
    unlinkWearable(id);
    if (activeDeviceId === id) setActiveDeviceId(null);
    refresh();
  };

  const startBle = async (device: LinkedWearable) => {
    setError(null);
    setNote(null);
    setBusy(true);
    try {
      const mon = getBleHeartRateMonitor();
      const session = await mon.connect(device.id);
      setLiveHr(session);
      setActiveDeviceId(device.id);
      setNote(t('wearables.bleConnected', { name: session.deviceName }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      if (msg === 'BLE_UNSUPPORTED') setError(t('wearables.bleUnsupported'));
      else if (msg.toLowerCase().includes('cancel') || msg.toLowerCase().includes('user')) {
        setError(t('wearables.bleCancelled'));
      } else setError(t('wearables.bleError'));
    } finally {
      setBusy(false);
    }
  };

  const stopBle = async () => {
    setBusy(true);
    try {
      const mon = getBleHeartRateMonitor();
      const session = await mon.disconnect();
      setLiveHr(null);
      if (session && session.samples > 0) {
        const device = devices.find((d) => d.id === session.wearableId);
        if (device) {
          const metrics = hrSessionToMetrics(session);
          addMetricSample({
            wearableId: device.id,
            brandId: device.brandId,
            metrics: {
              ...(metrics.heart_rate != null ? { heart_rate: metrics.heart_rate } : {}),
              ...(metrics.active_minutes != null
                ? { active_minutes: metrics.active_minutes }
                : {}),
            },
            source: 'ble',
            note: session.deviceName,
          });
          runAutoLog();
          setNote(t('wearables.bleSaved'));
        }
      }
      refresh();
    } finally {
      setBusy(false);
    }
  };

  const saveManual = () => {
    if (!activeDeviceId) {
      setError(t('wearables.selectDevice'));
      return;
    }
    const device = devices.find((d) => d.id === activeDeviceId);
    if (!device) return;

    const metrics: Partial<Record<WearableMetricKey, number | string>> = {};
    for (const [k, v] of Object.entries(manual)) {
      if (v == null || String(v).trim() === '') continue;
      const key = k as WearableMetricKey;
      if (key === 'sleep_bed' || key === 'sleep_wake') {
        metrics[key] = String(v).trim();
      } else {
        const n = Number(v);
        if (Number.isFinite(n)) metrics[key] = n;
      }
    }
    if (Object.keys(metrics).length === 0) {
      setError(t('wearables.emptyMetrics'));
      return;
    }

    addMetricSample({
      wearableId: device.id,
      brandId: device.brandId,
      metrics,
      source: 'manual',
    });
    setManual({});
    setError(null);
    runAutoLog();
    refresh();
    setNote(t('wearables.manualSaved'));
  };

  const categoryLabel = (cat: string) => {
    const map: Record<string, string> = {
      watch: t('wearables.catWatch'),
      ring: t('wearables.catRing'),
      band: t('wearables.catBand'),
      chest_strap: t('wearables.catChest'),
      scale: t('wearables.catScale'),
      other: t('wearables.catOther'),
    };
    return map[cat] || cat;
  };

  return (
    <section className="mb-6">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <h2 className="text-sm font-semibold text-[var(--sage)] flex items-center gap-2">
            <span>⌚</span> {t('wearables.title')}
          </h2>
          <p className="text-[11px] text-[var(--sage)]/80 mt-0.5">{t('wearables.subtitle')}</p>
        </div>
        <span className="pill-soft text-[10px] shrink-0">{t('wearables.faseC')}</span>
      </div>

      <div className="card-soft p-4 space-y-4">
        {/* Combined indicators from wearables today */}
        {combined && combined.sources.wearable && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {combined.avgHeartRate != null && (
              <MetricCell label={t('wearables.fieldHr')} value={`${combined.avgHeartRate}`} unit="bpm" />
            )}
            {combined.restingHr != null && (
              <MetricCell label={t('wearables.fieldRhr')} value={`${combined.restingHr}`} unit="bpm" />
            )}
            {combined.hrv != null && (
              <MetricCell label={t('wearables.fieldHrv')} value={`${combined.hrv}`} unit="ms" />
            )}
            {combined.wearable.steps > 0 && (
              <MetricCell label={t('wearables.fieldSteps')} value={`${combined.wearable.steps}`} />
            )}
            {combined.wearable.activeMinutes > 0 && (
              <MetricCell
                label={t('wearables.fieldActive')}
                value={`${combined.wearable.activeMinutes}`}
                unit="min"
              />
            )}
            {combined.sleepHours != null && combined.sources.wearable && (
              <MetricCell
                label={t('wearables.fieldSleepH')}
                value={`${combined.sleepHours}`}
                unit="h"
              />
            )}
            {combined.readiness != null && (
              <MetricCell label={t('wearables.fieldReadiness')} value={`${combined.readiness}`} />
            )}
            {combined.spo2 != null && (
              <MetricCell label={t('wearables.fieldSpo2')} value={`${combined.spo2}`} unit="%" />
            )}
          </div>
        )}

        {/* Linked devices */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-[var(--sage)]">{t('wearables.yourDevices')}</p>
            <button
              type="button"
              onClick={() => setShowAdd(!showAdd)}
              className="btn-outline-sm"
            >
              {showAdd ? t('common.close') : t('wearables.addDevice')}
            </button>
          </div>

          {devices.length === 0 && !showAdd && (
            <p className="text-xs text-[var(--sage)]/70">{t('wearables.empty')}</p>
          )}

          {devices.map((d) => {
            const cat = getCatalogItem(d.brandId);
            const isActive = activeDeviceId === d.id;
            return (
              <div
                key={d.id}
                className={`rounded-2xl border px-3 py-3 transition ${
                  isActive
                    ? 'border-[var(--border-strong)] bg-[var(--surface-active)]'
                    : 'border-[var(--border-soft)] bg-[var(--surface)]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    className="text-left min-w-0 flex-1"
                    onClick={() => setActiveDeviceId(d.id)}
                  >
                    <p className="text-sm font-medium text-white truncate">
                      {cat?.icon || '⌚'} {d.label}
                    </p>
                    <p className="text-[10px] text-[var(--sage)] mt-0.5">
                      {categoryLabel(d.category)} · {modeLabel(d.connectMode, t)}
                      {d.lastSyncAt && (
                        <>
                          {' · '}
                          {t('wearables.lastSync')}:{' '}
                          {new Date(d.lastSyncAt).toLocaleTimeString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </>
                      )}
                    </p>
                  </button>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    {(d.connectMode === 'web_bluetooth_hr' ||
                      cat?.connectModes.includes('web_bluetooth_hr')) &&
                      bleOk &&
                      !liveHr && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => startBle(d)}
                          className="btn-sm"
                        >
                          {t('wearables.connectBle')}
                        </button>
                      )}
                    <button
                      type="button"
                      onClick={() => handleUnlink(d.id)}
                      className="text-[10px] text-[var(--sage)]/70 hover:text-red-400"
                    >
                      {t('wearables.unlink')}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add device */}
        {showAdd && (
          <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] p-3 space-y-3">
            <p className="text-xs font-medium text-[var(--accent)]">{t('wearables.pickBrand')}</p>
            <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto">
              {WEARABLE_CATALOG.map((item) => (
                <button
                  key={item.brandId}
                  type="button"
                  onClick={() => setSelectedBrand(item.brandId)}
                  className={`text-left px-3 py-2 rounded-xl border text-xs transition ${
                    selectedBrand === item.brandId
                      ? 'border-[var(--border-strong)] bg-[var(--surface-active)] text-[var(--accent)]'
                      : 'border-[var(--border-soft)] text-[var(--sage)]'
                  }`}
                >
                  <span className="mr-1.5">{item.icon}</span>
                  {lang === 'en' ? item.name : item.nameEs}
                  <span className="text-[10px] opacity-70 ml-1">
                    · {categoryLabel(item.category)}
                  </span>
                </button>
              ))}
            </div>

            <input
              type="text"
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              placeholder={t('wearables.labelPlaceholder')}
              className="input-soft py-2.5 text-sm"
            />

            <div className="flex flex-wrap gap-1.5">
              {catalogItem?.connectModes.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setConnectMode(m)}
                  className={`pill-soft ${connectMode === m ? 'pill-soft-active' : ''}`}
                >
                  {modeLabel(m, t)}
                </button>
              ))}
            </div>

            {catalogItem && (
              <p className="text-[10px] text-[var(--sage)]/70 leading-relaxed">
                {lang === 'en' ? catalogItem.note : catalogItem.noteEs || catalogItem.note}
              </p>
            )}

            <button type="button" onClick={handleLink} className="btn-primary py-2.5 text-sm">
              {t('wearables.confirmLink')}
            </button>
          </div>
        )}

        {/* Live BLE HR */}
        {liveHr && (
          <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-active)] p-3 space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-xs font-semibold text-[var(--accent)]">
                {t('wearables.liveHr')} · {liveHr.deviceName}
              </p>
              <span className="text-[10px] text-[var(--sage)]">
                {liveHr.samples} {t('wearables.samples')}
              </span>
            </div>
            <div className="text-center py-2">
              <p className="text-4xl font-bold text-white tabular-nums">
                {liveHr.currentBpm ?? '—'}
              </p>
              <p className="text-xs text-[var(--sage)]">bpm</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-[var(--sage)]">
              <div>
                <p className="text-sm text-white font-semibold">{liveHr.minBpm ?? '—'}</p>
                min
              </div>
              <div>
                <p className="text-sm text-white font-semibold">
                  {liveHr.samples
                    ? Math.round(liveHr.sumBpm / liveHr.samples)
                    : '—'}
                </p>
                avg
              </div>
              <div>
                <p className="text-sm text-white font-semibold">{liveHr.maxBpm ?? '—'}</p>
                max
              </div>
            </div>
            <p className="text-[11px] text-[var(--sage)] text-center">
              {t('wearables.activeFromHr')}: {liveHr.activeMinutes} min
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={stopBle}
              className="btn-primary py-2.5 text-sm"
            >
              {t('wearables.stopBle')}
            </button>
          </div>
        )}

        {/* Manual sync form */}
        {activeDeviceId && !liveHr && (
          <div className="space-y-3 border-t border-[var(--border-soft)] pt-3">
            <p className="text-xs font-medium text-[var(--sage)]">{t('wearables.manualTitle')}</p>
            <p className="text-[10px] text-[var(--sage)]/70">{t('wearables.manualHint')}</p>
            <div className="grid grid-cols-2 gap-2">
              {MANUAL_FIELDS.map((f) => (
                <div key={f.key}>
                  <label className="block text-[10px] text-[var(--sage)] mb-1">{t(f.labelKey)}</label>
                  <input
                    type="text"
                    inputMode={
                      f.key === 'sleep_bed' || f.key === 'sleep_wake' ? 'text' : 'decimal'
                    }
                    placeholder={f.placeholder}
                    value={manual[f.key] || ''}
                    onChange={(e) =>
                      setManual((prev) => ({ ...prev, [f.key]: e.target.value }))
                    }
                    className="input-soft py-2 text-sm"
                  />
                </div>
              ))}
            </div>
            <button type="button" onClick={saveManual} className="btn-primary py-2.5 text-sm">
              {t('wearables.saveMetrics')}
            </button>
          </div>
        )}

        {!bleOk && (
          <p className="text-[10px] text-amber-400/80">{t('wearables.bleBrowserHint')}</p>
        )}

        {error && (
          <p className="text-xs text-red-400 bg-red-500/10 rounded-xl px-3 py-2">{error}</p>
        )}
        {note && !error && (
          <p className="text-xs text-[var(--accent)] bg-[var(--surface-active)] rounded-xl px-3 py-2">
            {note}
          </p>
        )}

        <p className="text-[10px] text-[var(--sage)]/60 leading-relaxed">
          {t('wearables.disclaimer')}
        </p>
      </div>
    </section>
  );
}

function MetricCell({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div className="bg-[var(--surface)] rounded-2xl py-2.5 px-2 text-center border border-[var(--border-soft)]">
      <p className="text-base font-bold text-white tabular-nums leading-tight">
        {value}
        {unit ? <span className="text-[10px] font-normal text-[var(--sage)] ml-0.5">{unit}</span> : null}
      </p>
      <p className="text-[10px] text-[var(--sage)] mt-0.5">{label}</p>
    </div>
  );
}

function modeLabel(mode: WearableConnectMode, t: (k: string) => string): string {
  switch (mode) {
    case 'web_bluetooth_hr':
      return t('wearables.modeBle');
    case 'manual':
      return t('wearables.modeManual');
    case 'oauth':
    case 'oauth_planned':
      return t('wearables.modeOauth');
    case 'healthkit':
      return t('wearables.modeHealthkit');
    case 'health_connect':
    case 'health_connect_planned':
      return t('wearables.modeOs');
    default:
      return mode;
  }
}

/**
 * Web Bluetooth — Heart Rate Profile (0x180D)
 * Works with many chest straps and some watches/bands that expose standard HR GATT.
 */

import type { LiveHeartRateSession } from './types';

const HR_SERVICE = 0x180d;
const HR_MEASUREMENT = 0x2a37;

export function isWebBluetoothAvailable(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.bluetooth;
}

function parseHeartRate(dataView: DataView): number | null {
  if (dataView.byteLength < 2) return null;
  const flags = dataView.getUint8(0);
  const hr16 = (flags & 0x1) !== 0;
  return hr16 ? dataView.getUint16(1, true) : dataView.getUint8(1);
}

export type BleHrListener = (session: LiveHeartRateSession) => void;

export class BleHeartRateMonitor {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private session: LiveHeartRateSession | null = null;
  private listeners = new Set<BleHrListener>();
  private zoneTimer: ReturnType<typeof setInterval> | null = null;
  private onDisconnected = () => {
    this.cleanup(false);
  };

  get current(): LiveHeartRateSession | null {
    return this.session;
  }

  subscribe(fn: BleHrListener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit() {
    if (!this.session) return;
    for (const fn of this.listeners) fn({ ...this.session });
  }

  async connect(wearableId: string): Promise<LiveHeartRateSession> {
    if (!isWebBluetoothAvailable()) {
      throw new Error('BLE_UNSUPPORTED');
    }

    await this.disconnect();

    if (!navigator.bluetooth) {
      throw new Error('BLE_UNSUPPORTED');
    }

    const device = await navigator.bluetooth.requestDevice({
      filters: [{ services: [HR_SERVICE] }],
      optionalServices: [HR_SERVICE],
    });

    this.device = device;
    device.addEventListener('gattserverdisconnected', this.onDisconnected);

    const server = await device.gatt!.connect();
    this.server = server;
    const service = await server.getPrimaryService(HR_SERVICE);
    const characteristic = await service.getCharacteristic(HR_MEASUREMENT);
    this.characteristic = characteristic;

    this.session = {
      wearableId,
      deviceName: device.name || 'HR Monitor',
      startedAt: new Date().toISOString(),
      currentBpm: null,
      samples: 0,
      minBpm: null,
      maxBpm: null,
      sumBpm: 0,
      activeMinutes: 0,
      zoneModerateSec: 0,
      zoneVigorousSec: 0,
    };

    const onHr = (event: Event) => {
      const target = event.target as BluetoothRemoteGATTCharacteristic;
      if (!target.value || !this.session) return;
      const bpm = parseHeartRate(target.value);
      if (bpm == null || bpm < 30 || bpm > 230) return;
      this.session.currentBpm = bpm;
      this.session.samples += 1;
      this.session.sumBpm += bpm;
      this.session.minBpm =
        this.session.minBpm == null ? bpm : Math.min(this.session.minBpm, bpm);
      this.session.maxBpm =
        this.session.maxBpm == null ? bpm : Math.max(this.session.maxBpm, bpm);
      this.emit();
    };

    await characteristic.startNotifications();
    characteristic.addEventListener('characteristicvaluechanged', onHr);

    // Zone accumulation every second from last BPM
    this.zoneTimer = setInterval(() => {
      if (!this.session || this.session.currentBpm == null) return;
      const bpm = this.session.currentBpm;
      // Simple zones without max-HR: moderate 110–139, vigorous ≥140
      if (bpm >= 140) {
        this.session.zoneVigorousSec += 1;
        this.session.activeMinutes = Math.round(
          (this.session.zoneModerateSec + this.session.zoneVigorousSec) / 60
        );
      } else if (bpm >= 110) {
        this.session.zoneModerateSec += 1;
        this.session.activeMinutes = Math.round(
          (this.session.zoneModerateSec + this.session.zoneVigorousSec) / 60
        );
      }
      this.emit();
    }, 1000);

    this.emit();
    return this.session;
  }

  async disconnect(): Promise<LiveHeartRateSession | null> {
    return this.cleanup(true);
  }

  private cleanup(manual: boolean): LiveHeartRateSession | null {
    if (this.zoneTimer) {
      clearInterval(this.zoneTimer);
      this.zoneTimer = null;
    }
    try {
      this.characteristic?.removeEventListener('characteristicvaluechanged', () => {});
      void this.characteristic?.stopNotifications().catch(() => {});
    } catch {
      /* ignore */
    }
    try {
      if (this.device) {
        this.device.removeEventListener('gattserverdisconnected', this.onDisconnected);
        if (this.device.gatt?.connected) this.device.gatt.disconnect();
      }
    } catch {
      /* ignore */
    }

    const snap = this.session;
    this.device = null;
    this.server = null;
    this.characteristic = null;
    this.session = null;
    if (manual && snap) {
      // final emit empty is not needed
    }
    return snap;
  }
}

let bleSingleton: BleHeartRateMonitor | null = null;

export function getBleHeartRateMonitor(): BleHeartRateMonitor {
  if (!bleSingleton) bleSingleton = new BleHeartRateMonitor();
  return bleSingleton;
}

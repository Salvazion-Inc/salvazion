import { WALLET_STORAGE_KEY } from './config';

export type SalvazionBalanceSource = 'onchain' | 'manual';

export interface LinkedWallet {
  address: string;
  label?: string;
  linkedAt: string;
  /** Last known SOL (on-chain) */
  solBalance?: number | null;
  /**
   * $SALVAZION amount shown on profile.
   * Prefer on-chain when available; user may override manually.
   */
  salvazionBalance?: number | null;
  salvazionSource?: SalvazionBalanceSource;
  balanceUpdatedAt?: string;
}

const CHANGE_EVENT = 'salvazion-wallet-change';

function emitChange(data: LinkedWallet | null) {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: data }));
  } catch {
    // ignore
  }
}

export function loadLinkedWallet(): LinkedWallet | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(WALLET_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LinkedWallet;
  } catch {
    return null;
  }
}

export function saveLinkedWallet(
  address: string,
  label?: string,
  extras?: Partial<
    Pick<
      LinkedWallet,
      | 'solBalance'
      | 'salvazionBalance'
      | 'salvazionSource'
      | 'balanceUpdatedAt'
    >
  >
): LinkedWallet {
  const prev = loadLinkedWallet();
  const sameAddress = prev?.address === address;
  const data: LinkedWallet = {
    address,
    label: label ?? (sameAddress ? prev?.label : undefined),
    linkedAt: sameAddress && prev?.linkedAt ? prev.linkedAt : new Date().toISOString(),
    solBalance:
      extras && 'solBalance' in extras
        ? extras.solBalance
        : sameAddress
          ? prev?.solBalance
          : undefined,
    salvazionBalance:
      extras && 'salvazionBalance' in extras
        ? extras.salvazionBalance
        : sameAddress
          ? prev?.salvazionBalance
          : undefined,
    salvazionSource:
      extras && 'salvazionSource' in extras
        ? extras.salvazionSource
        : sameAddress
          ? prev?.salvazionSource
          : undefined,
    balanceUpdatedAt:
      extras && 'balanceUpdatedAt' in extras
        ? extras.balanceUpdatedAt
        : sameAddress
          ? prev?.balanceUpdatedAt
          : undefined,
  };
  if (typeof window !== 'undefined') {
    localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(data));
  }
  emitChange(data);
  return data;
}

/** Patch balances / label for the currently linked wallet. */
export function updateLinkedWalletBalances(
  patch: Partial<
    Pick<
      LinkedWallet,
      | 'solBalance'
      | 'salvazionBalance'
      | 'salvazionSource'
      | 'label'
      | 'balanceUpdatedAt'
    >
  >
): LinkedWallet | null {
  const prev = loadLinkedWallet();
  if (!prev?.address) return null;
  return saveLinkedWallet(prev.address, patch.label ?? prev.label, {
    solBalance: 'solBalance' in patch ? patch.solBalance : prev.solBalance,
    salvazionBalance:
      'salvazionBalance' in patch ? patch.salvazionBalance : prev.salvazionBalance,
    salvazionSource:
      'salvazionSource' in patch ? patch.salvazionSource : prev.salvazionSource,
    balanceUpdatedAt:
      patch.balanceUpdatedAt ??
      (patch.salvazionBalance !== undefined || patch.solBalance !== undefined
        ? new Date().toISOString()
        : prev.balanceUpdatedAt),
  });
}

export function clearLinkedWallet(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(WALLET_STORAGE_KEY);
  emitChange(null);
}

/** Subscribe to linked-wallet updates (balances, connect, disconnect). */
export function subscribeLinkedWallet(
  listener: (wallet: LinkedWallet | null) => void
): () => void {
  if (typeof window === 'undefined') return () => undefined;

  const onStorage = (e: StorageEvent) => {
    if (e.key && e.key !== WALLET_STORAGE_KEY) return;
    listener(loadLinkedWallet());
  };
  const onCustom = (e: Event) => {
    const detail = (e as CustomEvent<LinkedWallet | null>).detail;
    listener(detail ?? loadLinkedWallet());
  };

  window.addEventListener('storage', onStorage);
  window.addEventListener(CHANGE_EVENT, onCustom);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(CHANGE_EVENT, onCustom);
  };
}

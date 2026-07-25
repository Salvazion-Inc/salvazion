import { WALLET_STORAGE_KEY } from './config';

export interface LinkedWallet {
  address: string;
  label?: string;
  linkedAt: string;
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

export function saveLinkedWallet(address: string, label?: string): LinkedWallet {
  const data: LinkedWallet = {
    address,
    label,
    linkedAt: new Date().toISOString(),
  };
  if (typeof window !== 'undefined') {
    localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(data));
  }
  return data;
}

export function clearLinkedWallet(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(WALLET_STORAGE_KEY);
}

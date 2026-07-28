export type SubscriptionStatus =
  | 'none'
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'unpaid'
  | 'paused';

export type Entitlement = {
  isPremium: boolean;
  status: SubscriptionStatus;
  interval: 'month' | 'year' | null;
  priceId: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  customerId: string | null;
  subscriptionId: string | null;
  source: 'db' | 'stripe' | 'none';
};

export function emptyEntitlement(): Entitlement {
  return {
    isPremium: false,
    status: 'none',
    interval: null,
    priceId: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    customerId: null,
    subscriptionId: null,
    source: 'none',
  };
}

export function isPremiumStatus(status: string | null | undefined): boolean {
  return status === 'active' || status === 'trialing';
}

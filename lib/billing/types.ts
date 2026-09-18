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

/** Client-safe slice — no Stripe customer / subscription / price ids. */
export type PublicEntitlement = {
  signedIn: boolean;
  isPremium: boolean;
  status: SubscriptionStatus;
  interval: 'month' | 'year' | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  canManage: boolean;
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

export function toPublicEntitlement(
  ent: Entitlement,
  signedIn = false
): PublicEntitlement {
  return {
    signedIn,
    isPremium: ent.isPremium,
    status: ent.status,
    interval: ent.interval,
    currentPeriodEnd: ent.currentPeriodEnd,
    cancelAtPeriodEnd: ent.cancelAtPeriodEnd,
    canManage: Boolean(ent.customerId),
    source: ent.source,
  };
}

export function emptyPublicEntitlement(): PublicEntitlement {
  return toPublicEntitlement(emptyEntitlement());
}

export function isPremiumStatus(status: string | null | undefined): boolean {
  return status === 'active' || status === 'trialing';
}

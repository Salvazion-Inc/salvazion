/** Client-safe types for Salvazion Inc. business console */

export type FunnelStep = {
  id: string;
  labelEs: string;
  labelEn: string;
  count: number;
  convFromPrevPct: number | null;
  convFromTopPct: number | null;
  noteEs?: string;
  noteEn?: string;
};

export type XBrandKpi = {
  handle: string;
  url: string;
  name: string | null;
  followers: number | null;
  following: number | null;
  tweets: number | null;
  mediaCount: number | null;
  likes: number | null;
  verified: boolean | null;
  articlesCatalog: number;
  articlesLast30d: number;
  /** App accounts with X username linked */
  appUsersWithX: number;
  /** followers → app accounts (reach efficiency, not vanity alone) */
  followersToAccountsPct: number | null;
  source: string;
  fetchedAt: string;
  latencyMs?: number;
  error?: string;
};

export type BusinessKpis = {
  asOf: string;
  /** Server generation time ms */
  computeMs: number;
  /** Suggested client poll interval */
  pollIntervalSec: number;
  live: boolean;
  currency: string;
  mrr: number;
  arr: number;
  revenue30d: number;
  revenue7d: number;
  arpu: number;
  ltv: number | null;
  activeSubscribers: number;
  monthlySubs: number;
  annualSubs: number;
  trialing: number;
  pastDue: number;
  canceled30d: number;
  newPaid30d: number;
  newPaid7d: number;
  churnRate30dPct: number | null;
  stripeCustomers: number;
  totalAccounts: number;
  authUsers: number;
  onboardedAccounts: number;
  newAccounts7d: number;
  newAccounts30d: number;
  paidConversionPct: number | null;
  activationPct: number | null;
  paidOfActivatedPct: number | null;
  billingIdentityPct: number | null;
  funnel: FunnelStep[];
  x: XBrandKpi;
  sources: {
    stripe: boolean;
    supabase: boolean;
    x: boolean;
    stripeKeyKind: 'secret' | 'restricted' | 'none' | 'unknown';
    stripeError?: string;
    supabaseError?: string;
    xError?: string;
  };
  planPrices: {
    monthlyUsd: number;
    annualUsd: number;
    annualMonthlyEquivalent: number;
  };
  insights: { es: string; en: string }[];
};

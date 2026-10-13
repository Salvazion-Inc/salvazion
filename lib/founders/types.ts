export type LiveYacht = {
  name: string;
  ft: number;
  guests: number;
  price: number;
  hours: number;
  marina: string;
  captain: string;
  kind: string;
};

export type LiveCapsule = {
  name: string;
  place: string;
  lands: string[];
  land: string;
  price: number;
  guests: number;
};

export type LiveDashboard = {
  fetchedAt: string;
  fx: { clpPerUsd: number | null };
  salvazion: {
    premiumMonthly: number;
    premiumAnnual: number;
    articles: { freedom: number; salvation: number; health: number; total: number };
    hymns: number;
  };
  kaenz: {
    ok: boolean;
    yachts: LiveYacht[];
    checkoutMarinas: string[];
    mapHubs: number | null;
  };
  mapucoin: {
    ok: boolean;
    capsules: LiveCapsule[];
    destinations: number;
    parks: number;
    gastronomy: number;
    activities: number;
    partners: number | null;
  };
  token: {
    paired: boolean;
    priceUsd: number | null;
  };
};

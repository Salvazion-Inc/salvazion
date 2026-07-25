export type SpiritualMaturity = 'new' | 'growing' | 'mature' | 'leader';
export type FamilyStatus = 'single' | 'married' | 'parent' | 'widow' | 'family';
export type Language = 'es' | 'en';
export type BibleVersion = 'rv1960' | 'kjv' | 'original';

/** Who you can invite into your Phalanx */
export type LinkRelation =
  | 'spouse'
  | 'child'
  | 'sibling' // hermanos / hermanas
  | 'family'
  | 'friend'
  | 'colleague' // colegas de trabajo / ministerio
  | 'faith_community';

export interface LinkedProfile {
  id: string;
  name: string;
  relation: LinkRelation;
  status: 'pending' | 'connected' | 'invited';
  avatarUrl?: string;
  /** Optional contact for follow-up */
  email?: string;
  /** Shareable invite code */
  inviteCode?: string;
  invitedAt?: string;
  note?: string;
  /** Supabase auth user id of the other person (when connected) */
  peerUserId?: string;
  /** Supabase phalanx_invites.id */
  inviteId?: string;
  connectedAt?: string;
}

export interface UserProfile {
  // Core
  name: string;
  language: Language;
  spiritualMaturity: SpiritualMaturity;
  familyStatus: FamilyStatus;
  currentFocus: string[]; // 'fe' | 'familia' | 'proposito' | 'salud' | 'libertad' | 'oracion' | 'liderazgo' | 'perseverancia'
  struggles?: string[];
  preferredBibleVersion: BibleVersion;

  // New for onboarding
  purpose: string;           // Propósito de vida
  city: string;
  country: string;
  birthDate: string;         // YYYY-MM-DD — para calcular edad y personalizar

  /** Profile photo — https URL (Supabase Storage) or compressed data URL (local) */
  avatarUrl?: string;

  // Social graph inside the app
  familyLinks: LinkedProfile[];
  friendsLinks: LinkedProfile[];

  // Coach acceptance
  hasAcceptedLionCoach: boolean;
  onboardingCompleted: boolean;
}

export interface Scripture {
  reference: string;
  text: string;
  version: string;
}

export interface Devotional {
  id: string;
  date: string;
  title: string;
  scripture: Scripture;
  /** Optional second supporting verse */
  secondaryScripture?: Scripture;
  reflection: string;
  prayer: string;
  action: string;
  /** Virtue of the day (fortaleza, templanza, fe, etc.) */
  virtue?: string;
  /** Closing charge / blessing */
  closing?: string;
  tags: string[];
  points: number;
  personalizedFor?: string;
  /** Generation engine */
  source?: 'grok' | 'rules';
  model?: string;
}

/**
 * El León Verde — Coach de Virtud y Desarrollo Integral
 * Característica central: virtud + desarrollo espiritual, físico y mental.
 */
export interface GreenLionCoach {
  name: 'León Verde';
  role: 'Motivador · Coach · Disciplina';
  pillars: ['Espiritual', 'Físico', 'Mental'];
  motto: 'Virtud, constancia y excelencia para que Salvation, Health y Freedom crezcan cada día.';
}

/**
 * Freedom — Aprender · Conectar · Aportar
 */

import { loadProfile, calculateAge, getLifeStage, LifeStage } from '@/lib/store/profile';
import { getPointsForAction } from '@/lib/scoring/engine';

export type FreedomCategory = 'learn' | 'connect' | 'contribute';

export interface FreedomActionDef {
  id: string;
  category: FreedomCategory;
  label: string;
  description: string;
  actionType: string;
  icon: string;
}

export interface FreedomContent {
  id: string;
  category: 'article' | 'video' | 'debate' | 'book';
  title: string;
  summary: string;
  readMin: number;
  tags: string[];
  stages?: LifeStage[];
  actionType: string;
  /** External long-form URL (X Articles / status). Opens in new tab. */
  url?: string;
  /** Source label, e.g. @salvazion_ */
  source?: string;
}

/**
 * Freedom library — primary content is X Articles from @salvazion_.
 * Links use x.com/i/article/{id} when published as Articles; otherwise the author status URL.
 */
export const FREEDOM_LIBRARY: FreedomContent[] = [
  {
    id: 'x-solana-salvazion',
    category: 'article',
    title: 'Solana y $SALVAZION: tecnología al servicio de la libertad',
    summary:
      'Por qué Solana es infraestructura para soberanía económica, y cómo $SALVAZION (Patriot Bitcoin) defiende familia, nación y Cultura Occidental Cristiana frente al metacapital globalista.',
    readMin: 12,
    tags: ['solana', 'salvazion', 'libertad', 'bioconservadurismo'],
    actionType: 'learn_article_video',
    url: 'https://x.com/i/article/2080163223987245056',
    source: '@salvazion_',
  },
  {
    id: 'x-immigration',
    category: 'article',
    title: 'Inmigración legal e ilegal: efectos y balance',
    summary:
      'Dinámicas de inmigración legal e ilegal, impacto económico y social, y por qué fronteras y orden importan para la cultura occidental cristiana.',
    readMin: 10,
    tags: ['inmigracion', 'soberania', 'occidente'],
    actionType: 'learn_article_video',
    url: 'https://x.com/i/article/1809649703920738306',
    source: '@salvazion_',
  },
  {
    id: 'x-communism',
    category: 'article',
    title: 'Comunismo: ideología, historia y costo humano',
    summary:
      'Orígenes, regímenes, fracasos y democidio. Incluye Cultural Marxism y por qué esta ideología sigue siendo una amenaza a la libertad.',
    readMin: 14,
    tags: ['comunismo', 'libertad', 'qolitica'],
    actionType: 'learn_article_video',
    url: 'https://x.com/i/article/1805331717353246720',
    source: '@salvazion_',
  },
  {
    id: 'x-islamic-west',
    category: 'article',
    title: 'Mundo islámico y Cultura Occidental Cristiana',
    summary:
      'Diversidad del mundo islámico, diferencias de cosmovisión con el Occidente cristiano, historia de choque y caminos de discernimiento.',
    readMin: 12,
    tags: ['cultura', 'occidente', 'fe'],
    actionType: 'learn_article_video',
    url: 'https://x.com/i/article/1814520724087873536',
    source: '@salvazion_',
  },
  {
    id: 'x-nato',
    category: 'article',
    title: 'OTAN: alianza, historia y desafíos',
    summary:
      'De la Guerra Fría a la ciberseguridad y la guerra híbrida. Análisis de la alianza y el debate sobre el rol de Estados Unidos.',
    readMin: 11,
    tags: ['otan', 'geopolitica', 'libertad'],
    actionType: 'learn_article_video',
    url: 'https://x.com/salvazion_/status/1811189410198642787',
    source: '@salvazion_',
  },
  {
    id: 'x-mega-europe',
    category: 'article',
    title: 'Patriots for Europe (MEGA): soberanía y cultura',
    summary:
      'La alianza de Orbán y otros líderes: soberanía nacional, control migratorio e identidad cultural en Europa.',
    readMin: 10,
    tags: ['europa', 'soberania', 'patriots'],
    actionType: 'learn_article_video',
    url: 'https://x.com/salvazion_/status/1811060019695149336',
    source: '@salvazion_',
  },
  {
    id: 'x-nvidia-huang',
    category: 'article',
    title: 'Jensen Huang y NVIDIA: tecnología exponencial',
    summary:
      'Del GPU al AI: cómo NVIDIA reconfiguró el poder tecnológico y qué significa para constructores y líderes de la Phalanx.',
    readMin: 11,
    tags: ['tecnologia', 'ai', 'exponencial'],
    actionType: 'learn_article_video',
    url: 'https://x.com/salvazion_/status/1818153582480257356',
    source: '@salvazion_',
  },
  {
    id: 'debate-family',
    category: 'debate',
    title: 'Debate: La familia es la primera política',
    summary:
      'Debate con Salvazion: familia natural, rechazo al woke y a ideologías que disuelven el hogar.',
    readMin: 10,
    tags: ['familia', 'debate', 'salvazion'],
    stages: ['young_adult', 'adult', 'mature', 'senior'],
    actionType: 'debate_participate',
  },
  {
    id: 'debate-bioconservatism',
    category: 'debate',
    title: 'Debate: Bio-conservadurismo vs transhumanismo',
    summary:
      'El cuerpo como templo frente a la reingeniería humana. Salvazion defiende la naturaleza creada.',
    readMin: 12,
    tags: ['bio', 'transhumanismo', 'debate'],
    stages: ['young_adult', 'adult', 'mature', 'senior'],
    actionType: 'debate_participate',
  },
  {
    id: 'debate-globalism',
    category: 'debate',
    title: 'Debate: Globalismo vs soberanía y fe',
    summary:
      'Naciones, fe y libertad ordenada frente al globalismo y el poder no electo (Deep State).',
    readMin: 12,
    tags: ['globalismo', 'soberania', 'debate'],
    stages: ['young_adult', 'adult', 'mature', 'senior'],
    actionType: 'debate_participate',
  },
  {
    id: 'book-virtue',
    category: 'book',
    title: 'Lección: Virtud como músculo',
    summary: 'Mini-lección: la virtud se entrena con repetición, no con intención.',
    readMin: 8,
    tags: ['virtud', 'leccion'],
    actionType: 'learn_lesson',
  },
];

export function getCurrentFreedomStage(): LifeStage {
  const profile = loadProfile();
  if (!profile?.birthDate) return 'adult';
  return getLifeStage(calculateAge(profile.birthDate));
}

export function getLibraryForStage(stage: LifeStage): FreedomContent[] {
  return FREEDOM_LIBRARY.filter(
    c => !c.stages || c.stages.length === 0 || c.stages.includes(stage)
  );
}

export function getFreedomActions(stage: LifeStage): FreedomActionDef[] {
  // Learn actions (video / lesson / debate) are presented via
  // YouTube channels + Debate UI in Freedom Hub — not separate chips.
  const actions: FreedomActionDef[] = [
    {
      id: 'connect',
      category: 'connect',
      label: stage === 'infancia' ? 'Tiempo con familia' : 'Conexion real',
      description: 'Familia, iglesia o comunidad de fe — presencial o llamada real',
      actionType: 'connect_real',
      icon: '🤝'
    },
    {
      id: 'contribute',
      category: 'contribute',
      label: 'Aportar a un proyecto',
      description:
        stage === 'infancia'
          ? 'Ayudar en casa o en un proyecto familiar'
          : 'Trabajo, startup, ministerio o proyecto de la Phalanx',
      actionType: 'contribute_project',
      icon: '🛠️'
    }
  ];

  return actions;
}

export function getFreedomPoints(actionType: string): number {
  return getPointsForAction(actionType, getCurrentFreedomStage());
}

const STORAGE_CONTENT = 'salvazion_freedom_content';

export function loadCompletedContent(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_CONTENT);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markContentComplete(contentId: string) {
  const list = loadCompletedContent();
  if (!list.includes(contentId)) {
    list.push(contentId);
    localStorage.setItem(STORAGE_CONTENT, JSON.stringify(list));
  }
}

export function isContentComplete(contentId: string): boolean {
  return loadCompletedContent().includes(contentId);
}

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
}

export const FREEDOM_LIBRARY: FreedomContent[] = [
  {
    id: 'art-phalanx',
    category: 'article',
    title: 'La Phalanx digital: disciplina en red',
    summary: 'Cómo la constancia compartida fortalece familias y comunidades de fe frente al ruido globalista.',
    readMin: 6,
    tags: ['phalanx', 'disciplina', 'comunidad'],
    actionType: 'learn_article_video'
  },
  {
    id: 'art-biocons',
    category: 'article',
    title: 'Bio-conservadurismo: el cuerpo como templo',
    summary: 'Por qué sol, sueño, comida real y movimiento son actos políticos y espirituales.',
    readMin: 7,
    tags: ['salud', 'templo', 'bio-conservadurismo'],
    actionType: 'learn_article_video'
  },
  {
    id: 'art-freedom',
    category: 'article',
    title: 'Libertad no es consumismo',
    summary: 'La verdadera libertad se construye con carácter, oficio y aporte — no con entretenimiento infinito.',
    readMin: 5,
    tags: ['libertad', 'caracter'],
    actionType: 'learn_article_video'
  },
  {
    id: 'vid-morning',
    category: 'video',
    title: 'Ritual de mañana: Palabra, sol, movimiento',
    summary: 'Un orden simple de 30 minutos para empezar el día con Salvation y Health alineados.',
    readMin: 4,
    tags: ['habito', 'manana'],
    actionType: 'learn_article_video'
  },
  {
    id: 'debate-family',
    category: 'debate',
    title: 'Debate: La familia es la primera politica',
    summary: 'Preguntas para discutir en casa o en la iglesia sobre soberania familiar.',
    readMin: 10,
    tags: ['familia', 'debate'],
    stages: ['young_adult', 'adult', 'mature', 'senior'],
    actionType: 'debate_participate'
  },
  {
    id: 'book-virtue',
    category: 'book',
    title: 'Leccion: Virtud como musculo',
    summary: 'Mini-leccion: la virtud se entrena con repeticion, no con intencion.',
    readMin: 8,
    tags: ['virtud', 'leccion'],
    actionType: 'learn_lesson'
  },
  {
    id: 'art-youth',
    category: 'article',
    title: 'Juventud: el caracter se decide ahora',
    summary: 'Por que los habitos de los 15-25 anos pesan decadas.',
    readMin: 5,
    tags: ['juventud', 'caracter'],
    stages: ['juventud', 'young_adult'],
    actionType: 'learn_article_video'
  },
  {
    id: 'art-kids',
    category: 'article',
    title: 'Para crecer con Dios (familia)',
    summary: 'Ideas simples para que padres e hijos compartan Palabra, juego y orden.',
    readMin: 4,
    tags: ['familia', 'infancia'],
    stages: ['infancia', 'adult', 'mature'],
    actionType: 'learn_article_video'
  }
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
  const actions: FreedomActionDef[] = [
    {
      id: 'learn_short',
      category: 'learn',
      label: 'Articulo o video corto',
      description: 'Completa un contenido de la biblioteca Salvazion',
      actionType: 'learn_article_video',
      icon: '📰'
    },
    {
      id: 'learn_lesson',
      category: 'learn',
      label: 'Leccion / mini-curso',
      description: 'Una leccion estructurada de virtud u oficio',
      actionType: 'learn_lesson',
      icon: '🎓'
    },
    {
      id: 'debate',
      category: 'learn',
      label: 'Debate estructurado',
      description:
        stage === 'infancia' || stage === 'juventud'
          ? 'Conversacion guiada en familia'
          : 'Participa en un debate con orden y respeto',
      actionType: 'debate_participate',
      icon: '💬'
    },
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

  if (stage === 'infancia') {
    return actions.filter(a => a.id !== 'debate');
  }
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

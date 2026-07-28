/**
 * Recommended books: Western Christian culture + bioconservatism.
 * Buy links use Amazon Associates (referral commission).
 */

import { amazonProductUrl, amazonSearchUrl } from '@/lib/config/affiliates';

export type BookTheme = 'western_christian' | 'bioconservatism' | 'both';

export interface RecommendedBook {
  id: string;
  title: string;
  titleEs: string;
  author: string;
  blurbEn: string;
  blurbEs: string;
  themes: BookTheme[];
  /** Amazon ASIN when known */
  asin?: string;
  /** Cover color accent for card */
  accent: string;
  /** Emoji / short mark when no cover image */
  mark: string;
}

export const RECOMMENDED_BOOKS: RecommendedBook[] = [
  {
    id: 'mere-christianity',
    title: 'Mere Christianity',
    titleEs: 'Mero cristianismo',
    author: 'C. S. Lewis',
    blurbEn: 'Classic defense of the Christian faith that shaped the West.',
    blurbEs: 'Defensa clásica de la fe cristiana que forjó Occidente.',
    themes: ['western_christian'],
    asin: '0060652926',
    accent: '#C4A574',
    mark: '✝',
  },
  {
    id: 'abolition-of-man',
    title: 'The Abolition of Man',
    titleEs: 'La abolición del hombre',
    author: 'C. S. Lewis',
    blurbEn: 'Against moral relativism and the remaking of human nature.',
    blurbEs: 'Contra el relativismo moral y la reingeniería de la naturaleza humana.',
    themes: ['both'],
    asin: '0060652942',
    accent: '#8B7355',
    mark: '⚖',
  },
  {
    id: 'dominion',
    title: 'Dominion',
    titleEs: 'Dominio',
    author: 'Tom Holland',
    blurbEn: 'How Christianity remade the West — and still does.',
    blurbEs: 'Cómo el cristianismo rehizo Occidente — y aún lo hace.',
    themes: ['western_christian'],
    asin: '0465093507',
    accent: '#9B6B4A',
    mark: '🏛',
  },
  {
    id: 'benedict-option',
    title: 'The Benedict Option',
    titleEs: 'La opción benedictina',
    author: 'Rod Dreher',
    blurbEn: 'Building resilient Christian communities in a post-Christian age.',
    blurbEs: 'Comunidades cristianas resilientes en una era postcristiana.',
    themes: ['western_christian'],
    asin: '0735213291',
    accent: '#6B8F6E',
    mark: '🛡',
  },
  {
    id: 'live-not-by-lies',
    title: 'Live Not by Lies',
    titleEs: 'No vivir de mentiras',
    author: 'Rod Dreher',
    blurbEn: 'Soft totalitarianism and the Christian duty to tell the truth.',
    blurbEs: 'Totalitarismo blando y el deber cristiano de decir la verdad.',
    themes: ['western_christian'],
    asin: '0593087395',
    accent: '#7A6B5A',
    mark: '🕯',
  },
  {
    id: 'rise-triumph-modern-self',
    title: 'The Rise and Triumph of the Modern Self',
    titleEs: 'El auge y triunfo del yo moderno',
    author: 'Carl R. Trueman',
    blurbEn: 'How expressive individualism dismantled Christian anthropology.',
    blurbEs: 'Cómo el individualismo expresivo desmanteló la antropología cristiana.',
    themes: ['both'],
    asin: '1433556332',
    accent: '#5C6B8A',
    mark: '🧠',
  },
  {
    id: 'strange-new-world',
    title: 'Strange New World',
    titleEs: 'Un mundo extraño y nuevo',
    author: 'Carl R. Trueman',
    blurbEn: 'Accessible guide to identity culture and Christian response.',
    blurbEs: 'Guía accesible a la cultura de la identidad y la respuesta cristiana.',
    themes: ['both'],
    asin: '1433579308',
    accent: '#4A7A8A',
    mark: '🌍',
  },
  {
    id: 'what-means-human',
    title: 'What It Means to Be Human',
    titleEs: 'Qué significa ser humano',
    author: 'O. Carter Snead',
    blurbEn: 'Bioconservative law: embodiment, vulnerability, human dignity.',
    blurbEs: 'Derecho bioconservador: cuerpo, vulnerabilidad y dignidad humana.',
    themes: ['bioconservatism'],
    asin: '0674987721',
    accent: '#4A9EFF',
    mark: '🧬',
  },
  {
    id: 'life-liberty-dignity',
    title: 'Life, Liberty and the Defense of Dignity',
    titleEs: 'Vida, libertad y defensa de la dignidad',
    author: 'Leon R. Kass',
    blurbEn: 'Foundational bioconservatism against biotech hubris.',
    blurbEs: 'Bioconservadurismo fundacional frente a la soberbia biotecnológica.',
    themes: ['bioconservatism'],
    asin: '159403039X',
    accent: '#3D7AB5',
    mark: '🫀',
  },
  {
    id: 'why-liberalism-failed',
    title: 'Why Liberalism Failed',
    titleEs: 'Por qué falló el liberalismo',
    author: 'Patrick J. Deneen',
    blurbEn: 'Critique of liberal order and recovery of rooted tradition.',
    blurbEs: 'Crítica del orden liberal y recuperación de la tradición arraigada.',
    themes: ['western_christian'],
    asin: '0300223447',
    accent: '#8B5A4A',
    mark: '📜',
  },
  {
    id: 'how-should-we-then-live',
    title: 'How Should We Then Live?',
    titleEs: '¿Cómo viviremos entonces?',
    author: 'Francis A. Schaeffer',
    blurbEn: 'Rise and decline of Western thought and Christian culture.',
    blurbEs: 'Auge y declive del pensamiento occidental y la cultura cristiana.',
    themes: ['western_christian'],
    asin: '0891072925',
    accent: '#A67C52',
    mark: '📖',
  },
  {
    id: 'case-against-sexual-revolution',
    title: 'The Case Against the Sexual Revolution',
    titleEs: 'El caso contra la revolución sexual',
    author: 'Louise Perry',
    blurbEn: 'Post-liberal case for restraint, family, and the body.',
    blurbEs: 'Argumento postliberal por la contención, la familia y el cuerpo.',
    themes: ['bioconservatism'],
    asin: '1509549997',
    accent: '#B07A8A',
    mark: '🏠',
  },
];

export function bookAmazonUrl(book: RecommendedBook): string {
  if (book.asin) return amazonProductUrl(book.asin, 'com');
  return amazonSearchUrl(`${book.title} ${book.author}`, 'com');
}

/**
 * Official YouTube channels (verified handles) for Freedom · Learn.
 * Only real, large/official channels — no squatted or fan accounts.
 */

export type YouTubeChannel = {
  id: string;
  name: string;
  /** Channel / handle focus */
  focusEs: string;
  focusEn: string;
  /** Full YouTube channel URL */
  url: string;
  /** Optional @handle for display */
  handle?: string;
  accent: string;
  mark: string;
  /** Optional direct avatar / banner image URL (preferred over unavatar) */
  imageUrl?: string;
};

/** Avatar for channel cards — prefers explicit imageUrl, then @handle via unavatar */
export function youtubeChannelImage(ch: YouTubeChannel): string | null {
  if (ch.imageUrl) return ch.imageUrl;
  if (ch.handle) {
    const h = ch.handle.replace(/^@/, '');
    return `https://unavatar.io/youtube/@${encodeURIComponent(h)}`;
  }
  const m = ch.url.match(/youtube\.com\/@([^/?#]+)/i);
  if (m?.[1]) {
    return `https://unavatar.io/youtube/@${encodeURIComponent(m[1])}`;
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(ch.name)}&background=${ch.accent.replace('#', '')}&color=fff&size=256&bold=true&format=png`;
}

/**
 * Verified official channels only (checked 2026-08).
 * Removed: squatted @tpusa / @charliekirk1776 / @salvazion, dead handles, and
 * people without a clear public official channel.
 */
export const YOUTUBE_CHANNELS: YouTubeChannel[] = [
  {
    id: 'jordan-peterson',
    name: 'Jordan B. Peterson',
    handle: '@JordanBPeterson',
    url: 'https://www.youtube.com/@JordanBPeterson',
    focusEs: 'Psicología, fe, responsabilidad y civilización occidental',
    focusEn: 'Psychology, faith, responsibility, and Western civilization',
    accent: '#1E90FF',
    mark: '🦞',
  },
  {
    id: 'charlie-kirk',
    name: 'Charlie Kirk',
    handle: '@RealCharlieKirk',
    url: 'https://www.youtube.com/@RealCharlieKirk',
    imageUrl:
      'https://yt3.googleusercontent.com/J6Zx0VftbF4QakX14hkMKlLQ2HfoinS3ISt2S3VoCxP0iXk1kFCUZQlrFqNpapoNkRj5GKGc=s240-c-k-c0x00ffffff-no-rj',
    focusEs: 'Campus, fe, libertad y cultura americana',
    focusEn: 'Campus, faith, liberty, and American culture',
    accent: '#DC143C',
    mark: '🇺🇸',
  },
  {
    id: 'tpusa',
    name: 'Turning Point USA',
    handle: '@TurningPointUSA',
    url: 'https://www.youtube.com/@TurningPointUSA',
    imageUrl:
      'https://yt3.googleusercontent.com/uf9sZRZaAS8Wnc36BjKpC8Gv8b4TQJ0EbunicclJnn-4nTuvskY3iohx3qb6I8ix37lbY49w=s240-c-k-c0x00ffffff-no-rj',
    focusEs: 'Mini-cursos y charlas de libertad en campus',
    focusEn: 'Campus liberty talks and short courses',
    accent: '#B22222',
    mark: '🎓',
  },
  {
    id: 'agustin-laje',
    name: 'Agustín Laje',
    handle: '@AgustinLajeOk',
    url: 'https://www.youtube.com/@AgustinLajeOk',
    imageUrl:
      'https://yt3.googleusercontent.com/R5xOBRi8YnK9GoZLZ9o27tyaF00mcowzFosKgYQbQtzkdny09dmXFaJ4Z_F25KWVZRpIj5BH=s240-c-k-c0x00ffffff-no-rj',
    focusEs: 'Batalla cultural, familia y crítica al progresismo',
    focusEn: 'Culture war, family, and critique of progressivism',
    accent: '#8B0000',
    mark: '⚔',
  },
  {
    id: 'axel-kaiser',
    name: 'Axel Kaiser',
    handle: '@AxelKaiserb',
    url: 'https://www.youtube.com/@AxelKaiserb',
    imageUrl:
      'https://yt3.googleusercontent.com/iRVUOhLrMwYlzc6gqD-aCH6a54Z7l4rHZK3RMep3ZoBB3aWV1xLDbDat4YLRDtjZUFbtJpvO=s240-c-k-c0x00ffffff-no-rj',
    focusEs: 'Libertad económica y crítica al igualitarismo',
    focusEn: 'Economic liberty and critique of egalitarianism',
    accent: '#C9A227',
    mark: '🇨🇱',
  },
  {
    id: 'vanessa-kaiser',
    name: 'Vanessa Kaiser',
    handle: '@vanessa.kaiser',
    url: 'https://www.youtube.com/@vanessa.kaiser',
    imageUrl:
      'https://yt3.googleusercontent.com/ronE1doWvTGVFft8k7IWNisisCmH2Q_miRL0JY3b7Jew2wtVzrxyrfmv7GD3L6wHXeNYf8KMwQ=s240-c-k-c0x00ffffff-no-rj',
    focusEs: 'Libertad, educación y crítica al feminismo radical',
    focusEn: 'Liberty, education, and critique of radical feminism',
    accent: '#DB7093',
    mark: '♀',
  },
  {
    id: 'miklos-lukacs',
    name: 'Miklós Lukács',
    handle: '@MiklosLukacs',
    url: 'https://www.youtube.com/@MiklosLukacs',
    focusEs: 'Transhumanismo, IA y antropología',
    focusEn: 'Transhumanism, AI, and anthropology',
    accent: '#6A5ACD',
    mark: '🤖',
  },
  {
    id: 'pablo-munoz',
    name: 'Pablo Muñoz Iturrieta',
    handle: '@PabloMunozIturrieta',
    url: 'https://www.youtube.com/@PabloMunozIturrieta',
    focusEs: 'Ideología de género, ciencia y fe',
    focusEn: 'Gender ideology, science, and faith',
    accent: '#2E8B57',
    mark: '🔬',
  },
  {
    id: 'prageru',
    name: 'PragerU',
    handle: '@prageru',
    url: 'https://www.youtube.com/@prageru',
    imageUrl:
      'https://yt3.googleusercontent.com/AKCYsayX6Z56Uqou3kjJBkODb5UXZyeOXJe98u6een5DXxRQ2hEkK3woTcgMc1Ar3yYEt0QMTjs=s240-c-k-c0x00ffffff-no-rj',
    focusEs: 'Mini-lecciones de 5 min: fe, historia y libertad (Dennis Prager)',
    focusEn: '5-min lessons: faith, history, and liberty (Dennis Prager)',
    accent: '#1E3A5F',
    mark: '📘',
  },
  {
    id: 'dailywire',
    name: 'Daily Wire',
    handle: '@DailyWire',
    url: 'https://www.youtube.com/@DailyWire',
    imageUrl:
      'https://yt3.googleusercontent.com/GgphyKn0EGYHdSCGE1-ryv4Z-47OmZBk7Jal8ZCxC-GYTYkKwfObbxn89ckXa9HIFq0d35JaqQ=s240-c-k-c0x00ffffff-no-rj',
    focusEs: 'Shapiro, Walsh y cultura conservadora',
    focusEn: 'Shapiro, Walsh, and conservative culture',
    accent: '#000000',
    mark: '🎙',
  },
  {
    id: 'matt-walsh',
    name: 'Matt Walsh',
    handle: '@MattWalsh',
    url: 'https://www.youtube.com/@MattWalsh',
    focusEs: 'Fe, familia y crítica a la ideología de género',
    focusEn: 'Faith, family, and critique of gender ideology',
    accent: '#1C1C1C',
    mark: '⛪',
  },
  {
    id: 'ben-shapiro',
    name: 'Ben Shapiro',
    handle: '@BenShapiro',
    url: 'https://www.youtube.com/@BenShapiro',
    focusEs: 'Argumentación, fe y política americana',
    focusEn: 'Argument, faith, and American politics',
    accent: '#4682B4',
    mark: '⚡',
  },
  {
    id: 'tucker-carlson',
    name: 'Tucker Carlson',
    handle: '@TuckerCarlson',
    url: 'https://www.youtube.com/@TuckerCarlson',
    focusEs: 'Entrevistas largas y crítica al establishment',
    focusEn: 'Long-form interviews and establishment critique',
    accent: '#1A1A2E',
    mark: '📺',
  },
  {
    id: 'vivek-ramaswamy',
    name: 'Vivek Ramaswamy',
    handle: '@VivekGRamaswamy',
    url: 'https://www.youtube.com/@VivekGRamaswamy',
    focusEs: 'Anti-woke corporativo y excelencia americana',
    focusEn: 'Anti-woke corporatism and American excellence',
    accent: '#FF8C00',
    mark: '🏆',
  },
  {
    id: 'javier-milei',
    name: 'Javier Milei',
    handle: '@JMilei',
    url: 'https://www.youtube.com/@JMilei',
    imageUrl:
      'https://yt3.googleusercontent.com/Mq2gx0XnRLMaS0E7_bM4l8GuVPOricx2Zdazn1AcCV8Lfi0fhYdK9maPn4STJNeIo7ExwEXXBg=s240-c-k-c0x00ffffff-no-rj',
    focusEs: 'Economía austriaca y libertad en español',
    focusEn: 'Austrian economics and liberty in Spanish',
    accent: '#6B2D5B',
    mark: '🦁',
  },
  {
    id: 'douglas-murray',
    name: 'Douglas Murray',
    handle: '@DouglasMurray',
    url: 'https://www.youtube.com/@DouglasMurray',
    focusEs: 'Identidad, Occidente y crítica al woke',
    focusEn: 'Identity, the West, and critique of woke ideology',
    accent: '#708090',
    mark: '🇪🇺',
  },
  {
    id: 'dave-ramsey',
    name: 'Dave Ramsey',
    handle: '@daveramsey',
    url: 'https://www.youtube.com/@daveramsey',
    focusEs: 'Mayordomía del dinero y vida sin deudas',
    focusEn: 'Money stewardship and debt-free living',
    accent: '#228B22',
    mark: '💵',
  },
  {
    id: 'robert-kiyosaki',
    name: 'Robert Kiyosaki',
    handle: '@therichdadchannel',
    url: 'https://www.youtube.com/@therichdadchannel',
    focusEs: 'Educación financiera y mentalidad de inversor',
    focusEn: 'Financial education and investor mindset',
    accent: '#32CD32',
    mark: '📊',
  },
  {
    id: 'john-maxwell',
    name: 'John C. Maxwell',
    handle: '@JohnCMaxwellLead',
    url: 'https://www.youtube.com/@JohnCMaxwellLead',
    focusEs: 'Liderazgo y carácter',
    focusEn: 'Leadership and character',
    accent: '#DAA520',
    mark: '👑',
  },
  {
    id: 'alex-newman',
    name: 'Alex Newman',
    handle: '@LibertySentinel',
    url: 'https://www.youtube.com/@LibertySentinel',
    focusEs: 'Educación, globalismo y derechos de los padres',
    focusEn: 'Education, globalism, and parental rights',
    accent: '#556B2F',
    mark: '🏫',
  },
  {
    id: 'liz-wheeler',
    name: 'Liz Wheeler',
    handle: '@LizWheeler',
    url: 'https://www.youtube.com/@LizWheeler',
    imageUrl:
      'https://yt3.googleusercontent.com/NOAamE04PmJlkmbiPwagZ3JnSxe-QOFD-whtmkk6AEvL32-cg_3oxS8z8JeRhbK8z3aHnEk5=s240-c-k-c0x00ffffff-no-rj',
    focusEs: 'Medios, cultura y verdad sin spin',
    focusEn: 'Media, culture, and truth without spin',
    accent: '#FF69B4',
    mark: '🎤',
  },
  {
    id: 'jack-posobiec',
    name: 'Jack Posobiec',
    handle: '@JackPosobiec',
    url: 'https://www.youtube.com/@JackPosobiec',
    focusEs: 'Noticias y batalla narrativa',
    focusEn: 'News and narrative warfare',
    accent: '#2F2F2F',
    mark: '📡',
  },
  {
    id: 'bill-oreilly',
    name: "Bill O'Reilly",
    handle: '@BillOReilly',
    url: 'https://www.youtube.com/@BillOReilly',
    focusEs: 'Historia y política americana',
    focusEn: 'American history and politics',
    accent: '#8B0000',
    mark: '🎩',
  },
  {
    id: 'daniel-lacalle',
    name: 'Daniel Lacalle',
    handle: '@dlacalle',
    url: 'https://www.youtube.com/@dlacalle',
    focusEs: 'Economía, mercados y libertad en español',
    focusEn: 'Economics, markets, and liberty in Spanish',
    accent: '#C0C0C0',
    mark: '🇪🇸',
  },
  {
    id: 'robert-malone',
    name: 'Robert Malone',
    handle: '@rwmalonemd',
    url: 'https://www.youtube.com/@rwmalonemd',
    focusEs: 'Ciencia, salud y libertad médica',
    focusEn: 'Science, health, and medical freedom',
    accent: '#4B0082',
    mark: '🧪',
  },
  {
    id: 'peter-mccullough',
    name: 'Peter McCullough',
    handle: '@PeterMcCulloughMD',
    url: 'https://www.youtube.com/@PeterMcCulloughMD',
    imageUrl:
      'https://yt3.googleusercontent.com/hR1BU46Zg0een100Q-t45MrVXZHEOFRSXrPyUzAt_fvp6jH1CGqtN1BuX8ArYKJBUlQSjJRY=s240-c-k-c0x00ffffff-no-rj',
    focusEs: 'Medicina y debate científico abierto',
    focusEn: 'Medicine and open scientific debate',
    accent: '#5F4B8B',
    mark: '🩺',
  },
];

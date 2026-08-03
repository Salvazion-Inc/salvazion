/**
 * YouTube channels of authors featured in the recommended library.
 * Short videos + lessons / mini-courses live here (Freedom · Learn).
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
    // unavatar with default fallback so the card never stays empty
    return `https://unavatar.io/youtube/@${encodeURIComponent(h)}`;
  }
  // Derive @ from youtube.com/@slug
  const m = ch.url.match(/youtube\.com\/@([^/?#]+)/i);
  if (m?.[1]) {
    return `https://unavatar.io/youtube/@${encodeURIComponent(m[1])}`;
  }
  // Last resort: monogram from channel name
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(ch.name)}&background=${ch.accent.replace('#', '')}&color=fff&size=256&bold=true&format=png`;
}

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
    handle: '@charliekirk1776',
    url: 'https://www.youtube.com/@charliekirk1776',
    focusEs: 'Campus, fe, libertad y cultura americana',
    focusEn: 'Campus, faith, liberty, and American culture',
    accent: '#DC143C',
    mark: '🇺🇸',
  },
  {
    id: 'tpusa',
    name: 'Turning Point USA',
    handle: '@tpusa',
    url: 'https://www.youtube.com/@tpusa',
    focusEs: 'Mini-cursos y charlas de libertad en campus',
    focusEn: 'Campus liberty talks and short courses',
    accent: '#B22222',
    mark: '🎓',
  },
  {
    id: 'agustin-laje',
    name: 'Agustín Laje',
    handle: '@agustinlaje',
    url: 'https://www.youtube.com/@agustinlaje',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Agust%C3%ADn_Laje_in_2025.jpg/400px-Agust%C3%ADn_Laje_in_2025.jpg',
    focusEs: 'Batalla cultural, familia y crítica al progresismo',
    focusEn: 'Culture war, family, and critique of progressivism',
    accent: '#8B0000',
    mark: '⚔',
  },
  {
    id: 'axel-kaiser',
    name: 'Axel Kaiser',
    handle: '@AxelKaiserOficial',
    url: 'https://www.youtube.com/@AxelKaiserOficial',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Axel_Kaiser%2C_2026.jpg/400px-Axel_Kaiser%2C_2026.jpg',
    focusEs: 'Libertad económica y crítica al igualitarismo',
    focusEn: 'Economic liberty and critique of egalitarianism',
    accent: '#C9A227',
    mark: '🇨🇱',
  },
  {
    id: 'vanessa-kaiser',
    name: 'Vanessa Kaiser',
    handle: '@VanessaKaiserOficial',
    url: 'https://www.youtube.com/@VanessaKaiserOficial',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/7/7c/Senado_2026_Vanessa_Olimpia_Kaiser_Barents_von_Hohenhagen.jpg',
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
    focusEs: 'Mini-lecciones de 5 min: fe, historia y libertad',
    focusEn: '5-min lessons: faith, history, and liberty',
    accent: '#1E3A5F',
    mark: '📘',
  },
  {
    id: 'dennis-prager',
    name: 'Dennis Prager',
    handle: '@DennisPrager',
    url: 'https://www.youtube.com/@DennisPrager',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Dennis_Prager_2023_AmericaFest_%283x4_cropped%29.jpg/400px-Dennis_Prager_2023_AmericaFest_%283x4_cropped%29.jpg',
    focusEs: 'Torá, moral y cultura judeocristiana',
    focusEn: 'Torah, morality, and Judeo-Christian culture',
    accent: '#2C4A6E',
    mark: '✡',
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
    handle: '@JohnCMaxwellCo',
    url: 'https://www.youtube.com/@JohnCMaxwellCo',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/John_C._Maxwell_%28cropped%29.jpg/400px-John_C._Maxwell_%28cropped%29.jpg',
    focusEs: 'Liderazgo y carácter',
    focusEn: 'Leadership and character',
    accent: '#DAA520',
    mark: '👑',
  },
  {
    id: 'tommy-robinson',
    name: 'Tommy Robinson',
    handle: '@TommyRobinsonNews',
    url: 'https://www.youtube.com/@TommyRobinsonNews',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Tommy_Robinson_2025.png/400px-Tommy_Robinson_2025.png',
    focusEs: 'Libertad de expresión y soberanía en el Reino Unido',
    focusEn: 'Free speech and sovereignty in the UK',
    accent: '#000080',
    mark: '🇬🇧',
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
    id: 'cristina-martin',
    name: 'Cristina Martín Jiménez',
    handle: '@CristinaMartinJimenez',
    url: 'https://www.youtube.com/@CristinaMartinJimenez',
    // Portrait not available on Commons; use clean monogram-style photo fallback via ui-avatars
    imageUrl:
      'https://ui-avatars.com/api/?name=Cristina+Martin&background=800020&color=fff&size=256&bold=true&format=png',
    focusEs: 'Geopolítica y redes de poder',
    focusEn: 'Geopolitics and power networks',
    accent: '#800020',
    mark: '🕵',
  },
  {
    id: 'nick-adams',
    name: 'Nick Adams',
    handle: '@OfficialNickAdams',
    url: 'https://www.youtube.com/@OfficialNickAdams',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Nick_Adams_Special_Envoy.png/400px-Nick_Adams_Special_Envoy.png',
    focusEs: 'Patriotismo y cultura americana',
    focusEn: 'Patriotism and American culture',
    accent: '#B22222',
    mark: '🦅',
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
  {
    id: 'salvazion',
    name: 'Salvazion',
    handle: '@salvazion',
    url: 'https://www.youtube.com/@salvazion',
    imageUrl:
      'https://yt3.googleusercontent.com/ytc/AIdro_n9L3MUdjitYl_K1iQquDvEiFlL6P2mVh1q6P-bVvmzCA=s240-c-k-c0x00ffffff-no-rj',
    focusEs: 'Canal y clips del movimiento Salvazion',
    focusEn: 'Salvazion movement channel and clips',
    accent: '#7BC98A',
    mark: '🦁',
  },
];

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
  /** Optional direct avatar / banner image URL */
  imageUrl?: string;
};

/** Avatar for channel cards — prefers @handle via unavatar.io */
export function youtubeChannelImage(ch: YouTubeChannel): string | null {
  if (ch.imageUrl) return ch.imageUrl;
  if (ch.handle) {
    const h = ch.handle.replace(/^@/, '');
    return `https://unavatar.io/youtube/@${encodeURIComponent(h)}?fallback=false`;
  }
  // Derive @ from youtube.com/@slug
  const m = ch.url.match(/youtube\.com\/@([^/?#]+)/i);
  if (m?.[1]) {
    return `https://unavatar.io/youtube/@${encodeURIComponent(m[1])}?fallback=false`;
  }
  return null;
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
    focusEs: 'Batalla cultural, familia y crítica al progresismo',
    focusEn: 'Culture war, family, and critique of progressivism',
    accent: '#8B0000',
    mark: '⚔',
  },
  {
    id: 'axel-kaiser',
    name: 'Axel Kaiser',
    handle: '@AxelKaiserOficial',
    url: 'https://www.youtube.com/results?search_query=Axel+Kaiser',
    focusEs: 'Libertad económica y crítica al igualitarismo',
    focusEn: 'Economic liberty and critique of egalitarianism',
    accent: '#C9A227',
    mark: '🇨🇱',
  },
  {
    id: 'vanessa-kaiser',
    name: 'Vanessa Kaiser',
    url: 'https://www.youtube.com/results?search_query=Vanessa+Kaiser',
    focusEs: 'Libertad, educación y crítica al feminismo radical',
    focusEn: 'Liberty, education, and critique of radical feminism',
    accent: '#DB7093',
    mark: '♀',
  },
  {
    id: 'miklos-lukacs',
    name: 'Miklós Lukács',
    url: 'https://www.youtube.com/results?search_query=Miklos+Lukacs',
    focusEs: 'Transhumanismo, IA y antropología',
    focusEn: 'Transhumanism, AI, and anthropology',
    accent: '#6A5ACD',
    mark: '🤖',
  },
  {
    id: 'pablo-munoz',
    name: 'Pablo Muñoz Iturrieta',
    url: 'https://www.youtube.com/results?search_query=Pablo+Mu%C3%B1oz+Iturrieta',
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
    url: 'https://www.youtube.com/results?search_query=Dennis+Prager',
    focusEs: 'Torá, moral y cultura judeocristiana',
    focusEn: 'Torah, morality, and Judeo-Christian culture',
    accent: '#2C4A6E',
    mark: '✡',
  },
  {
    id: 'dailywire',
    name: 'Daily Wire',
    handle: '@DailyWire',
    url: 'https://www.youtube.com/@DailyWirePlus',
    focusEs: 'Shapiro, Walsh y cultura conservadora',
    focusEn: 'Shapiro, Walsh, and conservative culture',
    accent: '#000000',
    mark: '🎙',
  },
  {
    id: 'matt-walsh',
    name: 'Matt Walsh',
    handle: '@MattWalsh',
    url: 'https://www.youtube.com/results?search_query=Matt+Walsh+Daily+Wire',
    focusEs: 'Fe, familia y crítica a la ideología de género',
    focusEn: 'Faith, family, and critique of gender ideology',
    accent: '#1C1C1C',
    mark: '⛪',
  },
  {
    id: 'ben-shapiro',
    name: 'Ben Shapiro',
    handle: '@BenShapiro',
    url: 'https://www.youtube.com/results?search_query=Ben+Shapiro',
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
    url: 'https://www.youtube.com/results?search_query=Vivek+Ramaswamy',
    focusEs: 'Anti-woke corporativo y excelencia americana',
    focusEn: 'Anti-woke corporatism and American excellence',
    accent: '#FF8C00',
    mark: '🏆',
  },
  {
    id: 'javier-milei',
    name: 'Javier Milei',
    handle: '@JavierMilei',
    url: 'https://www.youtube.com/results?search_query=Javier+Milei',
    focusEs: 'Economía austriaca y libertad en español',
    focusEn: 'Austrian economics and liberty in Spanish',
    accent: '#6B2D5B',
    mark: '🦁',
  },
  {
    id: 'douglas-murray',
    name: 'Douglas Murray',
    url: 'https://www.youtube.com/results?search_query=Douglas+Murray',
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
    url: 'https://www.youtube.com/results?search_query=Robert+Kiyosaki',
    focusEs: 'Educación financiera y mentalidad de inversor',
    focusEn: 'Financial education and investor mindset',
    accent: '#32CD32',
    mark: '📊',
  },
  {
    id: 'john-maxwell',
    name: 'John C. Maxwell',
    handle: '@JohnCMaxwellCo',
    url: 'https://www.youtube.com/results?search_query=John+C+Maxwell',
    focusEs: 'Liderazgo y carácter',
    focusEn: 'Leadership and character',
    accent: '#DAA520',
    mark: '👑',
  },
  {
    id: 'tommy-robinson',
    name: 'Tommy Robinson',
    url: 'https://www.youtube.com/results?search_query=Tommy+Robinson',
    focusEs: 'Libertad de expresión y soberanía en el Reino Unido',
    focusEn: 'Free speech and sovereignty in the UK',
    accent: '#000080',
    mark: '🇬🇧',
  },
  {
    id: 'alex-newman',
    name: 'Alex Newman',
    url: 'https://www.youtube.com/results?search_query=Alex+Newman',
    focusEs: 'Educación, globalismo y derechos de los padres',
    focusEn: 'Education, globalism, and parental rights',
    accent: '#556B2F',
    mark: '🏫',
  },
  {
    id: 'liz-wheeler',
    name: 'Liz Wheeler',
    url: 'https://www.youtube.com/results?search_query=Liz+Wheeler',
    focusEs: 'Medios, cultura y verdad sin spin',
    focusEn: 'Media, culture, and truth without spin',
    accent: '#FF69B4',
    mark: '🎤',
  },
  {
    id: 'jack-posobiec',
    name: 'Jack Posobiec',
    url: 'https://www.youtube.com/results?search_query=Jack+Posobiec',
    focusEs: 'Noticias y batalla narrativa',
    focusEn: 'News and narrative warfare',
    accent: '#2F2F2F',
    mark: '📡',
  },
  {
    id: 'bill-oreilly',
    name: "Bill O'Reilly",
    url: 'https://www.youtube.com/results?search_query=Bill+O%27Reilly',
    focusEs: 'Historia y política americana',
    focusEn: 'American history and politics',
    accent: '#8B0000',
    mark: '🎩',
  },
  {
    id: 'daniel-lacalle',
    name: 'Daniel Lacalle',
    url: 'https://www.youtube.com/results?search_query=Daniel+Lacalle',
    focusEs: 'Economía, mercados y libertad en español',
    focusEn: 'Economics, markets, and liberty in Spanish',
    accent: '#C0C0C0',
    mark: '🇪🇸',
  },
  {
    id: 'cristina-martin',
    name: 'Cristina Martín Jiménez',
    url: 'https://www.youtube.com/results?search_query=Cristina+Mart%C3%ADn+Jim%C3%A9nez',
    focusEs: 'Geopolítica y redes de poder',
    focusEn: 'Geopolitics and power networks',
    accent: '#800020',
    mark: '🕵',
  },
  {
    id: 'nick-adams',
    name: 'Nick Adams',
    url: 'https://www.youtube.com/results?search_query=Nick+Adams+Foundation',
    focusEs: 'Patriotismo y cultura americana',
    focusEn: 'Patriotism and American culture',
    accent: '#B22222',
    mark: '🦅',
  },
  {
    id: 'robert-malone',
    name: 'Robert Malone',
    url: 'https://www.youtube.com/results?search_query=Robert+Malone+MD',
    focusEs: 'Ciencia, salud y libertad médica',
    focusEn: 'Science, health, and medical freedom',
    accent: '#4B0082',
    mark: '🧪',
  },
  {
    id: 'peter-mccullough',
    name: 'Peter McCullough',
    url: 'https://www.youtube.com/results?search_query=Peter+McCullough+MD',
    focusEs: 'Medicina y debate científico abierto',
    focusEn: 'Medicine and open scientific debate',
    accent: '#5F4B8B',
    mark: '🩺',
  },
  {
    id: 'salvazion',
    name: 'Salvazion',
    handle: '@salvazion_',
    url: 'https://www.youtube.com/results?search_query=Salvazion',
    focusEs: 'Canal y clips del movimiento Salvazion',
    focusEn: 'Salvazion movement channel and clips',
    accent: '#7BC98A',
    mark: '🦁',
  },
];

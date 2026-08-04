/**
 * Christian Assemblies & Evangelical churches near the user (Freedom · Connect).
 * OpenStreetMap / Overpass — free, no API key.
 * Focus: Asambleas cristianas, iglesias evangélicas y denominaciones afines.
 * Excludes Catholic parishes and non-Christian religions.
 */

export type ChurchDenomFamily =
  | 'asambleas'
  | 'evangelica'
  | 'pentecostal'
  | 'bautista'
  | 'metodista'
  | 'presbiteriana'
  | 'luterana'
  | 'adventista'
  | 'anglicana'
  | 'reformada'
  | 'carismatica'
  | 'nondenominational'
  | 'otras';

export type ChurchPlace = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  denomination?: string;
  family: ChurchDenomFamily;
  address?: string;
  distanceM?: number;
  website?: string;
  phone?: string;
};

export const SEARCH_RADIUS_M = 15_000;
export const MAX_RESULTS = 60;

/** Denomination families shown as filter chips (value for discovery). */
export const DENOM_FAMILIES: ChurchDenomFamily[] = [
  'asambleas',
  'evangelica',
  'pentecostal',
  'bautista',
  'metodista',
  'presbiteriana',
  'luterana',
  'adventista',
  'anglicana',
  'reformada',
  'carismatica',
  'nondenominational',
  'otras',
];

export function denomFamilyLabel(family: ChurchDenomFamily, es: boolean): string {
  const map: Record<ChurchDenomFamily, { es: string; en: string }> = {
    asambleas: { es: 'Asambleas', en: 'Assemblies' },
    evangelica: { es: 'Evangélica', en: 'Evangelical' },
    pentecostal: { es: 'Pentecostal', en: 'Pentecostal' },
    bautista: { es: 'Bautista', en: 'Baptist' },
    metodista: { es: 'Metodista', en: 'Methodist' },
    presbiteriana: { es: 'Presbiteriana', en: 'Presbyterian' },
    luterana: { es: 'Luterana', en: 'Lutheran' },
    adventista: { es: 'Adventista', en: 'Adventist' },
    anglicana: { es: 'Anglicana', en: 'Anglican' },
    reformada: { es: 'Reformada', en: 'Reformed' },
    carismatica: { es: 'Carismática', en: 'Charismatic' },
    nondenominational: { es: 'No denom.', en: 'Non-denom.' },
    otras: { es: 'Otras', en: 'Other' },
  };
  return es ? map[family].es : map[family].en;
}

/** Catholic (excluded). */
const CATHOLIC_DENOM =
  /^(roman_?)?catholic$|greek_catholic|ukrainian_catholic|maronite|melkite|chaldean|syro.?malabar|syro.?malankara|coptic_catholic|armenian_catholic|byzantine_catholic/i;

const CATHOLIC_NAME =
  /\b(cat[oó]lic[ao]s?|catholic|catedral|cathedral|bas[ií]lica|basilica|sagrado\s+coraz[oó]n|inmaculada\s+concepci[oó]n|nuestra\s+se[nñ]ora\b|parroquia\s+(san|santa|nuestra)|iglesia\s+parroquial|arciprestazgo|obispado)\b/i;

const NON_CHRISTIAN_RELIGION =
  /^(muslim|islam|islamic|jewish|judaism|buddhist|buddhism|hindu|hinduism|sikh|shinto|taoist|bahai|bahá.?í|pagan|jain|zoroastrian|scientology)$/i;

const EXCLUDED_DENOM =
  /mormon|latter.?day|lds|jehovah|testigo|unitarian|scientology|catholic/i;

/**
 * Overpass denomination regex — Assemblies, Evangelical & Protestant families.
 * Kept in sync with classifyDenomFamily below.
 */
export const OVERPASS_DENOM_REGEX =
  'protestant|evangelical|evangelic|baptist|pentecostal|methodist|presbyterian|lutheran|anglican|adventist|assemblies_of_god|assembly_of_god|assemblies|asamblea|nondenominational|non-denominational|non_denominational|reformed|charismatic|holiness|brethren|mennonite|anabaptist|wesleyan|episcopal|congregational|full_gospel|foursquare|calvary|vineyard|independent|free_church|new_apostolic|moravian|quaker|salvation_army|church_of_god|church_of_christ|disciples_of_christ|restorationist|messianic|christian_and_missionary_alliance|cma|nazarene|apostolic|pentecost|evangelisch|reformed_church|united_methodist|southern_baptist|free_methodist';

/** Name patterns for LATAM / global evangelical & assemblies. */
export const OVERPASS_NAME_REGEX =
  'asamblea|asambleas de dios|asambleas cristianas|asamblea cristiana|evangelic|evang[eé]lic|iglesia cristiana|iglesia evang|assembly of god|assemblies of god|christian assembly|christian assemblies|pentecost|bautista|baptist|adventist|metodista|methodist|presbiterian|presbyterian|luteran|lutheran|anglican|episcopal|nazareno|nazarene|foursquare|calvary|vi[nñ]a|vineyard|bethel|ebenezer|peniel|shalom|centro cristiano|templo cristiano|iglesia del dios|iglesia de dios|church of god|full gospel|casa de oraci[oó]n|tabern[aá]culo|ministerio cristiano|iglesia reformada|alianza cristiana|christian and missionary|iglesia apost[oó]lica|iglesia pentecostal|iglesia bautista|iglesia metodista|iglesia presbiteriana|iglesia luterana|iglesia adventista|iglesia anglicana|iglesia wesleyana|iglesia carism[aá]tica|iglesia libre|iglesia independiente|iglesia no denominacional|community church|bible church|gospel church|faith church|grace church|hope church|life church|new life|nueva vida|palabra de vida|fuente de vida|r[ií]o de vida|monte sinai|monte sions|getseman[ií]|emaus|emmaus|maranatha|maranata|agape|[aá]gape|philadelphia|filadelfia|elim|hebron|hebr[oó]n|cana[aá]n|silo[eé]|siloam|bethany|betania|redeemer|redentor|saviour|salvador';

export function buildOverpassQuery(lat: number, lon: number, radiusM = SEARCH_RADIUS_M): string {
  const r = radiusM;
  const d = OVERPASS_DENOM_REGEX;
  const n = OVERPASS_NAME_REGEX;
  return `
[out:json][timeout:30];
(
  node["amenity"="place_of_worship"]["religion"="christian"](around:${r},${lat},${lon});
  way["amenity"="place_of_worship"]["religion"="christian"](around:${r},${lat},${lon});
  relation["amenity"="place_of_worship"]["religion"="christian"](around:${r},${lat},${lon});
  node["amenity"="place_of_worship"]["denomination"~"${d}",i](around:${r},${lat},${lon});
  way["amenity"="place_of_worship"]["denomination"~"${d}",i](around:${r},${lat},${lon});
  relation["amenity"="place_of_worship"]["denomination"~"${d}",i](around:${r},${lat},${lon});
  node["building"="church"]["denomination"~"${d}",i](around:${r},${lat},${lon});
  way["building"="church"]["denomination"~"${d}",i](around:${r},${lat},${lon});
  node["amenity"="place_of_worship"]["name"~"${n}",i](around:${r},${lat},${lon});
  way["amenity"="place_of_worship"]["name"~"${n}",i](around:${r},${lat},${lon});
  node["building"="church"]["name"~"${n}",i](around:${r},${lat},${lon});
  way["building"="church"]["name"~"${n}",i](around:${r},${lat},${lon});
  node["amenity"="community_centre"]["religion"="christian"](around:${r},${lat},${lon});
  way["amenity"="community_centre"]["religion"="christian"](around:${r},${lat},${lon});
);
out center tags ${MAX_RESULTS + 40};
`.trim();
}

export function classifyDenomFamily(
  denomRaw: string | undefined,
  name: string
): ChurchDenomFamily {
  const d = (denomRaw || '').toLowerCase().replace(/[_-]+/g, ' ');
  const n = name.toLowerCase();
  const hay = `${d} ${n}`;

  if (
    /assembl(?:y|ies)\s+of\s+god|asambleas?\s+de\s+dios|asamblea\s+cristiana|asambleas\s+cristianas|christian\s+assembl|assembly\s+of\s+god/.test(
      hay
    )
  ) {
    return 'asambleas';
  }
  if (/pentecost|full\s*gospel|foursquare|apostolic|iglesia\s+de\s+dios|church\s+of\s+god/.test(hay)) {
    return 'pentecostal';
  }
  if (/baptist|bautista/.test(hay)) return 'bautista';
  if (/methodist|metodista|wesleyan|wesley/.test(hay)) return 'metodista';
  if (/presbyterian|presbiterian/.test(hay)) return 'presbiteriana';
  if (/lutheran|luteran/.test(hay)) return 'luterana';
  if (/adventist|adventista|sda/.test(hay)) return 'adventista';
  if (/anglican|episcopal/.test(hay)) return 'anglicana';
  if (/reformed|reformad|calvin/.test(hay)) return 'reformada';
  if (/charismatic|carism[aá]tic|vineyard|vi[nñ]a|calvary/.test(hay)) {
    return 'carismatica';
  }
  if (
    /nondenominational|non\s*denominational|no\s*denom|independent|community\s+church|bible\s+church/.test(
      hay
    )
  ) {
    return 'nondenominational';
  }
  if (/evangelic|evang[eé]lic|protestant|alianza\s+cristiana|cma|nazarene|nazareno/.test(hay)) {
    return 'evangelica';
  }
  return 'otras';
}

function isCatholic(tags: Record<string, string>, name: string): boolean {
  const denom = (tags.denomination || '').trim();
  const religion = (tags.religion || '').trim();
  if (denom && CATHOLIC_DENOM.test(denom)) return true;
  if (religion && /catholic/i.test(religion)) return true;
  if (CATHOLIC_NAME.test(name)) return true;
  if (
    /cathol|di[oó]cesis|archidi[oó]cesis|obispado|vaticano/i.test(tags.operator || '')
  ) {
    return true;
  }
  return false;
}

function isExcludedDenom(tags: Record<string, string>, name: string): boolean {
  const denom = (tags.denomination || '').trim();
  if (denom && EXCLUDED_DENOM.test(denom)) return true;
  if (/\b(mormon|testigos?\s+de\s+jehov[aá]|jehovah|latter.?day|lds)\b/i.test(name)) {
    return true;
  }
  return false;
}

function isNonChristianReligion(tags: Record<string, string>): boolean {
  const religion = (tags.religion || '').trim();
  if (!religion) return false;
  if (/^christian$/i.test(religion)) return false;
  return NON_CHRISTIAN_RELIGION.test(religion) || !/christian/i.test(religion);
}

/**
 * Keep Christian Assemblies / Evangelical / Protestant churches.
 * Exclude Catholic and non-Christian places of worship.
 */
export function isChristianAssemblyOrEvangelical(
  tags: Record<string, string>,
  name: string
): boolean {
  if (isCatholic(tags, name)) return false;
  if (isExcludedDenom(tags, name)) return false;
  if (isNonChristianReligion(tags)) return false;

  const religion = (tags.religion || '').trim().toLowerCase();
  const denom = (tags.denomination || '').trim();
  const amenity = (tags.amenity || '').trim();
  const building = (tags.building || '').trim();

  if (religion === 'christian') return true;

  if (denom && new RegExp(OVERPASS_DENOM_REGEX, 'i').test(denom) && !CATHOLIC_DENOM.test(denom)) {
    return true;
  }

  if (new RegExp(OVERPASS_NAME_REGEX, 'i').test(name) && !CATHOLIC_NAME.test(name)) {
    if (/^\s*templo\s*$/i.test(name) && religion && religion !== 'christian') return false;
    return true;
  }

  if (amenity === 'place_of_worship' && !religion && !denom) return false;
  if (building === 'church' && !religion) {
    return new RegExp(OVERPASS_NAME_REGEX, 'i').test(name) && !CATHOLIC_NAME.test(name);
  }

  return false;
}

export function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

export function directionsUrl(lat: number, lon: number, name: string): string {
  // Name helps Maps label the pin; coords keep the route precise.
  const dest = encodeURIComponent(`${name}@${lat},${lon}`);
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`;
}

export function placeUrl(lat: number, lon: number, name?: string): string {
  const q = encodeURIComponent(name ? `${name} ${lat},${lon}` : `${lat},${lon}`);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

export function humanizeDenomination(raw: string | undefined, es: boolean): string | undefined {
  if (!raw) return undefined;
  const key = raw.toLowerCase().replace(/[_-]+/g, ' ').trim();
  const labels: Record<string, { es: string; en: string }> = {
    'assemblies of god': { es: 'Asambleas de Dios', en: 'Assemblies of God' },
    'assembly of god': { es: 'Asambleas de Dios', en: 'Assemblies of God' },
    evangelical: { es: 'Evangélica', en: 'Evangelical' },
    evangelic: { es: 'Evangélica', en: 'Evangelical' },
    protestant: { es: 'Protestante', en: 'Protestant' },
    baptist: { es: 'Bautista', en: 'Baptist' },
    pentecostal: { es: 'Pentecostal', en: 'Pentecostal' },
    methodist: { es: 'Metodista', en: 'Methodist' },
    presbyterian: { es: 'Presbiteriana', en: 'Presbyterian' },
    lutheran: { es: 'Luterana', en: 'Lutheran' },
    anglican: { es: 'Anglicana', en: 'Anglican' },
    episcopal: { es: 'Episcopal', en: 'Episcopal' },
    adventist: { es: 'Adventista', en: 'Adventist' },
    reformed: { es: 'Reformada', en: 'Reformed' },
    charismatic: { es: 'Carismática', en: 'Charismatic' },
    nondenominational: { es: 'No denominacional', en: 'Non-denominational' },
    'non denominational': { es: 'No denominacional', en: 'Non-denominational' },
    independent: { es: 'Independiente', en: 'Independent' },
    foursquare: { es: 'Cuadrangular', en: 'Foursquare' },
    vineyard: { es: 'La Viña', en: 'Vineyard' },
    calvary: { es: 'Calvary', en: 'Calvary' },
    nazarene: { es: 'Nazareno', en: 'Nazarene' },
    wesleyan: { es: 'Wesleyana', en: 'Wesleyan' },
    mennonite: { es: 'Menonita', en: 'Mennonite' },
    brethren: { es: 'Hermanos', en: 'Brethren' },
    congregational: { es: 'Congregacional', en: 'Congregational' },
    'full gospel': { es: 'Evangelio Completo', en: 'Full Gospel' },
    'church of god': { es: 'Iglesia de Dios', en: 'Church of God' },
    'salvation army': { es: 'Ejército de Salvación', en: 'Salvation Army' },
    christian: { es: 'Cristiana', en: 'Christian' },
  };
  const hit = labels[key];
  if (hit) return es ? hit.es : hit.en;
  // Title-case unknown OSM keys
  return raw
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

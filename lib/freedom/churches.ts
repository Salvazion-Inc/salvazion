/**
 * Christian Assemblies & Evangelical churches near the user (Freedom · Connect).
 * OpenStreetMap / Overpass — free, no API key.
 * Focus: Asambleas cristianas, iglesias evangélicas y denominaciones protestantes afines.
 * Excludes: Catholic, Mormon/LDS, Jehovah’s Witnesses, other sects, and non-Christian religions.
 * Allowlist only — bare `religion=christian` is not enough (most Catholic parishes use that).
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

/** Catholic rites / OSM denomination keys (excluded). */
const CATHOLIC_DENOM =
  /catholic|roman.?catholic|greek.?catholic|ukrainian.?catholic|maronite|melkite|chaldean|syro.?malabar|syro.?malankara|coptic.?catholic|armenian.?catholic|byzantine.?catholic|old.?catholic|latin.?rite|eastern.?catholic/i;

/** Names / operators typical of Catholic parishes (excluded). */
const CATHOLIC_NAME =
  /\b(cat[oó]lic[ao]s?|catholic|catedral|cathedral|bas[ií]lica|basilica|sagrado\s+coraz[oó]n|sacred\s+heart|inmaculada\s+concepci[oó]n|immaculate\s+conception|nuestra\s+se[nñ]ora\b|our\s+lady\b|parroquia|parish\b|iglesia\s+parroquial|arciprestazgo|obispado|di[oó]cesis|archidi[oó]cesis|diocese|archdiocese|vaticano|vatican|santa\s+sede|sacerdote|curia|seminario\s+(mayor|menor)|colegio\s+san\b|capilla\s+(san|santa|nuestra|del\s+sagrado)|san\s+francisco\s+javier|virgen\s+de\b|mar[ií]a\s+auxiliadora|cristo\s+rey\s+cat[oó]lic)\b/i;

const NON_CHRISTIAN_RELIGION =
  /^(muslim|islam|islamic|jewish|judaism|buddhist|buddhism|hindu|hinduism|sikh|shinto|taoist|bahai|bahá.?í|pagan|jain|zoroastrian|scientology)$/i;

/**
 * Denominations / movements we do not surface (sects, restorationist groups outside
 * classical evangelical/protestant assembly map, Catholic, etc.).
 */
const EXCLUDED_DENOM =
  /catholic|mormon|latter.?day|lds|jehovah|watch.?tower|watchtower|testigo|unitarian|universalist|scientology|christian.?science|unification|moon|moonies|raoelian|raelian|new.?apostolic|iglesia\s+ni\s+cristo|church\s+of\s+jesus\s+christ\s+of\s+latter|suda\b|santos\s+de\s+los\s+[uú]ltimos|kingdom.?hall|sal[oó]n\s+del\s+reino|branch.?davidian|world.?mission.?society|wmsco[gp]|shincheonji|god.?the.?mother|la\s+luz\s+del\s+mundo|luz\s+del\s+mundo|iglesia\s+universal\s+del\s+reino|universal\s+church\s+of\s+the\s+kingdom|iurd|orthodox|ortodox/i;

/** Name patterns for excluded groups (Spanish + English). */
const EXCLUDED_NAME =
  /\b(morm[oó]n(?:es)?|santos\s+de\s+los\s+[uú]ltimos\s+d[ií]as|latter[\s-]?day\s+saints|\blds\b|jehov[aá]|testigos?\s+de\s+jehov[aá]|kingdom\s+hall|sal[oó]n\s+del\s+reino|watch\s*tower|atalaya|cienci[ao]\s+cristiana|christian\s+science|unitari[ao]|unificaci[oó]n|moonies|scientolog|iglesia\s+ni\s+cristo|la\s+luz\s+del\s+mundo|luz\s+del\s+mundo|iurd|reino\s+de\s+dios\s+universal|nueva\s+apost[oó]lica|new\s+apostolic|madre\s+dios|world\s+mission\s+society|ortodox[ao]|orthodox)\b/i;

/**
 * Overpass denomination regex — Assemblies, Evangelical & Protestant families only.
 * Kept in sync with classifyDenomFamily. No Catholic / LDS / JW / sect keys.
 */
export const OVERPASS_DENOM_REGEX =
  'protestant|evangelical|evangelic|baptist|pentecostal|methodist|presbyterian|lutheran|anglican|adventist|assemblies_of_god|assembly_of_god|assemblies|asamblea|nondenominational|non-denominational|non_denominational|reformed|charismatic|holiness|brethren|mennonite|anabaptist|wesleyan|episcopal|congregational|full_gospel|foursquare|calvary|vineyard|independent|free_church|moravian|quaker|salvation_army|church_of_god|church_of_christ|disciples_of_christ|messianic|christian_and_missionary_alliance|cma|nazarene|apostolic|pentecost|evangelisch|reformed_church|united_methodist|southern_baptist|free_methodist';

/** Name patterns for LATAM / global evangelical & assemblies. */
export const OVERPASS_NAME_REGEX =
  'asamblea|asambleas de dios|asambleas cristianas|asamblea cristiana|evangelic|evang[eé]lic|iglesia cristiana|iglesia evang|assembly of god|assemblies of god|christian assembly|christian assemblies|pentecost|bautista|baptist|adventist|metodista|methodist|presbiterian|presbyterian|luteran|lutheran|anglican|episcopal|nazareno|nazarene|foursquare|calvary|vi[nñ]a|vineyard|bethel|ebenezer|peniel|shalom|centro cristiano|templo cristiano|iglesia del dios|iglesia de dios|church of god|full gospel|casa de oraci[oó]n|tabern[aá]culo|ministerio cristiano|iglesia reformada|alianza cristiana|christian and missionary|iglesia apost[oó]lica|iglesia pentecostal|iglesia bautista|iglesia metodista|iglesia presbiteriana|iglesia luterana|iglesia adventista|iglesia anglicana|iglesia wesleyana|iglesia carism[aá]tica|iglesia libre|iglesia independiente|iglesia no denominacional|community church|bible church|gospel church|faith church|grace church|hope church|life church|new life|nueva vida|palabra de vida|fuente de vida|r[ií]o de vida|monte sinai|monte sions|getseman[ií]|emaus|emmaus|maranatha|maranata|agape|[aá]gape|philadelphia|filadelfia|elim|hebron|hebr[oó]n|cana[aá]n|silo[eé]|siloam|bethany|betania|redeemer|redentor|saviour|salvador';

/** Official Overpass interpreters (server-side fetch with User-Agent). */
export const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
] as const;

export const GEO_USER_AGENT =
  'SalvazionApp/1.0 (https://salvazion.org; Freedom churches map)';

/**
 * Primary query: Christian places of worship near the point.
 * Keep it lean — heavy name regexes often time out or 406 on public mirrors.
 */
export function buildOverpassQuery(lat: number, lon: number, radiusM = SEARCH_RADIUS_M): string {
  const r = Math.max(1000, Math.min(radiusM, 25_000));
  return `
[out:json][timeout:28];
(
  node["amenity"="place_of_worship"]["religion"="christian"](around:${r},${lat},${lon});
  way["amenity"="place_of_worship"]["religion"="christian"](around:${r},${lat},${lon});
  relation["amenity"="place_of_worship"]["religion"="christian"](around:${r},${lat},${lon});
  node["building"="church"]["religion"="christian"](around:${r},${lat},${lon});
  way["building"="church"]["religion"="christian"](around:${r},${lat},${lon});
  node["amenity"="place_of_worship"]["denomination"~"${OVERPASS_DENOM_REGEX}",i](around:${r},${lat},${lon});
  way["amenity"="place_of_worship"]["denomination"~"${OVERPASS_DENOM_REGEX}",i](around:${r},${lat},${lon});
  node["amenity"="community_centre"]["religion"="christian"](around:${r},${lat},${lon});
  way["amenity"="community_centre"]["religion"="christian"](around:${r},${lat},${lon});
);
out tags center;
`.trim();
}

export type ReverseGeoResult = {
  label: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
};

export type OverpassElement = {
  id: number;
  type: string;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

/** Parse Overpass elements → filtered church list sorted by distance. */
export function churchesFromOverpassElements(
  elements: OverpassElement[] | undefined,
  lat: number,
  lon: number,
  es: boolean
): ChurchPlace[] {
  const list: ChurchPlace[] = [];
  for (const el of elements || []) {
    const clat = el.lat ?? el.center?.lat;
    const clon = el.lon ?? el.center?.lon;
    if (clat == null || clon == null) continue;
    const tags = el.tags || {};
    const name =
      tags.name ||
      tags['name:es'] ||
      tags['name:en'] ||
      (es ? 'Asamblea / Iglesia cristiana' : 'Christian assembly / church');

    if (!isChristianAssemblyOrEvangelical(tags, name)) continue;

    const family = classifyDenomFamily(tags.denomination, name);
    list.push({
      id: `${el.type}-${el.id}`,
      name,
      lat: clat,
      lon: clon,
      denomination: humanizeDenomination(tags.denomination, es),
      family,
      address:
        [tags['addr:street'], tags['addr:housenumber'], tags['addr:city']]
          .filter(Boolean)
          .join(' ')
          .trim() || undefined,
      distanceM: haversineMeters(lat, lon, clat, clon),
      website: tags.website || tags['contact:website'] || undefined,
      phone: tags.phone || tags['contact:phone'] || undefined,
    });
  }

  const seen = new Set<string>();
  return list
    .filter((c) => {
      const k = `${c.name.toLowerCase()}|${c.lat.toFixed(4)}|${c.lon.toFixed(4)}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .sort((a, b) => (a.distanceM ?? 0) - (b.distanceM ?? 0))
    .slice(0, MAX_RESULTS);
}

/** Server-side Overpass fetch with mirrors + User-Agent. */
export async function fetchOverpassChurches(
  lat: number,
  lon: number,
  radiusM = SEARCH_RADIUS_M
): Promise<OverpassElement[]> {
  const query = buildOverpassQuery(lat, lon, radiusM);
  let lastErr: Error | null = null;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 32_000);
      const res = await fetch(endpoint, {
        method: 'POST',
        body: query,
        headers: {
          'Content-Type': 'text/plain;charset=UTF-8',
          Accept: 'application/json',
          'User-Agent': GEO_USER_AGENT,
        },
        signal: ctrl.signal,
        cache: 'no-store',
      });
      clearTimeout(timer);
      if (!res.ok) {
        lastErr = new Error(`overpass ${res.status}`);
        continue;
      }
      const data = (await res.json()) as { elements?: OverpassElement[] };
      return data.elements || [];
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
    }
  }
  throw lastErr || new Error('overpass failed');
}

/** Nominatim reverse geocode → city + country (server-side). */
export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<ReverseGeoResult> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=12&addressdetails=1`;
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': GEO_USER_AGENT,
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    return {
      label: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
      city: '',
      country: '',
      lat,
      lon,
    };
  }
  const data = (await res.json()) as {
    display_name?: string;
    address?: {
      suburb?: string;
      neighbourhood?: string;
      city?: string;
      town?: string;
      village?: string;
      municipality?: string;
      county?: string;
      state?: string;
      country?: string;
    };
  };
  const a = data.address || {};
  const city =
    a.city ||
    a.town ||
    a.village ||
    a.municipality ||
    a.suburb ||
    a.neighbourhood ||
    a.county ||
    '';
  const country = a.country || '';
  const label =
    [city, a.state, country].filter(Boolean).join(', ') ||
    data.display_name ||
    `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  return { label, city, country, lat, lon };
}

/** Nominatim forward geocode for "City, Country". */
export async function geocodePlace(q: string): Promise<ReverseGeoResult | null> {
  const query = q.trim();
  if (!query) return null;
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&q=${encodeURIComponent(
    query
  )}`;
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': GEO_USER_AGENT,
    },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const rows = (await res.json()) as Array<{
    lat: string;
    lon: string;
    display_name?: string;
    address?: {
      city?: string;
      town?: string;
      village?: string;
      municipality?: string;
      country?: string;
      state?: string;
    };
  }>;
  if (!rows[0]) return null;
  const row = rows[0];
  const lat = parseFloat(row.lat);
  const lon = parseFloat(row.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const a = row.address || {};
  const city = a.city || a.town || a.village || a.municipality || query.split(',')[0]?.trim() || '';
  const country = a.country || '';
  return {
    lat,
    lon,
    city,
    country,
    label: row.display_name || [city, country].filter(Boolean).join(', ') || query,
  };
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

function haystack(tags: Record<string, string>, name: string): string {
  return [
    name,
    tags.denomination,
    tags.religion,
    tags.operator,
    tags.brand,
    tags['name:es'],
    tags['name:en'],
    tags['official_name'],
    tags['alt_name'],
  ]
    .filter(Boolean)
    .join(' ');
}

function isCatholic(tags: Record<string, string>, name: string): boolean {
  const denom = (tags.denomination || '').trim();
  const religion = (tags.religion || '').trim();
  const operator = (tags.operator || '').trim();
  const hay = haystack(tags, name);

  if (denom && CATHOLIC_DENOM.test(denom)) return true;
  if (religion && /catholic/i.test(religion)) return true;
  if (CATHOLIC_NAME.test(name) || CATHOLIC_NAME.test(hay)) return true;
  if (
    /cathol|di[oó]cesis|archidi[oó]cesis|obispado|vaticano|vatican|parroquia|parish/i.test(
      operator
    )
  ) {
    return true;
  }
  // OSM sometimes tags only network/brand for dioceses
  if (/di[oó]cesis|archidi[oó]cesis|archdiocese|diocese/i.test(tags.network || '')) {
    return true;
  }
  return false;
}

function isExcludedSectOrDenom(tags: Record<string, string>, name: string): boolean {
  const denom = (tags.denomination || '').trim();
  const hay = haystack(tags, name);
  if (denom && EXCLUDED_DENOM.test(denom)) return true;
  if (EXCLUDED_DENOM.test(hay)) return true;
  if (EXCLUDED_NAME.test(name) || EXCLUDED_NAME.test(hay)) return true;
  // Kingdom Hall / Watchtower often lack denomination tags
  if (
    /kingdom\s*hall|sal[oó]n\s+del\s+reino|watch\s*tower|atalaya/i.test(name) ||
    /kingdom\s*hall|sal[oó]n\s+del\s+reino/i.test(tags.building || '')
  ) {
    return true;
  }
  // LDS meetinghouses: full formal name or “Latter-day Saints”
  if (
    /santos\s+de\s+los\s+[uú]ltimos|latter[\s-]?day\s+saints|iglesia\s+de\s+jesucristo\s+de\s+los/i.test(
      name
    )
  ) {
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

function hasAllowedDenom(denom: string): boolean {
  if (!denom.trim()) return false;
  if (CATHOLIC_DENOM.test(denom) || EXCLUDED_DENOM.test(denom)) return false;
  return new RegExp(OVERPASS_DENOM_REGEX, 'i').test(denom);
}

function hasAllowedEvangelicalName(name: string): boolean {
  if (!name.trim()) return false;
  if (CATHOLIC_NAME.test(name) || EXCLUDED_NAME.test(name)) return false;
  return new RegExp(OVERPASS_NAME_REGEX, 'i').test(name);
}

/**
 * Keep Christian Assemblies / Evangelical / Protestant churches only.
 * Allowlist: denomination or name must match evangelical/assembly patterns.
 * Bare `religion=christian` alone is NOT enough (would include Catholic parishes).
 */
export function isChristianAssemblyOrEvangelical(
  tags: Record<string, string>,
  name: string
): boolean {
  if (isCatholic(tags, name)) return false;
  if (isExcludedSectOrDenom(tags, name)) return false;
  if (isNonChristianReligion(tags)) return false;

  const religion = (tags.religion || '').trim().toLowerCase();
  const denom = (tags.denomination || '').trim();
  const amenity = (tags.amenity || '').trim();
  const building = (tags.building || '').trim();

  // Positive allowlist — denomination tag from evangelical / protestant set
  if (hasAllowedDenom(denom)) return true;

  // Positive allowlist — name signals assemblies / evangelical church
  if (hasAllowedEvangelicalName(name)) {
    if (/^\s*templo\s*$/i.test(name) && religion && religion !== 'christian') {
      return false;
    }
    return true;
  }

  // No free pass for religion=christian without denom/name match
  if (amenity === 'place_of_worship' && !denom) return false;
  if (building === 'church' && !denom) return false;

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

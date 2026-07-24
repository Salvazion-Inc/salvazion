import { BibleChapter, BibleBook } from '@/lib/bible/types';

/**
 * Muestra curada de textos bíblicos confiables para el MVP.
 * 
 * Fuentes de referencia (producción):
 * - Español: Reina Valera 1960 (uso extendido; verificar licencia regional)
 * - Inglés: King James Version (public domain)
 * - Original: Westminster Leningrad Codex (Hebreo) + SBLGNT (Griego) — open data
 * 
 * En producción se reemplaza este sample por datasets completos o API confiable.
 */

export const BIBLE_BOOKS: BibleBook[] = [
  { id: 'gen', name: 'Genesis', nameEs: 'Génesis', testament: 'OT', chapters: 50 },
  { id: 'psa', name: 'Psalms', nameEs: 'Salmos', testament: 'OT', chapters: 150 },
  { id: 'pro', name: 'Proverbs', nameEs: 'Proverbios', testament: 'OT', chapters: 31 },
  { id: 'isa', name: 'Isaiah', nameEs: 'Isaías', testament: 'OT', chapters: 66 },
  { id: 'mat', name: 'Matthew', nameEs: 'Mateo', testament: 'NT', chapters: 28 },
  { id: 'jhn', name: 'John', nameEs: 'Juan', testament: 'NT', chapters: 21 },
  { id: 'rom', name: 'Romans', nameEs: 'Romanos', testament: 'NT', chapters: 16 },
  { id: 'rev', name: 'Revelation', nameEs: 'Apocalipsis', testament: 'NT', chapters: 22 },
];

export const SAMPLE_CHAPTERS: BibleChapter[] = [
  // ===== GÉNESIS 1 — RV1960 =====
  {
    book: 'Génesis', bookId: 'gen', chapter: 1, language: 'es', version: 'Reina Valera 1960',
    verses: [
      { number: 1, text: 'En el principio creó Dios los cielos y la tierra.' },
      { number: 2, text: 'Y la tierra estaba desordenada y vacía, y las tinieblas estaban sobre la faz del abismo, y el Espíritu de Dios se movía sobre la faz de las aguas.' },
      { number: 3, text: 'Y dijo Dios: Sea la luz; y fue la luz.' },
      { number: 4, text: 'Y vio Dios que la luz era buena; y separó Dios la luz de las tinieblas.' },
      { number: 5, text: 'Y llamó Dios a la luz Día, y a las tinieblas llamó Noche. Y fue la tarde y la mañana un día.' },
      { number: 26, text: 'Entonces dijo Dios: Hagamos al hombre a nuestra imagen, conforme a nuestra semejanza; y señoree en los peces del mar, en las aves de los cielos, en las bestias, en toda la tierra, y en todo animal que se arrastra sobre la tierra.' },
      { number: 27, text: 'Y creó Dios al hombre a su imagen, a imagen de Dios lo creó; varón y hembra los creó.' },
      { number: 28, text: 'Y los bendijo Dios, y les dijo: Fructificad y multiplicaos; llenad la tierra, y sojuzgadla, y señoread en los peces del mar, en las aves de los cielos, y en todas las bestias que se mueven sobre la tierra.' },
      { number: 31, text: 'Y vio Dios todo lo que había hecho, y he aquí que era bueno en gran manera. Y fue la tarde y la mañana el día sexto.' },
    ]
  },
  // ===== GENESIS 1 — KJV =====
  {
    book: 'Genesis', bookId: 'gen', chapter: 1, language: 'en', version: 'King James Version',
    verses: [
      { number: 1, text: 'In the beginning God created the heaven and the earth.' },
      { number: 2, text: 'And the earth was without form, and void; and darkness was upon the face of the deep. And the Spirit of God moved upon the face of the waters.' },
      { number: 3, text: 'And God said, Let there be light: and there was light.' },
      { number: 4, text: 'And God saw the light, that it was good: and God divided the light from the darkness.' },
      { number: 5, text: 'And God called the light Day, and the darkness he called Night. And the evening and the morning were the first day.' },
      { number: 26, text: 'And God said, Let us make man in our image, after our likeness: and let them have dominion over the fish of the sea, and over the fowl of the air, and over the cattle, and over all the earth, and over every creeping thing that creepeth upon the earth.' },
      { number: 27, text: 'So God created man in his own image, in the image of God created he him; male and female created he them.' },
      { number: 28, text: 'And God blessed them, and God said unto them, Be fruitful, and multiply, and replenish the earth, and subdue it: and have dominion over the fish of the sea, and over the fowl of the air, and over every living thing that moveth upon the earth.' },
      { number: 31, text: 'And God saw every thing that he had made, and, behold, it was very good. And the evening and the morning were the sixth day.' },
    ]
  },
  // ===== SALMOS 23 — RV1960 =====
  {
    book: 'Salmos', bookId: 'psa', chapter: 23, language: 'es', version: 'Reina Valera 1960',
    verses: [
      { number: 1, text: 'Jehová es mi pastor; nada me faltará.' },
      { number: 2, text: 'En lugares de delicados pastos me hará descansar; Junto a aguas de reposo me pastoreará.' },
      { number: 3, text: 'Confortará mi alma; Me guiará por sendas de justicia por amor de su nombre.' },
      { number: 4, text: 'Aunque ande en valle de sombra de muerte, No temeré mal alguno, porque tú estarás conmigo; Tu vara y tu cayado me infundirán aliento.' },
      { number: 5, text: 'Aderezas mesa delante de mí en presencia de mis angustiadores; Unges mi cabeza con aceite; mi copa está rebosando.' },
      { number: 6, text: 'Ciertamente el bien y la misericordia me seguirán todos los días de mi vida, Y en la casa de Jehová moraré por largos días.' },
    ]
  },
  // ===== PSALM 23 — KJV =====
  {
    book: 'Psalms', bookId: 'psa', chapter: 23, language: 'en', version: 'King James Version',
    verses: [
      { number: 1, text: 'The Lord is my shepherd; I shall not want.' },
      { number: 2, text: 'He maketh me to lie down in green pastures: he leadeth me beside the still waters.' },
      { number: 3, text: 'He restoreth my soul: he leadeth me in the paths of righteousness for his name\'s sake.' },
      { number: 4, text: 'Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff they comfort me.' },
      { number: 5, text: 'Thou preparest a table before me in the presence of mine enemies: thou anointest my head with oil; my cup runneth over.' },
      { number: 6, text: 'Surely goodness and mercy shall follow me all the days of my life: and I will dwell in the house of the Lord for ever.' },
    ]
  },
  // ===== JUAN 1 — RV1960 =====
  {
    book: 'Juan', bookId: 'jhn', chapter: 1, language: 'es', version: 'Reina Valera 1960',
    verses: [
      { number: 1, text: 'En el principio era el Verbo, y el Verbo era con Dios, y el Verbo era Dios.' },
      { number: 2, text: 'Este era en el principio con Dios.' },
      { number: 3, text: 'Todas las cosas por él fueron hechas, y sin él nada de lo que ha sido hecho, fue hecho.' },
      { number: 4, text: 'En él estaba la vida, y la vida era la luz de los hombres.' },
      { number: 5, text: 'La luz en las tinieblas resplandece, y las tinieblas no prevalecieron contra ella.' },
      { number: 12, text: 'Mas a todos los que le recibieron, a los que creen en su nombre, les dio potestad de ser hechos hijos de Dios;' },
      { number: 14, text: 'Y aquel Verbo fue hecho carne, y habitó entre nosotros (y vimos su gloria, gloria como del unigénito del Padre), lleno de gracia y de verdad.' },
    ]
  },
  // ===== JOHN 1 — KJV =====
  {
    book: 'John', bookId: 'jhn', chapter: 1, language: 'en', version: 'King James Version',
    verses: [
      { number: 1, text: 'In the beginning was the Word, and the Word was with God, and the Word was God.' },
      { number: 2, text: 'The same was in the beginning with God.' },
      { number: 3, text: 'All things were made by him; and without him was not any thing made that was made.' },
      { number: 4, text: 'In him was life; and the life was the light of men.' },
      { number: 5, text: 'And the light shineth in darkness; and the darkness comprehended it not.' },
      { number: 12, text: 'But as many as received him, to them gave he power to become the sons of God, even to them that believe on his name:' },
      { number: 14, text: 'And the Word was made flesh, and dwelt among us, (and we beheld his glory, the glory as of the only begotten of the Father,) full of grace and truth.' },
    ]
  },
  // ===== ROMANOS 12 — RV1960 (extracto) =====
  {
    book: 'Romanos', bookId: 'rom', chapter: 12, language: 'es', version: 'Reina Valera 1960',
    verses: [
      { number: 1, text: 'Así que, hermanos, os ruego por las misericordias de Dios, que presentéis vuestros cuerpos en sacrificio vivo, santo, agradable a Dios, que es vuestro culto racional.' },
      { number: 2, text: 'No os conforméis a este siglo, sino transformaos por medio de la renovación de vuestro entendimiento, para que comprobéis cuál sea la buena voluntad de Dios, agradable y perfecta.' },
      { number: 9, text: 'El amor sea sin fingimiento. Aborreced lo malo, seguid lo bueno.' },
      { number: 12, text: 'Gozosos en la esperanza; sufridos en la tribulación; constantes en la oración.' },
      { number: 21, text: 'No seas vencido de lo malo, sino vence con el bien el mal.' },
    ]
  },
  // ===== APOCALIPSIS 5 — RV1960 (León de Judá) =====
  {
    book: 'Apocalipsis', bookId: 'rev', chapter: 5, language: 'es', version: 'Reina Valera 1960',
    verses: [
      { number: 5, text: 'Y uno de los ancianos me dijo: No llores. He aquí que el León de la tribu de Judá, la raíz de David, ha vencido para abrir el libro y desatar sus siete sellos.' },
      { number: 6, text: 'Y miré, y vi que en medio del trono y de los cuatro seres vivientes, y en medio de los ancianos, estaba en pie un Cordero como inmolado...' },
      { number: 9, text: 'Y cantaban un nuevo cántico, diciendo: Digno eres de tomar el libro y de abrir sus sellos; porque tú fuiste inmolado, y con tu sangre nos has redimido para Dios, de todo linaje y lengua y pueblo y nación;' },
      { number: 12, text: 'que decían a gran voz: El Cordero que fue inmolado es digno de tomar el poder, las riquezas, la sabiduría, la fortaleza, la honra, la gloria y la alabanza.' },
    ]
  },
];

/** Placeholder para idiomas originales (Hebreo / Griego) */
export const ORIGINAL_NOTES: Record<string, string> = {
  'gen-1': 'בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ (Bereshit bará Elohim et hashamáyim ve’et ha’áretz)',
  'jhn-1': 'Ἐν ἀρχῇ ἦν ὁ λόγος, καὶ ὁ λόγος ἦν πρὸς τὸν θεόν, καὶ θεὸς ἦν ὁ λόγος (En archē ēn ho logos...)',
  'psa-23': 'יְהוָה רֹעִי לֹא אֶחְסָר (YHWH ro’í lo’ eḥsár)',
};

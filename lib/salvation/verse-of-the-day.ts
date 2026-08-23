import { tx3 } from '@/lib/i18n/locale';

export type VerseOfTheDay = {
  ref: string;
  text: string;
};

const VERSES: { ref: string; en: string; es: string; pt: string }[] = [
  {
    ref: 'Philippians 4:6',
    en: 'Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.',
    es: 'Por nada estéis afanosos; sino sean conocidas vuestras peticiones delante de Dios en toda oración y ruego, con hacimiento de gracias.',
    pt: 'Não estejais inquietos por coisa alguma; antes as vossas petições sejam em tudo conhecidas diante de Deus pela oração e súplica, com ação de graças.',
  },
  {
    ref: '1 Thessalonians 5:17',
    en: 'Pray without ceasing.',
    es: 'Orad sin cesar.',
    pt: 'Orai sem cessar.',
  },
  {
    ref: 'Matthew 7:7',
    en: 'Ask, and it shall be given you; seek, and ye shall find; knock, and it shall be opened unto you.',
    es: 'Pedid, y se os dará; buscad, y hallaréis; llamad, y se os abrirá.',
    pt: 'Pedi, e dar-se-vos-á; buscai, e encontrareis; batei, e abrir-se-vos-á.',
  },
  {
    ref: 'Psalm 46:10',
    en: 'Be still, and know that I am God.',
    es: 'Estad quietos, y conoced que yo soy Dios.',
    pt: 'Aquietai-vos, e sabei que eu sou Deus.',
  },
  {
    ref: 'James 5:16',
    en: 'The effectual fervent prayer of a righteous man availeth much.',
    es: 'La oración eficaz del justo, obrando eficazmente, puede mucho.',
    pt: 'A oração feita por um justo pode muito em seus efeitos.',
  },
  {
    ref: 'Jeremiah 29:12',
    en: 'Then shall ye call upon me, and ye shall go and pray unto me, and I will hearken unto you.',
    es: 'Entonces me invocaréis, y vendréis y oraréis a mí, y yo os oiré.',
    pt: 'Então me invocareis, e ireis, e orareis a mim, e eu vos ouvirei.',
  },
  {
    ref: 'Psalm 5:3',
    en: 'My voice shalt thou hear in the morning, O Lord; in the morning will I direct my prayer unto thee, and will look up.',
    es: 'Oh Jehová, de mañana oirás mi voz; de mañana me presentaré a ti, y esperaré.',
    pt: 'Pela manhã ouvirás a minha voz, ó Senhor; pela manhã apresentarei a ti a minha oração, e vigiarei.',
  },
  {
    ref: 'Colossians 4:2',
    en: 'Continue in prayer, and watch in the same with thanksgiving.',
    es: 'Perseverad en oración, velando en ella con hacimiento de gracias.',
    pt: 'Perseverai em oração, velando nela com ação de graças.',
  },
  {
    ref: 'Mark 11:24',
    en: 'What things soever ye desire, when ye pray, believe that ye receive them, and ye shall have them.',
    es: 'Todas las cosas que pidiereis orando, creed que las recibiréis, y os vendrán.',
    pt: 'Tudo o que pedirdes, orando, crede que o recebereis, e tê-lo-eis.',
  },
  {
    ref: 'Romans 12:12',
    en: 'Rejoicing in hope; patient in tribulation; continuing instant in prayer.',
    es: 'Gozosos en la esperanza; sufridos en la tribulación; constantes en la oración.',
    pt: 'Alegrai-vos na esperança, sede pacientes na tribulação, perseverai na oração.',
  },
];

function dayOfYear(d = new Date()): number {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / 86400000);
}

export function getVerseOfTheDay(
  lang?: 'es' | 'en' | 'pt' | string,
  date = new Date()
): VerseOfTheDay {
  const v = VERSES[dayOfYear(date) % VERSES.length];
  return { ref: v.ref, text: tx3(lang, v.en, v.es, v.pt) };
}

/**
 * Generate Brazilian Portuguese title/preview for the article catalog.
 * Uses xAI when configured; resumes incrementally into data/freedom/x-articles-pt.json
 *
 * Usage: node scripts/generate-article-pt.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const dest = path.join(root, 'data/freedom/x-articles-pt.json');
const catalog = JSON.parse(
  fs.readFileSync(path.join(root, 'data/freedom/x-articles-catalog.json'), 'utf8')
);

function loadEnv() {
  const env = { ...process.env };
  const envPath = path.join(root, '.env.local');
  if (!fs.existsSync(envPath)) return env;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    let k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    env[k] = v;
  }
  return env;
}

const TITLE_PHRASES = [
  [/All About /gi, 'Tudo sobre '],
  [/A Comprehensive Overview/gi, 'Uma visão integral'],
  [/A Comprehensive Look at/gi, 'Um olhar integral sobre'],
  [/An In-Depth Exploration/gi, 'Uma exploração em profundidade'],
  [/An In-depth Exploration/gi, 'Uma exploração em profundidade'],
  [
    /The Exponential Infrastructure That Makes Patriot Bitcoin Possible\.?/gi,
    'A infraestrutura exponencial que torna possível o Bitcoin patriota',
  ],
  [
    /The High-Performance Blockchain Revolutionizing Web3/gi,
    'A blockchain de alto desempenho que revoluciona a Web3',
  ],
  [
    /What would the world be like if SpaceX and Tesla merged\?/gi,
    'Como seria o mundo se a SpaceX e a Tesla se fundissem?',
  ],
  [/Christian Masculinity Under Ideological Fire/gi, 'Masculinidade cristã sob fogo ideológico'],
  [
    /The Chinese Communist Party: Tyranny That Poisons the World/gi,
    'O Partido Comunista Chinês: a tirania que envenena o mundo',
  ],
  [/Grok: The Truth-Seeking AI Chosen by Salvazion/gi, 'Grok: a IA que busca a verdade escolhida pela Salvazion'],
  [/Intermittent Fasting: Body, Spirit and Freedom/gi, 'Jejum intermitente: corpo, espírito e liberdade'],
  [/Solana \+ Musk Ecosystem: The Perfect Stack/gi, 'Solana + ecossistema Musk: o stack perfeito'],
  [
    /Salvation, Health and Freedom the tripod that holds the human person upright/gi,
    'Salvação, Saúde e Liberdade: o tripé que sustenta a pessoa em pé',
  ],
  [/Mining and Rare Earths: Sovereignty and Future/gi, 'Mineração e terras raras: soberania e futuro'],
  [
    /Homeschooling: Family, Faith, and Integral Formation/gi,
    'Educação em casa: família, fé e formação integral',
  ],
  [/Autonomous Agents and the Victory of Grok/gi, 'Agentes autônomos e a vitória do Grok'],
  [/The Chicago Boys Forged Chile.?s Prosperity/gi, 'Os Chicago Boys forjaram a prosperidade do Chile'],
  [
    /Salvazion App: The platform that restores the human person/gi,
    'Salvazion App: a plataforma que restaura a pessoa',
  ],
  [/Jupiter: The Catalyst of Web3 on Solana/gi, 'Jupiter: o catalisador da Web3 na Solana'],
  [/The Lion: Christ and the Spirit of Salvazion/gi, 'O Leão: Cristo e o Espírito da Salvazion'],
  [/Is the Trump Meme real\?/gi, 'O meme de Trump é real?'],
  [/Philosophy for a Resilient Life/gi, 'Filosofia para uma vida resiliente'],
  [/The Best Politician in the World Today/gi, 'O melhor político do mundo hoje'],
  [/and His Impact on Society/gi, 'e seu impacto na sociedade'],
  [/and His Global Impact/gi, 'e seu impacto global'],
  [/and His Spiritual Contribution to Society/gi, 'e sua contribuição espiritual à sociedade'],
  [/and His Impact on Christianity/gi, 'e seu impacto no cristianismo'],
  [/The Rise and Impact of /gi, 'A ascensão e o impacto de '],
  [/From Youth Activist to Italy's Prime Minister/gi, 'De ativista juvenil a primeira-ministra da Itália'],
  [/The Transformative Leader of El Salvador/gi, 'O líder transformador de El Salvador'],
  [/The Material of the Future/gi, 'O material do futuro'],
  [/and Its Future Potential/gi, 'e seu potencial futuro'],
  [/and Its Current Impact/gi, 'e seu impacto atual'],
  [/and Strategies to Increase Birth Rates/gi, 'e estratégias para aumentar a natalidade'],
  [
    /The Negative Aspects of Applying DEI Principles in Organizations/gi,
    'Os aspectos negativos de aplicar princípios DEI nas organizações',
  ],
  [/for an Apocalyptic War/gi, 'para uma guerra apocalíptica'],
  [/Causes, Symptoms, Impacts, and Treatment/gi, 'Causas, sintomas, impactos e tratamento'],
  [/The Most Powerful Families in the World/gi, 'As famílias mais poderosas do mundo'],
  [/Health Problems From Eating Bugs or Insects/gi, 'Problemas de saúde por comer insetos'],
  [
    /Super Longevity, Super Intelligence, and Super Wellbeing/gi,
    'Superlongevidade, superinteligência e superbem-estar',
  ],
  [
    /The Current Geopolitical Landscape and the Conditions for a Third World War/gi,
    'O panorama geopolítico atual e as condições para uma Terceira Guerra Mundial',
  ],
  [
    /Unveiling the Mysteries of America's Most Secretive Military Base/gi,
    'Revelando os mistérios da base militar mais secreta dos EUA',
  ],
  [/Political and Social Polarization/gi, 'Polarização política e social'],
  [/Why "Trans Women" Should Not Compete in Women's Sports/gi, 'Por que "mulheres trans" não devem competir no esporte feminino'],
  [/In Search of Truth, Happiness, and Eternal Life/gi, 'Em busca da verdade, da felicidade e da vida eterna'],
  [
    /Lessons from the Great Depression and the Dot-Com Bubble/gi,
    'Lições da Grande Depressão e da bolha das pontocom',
  ],
  [/The Damage of Eating Synthetic Meat/gi, 'O dano de comer carne sintética'],
  [/The Benefits of Laughter and Happiness in Medicine/gi, 'Os benefícios do riso e da felicidade na medicina'],
  [/Origins, Traditions, and Celebrations/gi, 'Origens, tradições e celebrações'],
  [/Citizen Journalism/gi, 'Jornalismo cidadão'],
  [/How Can I Get to Heaven\? According to the Gospel/gi, 'Como posso chegar ao céu? Segundo o Evangelho'],
  [/Spiritual Warfare According to the Bible/gi, 'Guerra espiritual segundo a Bíblia'],
  [
    /The Contribution of Christianity to Today's Society/gi,
    'A contribuição do cristianismo à sociedade atual',
  ],
  [/Understanding /gi, 'Entendendo '],
  [/The Crusades and Their Impact on Our Days/gi, 'As Cruzadas e seu impacto em nossos dias'],
  [/Hero or Villain\?/gi, 'Herói ou vilão?'],
  [/The Origin of Universities/gi, 'A origem das universidades'],
  [/Their Pros and Cons/gi, 'Seus prós e contras'],
  [/Why would the Deep State or Globalist Elite want to kill the Anti-Globalists Leaders\?/gi,
    'Por que o Estado profundo ou a elite globalista quereria matar os líderes antiglobalistas?'],
  [/All About Sir Roger Scruton and His Contribution to Conservatism/gi,
    'Tudo sobre Sir Roger Scruton e sua contribuição ao conservadorismo'],
  [/All About Voter Fraud and How to Avoid It/gi, 'Tudo sobre fraude eleitoral e como evitá-la'],
  [/How to create value with a Decentralized Autonomous Organization \(DAO\) in web3\?/gi,
    'Como criar valor com uma Organização Autônoma Descentralizada (DAO) na web3?'],
  [/How to create value for a country in Politics\?/gi, 'Como criar valor para um país na política?'],
  [/How to Create Value in Healthtech\?/gi, 'Como criar valor em Healthtech?'],
  [/Everything You Need to Know to Understand the Bible Better/gi,
    'Tudo o que você precisa saber para entender melhor a Bíblia'],
  [/Everything you need to know\s+about the Kingdom of God/gi,
    'Tudo o que você precisa saber sobre o Reino de Deus'],
  [/Everything You Need to Know About Exponential Technologies/gi,
    'Tudo o que você precisa saber sobre tecnologias exponenciais'],
  [/Everything You Need to Know About DAOs/gi, 'Tudo o que você precisa saber sobre DAOs'],
  [/Everything You Need to Know About /gi, 'Tudo o que você precisa saber sobre '],
  [/Everything you need to know/gi, 'Tudo o que você precisa saber'],
  [/Keys to Effective Gospel\s+Preaching/gi, 'Chaves para uma pregação eficaz do Evangelho'],
  [/How to identify my Spiritual\s+Gifts\?/gi, 'Como identificar meus dons espirituais?'],
  [/Why does your Business Need\s+to Incorporate Technology\?/gi,
    'Por que o seu negócio precisa incorporar tecnologia?'],
  [/How to create value/gi, 'Como criar valor'],
  [/How to Create Value/gi, 'Como criar valor'],
];

const TITLE_WORDS = [
  [/\bThe\b/g, 'O'],
  [/\band\b/g, 'e'],
  [/\bof\b/g, 'de'],
  [/\bin\b/g, 'em'],
  [/\bfor\b/g, 'para'],
  [/\bwith\b/g, 'com'],
  [/\bfrom\b/g, 'de'],
  [/\bto\b/g, 'a'],
  [/\bHis\b/g, 'sua'],
  [/\bher\b/g, 'sua'],
  [/\bmy\b/g, 'meus'],
  [/\byour\b/g, 'seu'],
  [/\bdoes\b/g, ''],
  [/\bwould\b/g, ''],
  [/\bwant\b/g, 'querer'],
  [/\bkill\b/g, 'matar'],
  [/\bcreate\b/g, 'criar'],
  [/\bCreate\b/g, 'Criar'],
  [/\bvalue\b/g, 'valor'],
  [/\bValue\b/g, 'Valor'],
  [/\bcountry\b/g, 'país'],
  [/\bNeed\b/g, 'precisa'],
  [/\bneed\b/g, 'precisa'],
  [/\bKnow\b/g, 'saber'],
  [/\bknow\b/g, 'saber'],
  [/\bBetter\b/g, 'melhor'],
  [/\bUnderstand\b/g, 'entender'],
  [/\bidentify\b/g, 'identificar'],
  [/\bAvoid\b/g, 'evitar'],
  [/\bIt\b/g, 'isso'],
  [/\bContribution\b/g, 'contribuição'],
  [/\bConservatism\b/g, 'conservadorismo'],
  [/\bVoter Fraud\b/g, 'fraude eleitoral'],
  [/\bDecentralized Autonomous Organization\b/g, 'Organização Autônoma Descentralizada'],
  [/\bExponential Technologies\b/g, 'tecnologias exponenciais'],
  [/\bSpiritual\s+Gifts\b/g, 'dons espirituais'],
  [/\bGospel\s+Preaching\b/g, 'pregação do Evangelho'],
  [/\bIncorporate\b/g, 'incorporar'],
  [/\bBusiness\b/g, 'negócio'],
  [/\bLeaders\b/g, 'líderes'],
  [/\bGlobalist Elite\b/g, 'elite globalista'],
  [/\bAnti-Globalists\b/g, 'antiglobalistas'],
  [/\bEverything You\b/g, 'Tudo o que você'],
  [/\bKeys to Effective\b/g, 'Chaves para uma eficaz'],
  [/\bFuture\b/g, 'Futuro'],
  [/\bSociety\b/g, 'Sociedade'],
  [/\bImpact\b/g, 'Impacto'],
  [/\bWorld\b/g, 'Mundo'],
  [/\bLife\b/g, 'Vida'],
  [/\bHealth\b/g, 'Saúde'],
  [/\bFreedom\b/g, 'Liberdade'],
  [/\bFaith\b/g, 'Fé'],
  [/\bFamily\b/g, 'Família'],
  [/\bTechnology\b/g, 'Tecnologia'],
  [/\bWar\b/g, 'Guerra'],
  [/\bPower\b/g, 'Poder'],
  [/\bHistory\b/g, 'História'],
  [/\bScience\b/g, 'Ciência'],
  [/\bMedicine\b/g, 'Medicina'],
  [/\bEducation\b/g, 'Educação'],
  [/\bEconomy\b/g, 'Economia'],
  [/\bPolitics\b/g, 'Política'],
  [/\bGovernment\b/g, 'Governo'],
  [/\bCulture\b/g, 'Cultura'],
  [/\bReligion\b/g, 'Religião'],
  [/\bChristianity\b/g, 'Cristianismo'],
  [/\bBible\b/g, 'Bíblia'],
  [/\bChurch\b/g, 'Igreja'],
  [/\bTruth\b/g, 'Verdade'],
  [/\bHow\b/g, 'Como'],
  [/\bWhy\b/g, 'Por que'],
  [/\bWhat\b/g, 'O que'],
  [/\bAbout\b/g, 'Sobre'],
  [/\bToday\b/g, 'Hoje'],
  [/\bPeople\b/g, 'Pessoas'],
  [/\bChildren\b/g, 'Crianças'],
  [/\bWomen\b/g, 'Mulheres'],
  [/\bMen\b/g, 'Homens'],
  [/\bBody\b/g, 'Corpo'],
  [/\bMind\b/g, 'Mente'],
  [/\bSpirit\b/g, 'Espírito'],
  [/\bSoul\b/g, 'Alma'],
  [/\bLove\b/g, 'Amor'],
  [/\bDeath\b/g, 'Morte'],
  [/\bFood\b/g, 'Comida'],
  [/\bSleep\b/g, 'Sono'],
  [/\bExercise\b/g, 'Exercício'],
  [/\bSports\b/g, 'Esportes'],
  [/\bUnited States\b/g, 'Estados Unidos'],
  [/\bAmerica\b/g, 'América'],
  [/\bEurope\b/g, 'Europa'],
  [/\bWestern\b/g, 'Ocidental'],
  [/\bChristian\b/g, 'Cristão'],
  [/\bDeep State\b/g, 'Estado profundo'],
  [/\bImmigration\b/g, 'Imigração'],
  [/\bCommunism\b/g, 'Comunismo'],
  [/\bSocialism\b/g, 'Socialismo'],
  [/\bCapitalism\b/g, 'Capitalismo'],
  [/\bCensorship\b/g, 'Censura'],
  [/\bPandemic\b/g, 'Pandemia'],
  [/\bArtificial Intelligence\b/g, 'Inteligência Artificial'],
  [/\bSovereignty\b/g, 'Soberania'],
  [/\bLiberty\b/g, 'Liberdade'],
  [/\bSalvation\b/g, 'Salvação'],
  [/\bVirtue\b/g, 'Virtude'],
  [/\bGod\b/g, 'Deus'],
  [/\bJesus\b/g, 'Jesus'],
  [/\bChrist\b/g, 'Cristo'],
  [/\bGospel\b/g, 'Evangelho'],
];

const PREVIEW_OPENERS = [
  [
    /^True masculinity, forged in the image of God as protector, provider and priest of the home, faces a coordinated assault from the woke movement, radical feminism, moral relativism, post-truth culture/i,
    'A verdadeira masculinidade, forjada à imagem de Deus como protetor, provedor e sacerdote do lar, enfrenta um assalto coordenado do movimento woke, do feminismo radical, do relativismo moral e da cultura da pós-verdade',
  ],
  [
    /^The Chinese Communist Party is not an ordinary government\. It is a Marxist-Leninist structure that has perfected total control over the spirit, mind, body, and soul of hundreds of millions of people/i,
    'O Partido Comunista Chinês não é um governo comum. É uma estrutura marxista-leninista que aperfeiçoou o controle total sobre o espírito, a mente, o corpo e a alma de centenas de milhões de pessoas',
  ],
  [
    /^Grok has established itself as the artificial intelligence model most aligned with the disinterested pursuit of truth, surpassing its competitors in freedom of expression, token efficiency, and(?: rejection of ideological filters)?/i,
    'O Grok se consolidou como o modelo de inteligência artificial mais alinhado com a busca desinteressada da verdade, superando seus concorrentes em liberdade de expressão, eficiência de tokens e rejeição de filtros ideológicos',
  ],
  [
    /^Intermittent fasting restores the original design of the human body, strengthens the spirit against the slavery of the flesh, and frees the person from the chains of industrial consumerism/i,
    'O jejum intermitente restaura o desenho original do corpo humano, fortalece o espírito contra a escravidão da carne e liberta a pessoa das cadeias do consumismo industrial',
  ],
  [
    /^Responsible mining of critical minerals and rare earths forms the material foundation of technological sovereignty, national security and genuine economic development for any nation determined to/i,
    'A mineração responsável de minerais críticos e terras raras é a base material da soberania tecnológica, da segurança nacional e do desenvolvimento econômico genuíno de qualquer nação determinada a',
  ],
  [
    /^The education of children belongs first to parents, not to the State or ideological bureaucracies\. Homeschooling is not a marginal trend\. It is the deliberate recovery of parental authority to form/i,
    'A educação dos filhos pertence primeiro aos pais, não ao Estado nem às burocracias ideológicas. A educação em casa não é uma tendência marginal. É a recuperação deliberada da autoridade parental para formar',
  ],
  [/^In this article[, ]*/i, 'Neste artigo, '],
  [/^Throughout history[, ]*/i, 'Ao longo da história, '],
  [/^In today's world[, ]*/i, 'No mundo de hoje, '],
  [/^In the modern world[, ]*/i, 'No mundo moderno, '],
  [/^In recent years[, ]*/i, 'Nos últimos anos, '],
  [/^One of the most /i, 'Um dos mais '],
  [/^Among the most /i, 'Entre os mais '],
  [/^Born on /i, 'Nascido em '],
  [/^Born in /i, 'Nascido em '],
  [/^Known as /i, 'Conhecido como '],
  [/^Has become /i, 'Tornou-se '],
  [/^Represents /i, 'Representa '],
  [/^Explores /i, 'Explora '],
  [/^Examines /i, 'Examina '],
  [/^Analyzes /i, 'Analisa '],
  [/^Discusses /i, 'Analisa '],
  [/^Addresses /i, 'Aborda '],
  [/^Highlights /i, 'Destaca '],
  [/^Focuses on /i, 'Concentra-se em '],
  [/^Delves into /i, 'Aprofunda-se em '],
  [/^Provides an overview of /i, 'Oferece uma visão geral de '],
];

const PREVIEW_WORDS = [
  [/\bworld\b/gi, 'mundo'],
  [/\bsociety\b/gi, 'sociedade'],
  [/\bpeople\b/gi, 'pessoas'],
  [/\bfamily\b/gi, 'família'],
  [/\bfamilies\b/gi, 'famílias'],
  [/\bnations?\b/gi, 'nações'],
  [/\bhistory\b/gi, 'história'],
  [/\bfuture\b/gi, 'futuro'],
  [/\blife\b/gi, 'vida'],
  [/\bhealth\b/gi, 'saúde'],
  [/\bfreedom\b/gi, 'liberdade'],
  [/\bfaith\b/gi, 'fé'],
  [/\breligion\b/gi, 'religião'],
  [/\bchurch\b/gi, 'igreja'],
  [/\bgod\b/gi, 'Deus'],
  [/\bchrist\b/gi, 'Cristo'],
  [/\bbible\b/gi, 'Bíblia'],
  [/\bgospel\b/gi, 'Evangelho'],
  [/\bprayer\b/gi, 'oração'],
  [/\bspirit\b/gi, 'espírito'],
  [/\bsoul\b/gi, 'alma'],
  [/\bmind\b/gi, 'mente'],
  [/\bbody\b/gi, 'corpo'],
  [/\btechnology\b/gi, 'tecnologia'],
  [/\bscience\b/gi, 'ciência'],
  [/\bmedicine\b/gi, 'medicina'],
  [/\beducation\b/gi, 'educação'],
  [/\beconomy\b/gi, 'economia'],
  [/\bpolitics\b/gi, 'política'],
  [/\bgovernment\b/gi, 'governo'],
  [/\bleaders?\b/gi, 'líderes'],
  [/\bpower\b/gi, 'poder'],
  [/\bliberty\b/gi, 'liberdade'],
  [/\bwar\b/gi, 'guerra'],
  [/\bpeace\b/gi, 'paz'],
  [/\bculture\b/gi, 'cultura'],
  [/\btruth\b/gi, 'verdade'],
  [/\bchildren\b/gi, 'crianças'],
  [/\bwomen\b/gi, 'mulheres'],
  [/\bmen\b/gi, 'homens'],
  [/\bsleep\b/gi, 'sono'],
  [/\bexercise\b/gi, 'exercício'],
  [/\bfood\b/gi, 'alimento'],
  [/\bcensorship\b/gi, 'censura'],
  [/\bpandemic\b/gi, 'pandemia'],
  [/\bartificial intelligence\b/gi, 'inteligência artificial'],
  [/\bsovereignty\b/gi, 'soberania'],
  [/\bautonomous digital agents\b/gi, 'agentes digitais autônomos'],
  [/\bartificial intelligence\b/gi, 'inteligência artificial'],
  [/\balready run in production\b/gi, 'já operam em produção'],
  [/\benterprises\b/gi, 'empresas'],
  [/\bproductivity\b/gi, 'produtividade'],
  [/\bvalue creation\b/gi, 'criação de valor'],
  [/\bpossibility\b/gi, 'possibilidade'],
  [/\bpossibilities\b/gi, 'possibilidades'],
  [/\bbased on\b/gi, 'baseados em'],
  [/\binside a third of\b/gi, 'dentro de um terço das'],
  [/\bare redefining\b/gi, 'estão redefinindo'],
  [/\bthe original design\b/gi, 'o desenho original'],
  [/\bhuman body\b/gi, 'corpo humano'],
  [/\bstrengthens\b/gi, 'fortalece'],
  [/\bagainst\b/gi, 'contra'],
  [/\bfrees the person\b/gi, 'liberta a pessoa'],
  [/\bnot an ordinary government\b/gi, 'não é um governo comum'],
  [/\bthis article\b/gi, 'este artigo'],
  [/\bthis piece\b/gi, 'este texto'],
  [/\bexplores\b/gi, 'explora'],
  [/\bexamines\b/gi, 'examina'],
  [/\banalyzes\b/gi, 'analisa'],
  [/\bdiscusses\b/gi, 'analisa'],
  [/\bhighlights\b/gi, 'destaca'],
  [/\bprovides\b/gi, 'oferece'],
  [/\boverview\b/gi, 'visão geral'],
  [/\bcomprehensive\b/gi, 'integral'],
  [/\bimportant\b/gi, 'importante'],
  [/\bcritical\b/gi, 'crítico'],
  [/\bmodern\b/gi, 'moderno'],
  [/\bcurrent\b/gi, 'atual'],
  [/\bglobal\b/gi, 'global'],
  [/\bsocial\b/gi, 'social'],
  [/\bpolitical\b/gi, 'político'],
  [/\bhuman\b/gi, 'humano'],
  [/\bperson\b/gi, 'pessoa'],
  [/\bpersons\b/gi, 'pessoas'],
  [/\bchildren\b/gi, 'filhos'],
  [/\bparents\b/gi, 'pais'],
  [/\bstate\b/gi, 'Estado'],
  [/\btoday\b/gi, 'hoje'],
  [/\bwithout\b/gi, 'sem'],
  [/\bbecause\b/gi, 'porque'],
  [/\bhowever\b/gi, 'no entanto'],
  [/\btherefore\b/gi, 'portanto'],
  [/\bthrough\b/gi, 'através de'],
  [/\bbetween\b/gi, 'entre'],
  [/\bwithin\b/gi, 'dentro de'],
  [/\bacross\b/gi, 'ao longo de'],
  [/\bduring\b/gi, 'durante'],
  [/\bbefore\b/gi, 'antes'],
  [/\bafter\b/gi, 'depois'],
  [/\balways\b/gi, 'sempre'],
  [/\bnever\b/gi, 'nunca'],
  [/\boften\b/gi, 'muitas vezes'],
  [/\balso\b/gi, 'também'],
  [/\bonly\b/gi, 'apenas'],
  [/\bmore\b/gi, 'mais'],
  [/\bmost\b/gi, 'mais'],
  [/\bmany\b/gi, 'muitos'],
  [/\beach\b/gi, 'cada'],
  [/\bevery\b/gi, 'todo'],
  [/\btheir\b/gi, 'seu'],
  [/\bthese\b/gi, 'estes'],
  [/\bthose\b/gi, 'aqueles'],
  [/\bwhich\b/gi, 'que'],
  [/\bthat\b/gi, 'que'],
  [/\bthis\b/gi, 'este'],
  [/\bfrom\b/gi, 'de'],
  [/\bwith\b/gi, 'com'],
  [/\binto\b/gi, 'em'],
  [/\bover\b/gi, 'sobre'],
  [/\bunder\b/gi, 'sob'],
  [/\band\b/gi, 'e'],
  [/\bthe\b/gi, 'o'],
];

function clean(s) {
  return s
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,:;.!?])/g, '$1')
    .trim();
}

function capFirst(s) {
  if (!s) return s;
  return s[0].toUpperCase() + s.slice(1);
}

function fallbackTitle(en) {
  let t = en || '';
  for (const [re, rep] of TITLE_PHRASES) t = t.replace(re, rep);
  for (const [re, rep] of TITLE_WORDS) t = t.replace(re, rep);
  return capFirst(clean(t).replace(/\s{2,}/g, ' '));
}

function fallbackPreview(en) {
  let t = en || '';
  for (const [re, rep] of PREVIEW_OPENERS) {
    if (re.test(t)) {
      t = t.replace(re, rep);
      break;
    }
  }
  for (const [re, rep] of PREVIEW_WORDS) t = t.replace(re, rep);
  t = capFirst(clean(t));
  if (t.length > 320) t = t.slice(0, 317).replace(/\s+\S*$/, '') + '…';
  return t;
}

function extractJson(text) {
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start < 0 || end <= start) throw new Error('no json array');
  return JSON.parse(text.slice(start, end + 1));
}

async function translateBatch(items, env) {
  const key = env.XAI_API_KEY || '';
  const model = env.XAI_MODEL || 'grok-4.5';
  const base = (env.XAI_BASE_URL || 'https://api.x.ai/v1').replace(/\/$/, '');
  if (!key || key.length < 20) return null;

  const payload = items.map((a) => ({
    id: a.id,
    title: a.title || '',
    preview: a.preview || '',
  }));

  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 6000,
      messages: [
        {
          role: 'system',
          content:
            'You translate Salvazion long-form X article titles and previews into natural Brazilian Portuguese. Keep proper names, Salvazion, $SALVAZION, X, Solana, Bitcoin, Grok, Tesla, SpaceX, and similar brands unchanged. Do not add commentary. Return ONLY a JSON array of objects: {"id":"...","titlePt":"...","previewPt":"..."}.',
        },
        {
          role: 'user',
          content: JSON.stringify(payload),
        },
      ],
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`xAI ${res.status} ${err.slice(0, 180)}`);
  }
  const json = await res.json();
  const text = json.choices?.[0]?.message?.content || '';
  return extractJson(text);
}

function save(map) {
  fs.writeFileSync(dest, JSON.stringify(map, null, 2) + '\n');
}

async function main() {
  const env = loadEnv();
  let map = {};
  if (fs.existsSync(dest)) {
    try {
      map = JSON.parse(fs.readFileSync(dest, 'utf8')) || {};
    } catch {
      map = {};
    }
  }

  const articles = catalog.filter((a) => a?.id);
  const force = process.argv.includes('--force');
  const offline = process.argv.includes('--offline') || force;
  const pending = articles.filter((a) => force || !map[a.id]?.titlePt);
  console.log(`catalog ${articles.length} · already ${articles.length - pending.length} · pending ${pending.length}${offline ? ' · offline' : ''}`);

  const batchSize = 12;
  for (let i = 0; i < pending.length; i += batchSize) {
    const batch = pending.slice(i, i + batchSize);
    try {
      if (offline) throw new Error('offline');
      const rows = await translateBatch(batch, env);
      if (!rows) throw new Error('no xAI key');
      for (const row of rows) {
        if (!row?.id) continue;
        map[row.id] = {
          titlePt: String(row.titlePt || '').trim() || fallbackTitle(batch.find((b) => b.id === row.id)?.title),
          previewPt: String(row.previewPt || '').trim() || fallbackPreview(batch.find((b) => b.id === row.id)?.preview),
        };
      }
      console.log(`ok ${Math.min(i + batch.length, pending.length)}/${pending.length}`);
    } catch (e) {
      console.log(`fallback batch ${i / batchSize + 1}: ${e.message}`);
      for (const a of batch) {
        map[a.id] = {
          titlePt: fallbackTitle(a.title || ''),
          previewPt: fallbackPreview(a.preview || ''),
        };
      }
    }
    save(map);
  }

  for (const a of articles) {
    if (!map[a.id]?.titlePt) {
      map[a.id] = {
        titlePt: fallbackTitle(a.title || ''),
        previewPt: fallbackPreview(a.preview || ''),
      };
    }
  }
  save(map);
  const sample = articles.slice(0, 5).map((a) => ({
    en: a.title,
    pt: map[a.id]?.titlePt,
  }));
  console.log('done', Object.keys(map).length);
  console.log(JSON.stringify(sample, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

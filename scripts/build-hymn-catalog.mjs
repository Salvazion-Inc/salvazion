/**
 * Build data/salvation/hymns-catalog.json
 *
 * Stores the public index of Himnos y Cánticos del Evangelio (number, title,
 * bibliographic facts, official URL) plus English original titles and a
 * Portuguese equivalent title when we can identify one.
 *
 * Does not download or store lyrics, sheet-music files, or audio.
 * Those stay on the official hymnal site and on cited public hymn pages.
 */
import fs from 'fs';
import path from 'path';

const UA = 'Mozilla/5.0 (compatible; SalvazionHymnIndex/1.0)';
const HCE = 'https://www.himnosycanticosdelevangelio.org';
const HC = 'https://www.himnos-cristianos.com';
const OUT = path.join(process.cwd(), 'data', 'salvation', 'hymns-catalog.json');

const LABELS = new Set([
  'Autor',
  'Música',
  'Traductor',
  'Métrica',
  'Tono',
  'Tempo',
  'Temática',
  'Subtematica',
  'Subtemática',
  'Versículos sugeridos',
]);

/** English title (normalized) → Portuguese equivalent. High-confidence classics only. */
const PT_BY_EN = {
  'onward christian soldiers': 'Firmes e avante',
  'amazing grace': 'Maravilhosa graça',
  'what a friend we have in jesus': 'Que amigo temos em Jesus',
  'holy holy holy': 'Santo, santo, santo',
  'how great thou art': 'Quão grande és Tu',
  'the old rugged cross': 'A velha cruz',
  'rock of ages': 'Rocha eterna',
  'blessed assurance': 'Bendita certeza',
  'great is thy faithfulness': 'Grande é a Tua fidelidade',
  'it is well with my soul': 'Está bem com a minha alma',
  'standing on the promises': 'Firmado nas promessas',
  'trust and obey': 'Confia e obedece',
  'jesus loves me': 'Jesus me ama',
  'silent night': 'Noite feliz',
  'joy to the world': 'Alegria ao mundo',
  'o come all ye faithful': 'Vinde, fiéis',
  'hark the herald angels sing': 'Ouvi os anjos',
  'a mighty fortress is our god': 'Castelo forte',
  'a mighty fortress': 'Castelo forte',
  'just as i am': 'Tal como sou',
  'nearer my god to thee': 'Mais perto quero estar',
  'abide with me': 'Fica conosco, Senhor',
  'all hail the power of jesus name': 'Coroai',
  'crown him with many crowns': 'Coroai com muitas coroas',
  'when i survey the wondrous cross': 'Contemplando a cruz',
  'there is a fountain': 'Há uma fonte',
  'i surrender all': 'Tudo a Cristo entrego',
  'softly and tenderly': 'Brandamente Jesus chama',
  'have thine own way lord': 'Dispõe de mim',
  'i need thee every hour': 'Preciso de Ti',
  'jesus paid it all': 'Jesus pagou tudo',
  'nothing but the blood': 'Nada senão o sangue',
  'there is power in the blood': 'Há poder no sangue',
  'are you washed in the blood': 'Lavado no sangue',
  'at the cross': 'Na cruz',
  'at calvary': 'No Calvário',
  'the solid rock': 'Rocha firme',
  'my hope is built': 'Minha esperança está firmada',
  'sweet hour of prayer': 'Doce hora de oração',
  'take my life and let it be': 'Toma a minha vida',
  'pass me not': 'Não me passes',
  'rescue the perishing': 'Resgatai os que perecem',
  'almost persuaded': 'Quase persuadido',
  'whiter than snow': 'Mais alvo que a neve',
  'jesus lover of my soul': 'Jesus, amante da minha alma',
  'he leadeth me': 'Ele me guia',
  'savior like a shepherd lead us': 'Qual pastor, Cristo guia',
  'count your blessings': 'Conta as bênçãos',
  'leaning on the everlasting arms': 'Nos braços eternos',
  'what a fellowship': 'Que comunhão',
  'tis so sweet to trust in jesus': 'Doce é confiar em Jesus',
  'my jesus i love thee': 'Meu Jesus, eu Te amo',
  'more love to thee': 'Mais amor a Ti',
  'near the cross': 'Junto à cruz',
  'jesus keep me near the cross': 'Junto à cruz',
  'the lily of the valley': 'O lírio dos vales',
  'stand up stand up for jesus': 'De pé por Jesus',
  'faith is the victory': 'A fé é a vitória',
  'yield not to temptation': 'Não cedas à tentação',
  'god be with you till we meet again': 'Deus esteja convosco',
  'blest be the tie that binds': 'Bendito seja o laço',
  'the church s one foundation': 'Um só fundamento',
  'i love to tell the story': 'Amo contar a história',
  'tell me the old old story': 'Conta-me a antiga história',
  'to god be the glory': 'A Deus demos glória',
  'wonderful words of life': 'Palavras de vida',
  'break thou the bread of life': 'Parte o pão da vida',
  'how firm a foundation': 'Quão firme alicerce',
  'he lives': 'Ele vive',
  'because he lives': 'Porque Ele vive',
  'christ the lord is risen today': 'Cristo ressuscitou',
  'low in the grave he lay': 'Na sepultura',
  'up from the grave he arose': 'Da sepultura ressurgiu',
  'in the garden': 'No jardim',
  'when the roll is called up yonder': 'Quando ali a lista for lida',
  'shall we gather at the river': 'Juntos ao rio',
  'in the sweet by and by': 'No além, breve',
  'face to face': 'Face a face',
  'when we all get to heaven': 'Quando chegarmos ao céu',
  'o for a thousand tongues to sing': 'Oh, que mil línguas',
  'and can it be': 'E pode ser',
  'come thou fount': 'Fonte da celeste graça',
  'immortal invisible': 'Imortal, invisível',
  'o worship the king': 'Adorai o Rei',
  'praise him praise him': 'Louvai-O',
  'all creatures of our god and king': 'Todas as criaturas',
  'fairest lord jesus': 'Ó Jesus, o mais formoso',
  'this is my father s world': 'O mundo é de meu Pai',
  'for the beauty of the earth': 'Pela beleza da terra',
  'come ye thankful people come': 'Vinde, agradecidos',
  'now thank we all our god': 'Agora agradecemos',
  'a charge to keep i have': 'Um dever a cumprir',
  'am i a soldier of the cross': 'Sou soldado da cruz',
  'on christ the solid rock i stand': 'Na rocha firme',
  'god will take care of you': 'Deus cuidará de ti',
  'only trust him': 'Só confia',
  'where he leads me i will follow': 'Onde Ele me guiar',
  'i have decided to follow jesus': 'Decidi seguir a Jesus',
  'higher ground': 'Terreno mais alto',
  'draw me nearer': 'Atrai-me mais',
  'i am thine o lord': 'Sou Teu, ó Senhor',
  'take time to be holy': 'Toma tempo para ser santo',
  'under his wings': 'Sob as Suas asas',
  'he hideth my soul': 'Ele guarda a minha alma',
  'a child of the king': 'Filho do Rei',
  'since i have been redeemed': 'Desde que fui remido',
  'redeemed how i love to proclaim it': 'Remido',
  'grace greater than our sin': 'Graça maior que o pecado',
  'marvelous grace of our loving lord': 'Graça maravilhosa',
  'the love of god': 'O amor de Deus',
  'o love that wilt not let me go': 'Ó amor que não me deixas',
  'man of sorrows': 'Homem de dores',
  'hallelujah what a savior': 'Aleluia, que Salvador',
  'were you there': 'Estavas lá',
  'beneath the cross of jesus': 'Sob a cruz de Jesus',
  'alas and did my savior bleed': 'Foi por mim que Cristo sofreu',
  'i gave my life for thee': 'Dei a minha vida por ti',
  'there is a green hill far away': 'Há um verde monte',
  'away in a manger': 'Numa manjedoura',
  'o little town of bethlehem': 'Ó pequena Belém',
  'the first noel': 'O primeiro Natal',
  'we three kings': 'Reis do Oriente',
  'angels we have heard on high': 'Anjos cantando glória',
  'while shepherds watched': 'Enquanto os pastores',
  'go tell it on the mountain': 'Proclamai nos montes',
  'o come o come emmanuel': 'Ó vem, Emanuel',
  'o holy night': 'Ó noite santa',
  'what child is this': 'Que criança é esta',
  'joy to the world the lord is come': 'Alegria ao mundo',
  'silent night holy night': 'Noite feliz',
  'hark the herald': 'Ouvi os anjos',
  'i heard the bells on christmas day': 'Ouvi os sinos',
  'there s a royal banner': 'Há um estandarte real',
  'the banner of the cross': 'O estandarte da cruz',
  'sound the battle cry': 'Soa o brado de guerra',
  'hold the fort': 'Guardai o forte',
  'throw out the lifeline': 'Lançai a boia',
  'let the lower lights be burning': 'Brilhem as luzes da costa',
  'bring them in': 'Trazei-os',
  'work for the night is coming': 'Trabalhai, vem a noite',
  'we ve a story to tell to the nations': 'Há uma história para as nações',
  'from greenland s icy mountains': 'Das geleiras da Groenlândia',
  'i will sing the wondrous story': 'Cantarei a história',
  'jesus saves': 'Jesus salva',
  'whosoever will': 'Quem quiser',
  'come every soul by sin oppressed': 'Vem, alma oprimida',
  'softly and tenderly jesus is calling': 'Brandamente Jesus chama',
  'jesus is tenderly calling': 'Jesus chama com ternura',
  'lord i m coming home': 'Senhor, volto para casa',
  'is your all on the altar': 'Tudo está no altar',
  'have you been to jesus for the cleansing power': 'Foste a Jesus',
  'are you weary are you heavy hearted': 'Estás cansado',
  'tell it to jesus': 'Dize a Jesus',
  'i must tell jesus': 'Tenho que dizer a Jesus',
  'did you think to pray': 'Pensaste em orar',
  'sweet hour of prayer sweet hour of prayer': 'Doce hora de oração',
  'my faith looks up to thee': 'Minha fé olha para Ti',
  'more holiness give me': 'Dá-me mais santidade',
  'i m pressing on the upward way': 'Sigo para o alto',
  'be not dismayed whate er betide': 'Não temas',
  'god be with you': 'Deus esteja convosco',
  'blessed be the tie': 'Bendito seja o laço',
  'shall we gather': 'Juntos ao rio',
  'when the trumpet of the lord shall sound': 'Quando a trombeta soar',
  'o that will be glory': 'Oh, que glória',
  'is my name written there': 'Está o meu nome escrito',
  'will jesus find us watching': 'Achar-nos-á Jesus vigiando',
  'is it the crowning day': 'É o dia da coroação',
  'some golden daybreak': 'Um amanhecer dourado',
  'jesus is coming again': 'Jesus virá outra vez',
  'faith of our fathers': 'Fé de nossos pais',
  'the great physician': 'O grande Médico',
  'all the way my savior leads me': 'Todo o caminho me guia',
  'he keeps me singing': 'Ele me faz cantar',
  'sunshine in my soul': 'Sol na minha alma',
  'there is sunshine in my soul today': 'Há sol na minha alma',
  'dwelling in bezier': 'Morando em Beulá',
  'is not this the land of bezier': 'Não é esta a terra de Beulá',
  'dwelling in beulah land': 'Morando em Beulá',
  'a shelter in the time of storm': 'Abrigo na tempestade',
  'the haven of rest': 'O porto de descanso',
  'wonderous story of love': 'Maravilhosa história de amor',
  'wonderful story of love': 'Maravilhosa história de amor',
  'for god so loved the world': 'Porque Deus amou o mundo',
  'come to the savior': 'Vem ao Salvador',
  'there s a stranger at the door': 'Há um estranho à porta',
  'blessed be the fountain': 'Bendita a fonte de sangue',
  'yet there is room': 'Ainda há lugar',
  'in tenderness he sought me': 'Com ternura me buscou',
  'the light of the world is jesus': 'A luz do mundo é Jesus',
  'there is life in a look': 'Há vida num olhar',
  'master the tempest is raging': 'Mestre, o mar se revolta',
  'nothing either great or small': 'Nada, nem grande nem pequeno',
  'sing them over again to me': 'Canta-as outra vez para mim',
  'i heard the voice of jesus say': 'Ouvi a voz de Jesus',
  'why do you wait': 'Por que esperas',
  'who is on the lord s side': 'Quem está do lado do Senhor',
  'would you be free from the burden of sin': 'Há poder no sangue',
  'rock of ages cleft for me': 'Rocha eterna',
  'though your sins be as scarlet': 'Ainda que os teus pecados sejam vermelhos',
  'when peace like a river': 'Está bem com a minha alma',
  'ring the bells of heaven': 'Tocai os sinos do céu',
  'blow ye the trumpet blow': 'Tocai a trombeta',
  'whosoever heareth': 'Quem ouvir, proclame',
  'thou didst leave thy throne': 'Deixaste o Teu trono',
  'ye must be born again': 'Importa-vos nascer de novo',
  'a ruler once came to jesus by night': 'Importa-vos nascer de novo',
  'are you weary are you languid': 'Estás cansado e abatido',
  'come unto me': 'Vinde a mim',
  'revive thy work o lord': 'Aviva a Tua obra, Senhor',
  'jesus is all the world to me': 'Jesus é tudo para mim',
  'never alone': 'Nunca sozinho',
  'like a river glorious': 'Como um rio glorioso',
  'take the name of jesus with you': 'Leva contigo o nome de Jesus',
  'the day thou gavest lord is ended': 'O dia que nos deste, Senhor',
  'face to face with christ my savior': 'Face a face com Cristo',
  'jerusalem the golden': 'Jerusalém de ouro',
  'there shall be showers of blessing': 'Haverá chuvas de bênção',
  'hold thou my hand': 'Segura a minha mão',
  'i know that my redeemer lives': 'Sei que o meu Redentor vive',
  'lord speak to me that i may speak': 'Fala-me, Senhor',
  'peace perfect peace': 'Paz, perfeita paz',
  'safe in the arms of jesus': 'Seguro nos braços de Jesus',
  'lead kindly light': 'Guia-me, luz benigna',
  'our god our help in ages past': 'Nosso Deus, nosso auxílio',
  'god moves in a mysterious way': 'Deus se move de modo misterioso',
  'jesus is coming': 'Jesus vem',
  'now the day is over': 'O dia já passou',
  'how sweet the name of jesus sounds': 'Quão doce é o nome de Jesus',
  'o the deep deep love of jesus': 'Ó profundo amor de Jesus',
  'praise god from whom all blessings flow': 'Louvai a Deus, de quem provém a bênção',
  'anywhere with jesus': 'Em qualquer lugar com Jesus',
  'jesus bids us shine': 'Jesus quer que brilhemos',
  'i think when i read that sweet story of old': 'Quando leio a doce história',
  'i am so glad that our father in heaven': 'Alegre estou, Jesus me ama',
  'when he cometh when he cometh': 'Quando Ele vier',
  'jesus wants me for a sunbeam': 'Jesus quer que eu brilhe',
  'jesus is our shepherd': 'Jesus é o nosso pastor',
  'behold me standing at the door': 'Eis que estou à porta',
  'grace tis a charming sound': 'A graça, som encantador',
  'out of the ivory palaces': 'Dos palácios de marfim',
  'must i go and empty handed': 'Irei de mãos vazias',
  'o happy day that fixed my choice': 'Ó dia feliz',
  'o jesus i have promised': 'Ó Jesus, eu prometi',
  'give of your best to the master': 'Dá o melhor ao Mestre',
  'jesus savior pilot me': 'Jesus, Salvador, pilota-me',
  'search me o god': 'Sonda-me, ó Deus',
  'i stand all amazed': 'Maravilhado estou',
  'will your anchor hold': 'Firme está a tua âncora',
  'only a sinner saved by grace': 'Só um pecador, salvo pela graça',
  'oh sacred head now wounded': 'Ó fronte ensanguentada',
  'sing the wondrous love of jesus': 'Cantai o amor de Jesus',
  'and can it be that i should gain': 'E pode ser que eu ganhe',
  'jesus i am resting resting': 'Em Teu amor descanso',
  'i want to be a worker for the lord': 'Quero trabalhar para o Senhor',
  'when upon life s billows': 'Quando lutas da vida',
  'you may have the joy bells': 'Podes ter os sinos de alegria',
  'king of my life i crown thee now': 'Rei da minha vida',
  'i remember when my burdens rolled away': 'Lembro-me quando as cargas rolaram',
  'i ve a message from the lord hallelujah': 'Tenho uma mensagem do Senhor',
  'jesus is coming to earth again': 'Jesus virá à terra outra vez',
  'stepping in the light': 'Pisando na luz',
  'i must have the savior with me': 'Preciso do Salvador comigo',
  'the name of jesus is so sweet': 'Tão doce é o nome de Jesus',
  'to the work to the work': 'Ao trabalho',
  'more holiness give me': 'Dá-me mais santidade',
  'i was a wandering sheep': 'Eu era uma ovelha desgarrada',
  'i have found a friend in jesus': 'Achei um amigo em Jesus',
  'the lily of the valley': 'O lírio dos vales',
  'there s a royal banner': 'Há um estandarte real',
  'there s a royal banner given for display': 'Há um estandarte real',
  'softly and tenderly jesus is calling': 'Brandamente Jesus chama',
  'almost persuaded': 'Quase persuadido',
  'sweet hour of prayer': 'Doce hora de oração',
  'abide with me fast falls the eventide': 'Fica conosco, Senhor',
  'what a friend we have in jesus': 'Que amigo temos em Jesus',
  'savior like a shepherd lead us': 'Qual pastor, Cristo guia',
  'stand up stand up for jesus': 'De pé por Jesus',
  'onward christian soldiers': 'Firmes e avante',
  'i love to tell the story': 'Amo contar a história',
  'come thou fount of every blessing': 'Fonte da celeste graça',
  'crown him with many crowns': 'Coroai com muitas coroas',
  'christ the lord is risen today': 'Cristo ressuscitou',
  'when i survey the wondrous cross': 'Contemplando a cruz',
  'man of sorrows what a name': 'Homem de dores',
  'just as i am': 'Tal como sou',
  'tell me the old old story': 'Conta-me a antiga história',
  'near the cross': 'Junto à cruz',
  'i am thine o lord': 'Sou Teu, ó Senhor',
  'take time to be holy': 'Toma tempo para ser santo',
  'am i a soldier of the cross': 'Sou soldado da cruz',
};

/** Spanish title (normalized) used when the other site has no original title. */
const FALLBACK_BY_ES = {
  'firmes y adelante': ['Onward, Christian Soldiers', 'Firmes e avante'],
  'santo santo santo': ['Holy, Holy, Holy', 'Santo, santo, santo'],
  'sublime gracia': ['Amazing Grace', 'Maravilhosa graça'],
  'maravilla gracia': ['Amazing Grace', 'Maravilhosa graça'],
  'cual amigo tenemos': ['What a Friend We Have in Jesus', 'Que amigo temos em Jesus'],
  'que amigo tenemos en jesus': ['What a Friend We Have in Jesus', 'Que amigo temos em Jesus'],
  'roca de la eternidad': ['Rock of Ages', 'Rocha eterna'],
  'castillo fuerte': ['A Mighty Fortress Is Our God', 'Castelo forte'],
  'cual pendon hermoso': ['The Banner of the Cross', 'O estandarte da cruz'],
  'estad por cristo firmes': ['Stand Up, Stand Up for Jesus', 'De pé por Jesus'],
  'tal como soy': ['Just as I Am', 'Tal como sou'],
  'mas cerca oh dios de ti': ['Nearer, My God, to Thee', 'Mais perto quero estar'],
  'mas cerca de ti': ['Nearer, My God, to Thee', 'Mais perto quero estar'],
  'jesus me ama': ['Jesus Loves Me', 'Jesus me ama'],
  'cristo me ama': ['Jesus Loves Me', 'Jesus me ama'],
  'noche de paz': ['Silent Night', 'Noite feliz'],
  'venid fieles': ['O Come, All Ye Faithful', 'Vinde, fiéis'],
  'oid un son en alta esfera': ['Hark! The Herald Angels Sing', 'Ouvi os anjos'],
  'alegria al mundo': ['Joy to the World', 'Alegria ao mundo'],
  'cuentan las bendiciones': ['Count Your Blessings', 'Conta as bênçãos'],
  'cuenta las bendiciones': ['Count Your Blessings', 'Conta as bênçãos'],
  'dulce oracion': ['Sweet Hour of Prayer', 'Doce hora de oração'],
  'a dios sea la gloria': ['To God Be the Glory', 'A Deus demos glória'],
  'el vive': ['He Lives', 'Ele vive'],
  'porque el vive': ['Because He Lives', 'Porque Ele vive'],
  'en el huerto': ['In the Garden', 'No jardim'],
  'grande es tu fidelidad': ['Great Is Thy Faithfulness', 'Grande é a Tua fidelidade'],
  'cuan grande es el': ['How Great Thou Art', 'Quão grande és Tu'],
  'cuan grande es el senor': ['How Great Thou Art', 'Quão grande és Tu'],
  'la cruz excelsa': ['The Old Rugged Cross', 'A velha cruz'],
  'en el monte calvario': ['The Old Rugged Cross', 'A velha cruz'],
  'junto a la cruz': ['Near the Cross', 'Junto à cruz'],
  'todo a cristo yo me rindo': ['I Surrender All', 'Tudo a Cristo entrego'],
  'te rindo todo': ['I Surrender All', 'Tudo a Cristo entrego'],
  'solo de jesus la sangre': ['Nothing but the Blood', 'Nada senão o sangue'],
  'hay poder en la sangre': ['There Is Power in the Blood', 'Há poder no sangue'],
  'mi esperanza esta en jesus': ['The Solid Rock', 'Rocha firme'],
  'mi fe espera en ti': ['My Faith Looks Up to Thee', 'Minha fé olha para Ti'],
  'el me guia': ['He Leadeth Me', 'Ele me guia'],
  'cual pastor cristo': ['Savior, Like a Shepherd Lead Us', 'Qual pastor, Cristo guia'],
  'confia y obedece': ['Trust and Obey', 'Confia e obedece'],
  'de pie de pie por jesus': ['Stand Up, Stand Up for Jesus', 'De pé por Jesus'],
  'la fe es la victoria': ['Faith Is the Victory', 'A fé é a vitória'],
  'no te dejes vencer': ['Yield Not to Temptation', 'Não cedas à tentação'],
  'dios os guarde': ['God Be with You Till We Meet Again', 'Deus esteja convosco'],
  'grato es contar la historia': ['I Love to Tell the Story', 'Amo contar a história'],
  'amo contar la historia': ['I Love to Tell the Story', 'Amo contar a história'],
  'cuentame la antigua historia': ['Tell Me the Old, Old Story', 'Conta-me a antiga história'],
  'dime la antigua historia': ['Tell Me the Old, Old Story', 'Conta-me a antiga história'],
  'firmes sobre las promesas': ['Standing on the Promises', 'Firmado nas promessas'],
  'apoyado en tus brazos': ['Leaning on the Everlasting Arms', 'Nos braços eternos'],
  'que comunion': ['Leaning on the Everlasting Arms', 'Nos braços eternos'],
  'es dulce confiar': ['Tis So Sweet to Trust in Jesus', 'Doce é confiar em Jesus'],
  'bendita seguridad': ['Blessed Assurance', 'Bendita certeza'],
  'bien segura tengo yo': ['Blessed Assurance', 'Bendita certeza'],
  'al contemplar la excelsa cruz': ['When I Survey the Wondrous Cross', 'Contemplando a cruz'],
  'cuando contemplo la cruz': ['When I Survey the Wondrous Cross', 'Contemplando a cruz'],
  'oh amor que no me dejaras': ['O Love That Wilt Not Let Me Go', 'Ó amor que não me deixas'],
  'el amor de dios': ['The Love of God', 'O amor de Deus'],
  'cristo ya resucito': ['Christ the Lord Is Risen Today', 'Cristo ressuscitou'],
  'la tumba le encerro': ['Low in the Grave He Lay', 'Na sepultura'],
  'de la tumba el resucito': ['Up from the Grave He Arose', 'Da sepultura ressurgiu'],
  'santa biblia': ['Holy Bible, Book Divine', 'Bíblia santa'],
  'parte tu el pan de vida': ['Break Thou the Bread of Life', 'Parte o pão da vida'],
  'cuán firme cimiento': ['How Firm a Foundation', 'Quão firme alicerce'],
  'cuan firme cimiento': ['How Firm a Foundation', 'Quão firme alicerce'],
  'corona a cristo': ['Crown Him with Many Crowns', 'Coroai com muitas coroas'],
  'coroad al rey': ['All Hail the Power of Jesus’ Name', 'Coroai'],
  'ven fuente de toda bendicion': ['Come, Thou Fount of Every Blessing', 'Fonte da celeste graça'],
  'inmortal invisible': ['Immortal, Invisible, God Only Wise', 'Imortal, invisível'],
  'oh adorad al rey': ['O Worship the King', 'Adorai o Rei'],
  'alabad al rey': ['O Worship the King', 'Adorai o Rei'],
  'conmigo queda': ['Abide with Me', 'Fica conosco, Senhor'],
  'en una pobre pesebre': ['Away in a Manger', 'Numa manjedoura'],
  'oh pueblecito de belen': ['O Little Town of Bethlehem', 'Ó pequena Belém'],
  'los magos': ['We Three Kings', 'Reis do Oriente'],
  'angeles cantando estan': ['Angels We Have Heard on High', 'Anjos cantando glória'],
  'oh ven oh ven emanuel': ['O Come, O Come, Emmanuel', 'Ó vem, Emanuel'],
  'casi decidido': ['Almost Persuaded', 'Quase persuadido'],
  'con voz benigna': ['Softly and Tenderly', 'Brandamente Jesus chama'],
  'mas blanco que la nieve': ['Whiter than Snow', 'Mais alvo que a neve'],
  'preciso de ti': ['I Need Thee Every Hour', 'Preciso de Ti'],
  'cada momento preciso': ['I Need Thee Every Hour', 'Preciso de Ti'],
  'no me pases': ['Pass Me Not', 'Não me passes'],
  'rescatad a los que perecen': ['Rescue the Perishing', 'Resgatai os que perecem'],
  'hay una fuente': ['There Is a Fountain', 'Há uma fonte'],
  'en el calvario': ['At Calvary', 'No Calvário'],
  'paz paz dulce paz': ['It Is Well with My Soul', 'Está bem com a minha alma'],
  'cuando la paz como un rio': ['It Is Well with My Soul', 'Está bem com a minha alma'],
  'al estar en la presencia': ['Face to Face', 'Face a face'],
  'cuando alla se pase lista': ['When the Roll Is Called Up Yonder', 'Quando ali a lista for lida'],
  'junto al rio nos veremos': ['Shall We Gather at the River', 'Juntos ao rio'],
  'en la dulce eternidad': ['In the Sweet By and By', 'No além, breve'],
  'cuando todos lleguemos': ['When We All Get to Heaven', 'Quando chegarmos ao céu'],
  'mil voces para celebrar': ['O for a Thousand Tongues to Sing', 'Oh, que mil línguas'],
  'y puede ser': ['And Can It Be', 'E pode ser'],
  'asombroso amor': ['And Can It Be', 'E pode ser'],
  'fe de nuestros padres': ['Faith of Our Fathers', 'Fé de nossos pais'],
  'la iglesia tiene un fundamento': ["The Church's One Foundation", 'Um só fundamento'],
  'un firme fundamento': ["The Church's One Foundation", 'Um só fundamento'],
  'el gran medico': ['The Great Physician', 'O grande Médico'],
  'bajo sus alas': ['Under His Wings', 'Sob as Suas asas'],
  'hijo del rey': ['A Child of the King', 'Filho do Rei'],
  'el lirio de los valles': ['The Lily of the Valley', 'O lírio dos vales'],
  'jesus amante de mi alma': ['Jesus, Lover of My Soul', 'Jesus, amante da minha alma'],
  'toma mi vida': ['Take My Life and Let It Be', 'Toma a minha vida'],
  'tened santidad': ['Take Time to Be Holy', 'Toma tempo para ser santo'],
  'mas santidad dame': ['More Holiness Give Me', 'Dá-me mais santidade'],
  'a la tierra mas alta': ['Higher Ground', 'Terreno mais alto'],
  'he decidido seguir a cristo': ['I Have Decided to Follow Jesus', 'Decidi seguir a Jesus'],
  'donde el me lleve': ['Where He Leads Me', 'Onde Ele me guiar'],
  'solo confia': ['Only Trust Him', 'Só confia'],
  'dios cuidara de ti': ['God Will Take Care of You', 'Deus cuidará de ti'],
  'no te desalientes': ['Be Not Dismayed', 'Não temas'],
  'hay un verde monte': ['There Is a Green Hill Far Away', 'Há um verde monte'],
  'hombre de dolores': ['Man of Sorrows', 'Homem de dores'],
  'estabas alli': ['Were You There', 'Estavas lá'],
  'bajo la cruz de jesus': ['Beneath the Cross of Jesus', 'Sob a cruz de Jesus'],
  'di mi vida por ti': ['I Gave My Life for Thee', 'Dei a minha vida por ti'],
  'gracia mayor que el pecado': ['Grace Greater than Our Sin', 'Graça maior que o pecado'],
  'ya remido': ['Redeemed', 'Remido'],
  'palabras de vida': ['Wonderful Words of Life', 'Palavras de vida'],
  'cantare la maravillosa historia': ['I Will Sing the Wondrous Story', 'Cantarei a história'],
  'jesus salva': ['Jesus Saves', 'Jesus salva'],
  'traedlos': ['Bring Them In', 'Trazei-os'],
  'trabajad que la noche viene': ['Work, for the Night Is Coming', 'Trabalhai, vem a noite'],
  'lanzad el cordel': ['Throw Out the Lifeline', 'Lançai a boia'],
  'guardad el fuerte': ['Hold the Fort', 'Guardai o forte'],
  'tocad la trompeta': ['Sound the Battle Cry', 'Soa o brado de guerra'],
  'soy soldado de la cruz': ['Am I a Soldier of the Cross', 'Sou soldado da cruz'],
  'refugio en la tempestad': ['A Shelter in the Time of Storm', 'Abrigo na tempestade'],
  'el puerto del reposo': ['The Haven of Rest', 'O porto de descanso'],
  'morando en beula': ['Dwelling in Beulah Land', 'Morando em Beulá'],
  'hay sol en mi alma': ['Sunshine in My Soul', 'Há sol na minha alma'],
  'me hace cantar': ['He Keeps Me Singing', 'Ele me faz cantar'],
  'todo el camino': ['All the Way My Savior Leads Me', 'Todo o caminho me guia'],
  'cuando suene la trompeta': ['When the Trumpet of the Lord Shall Sound', 'Quando a trombeta soar'],
  'oh que gloria': ['O That Will Be Glory', 'Oh, que glória'],
  'esta mi nombre escrito alli': ['Is My Name Written There', 'Está o meu nome escrito'],
  'nos hallara jesus velando': ['Will Jesus Find Us Watching', 'Achar-nos-á Jesus vigiando'],
  'es el dia de coronacion': ['Is It the Crowning Day', 'É o dia da coroação'],
  'jesus viene otra vez': ['Jesus Is Coming Again', 'Jesus virá outra vez'],
  'debo decir a jesus': ['I Must Tell Jesus', 'Tenho que dizer a Jesus'],
  'dile a jesus': ['Tell It to Jesus', 'Dize a Jesus'],
  'pensaste orar': ['Did You Think to Pray', 'Pensaste em orar'],
  'mas amor a ti': ['More Love to Thee', 'Mais amor a Ti'],
  'te amo jesus': ['My Jesus, I Love Thee', 'Meu Jesus, eu Te amo'],
  'mi jesus yo te amo': ['My Jesus, I Love Thee', 'Meu Jesus, eu Te amo'],
  'bajo el cuidado de sus alas': ['Under His Wings', 'Sob as Suas asas'],
  'escondida en el': ['He Hideth My Soul', 'Ele guarda a minha alma'],
  'atraeme mas': ['Draw Me Nearer', 'Atrai-me mais'],
  'tuyo soy senor': ['I Am Thine, O Lord', 'Sou Teu, ó Senhor'],
  'haz lo que quieras': ['Have Thine Own Way, Lord', 'Dispõe de mim'],
  'sea hecha tu voluntad': ['Have Thine Own Way, Lord', 'Dispõe de mim'],
  'esta todo en el altar': ['Is Your All on the Altar', 'Tudo está no altar'],
  'vuelvo a casa': ['Lord, I’m Coming Home', 'Senhor, volto para casa'],
  'jesus llama con ternura': ['Jesus Is Tenderly Calling', 'Jesus chama com ternura'],
  'ven alma cansada': ['Come, Every Soul by Sin Oppressed', 'Vem, alma oprimida'],
  'quien quiera': ['Whosoever Will', 'Quem quiser'],
  'de groenlandia': ["From Greenland's Icy Mountains", 'Das geleiras da Groenlândia'],
  'una historia a las naciones': ["We've a Story to Tell to the Nations", 'Há uma história para as nações'],
  'brillen las luces': ['Let the Lower Lights Be Burning', 'Brilhem as luzes da costa'],
  'nino en el pesebre': ['Away in a Manger', 'Numa manjedoura'],
  'que nino es este': ['What Child Is This', 'Que criança é esta'],
  'noche santa': ['O Holy Night', 'Ó noite santa'],
  'oh venid fieles': ['O Come, All Ye Faithful', 'Vinde, fiéis'],
  'regocijaos': ['Joy to the World', 'Alegria ao mundo'],
  'pastores vigilaban': ['While Shepherds Watched', 'Enquanto os pastores'],
  'el primer noel': ['The First Noel', 'O primeiro Natal'],
  'proclamad en el monte': ['Go, Tell It on the Mountain', 'Proclamai nos montes'],
  'oi los cascabeles': ['I Heard the Bells on Christmas Day', 'Ouvi os sinos'],
  'por la hermosura de la tierra': ['For the Beauty of the Earth', 'Pela beleza da terra'],
  'este es el mundo de mi padre': ["This Is My Father's World", 'O mundo é de meu Pai'],
  'jesus el mas hermoso': ['Fairest Lord Jesus', 'Ó Jesus, o mais formoso'],
  'criaturas todas': ['All Creatures of Our God and King', 'Todas as criaturas'],
  'alabadle': ['Praise Him! Praise Him!', 'Louvai-O'],
  'alabadle alabadle': ['Praise Him! Praise Him!', 'Louvai-O'],
  'ahora gracias demos': ['Now Thank We All Our God', 'Agora agradecemos'],
  'venid agradecidos': ['Come, Ye Thankful People, Come', 'Vinde, agradecidos'],
  'un cargo tengo': ['A Charge to Keep I Have', 'Um dever a cumprir'],
  'la fe de los padres': ['Faith of Our Fathers', 'Fé de nossos pais'],
};

function decode(s) {
  return String(s)
    .replace(/&#8211;|&#x2013;/gi, '–')
    .replace(/&#8212;/gi, '—')
    .replace(/&#8216;|&#8217;|&#x2019;/gi, '’')
    .replace(/&#8220;|&#8221;/gi, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function norm(s) {
  return decode(s)
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function cleanFact(s) {
  const t = decode(s);
  if (!t || /^n\/?a$/i.test(t) || t === '-' || t === '—') return undefined;
  return t;
}

export function parseMetaCells(cells) {
  const out = {};
  let i = 0;
  while (i < cells.length) {
    if (!LABELS.has(cells[i])) {
      i += 1;
      continue;
    }
    const labels = [];
    while (i < cells.length && LABELS.has(cells[i])) {
      labels.push(cells[i]);
      i += 1;
    }
    const values = [];
    while (i < cells.length && !LABELS.has(cells[i])) {
      values.push(cells[i]);
      i += 1;
    }
    if (labels.length === 1) {
      out[labels[0]] = values;
    } else {
      labels.forEach((label, idx) => {
        if (idx < labels.length - 1) out[label] = values[idx] ? [values[idx]] : [];
        else out[label] = values.slice(idx);
      });
    }
  }
  return out;
}

function splitTune(raw) {
  const s = decode(raw).replace(/[()]/g, '').trim();
  if (!s) return {};
  const meterMatch = s.match(/\d+(?:\s*\.\s*\d+)+(?:\s*con coro)?/i);
  const meter = meterMatch ? meterMatch[0].replace(/\s+/g, '') : undefined;
  let tune = s;
  if (meterMatch) tune = (s.slice(0, meterMatch.index) + ' ' + s.slice(meterMatch.index + meterMatch[0].length)).trim();
  tune = tune.replace(/^[,–—.\s]+|[,–—.\s]+$/g, '').replace(/\s+/g, ' ').trim();
  return {
    tune: tune || undefined,
    meter: meter || (!/[a-z]/i.test(s) ? s : undefined),
  };
}

function enFromClass(classList) {
  const raw = (classList || []).find((c) => c.startsWith('pa_titulo-original-'));
  if (!raw) return undefined;
  const slug = raw.slice('pa_titulo-original-'.length);
  if (!slug || /^(desconocido|n-a|na|anonimo|anonymous)$/.test(slug)) return undefined;
  const fixes = { onwart: 'onward', christain: 'christian', saviour: 'savior' };
  const small = new Set(['a', 'of', 'the', 'and', 'to', 'in', 'on', 'for', 'my', 'is', 'o', 'oh', 'at', 'by', 'or']);
  const words = slug.split('-').filter(Boolean).map((w) => fixes[w] || w);
  if (!words.length) return undefined;
  return words
    .map((w, i) => {
      if (w === 'i') return 'I';
      if (i > 0 && small.has(w)) return w;
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(' ');
}

const PT_NORM = Object.entries(PT_BY_EN).map(([k, v]) => [norm(k), v]);
const ES_NORM = Object.entries(FALLBACK_BY_ES).map(([k, v]) => [norm(k), v]);

const EN_OVERRIDE = {
  'mas santidad dame': 'More Holiness Give Me',
  'descarrieme cual oveja': 'I Was a Wandering Sheep',
};

function lookupNorm(table, value) {
  if (!value) return undefined;
  const n = norm(value);
  const exact = table.find(([k]) => k === n);
  if (exact) return exact[1];
  const keys = [...table].sort((a, b) => b[0].length - a[0].length);
  for (const [key, title] of keys) {
    if (key.length < 12) continue;
    if (n.startsWith(key + ' ') || n.startsWith(key)) return title;
  }
  return undefined;
}

function localesFor(esTitle, productEn) {
  const fallback = applySpanishFallback({ es: esTitle });
  const override = EN_OVERRIDE[norm(esTitle)];
  const en = override || productEn || fallback?.[0];
  let pt = ptForEnglish(en);
  if (!pt && fallback && en && norm(en) === norm(fallback[0])) pt = fallback[1];
  return { en, pt };
}

function ptForEnglish(en) {
  return lookupNorm(PT_NORM, en);
}

function applySpanishFallback(hymn) {
  return lookupNorm(ES_NORM, hymn.es);
}

async function getJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const headers = Object.fromEntries(res.headers);
  const json = await res.json();
  return { json, headers };
}

async function getText(url, tries = 3) {
  let last;
  for (let t = 0; t < tries; t += 1) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html' } });
      if (!res.ok) throw new Error(`${res.status} ${url}`);
      return await res.text();
    } catch (err) {
      last = err;
      await new Promise((r) => setTimeout(r, 400 * (t + 1)));
    }
  }
  throw last;
}

async function pool(items, limit, fn) {
  const out = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const idx = cursor;
      cursor += 1;
      out[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: limit }, () => worker()));
  return out;
}

function assertParser() {
  const cells = [
    'Autor',
    'Música',
    'S. Baring-Gould',
    'Sir Arthur Sullivan',
    'Traductor',
    'Juan B. Cabrera',
    'Métrica',
    'Tono',
    'Tempo',
    '(St. Gertrude 11.11.11.11.)',
    'D',
    'N/A',
    'Temática',
    'Subtematica',
    'Vida cristiana',
    'Servicio',
    'Versículos sugeridos',
    'Mt. 28.19',
    'Hch. 1.8',
    'Ef. 6.11',
  ];
  const meta = parseMetaCells(cells);
  if (meta.Autor?.[0] !== 'S. Baring-Gould') throw new Error('author parse');
  if (meta.Música?.[0] !== 'Sir Arthur Sullivan') throw new Error('music parse');
  if (meta['Versículos sugeridos']?.length !== 3) throw new Error('verse parse');
  const tune = splitTune(meta.Métrica[0]);
  if (tune.tune !== 'St. Gertrude') throw new Error('tune parse ' + JSON.stringify(tune));
  if (!tune.meter?.startsWith('11.11.11.11')) throw new Error('meter parse');
}

async function fetchHcePosts() {
  const fields = 'slug,link,title';
  const first = await getJson(
    `${HCE}/wp-json/wp/v2/posts?categories=7&per_page=100&page=1&orderby=id&order=asc&_fields=${fields}`,
  );
  const pages = Number(first.headers['x-wp-totalpages'] || 1);
  const all = [...first.json];
  for (let p = 2; p <= pages; p += 1) {
    const next = await getJson(
      `${HCE}/wp-json/wp/v2/posts?categories=7&per_page=100&page=${p}&orderby=id&order=asc&_fields=${fields}`,
    );
    all.push(...next.json);
  }
  const seen = new Set();
  return all.filter((post) => {
    if (seen.has(post.slug)) return false;
    seen.add(post.slug);
    return true;
  });
}

async function fetchProducts() {
  const first = await getJson(
    `${HC}/wp-json/wp/v2/product?per_page=100&page=1&_fields=link,title,class_list`,
  );
  const pages = Number(first.headers['x-wp-totalpages'] || 1);
  const all = [...first.json];
  for (let p = 2; p <= pages; p += 1) {
    const next = await getJson(
      `${HC}/wp-json/wp/v2/product?per_page=100&page=${p}&_fields=link,title,class_list`,
    );
    all.push(...next.json);
  }
  return all
    .map((p) => ({
      es: decode(p.title?.rendered || ''),
      link: p.link,
      en: enFromClass(p.class_list || []),
    }))
    .filter((p) => p.es);
}

function matchProduct(hymnEs, products, byNorm) {
  const key = norm(hymnEs);
  const exact = byNorm.get(key) || [];
  if (exact.length === 1) return exact[0];
  if (exact.length > 1) {
    const withEn = exact.filter((p) => p.en);
    if (withEn.length === 1) return withEn[0];
    return undefined;
  }
  if (key.length < 16) return undefined;
  const loose = products.filter((p) => {
    const pk = norm(p.es);
    if (pk.length < 10) return false;
    return pk.startsWith(key) || key.startsWith(pk);
  });
  if (loose.length === 1) return loose[0];
  return undefined;
}

async function findAcquireUrl() {
  try {
    const html = await getText(`${HCE}/`);
    const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
    const hit = hrefs.find((h) => /adquir|compr|tienda|shop/i.test(h));
    if (!hit) return `${HCE}/`;
    return hit.startsWith('http') ? hit : new URL(hit, HCE).href;
  } catch {
    return `${HCE}/`;
  }
}

async function main() {
  assertParser();
  if (process.argv.includes('--locales-only')) {
    const catalog = JSON.parse(fs.readFileSync(OUT, 'utf8'));
    for (const hymn of catalog.hymns) {
      const { en, pt } = localesFor(hymn.es, hymn.en);
      if (en) hymn.en = en;
      else delete hymn.en;
      if (pt) hymn.pt = pt;
      else delete hymn.pt;
    }
    fs.writeFileSync(OUT, JSON.stringify(catalog, null, 2) + '\n');
    console.log(
      JSON.stringify({
        count: catalog.hymns.length,
        withEn: catalog.hymns.filter((h) => h.en).length,
        withPt: catalog.hymns.filter((h) => h.pt).length,
      }),
    );
    return;
  }
  console.log('parser ok');
  const [posts, products, acquireUrl] = await Promise.all([
    fetchHcePosts(),
    fetchProducts(),
    findAcquireUrl(),
  ]);
  console.log('posts', posts.length, 'products', products.length, 'acquire', acquireUrl);

  const byNorm = new Map();
  for (const p of products) {
    const k = norm(p.es);
    if (!byNorm.has(k)) byNorm.set(k, []);
    byNorm.get(k).push(p);
  }

  const base = [];
  for (const post of posts) {
    const title = decode(post.title?.rendered || '');
    const m = title.match(/^(\d+)\s*[–—-]\s*(.+)$/);
    if (!m) {
      console.warn('skip title', title);
      continue;
    }
    base.push({
      n: Number(m[1]),
      es: m[2].trim(),
      slug: post.slug,
      url: post.link,
    });
  }
  base.sort((a, b) => a.n - b.n);

  let failed = 0;
  const detailed = await pool(base, 8, async (hymn) => {
    let html = '';
    try {
      html = await getText(hymn.url);
    } catch (err) {
      failed += 1;
      console.warn('html fail', hymn.n, err.message);
    }
    const cells = [...html.matchAll(/jet-table__cell-text">([^<]*)</g)]
      .map((m) => decode(m[1]))
      .filter(Boolean);
    const meta = parseMetaCells(cells);
    const tuneBits = splitTune((meta.Métrica || [])[0] || '');
    const product = matchProduct(hymn.es, products, byNorm);
    const { en, pt } = localesFor(hymn.es, product?.en);
    const verses = (meta['Versículos sugeridos'] || []).map(cleanFact).filter(Boolean);
    const record = {
      n: hymn.n,
      es: hymn.es,
      url: hymn.url,
      hasDemo: /\/wp-content\/uploads\/himnos\/\d+\.mp3/.test(html),
    };
    if (en) record.en = en;
    if (pt) record.pt = pt;
    const author = cleanFact((meta.Autor || [])[0]);
    const music = cleanFact((meta.Música || [])[0]);
    const translator = cleanFact((meta.Traductor || [])[0]);
    const key = cleanFact((meta.Tono || [])[0]);
    const tempo = cleanFact((meta.Tempo || [])[0]);
    const theme = cleanFact((meta.Temática || [])[0]);
    const subtheme = cleanFact((meta.Subtematica || meta.Subtemática || [])[0]);
    if (author) record.author = author;
    if (music) record.music = music;
    if (translator && !/^n\/?a$/i.test(translator)) record.translator = translator;
    if (tuneBits.tune) record.tune = tuneBits.tune;
    if (tuneBits.meter) record.meter = tuneBits.meter;
    if (key) record.key = key;
    if (tempo) record.tempo = tempo;
    if (theme) record.theme = theme;
    if (subtheme) record.subtheme = subtheme;
    if (verses.length) record.verses = verses;
    if (product?.link) record.scorePage = product.link;
    return record;
  });

  const hymns = detailed.filter(Boolean).sort((a, b) => a.n - b.n);
  const nums = new Set(hymns.map((h) => h.n));
  const missing = [];
  for (let n = 1; n <= 517; n += 1) if (!nums.has(n)) missing.push(n);

  const catalog = {
    source: `${HCE}/`,
    hymnal: 'Himnos y Cánticos del Evangelio',
    count: hymns.length,
    acquireUrl,
    hymns,
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(catalog, null, 2) + '\n');
  const withEn = hymns.filter((h) => h.en).length;
  const withPt = hymns.filter((h) => h.pt).length;
  const withAuthor = hymns.filter((h) => h.author).length;
  const withDemo = hymns.filter((h) => h.hasDemo).length;
  const withScore = hymns.filter((h) => h.scorePage).length;
  console.log(
    JSON.stringify(
      {
        count: hymns.length,
        missing,
        failed,
        withEn,
        withPt,
        withAuthor,
        withDemo,
        withScore,
        bytes: fs.statSync(OUT).size,
      },
      null,
      2,
    ),
  );
}

const isDirect = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
if (isDirect || process.argv[1]?.endsWith('build-hymn-catalog.mjs')) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

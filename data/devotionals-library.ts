import { Devotional } from '@/lib/types';

/**
 * Biblioteca curada de devocionales alineados con:
 * - Cultura Cristiano-Occidental
 * - BioConservadurismo
 * - Fe, Familia, Propósito, Salud y Libertad
 * - Make Salvation, Health and Freedom Great Again
 */
export const DEVOTIONALS_LIBRARY: Omit<Devotional, 'id' | 'date' | 'personalizedFor'>[] = [
  // === FE Y CONFIANZA ===
  {
    title: 'El León de Judá no tiembla',
    scripture: {
      reference: 'Apocalipsis 5:5',
      text: 'He aquí que el León de la tribu de Judá, la raíz de David, ha vencido para abrir el libro y desatar sus siete sellos.',
      version: 'Reina Valera 1909'
    },
    reflection: 'En un mundo que celebra la debilidad y la confusión, tú perteneces a la tribu del León. No te disculpes por tu fe. No te avergüences de defender la verdad. El mismo León que venció a la muerte camina contigo. Hoy elige rugir en silencio con tu integridad y en voz alta con tu testimonio.',
    prayer: 'Señor Jesucristo, León de Judá, fortaléceme para no temblar ante la presión cultural. Dame valentía para defender lo sagrado: la vida, la familia y Tu Nombre. Amén.',
    action: 'Comparte hoy un versículo o una verdad bíblica con alguien de tu círculo sin disculparte.',
    tags: ['fe', 'liderazgo', 'perseverancia', 'proposito'],
    points: 18
  },
  {
    title: 'La fe que no se negocia',
    scripture: {
      reference: 'Hebreos 11:1',
      text: 'Es, pues, la fe la certeza de lo que se espera, la convicción de lo que no se ve.',
      version: 'Reina Valera 1909'
    },
    reflection: 'La fe no es un sentimiento blando. Es certeza. En una era de relativismo, tu fe es el ancla que sostiene a tu familia y a tu comunidad. No la diluyas para agradar al mundo. Afírmala, vive conforme a ella y deja que otros vean el fruto.',
    prayer: 'Padre, aumenta mi fe. Que no sea solo palabras, sino una certeza que se note en mis decisiones diarias, en mi matrimonio, en mi trabajo y en cómo eduço a mis hijos.',
    action: 'Identifica una área donde has estado negociando tu fe y toma una decisión concreta de alinearte hoy.',
    tags: ['fe', 'familia', 'proposito'],
    points: 18
  },

  // === FAMILIA ===
  {
    title: 'El altar de la familia',
    scripture: {
      reference: 'Josué 24:15',
      text: 'Pero yo y mi casa serviremos a Jehová.',
      version: 'Reina Valera 1909'
    },
    reflection: 'La familia no es un accidente sociológico. Es el primer frente de batalla espiritual. Mientras el mundo ataca el matrimonio y confunde a los niños, tú eres llamado a levantar un altar en tu casa. Ora con ellos. Lee la Escritura. Defiende su inocencia. Sé el sacerdote de tu hogar.',
    prayer: 'Señor, haz de mi casa un lugar donde Tu presencia sea evidente. Dame sabiduría para liderar con amor firme y proteger a los que me has confiado.',
    action: 'Ora hoy en voz alta con al menos un miembro de tu familia o llama a un ser querido para bendecirlo.',
    tags: ['familia', 'liderazgo', 'oracion', 'fe'],
    points: 20
  },
  {
    title: 'Padres que no se rinden',
    scripture: {
      reference: 'Proverbios 22:6',
      text: 'Instruye al niño en su camino, y aun cuando fuere viejo no se apartará de él.',
      version: 'Reina Valera 1909'
    },
    reflection: 'Criar hijos en esta generación es guerra espiritual. No es suficiente “ser buenos padres”. Se necesita intencionalidad: disciplina, verdad, ejemplo y oración constante. Tus hijos no necesitan un amigo más; necesitan un padre y una madre que sepan a dónde van.',
    prayer: 'Dios de Abraham, Isaac y Jacob, dame la fuerza de no cansarme de instruir, corregir y amar. Que mis hijos vean en mí un reflejo de Tu carácter.',
    action: 'Dedica 15 minutos hoy a hablar con tus hijos (o sobrinos/ahijados) sobre una verdad bíblica práctica.',
    tags: ['familia', 'liderazgo', 'perseverancia'],
    points: 20
  },

  // === PROPÓSITO Y LLAMADO ===
  {
    title: 'No fuiste llamado a la mediocridad',
    scripture: {
      reference: 'Efesios 2:10',
      text: 'Porque somos hechura suya, creados en Cristo Jesús para buenas obras, las cuales Dios preparó de antemano para que anduviésemos en ellas.',
      version: 'Reina Valera 1909'
    },
    reflection: 'El mundo te empuja a consumir y a distraerte. Dios te creó para producir, construir y dejar legado. Tu trabajo, tu startup, tu ministerio o tu rol en la familia no son “solo un trabajo”. Son el terreno donde se manifiesta el Reino. Trabaja como quien sabe que responde a un Rey.',
    prayer: 'Señor, líbrame de la mediocridad. Muéstrame las buenas obras que preparaste para mí y dame disciplina para caminar en ellas con excelencia.',
    action: 'Identifica una tarea pendiente importante y termínala hoy con excelencia, como ofrenda al Señor.',
    tags: ['proposito', 'liderazgo', 'libertad'],
    points: 18
  },
  {
    title: 'La Comunidad y espiritual',
    scripture: {
      reference: 'Nehemías 4:14',
      text: 'No temáis delante de ellos; acordaos del Señor, grande y temible, y pelead por vuestros hermanos, por vuestros hijos, por vuestras mujeres y por vuestras casas.',
      version: 'Reina Valera 1909'
    },
    reflection: 'No estás solo. Formas parte de la Comunidad: hombres y mujeres Green Lion Kings que defienden la fe, la familia y la libertad en la era digital. Tu presencia en Salvazion no es casualidad. Es un llamado a pelear (espiritualmente) por lo que importa. Mantente firme junto a otros.',
    prayer: 'Señor de los ejércitos, úneme a otros que pelean la misma batalla. Que no me aísle ni me rinda. Hazme un eslabón fuerte en la cadena.',
    action: 'Envía un mensaje de aliento a alguien de tu comunidad de fe o de Salvazion hoy.',
    tags: ['proposito', 'liderazgo', 'comunidad', 'fe'],
    points: 18
  },

  // === SALUD Y CUERPO ===
  {
    title: 'Tu cuerpo es templo, no merchandise',
    scripture: {
      reference: '1 Corintios 6:19-20',
      text: '¿O ignoráis que vuestro cuerpo es templo del Espíritu Santo, el cual está en vosotros, el cual tenéis de Dios, y que no sois vuestros? Porque habéis sido comprados por precio; glorificad, pues, a Dios en vuestro cuerpo y en vuestro espíritu, los cuales son de Dios.',
      version: 'Reina Valera 1909'
    },
    reflection: 'El bio-conservadurismo empieza en tu propia carne. Cuidar el sueño, el movimiento, la alimentación y el ayuno no es vanidad: es mayordomía. Mientras la cultura promueve la destrucción del cuerpo (drogas, cirugías ideológicas, obesidad), tú eliges honrar el templo que Dios te dio.',
    prayer: 'Espíritu Santo que habitas en mí, ayúdame a tratar este cuerpo con respeto. Dame disciplina para el sueño, el ejercicio y la comida. Que mi salud glorifique a Dios.',
    action: 'Hoy cumple al menos una de estas: 20 min de movimiento intenso, 7+ horas de sueño planeadas, o un ayuno parcial consciente.',
    tags: ['salud', 'disciplina', 'fe'],
    points: 18
  },

  // === LIBERTAD Y RESISTENCIA ===
  {
    title: 'La libertad que no se regala',
    scripture: {
      reference: 'Gálatas 5:1',
      text: 'Estad, pues, firmes en la libertad con que Cristo nos hizo libres, y no estéis otra vez sujetos al yugo de esclavitud.',
      version: 'Reina Valera 1909'
    },
    reflection: 'La verdadera libertad no es hacer lo que se te antoja. Es vivir sin las cadenas del pecado, de la ideología y del miedo. Cristo te liberó. No vuelvas a ponerte el yugo de la corrección política, del consumo vacío o de la aprobación del mundo. Mantente firme.',
    prayer: 'Señor, que no venda mi libertad por comodidad. Que prefiera la verdad incómoda a la mentira cómoda. Hazme libre de verdad.',
    action: 'Identifica una “cadena” cultural o personal que te está limitando y da un paso concreto para romperla hoy.',
    tags: ['libertad', 'fe', 'perseverancia'],
    points: 18
  },
  {
    title: 'Contra la corriente',
    scripture: {
      reference: 'Romanos 12:2',
      text: 'No os conforméis a este siglo, sino transformaos por medio de la renovación de vuestro entendimiento, para que comprobéis cuál sea la buena voluntad de Dios, agradable y perfecta.',
      version: 'Reina Valera 1909'
    },
    reflection: 'Conformarse es fácil. Transformarse duele. Pero solo los que renuevan su mente pueden discernir la voluntad de Dios en medio del caos. Hoy elige no tragar el relato dominante. Piensa con la Escritura. Habla con claridad. Vive diferente.',
    prayer: 'Renueva mi entendimiento, Señor. Que no me deje arrastrar por las modas ideológicas. Que mi mente esté cautiva solo de Cristo.',
    action: 'Lee un capítulo de la Biblia hoy con la intención de confrontar alguna idea cultural que has aceptado sin cuestionar.',
    tags: ['libertad', 'fe', 'proposito'],
    points: 18
  },

  // === ORACIÓN Y DISCIPLINA ===
  {
    title: 'El poder de la oración constante',
    scripture: {
      reference: '1 Tesalonicenses 5:17',
      text: 'Orad sin cesar.',
      version: 'Reina Valera 1909'
    },
    reflection: 'La oración no es un ritual de emergencia. Es el oxígeno del espíritu. En la Comunidad, la disciplina de orar diariamente es lo que mantiene el fuego. No esperes a tener ganas. Ora cuando no las tengas. Ahí se forja el carácter.',
    prayer: 'Señor, enséñame a orar sin cesar. Que mi primer reflejo ante cualquier situación sea volverme a Ti. Haz de la oración mi arma y mi descanso.',
    action: 'Pon un timer de 7 minutos ahora mismo y ora sin distracciones por tu familia, tu propósito y tu nación.',
    tags: ['oracion', 'disciplina', 'fe'],
    points: 18
  },
  {
    title: 'Cuando el silencio también es oración',
    scripture: {
      reference: 'Salmos 46:10',
      text: 'Estad quietos, y conoced que yo soy Dios.',
      version: 'Reina Valera 1909'
    },
    reflection: 'En la era del ruido constante, el silencio es rebelión santa. Apagar las notificaciones y simplemente estar delante de Dios no es pérdida de tiempo: es recuperar el centro. El León también se echa a descansar. Aprende a estar quieto.',
    prayer: 'Dios eterno, enséñame el valor del silencio. Que en la quietud pueda oír Tu voz por encima del estruendo del mundo.',
    action: 'Hoy dedica 10 minutos de silencio total (sin teléfono) solo para estar delante de Dios.',
    tags: ['oracion', 'salud', 'fe'],
    points: 15
  },

  // === PERSEVERANCIA ===
  {
    title: 'No te canses de hacer el bien',
    scripture: {
      reference: 'Gálatas 6:9',
      text: 'No nos cansemos, pues, de hacer bien; porque a su tiempo segaremos, si no desmayamos.',
      version: 'Reina Valera 1909'
    },
    reflection: 'La batalla es larga. Habrá días en que sientas que nadie nota tu fidelidad, tu oración, tu trabajo o tu defensa de la verdad. Sigue. La cosecha viene. Dios no se olvida. La perseverancia es la marca de los que realmente creen.',
    prayer: 'Señor, cuando quiera desmayar, recuérdame la cosecha. Dame la gracia de seguir plantando aunque no vea fruto inmediato.',
    action: 'Continúa hoy con una disciplina espiritual o de salud que estés tentado a abandonar.',
    tags: ['perseverancia', 'proposito', 'fe'],
    points: 18
  }
];

// Versiones en inglés (subset clave)
export const DEVOTIONALS_EN: Omit<Devotional, 'id' | 'date' | 'personalizedFor'>[] = [
  {
    title: 'The Lion of Judah Does Not Tremble',
    scripture: {
      reference: 'Revelation 5:5',
      text: 'Behold, the Lion of the tribe of Judah, the Root of David, has prevailed to open the scroll and to loose its seven seals.',
      version: 'King James Version'
    },
    reflection: 'In a world that celebrates weakness and confusion, you belong to the tribe of the Lion. Do not apologize for your faith. Do not be ashamed to defend truth. The same Lion who conquered death walks with you. Today choose to roar in silence with your integrity and out loud with your testimony.',
    prayer: 'Lord Jesus Christ, Lion of Judah, strengthen me so I will not tremble before cultural pressure. Give me courage to defend what is sacred: life, family, and Your Name. Amen.',
    action: 'Share a verse or a biblical truth today with someone in your circle without apologizing.',
    tags: ['fe', 'liderazgo', 'perseverancia', 'proposito'],
    points: 18
  },
  {
    title: 'Your Body Is a Temple, Not Merchandise',
    scripture: {
      reference: '1 Corinthians 6:19-20',
      text: 'What? know ye not that your body is the temple of the Holy Ghost which is in you, which ye have of God, and ye are not your own? For ye are bought with a price: therefore glorify God in your body, and in your spirit, which are God\'s.',
      version: 'King James Version'
    },
    reflection: 'Bio-conservatism begins in your own flesh. Caring for sleep, movement, food and fasting is not vanity — it is stewardship. While the culture promotes the destruction of the body, you choose to honor the temple God gave you.',
    prayer: 'Holy Spirit who dwells in me, help me treat this body with respect. Give me discipline for sleep, exercise and food. May my health glorify God.',
    action: 'Today complete at least one: 20 min of intense movement, plan 7+ hours of sleep, or a conscious partial fast.',
    tags: ['salud', 'disciplina', 'fe'],
    points: 18
  },
  {
    title: 'The Family Altar',
    scripture: {
      reference: 'Joshua 24:15',
      text: 'But as for me and my house, we will serve the Lord.',
      version: 'King James Version'
    },
    reflection: 'The family is not a sociological accident. It is the first front of spiritual battle. While the world attacks marriage and confuses children, you are called to raise an altar in your home. Pray with them. Read Scripture. Defend their innocence. Be the priest of your household.',
    prayer: 'Lord, make my house a place where Your presence is evident. Give me wisdom to lead with firm love and protect those You have entrusted to me.',
    action: 'Pray out loud today with at least one family member or call a loved one to bless them.',
    tags: ['familia', 'liderazgo', 'oracion', 'fe'],
    points: 20
  }
];

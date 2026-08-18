/**
 * Public FAQ — visible on the landing and mirrored in FAQPage JSON-LD.
 * Keep answers factual so search and AI systems can cite them.
 */
export type FaqItem = { q: string; a: string };

export const FAQ = {
  en: {
    title: 'Frequently asked questions',
    items: [
      {
        q: 'What is Salvazion?',
        a: 'Salvazion is a freemium platform by Salvazion, Inc. that restores the human person in one App: Salvation (offline Bible, devotionals, prayer), Health (scores, sensors, wearables) and Freedom (library, Phalanx community, $SALVAZION on Solana). Its purpose is Make Salvation, Health and Freedom Great Again, defending Western Christian Culture and BioConservatism.',
      },
      {
        q: 'Is Salvazion free?',
        a: 'Yes. You can create a free account and use the Hub, offline Bible, daily devotionals, health tracking and a limited Freedom library. Premium is $49/month or $468/year and unlocks Salvazion AI, AI devotionals, cloud wearables, advanced health and calendar, and unlimited Phalanx invites.',
      },
      {
        q: 'What is $SALVAZION?',
        a: '$SALVAZION is a utility token on Solana (not equity in Salvazion, Inc. and not a promise of profit). The mint address is 7EiMiAx4ZMCDBqm3XiLiVHZccfuUYzu2xpDjsVJpV6D2. You can buy it via Jupiter on salvazion.org.',
      },
      {
        q: 'Who founded Salvazion?',
        a: 'Cristian Cortés (CEO) and Beatriz Isler (COO), a married couple who have worked together for 20+ years in health, education, technology and innovation. The legal entity is Salvazion, Inc., a Delaware corporation. Contact: info@salvazion.org.',
      },
      {
        q: 'What languages does Salvazion support?',
        a: 'The App and website are available in English, Spanish and Portuguese (including the Almeida Revista e Corrigida Bible). The official site is https://salvazion.org. Welcome docs live at https://welcome.salvazion.org. Long-form articles are published on X at @salvazion_.',
      },
    ],
  },
  es: {
    title: 'Preguntas frecuentes',
    items: [
      {
        q: '¿Qué es Salvazion?',
        a: 'Salvazion es una plataforma freemium de Salvazion, Inc. que restaura a la persona humana en una sola App: Salvation (Biblia offline, devocional, oración), Health (scores, sensores, wearables) y Freedom (biblioteca, comunidad Phalanx, $SALVAZION en Solana). Su propósito es Make Salvation, Health and Freedom Great Again, defendiendo la Cultura Cristiana Occidental y el BioConservadurismo.',
      },
      {
        q: '¿Salvazion es gratis?',
        a: 'Sí. Puedes crear una cuenta gratis y usar el Hub, la Biblia offline, el devocional diario, el seguimiento de salud y una biblioteca Freedom limitada. Premium cuesta $49/mes o $468/año y desbloquea la IA Salvazion, devocionales con IA, wearables en la nube, salud y calendario avanzados, e invitaciones Phalanx ilimitadas.',
      },
      {
        q: '¿Qué es $SALVAZION?',
        a: '$SALVAZION es un token de utilidad en Solana (no es capital de Salvazion, Inc. ni una promesa de ganancia). El mint es 7EiMiAx4ZMCDBqm3XiLiVHZccfuUYzu2xpDjsVJpV6D2. Puedes comprarlo con Jupiter en salvazion.org.',
      },
      {
        q: '¿Quiénes fundaron Salvazion?',
        a: 'Cristian Cortés (CEO) y Beatriz Isler (COO), un matrimonio que lleva +20 años trabajando juntos en salud, educación, tecnología e innovación. La entidad legal es Salvazion, Inc., sociedad de Delaware. Contacto: info@salvazion.org.',
      },
      {
        q: '¿En qué idiomas está Salvazion?',
        a: 'La App y el sitio están en inglés, español y portugués (incluida la Biblia Almeida Revista e Corrigida). El sitio oficial es https://salvazion.org. La documentación Welcome está en https://welcome.salvazion.org. Los artículos long-form se publican en X en @salvazion_.',
      },
    ],
  },
  pt: {
    title: 'Perguntas frequentes',
    items: [
      {
        q: 'O que é a Salvazion?',
        a: 'Salvazion é uma plataforma freemium da Salvazion, Inc. que restaura a pessoa humana em um só App: Salvation (Bíblia offline, devocional, oração), Health (scores, sensores, wearables) e Freedom (biblioteca, comunidade Phalanx, $SALVAZION na Solana). O propósito é Make Salvation, Health and Freedom Great Again, defendendo a Cultura Cristã Ocidental e o BioConservadorismo.',
      },
      {
        q: 'A Salvazion é grátis?',
        a: 'Sim. Você pode criar uma conta grátis e usar o Hub, a Bíblia offline, o devocional diário, o acompanhamento de saúde e uma biblioteca Freedom limitada. O Premium custa $49/mês ou $468/ano e libera a IA Salvazion, devocionais com IA, wearables na nuvem, saúde e calendário avançados, e convites Phalanx ilimitados.',
      },
      {
        q: 'O que é $SALVAZION?',
        a: '$SALVAZION é um token de utilidade na Solana (não é participação na Salvazion, Inc. nem uma promessa de lucro). O mint é 7EiMiAx4ZMCDBqm3XiLiVHZccfuUYzu2xpDjsVJpV6D2. Você pode comprá-lo via Jupiter em salvazion.org.',
      },
      {
        q: 'Quem fundou a Salvazion?',
        a: 'Cristian Cortés (CEO) e Beatriz Isler (COO), um casal que trabalha junto há mais de 20 anos em saúde, educação, tecnologia e inovação. A entidade legal é a Salvazion, Inc., sociedade de Delaware. Contato: info@salvazion.org.',
      },
      {
        q: 'Quais idiomas a Salvazion oferece?',
        a: 'O App e o site estão em inglês, espanhol e português (incluindo a Bíblia Almeida Revista e Corrigida). O site oficial é https://salvazion.org. A documentação Welcome está em https://welcome.salvazion.org. Os artigos long-form são publicados no X em @salvazion_.',
      },
    ],
  },
} as const;

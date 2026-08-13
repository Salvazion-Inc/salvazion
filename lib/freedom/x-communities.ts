/**
 * Official X (Twitter) Communities for Salvazion · Freedom · Connect.
 */

export type XCommunity = {
  id: string;
  name: string;
  /** Public community URL on x.com */
  url: string;
  /** Short bilingual blurbs */
  blurbEn: string;
  blurbEs: string;
  blurbPt: string;
  /** Display handle / brand line */
  brand: string;
  accent: string;
};

export const X_COMMUNITIES: XCommunity[] = [
  {
    id: 'green-lion-kings',
    name: 'Green Lion Kings',
    url: 'https://x.com/i/communities/1800657219379146780',
    brand: 'Salvazion · X Community',
    accent: '#8FD99A',
    blurbEn:
      'Join the Green Lion Kings on X: faith, family, Western Christian culture, BioConservatism and Freedom. Connect with the Salvazion tribe.',
    blurbEs:
      'Únete a Green Lion Kings en X: fe, familia, cultura cristiano-occidental, BioConservadurismo y Freedom. Conecta con la tribu Salvazion.',
    blurbPt:
      'Entre nos Green Lion Kings no X: fé, família, cultura cristã ocidental, BioConservadorismo e Freedom. Conecte-se com a tribo Salvazion.',
  },
];

export const GREEN_LION_KINGS_URL =
  'https://x.com/i/communities/1800657219379146780';

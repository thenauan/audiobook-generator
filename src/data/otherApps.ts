// Apps do mesmo autor exibidos em "Outros Apps"
export interface OtherApp {
  id: string;
  name: string;
  owner: string;
  icon: string;
  /** Repositório no GitHub */
  url: string;
  /** Onde o app roda (o "abrir" leva para cá) */
  appUrl: string;
  description: string;
  details: [label: string, value: string][];
}

export const OTHER_APPS: OtherApp[] = [
  {
    id: 'audiobook-player',
    name: 'Audiobook Player',
    owner: 'thenauan',
    icon: '/apps/audiobook-player.svg',
    url: 'https://github.com/thenauan/audiobook-player',
    appUrl: 'https://thenauan.github.io/audiobook-player/',
    description: 'Reprodutor de audiobooks gratuito com capítulos, texto sincronizado, marcações, fila, timer de sono e coleções.',
    details: [
      ['Plataformas', 'Web/PWA, Windows, macOS, Linux'],
      ['Idiomas', 'PT, EN, ES, RU, AR'],
      ['Licença', 'MIT'],
    ],
  },
];

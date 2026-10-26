// ===== Dados de exemplo exibidos antes do primeiro uso =====
import { HistoryItem } from '../app/types';
import { getGenericBookCover } from '../lib/covers';

// Histórico padrão de pesquisas e audiobooks
export const DEFAULT_RECENT_SEARCHES: string[] = [
  'A Arte da Guerra',
  'Dom Casmurro',
  'Machado de Assis',
  'O Pequeno Príncipe'
];

export const DEFAULT_AUDIOBOOKS: HistoryItem[] = [
  {
    id: 'default-audiobook-1',
    title: 'Dom Casmurro',
    author: 'Machado de Assis',
    genre: 'Literatura Brasileira',
    subgenre: 'Realismo',
    narrator: 'Antônio',
    language: 'Português (Brasil)',
    year: '1899',
    date: '15/10/2026',
    status: 'success',
    duration: '06h 45m',
    durationEst: '06h 45m',
    size: '95 Mb',
    sizeStr: '95 Mb',
    format: 'MP3',
    path: 'public/samples/pt-BR-AntonioNeural.mp3',
    coverColor: '#F97316',
    cover: getGenericBookCover('Dom Casmurro', 'Machado de Assis', '#F97316'),
    description: 'Um clássico absoluto da literatura brasileira, onde Bentinho narra suas memórias e a dúvida perpétua sobre a traição de Capitu.',
    chapters: [
      { id: 'c1', title: 'Capítulo 1: Do título', duration: '05:12' },
      { id: 'c2', title: 'Capítulo 2: Do livro', duration: '07:30' },
      { id: 'c3', title: 'Capítulo 3: A denúncia', duration: '12:45' }
    ],
    hasTranscript: true,
    transcriptFileName: 'dom_casmurro.lrc'
  },
  {
    id: 'default-audiobook-2',
    title: 'O Pequeno Príncipe',
    author: 'Antoine de Saint-Exupéry',
    genre: 'Fábula',
    subgenre: 'Filosofia',
    narrator: 'Francisca',
    language: 'Português (Brasil)',
    year: '1943',
    date: '14/10/2026',
    status: 'success',
    duration: '02h 15m',
    durationEst: '02h 15m',
    size: '32 Mb',
    sizeStr: '32 Mb',
    format: 'MP3',
    path: 'public/samples/pt-BR-FranciscaNeural.mp3',
    coverColor: '#38BDF8',
    cover: getGenericBookCover('O Pequeno Príncipe', 'Antoine de Saint-Exupéry', '#38BDF8'),
    description: 'A jornada poética de um pequeno príncipe através de vários planetas, abordando temas universais como amor, amizade e perda.',
    chapters: [
      { id: 'c1', title: 'Capítulo 1: O desenho da jiboia', duration: '06:20' },
      { id: 'c2', title: 'Capítulo 2: No deserto', duration: '08:15' }
    ],
    hasTranscript: true,
    transcriptFileName: 'pequeno_principe.lrc'
  },
  {
    id: 'default-audiobook-3',
    title: 'A Arte da Guerra',
    author: 'Sun Tzu',
    genre: 'Filosofia e Estratégia',
    subgenre: 'Militar',
    narrator: 'Antônio',
    language: 'Português (Brasil)',
    year: '500 a.C.',
    date: '12/10/2026',
    status: 'success',
    duration: '03h 10m',
    durationEst: '03h 10m',
    size: '45 Mb',
    sizeStr: '45 Mb',
    format: 'MP3',
    path: 'public/samples/pt-BR-AntonioNeural.mp3',
    coverColor: '#10B981',
    cover: getGenericBookCover('A Arte da Guerra', 'Sun Tzu', '#10B981'),
    description: 'Tratado militar milenar cujos princípios de estratégia e liderança são aplicados até hoje nos mais diversos âmbitos da vida.',
    chapters: [
      { id: 'c1', title: 'Capítulo 1: Avaliações preliminares', duration: '14:20' },
      { id: 'c2', title: 'Capítulo 2: As operações de guerra', duration: '16:05' }
    ],
    hasTranscript: false
  }
];

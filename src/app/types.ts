// ===== Tipos de dados do app =====
import type { AudioFormat } from './audioFormats';
import React from 'react';

// Tipos Principais
export type ScreenId = 
  | 'converter' 
  | 'search' 
  | 'history' 
  | 'history-audiobooks' 
  | 'history-texts' 
  | 'edit-audiobook'
  | 'edit-text'
  | 'other-apps' 
  | 'help' 
  | 'help-topic' 
  | 'settings' 
  | 'settings-interface' 
  | 'settings-conversion' 
  | 'settings-storage' 
  | 'settings-data' 
  | 'settings-about';

export type Phase = 0 | 1 | 2 | 3;

export interface ChapterItem {
  id: string;
  title: string;
  duration?: number | string;
  snippet?: string;
  content?: string;
}

export interface AppFile {
  id: string;
  /** Caracteres do texto do livro (para as estimativas) */
  charCount?: number;
  filename?: string;
  name?: string;
  title: string;
  author: string;
  genre?: string;
  subgenre?: string;
  narrator?: string;
  language?: string;
  year?: string;
  voice?: string;
  sizeStr?: string;
  size?: string | number;
  durationEst?: string;
  processingTimeEst?: string;
  status: 'idle' | 'translating' | 'editing' | 'processing' | 'syncing' | 'success' | 'error';
  progress: number;
  translationProgress?: number;
  editingProgress?: number;
  isTranslating?: boolean;
  isEditing?: boolean;
  requiresTranslation?: boolean;
  /** Idioma (código de duas letras) para o qual o livro é traduzido antes de narrar */
  translateTo?: string;
  partsTotal?: number;
  /** O que está sendo contado na etapa atual ("partes narradas", "capítulos com volume ajustado"...) */
  partsUnit?: string;
  /** Velocidade real de download do áudio da narração (bytes por segundo) */
  speedBps?: number;
  /** Etapa atual da conversão depois da narração (volume dos capítulos, montagem do arquivo) */
  stageMessage?: string;
  partsDone?: number;
  fileObj?: File;
  errorMessage?: string;
  /** Detalhes técnicos do erro (etapa, código, mensagens do sistema), para copiar ou mostrar a quem ajuda */
  errorDetails?: string;
  syncMessage?: string;
  cover?: string;
  customCover?: string;
  coverColor?: string;
  /** Capa de onde a cor foi lida (para ler de novo só quando a capa muda) */
  coverColorFrom?: string;
  /** Cor escolhida pelo usuário na edição: não é trocada pela cor da capa */
  coverColorUser?: boolean;
  audioSizeEst?: string;
  metadataStatus?: 'loading' | 'loaded' | 'error';
  phaseStartTime?: number;
  generatedPaths?: string[];
  generateSyncText?: boolean;
  fileType?: AudioFormat;
  isLanguageSelected?: boolean;
  isSyncTextSelected?: boolean;
  description?: string;
  chapters?: ChapterItem[];
  pronunciationMap?: { original: string; replacement: string }[];
}

export interface HistoryItem {
  id: string;
  title: string;
  author: string;
  genre?: string;
  subgenre?: string;
  narrator?: string;
  language?: string;
  year?: string;
  date: string;
  status: 'success' | 'error';
  cover?: string;
  customCover?: string;
  coverColor?: string;
  path?: string;
  duration?: string;
  durationEst?: string;
  size?: string;
  sizeStr?: string;
  format?: string;
  description?: string;
  chapters?: ChapterItem[];
  hasTranscript?: boolean;
  /** Todos os arquivos que a conversão gerou (áudio, pasta de capítulos, texto), para excluir do computador */
  files?: string[];
  transcriptFileName?: string;
  pronunciationMap?: { original: string; replacement: string }[];
}

export interface GeneratedTextItem {
  id: string;
  title: string;
  author?: string;
  genre: string;
  tone: string;
  content: string;
  date: string;
  wordCount: number;
  cover?: string;
  coverColor?: string;
  /** Arquivos do texto na pasta da biblioteca (.lrc, .srt, .sync.json), para excluir do computador */
  files?: string[];
}

export type SortOption = 'name-asc' | 'name-desc' | 'year-desc' | 'year-asc' | 'duration-desc' | 'duration-asc';
export type StatusFilter = 'all' | 'success' | 'error';

export interface SettingSelectorOption {
  value: any;
  label: string;
  description?: string;
  colorPreview?: string;
  icon?: React.ReactNode;
  isCustomInput?: boolean;
  /** Texto curto à direita (ex.: o idioma escolhido numa segunda página) */
  hint?: string;
  /** Título de seção mostrado antes da primeira opção do grupo */
  section?: string;
  /** Marca a opção como selecionada mesmo sem ser o currentValue */
  selected?: boolean;
  /** Abre uma segunda página dentro do mesmo pop-up, com botão de voltar */
  subpage?: SettingSelectorSubpage;
  /** Voz com amostra: mostra, ao passar o mouse, um botão para ouvir */
  sampleCode?: string;
}

export interface SettingSelectorSubpage {
  title: string;
  currentValue: any;
  options: SettingSelectorOption[];
  onSelect: (val: any) => void;
  inputPlaceholder?: string;
}

export interface ActiveSettingSelector {
  id: string;
  triggerEl: HTMLElement | null;
  title: string;
  /** Pop-ups dos Ajustes: só a lista, sem título (o botão já diz o que é) */
  hideTitle?: boolean;
  /** Mostra a descrição de cada opção como legenda, em cinza, abaixo do nome */
  captions?: boolean;
  subtitle?: string;
  currentValue: any;
  options?: SettingSelectorOption[];
  onSelect: (val: any) => void;
  mode?: 'select' | 'input';
  inputPlaceholder?: string;
  initialInputValue?: string;
  allowCustomInput?: boolean;
  /** Várias escolhas: cada clique marca ou desmarca e o pop-up fica aberto; o valor é a lista separada por vírgula */
  multi?: boolean;
}

export interface NavGroupItem<T> {
  id: string;
  title: string;
  navLabel: string;
  items: T[];
}

// Onde o texto sincronizado de um audiobook é guardado
export type SyncTextDestination = 'metadata' | 'library' | 'both';
/** Como o texto sincronizado é dividido: por frases, por palavras ou os dois */
export type SyncTextGranularity = 'sentences' | 'words' | 'both';

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
  partsTotal?: number;
  partsDone?: number;
  fileObj?: File;
  errorMessage?: string;
  syncMessage?: string;
  cover?: string;
  customCover?: string;
  coverColor?: string;
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
}

export type SortOption = 'name-asc' | 'name-desc' | 'year-desc' | 'year-asc' | 'duration-desc' | 'duration-asc';
export type StatusFilter = 'all' | 'success' | 'error';

export interface ActiveSettingSelector {
  id: string;
  triggerEl: HTMLElement | null;
  title: string;
  /** Pop-ups dos Ajustes: só a lista, sem título (o botão já diz o que é) */
  hideTitle?: boolean;
  subtitle?: string;
  currentValue: any;
  options?: { value: any; label: string; description?: string; colorPreview?: string; icon?: React.ReactNode; isCustomInput?: boolean }[];
  onSelect: (val: any) => void;
  mode?: 'select' | 'input';
  inputPlaceholder?: string;
  initialInputValue?: string;
  allowCustomInput?: boolean;
}

export interface NavGroupItem<T> {
  id: string;
  title: string;
  navLabel: string;
  items: T[];
}

// Onde o texto sincronizado de um audiobook é guardado
export type SyncTextDestination = 'metadata' | 'library' | 'both';

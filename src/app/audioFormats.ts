// ===== Formatos e qualidade dos audiobooks gerados =====
// Os valores são os mesmos que o conversor (audio_output.py) entende. A voz vem do Edge TTS em MP3
// 24 kHz a 96 kbps; o capítulo é guardado sem perda e o arquivo final é codificado uma única vez.

export type AudioFormat = 'm4b' | 'single' | 'opus' | 'flac' | 'wav' | 'multiple';
export type AudioQuality = 'standard' | 'high' | 'max';

export interface AudioFormatInfo {
  value: AudioFormat;
  label: string;        // nome completo (menus e ajustes)
  short: string;        // rótulo curto (etiquetas dos cards)
  description: string;
  lossless?: boolean;
}

export const AUDIO_FORMATS: AudioFormatInfo[] = [
  { value: 'm4b', label: 'Audiobook .m4b (AAC)', short: 'M4B', description: 'Um arquivo com capítulos e capa, ideal para apps de audiobook' },
  { value: 'single', label: 'Arquivo único .mp3', short: 'MP3', description: 'Compatível com qualquer player, com capítulos e capa' },
  { value: 'opus', label: 'Arquivo único .opus', short: 'Opus', description: 'Melhor qualidade por tamanho, com capítulos e capa' },
  { value: 'flac', label: 'Arquivo único .flac', short: 'FLAC', description: 'Sem perda de qualidade, com capítulos e capa (arquivo maior)', lossless: true },
  { value: 'wav', label: 'Arquivo único .wav', short: 'WAV', description: 'Sem compressão, para edição (sem capítulos nem capa)', lossless: true },
  { value: 'multiple', label: 'Um .mp3 por capítulo', short: 'Capítulos', description: 'Faixas separadas, organizadas numa pasta' },
];

export const AUDIO_QUALITIES: { value: AudioQuality; label: string; description: string }[] = [
  { value: 'standard', label: 'Padrão', description: 'Arquivos menores (MP3 128k, AAC 96k, Opus 48k)' },
  { value: 'high', label: 'Alta', description: 'Equilíbrio (MP3 192k, AAC 128k, Opus 64k)' },
  { value: 'max', label: 'Máxima', description: 'Sem perdas audíveis (MP3 320k, AAC 256k, Opus 128k)' },
];

export const isAudioFormat = (v: unknown): v is AudioFormat => AUDIO_FORMATS.some(f => f.value === v);
export const audioFormatInfo = (v?: string | null) => AUDIO_FORMATS.find(f => f.value === v) || AUDIO_FORMATS[0];
export const audioQualityLabel = (v?: string | null) => AUDIO_QUALITIES.find(q => q.value === v)?.label || 'Alta';

// Formato a partir da extensão de um arquivo já gerado (edição de audiobooks do histórico)
export function audioFormatFromPath(path?: string | null): AudioFormat {
  const ext = (path || '').split('.').pop()?.toLowerCase();
  if (ext === 'm4b' || ext === 'm4a') return 'm4b';
  if (ext === 'opus' || ext === 'ogg') return 'opus';
  if (ext === 'flac') return 'flac';
  if (ext === 'wav') return 'wav';
  return 'single';
}

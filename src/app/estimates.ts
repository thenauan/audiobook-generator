// ===== Estimativas de uma conversão (duração, tamanho e tempo) =====
// Calculadas a partir do número de caracteres do livro, do formato e da qualidade escolhidos.
import type { AudioFormat, AudioQuality } from './audioFormats';

// Velocidade média das vozes neurais (~15 caracteres por segundo de fala)
const CHARS_POR_MINUTO = 900;
// Taxa média de cada formato (kbps); FLAC/WAV guardam a voz de 24 kHz sem perda
const KBPS: Record<AudioFormat, Record<AudioQuality, number>> = {
  single: { voice: 96, standard: 128, high: 192, max: 320 },
  multiple: { voice: 96, standard: 128, high: 192, max: 320 },
  m4b: { voice: 64, standard: 96, high: 128, max: 256 },
  opus: { voice: 40, standard: 48, high: 64, max: 128 },
  flac: { voice: 210, standard: 210, high: 210, max: 210 },
  wav: { voice: 384, standard: 384, high: 384, max: 384 },
};

export interface ConversionEstimate {
  minutes: number;
  sizeMB: number;
  seconds: number;
  durationLabel: string;
  sizeLabel: string;
  timeLabel: string;
}

export function formatDuration(minutes: number): string {
  if (minutes <= 0) return '—';
  if (minutes < 1) return 'menos de 1 minuto';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m} ${m === 1 ? 'minuto' : 'minutos'}`;
  if (m === 0) return `${h} ${h === 1 ? 'hora' : 'horas'}`;
  return `${h} ${h === 1 ? 'hora' : 'horas'} e ${m} min`;
}

export function formatSize(mb: number): string {
  if (mb <= 0) return '—';
  if (mb < 1) return `${Math.max(0.1, mb).toFixed(1)} MB`;
  if (mb < 1024) return `${Math.round(mb)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

export function formatWait(seconds: number): string {
  if (seconds <= 0) return '—';
  if (seconds < 60) return `${Math.max(10, Math.round(seconds / 5) * 5)} segundos`;
  const min = Math.round(seconds / 60);
  if (min < 60) return `cerca de ${min} ${min === 1 ? 'minuto' : 'minutos'}`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `cerca de ${h} h${m ? ` ${m} min` : ''}`;
}

export function estimateConversion(chars: number, format: AudioFormat, quality: AudioQuality, translate = false): ConversionEstimate {
  const minutes = chars > 0 ? chars / CHARS_POR_MINUTO : 0;
  const kbps = (KBPS[format] || KBPS.single)[quality] || 96;
  const sizeMB = (minutes * 60 * kbps) / 8 / 1000;
  // Síntese em paralelo (~1.000 caracteres/s, medido com 10 conexões) + normalização e codificação (~0,5 s por minuto de áudio)
  const seconds = chars > 0 ? chars / 1000 + minutes * 0.5 + (translate ? chars / 4000 : 0) + 15 : 0;
  return {
    minutes,
    sizeMB,
    seconds,
    durationLabel: formatDuration(minutes),
    sizeLabel: formatSize(sizeMB),
    timeLabel: formatWait(seconds),
  };
}

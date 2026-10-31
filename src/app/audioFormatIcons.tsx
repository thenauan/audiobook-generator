// Ícones dos formatos e níveis de qualidade (usados em todos os menus que listam essas opções)
import React from 'react';
import { AudioWaveform, Gem, Disc3, Layers, SignalLow, SignalMedium, SignalHigh, HelpCircle, Mic } from 'lucide-react';
import { LuBookAudio, LuFileAudio } from 'react-icons/lu';
import type { AudioFormat, AudioQuality } from './audioFormats';

export function audioFormatIcon(format: AudioFormat | 'ask', size = 14, className = 'shrink-0'): React.ReactNode {
  switch (format) {
    case 'm4b': return <LuBookAudio size={size} className={className} />;
    case 'single': return <LuFileAudio size={size} className={className} />;
    case 'opus': return <AudioWaveform size={size} className={className} />;
    case 'flac': return <Gem size={size} className={className} />;
    case 'wav': return <Disc3 size={size} className={className} />;
    case 'multiple': return <Layers size={size} className={className} />;
    default: return <HelpCircle size={size} className={className} />;
  }
}

export function audioQualityIcon(quality: AudioQuality, size = 14, className = 'shrink-0'): React.ReactNode {
  if (quality === 'voice') return <Mic size={size} className={className} />;
  if (quality === 'standard') return <SignalLow size={size} className={className} />;
  if (quality === 'high') return <SignalMedium size={size} className={className} />;
  return <SignalHigh size={size} className={className} />;
}

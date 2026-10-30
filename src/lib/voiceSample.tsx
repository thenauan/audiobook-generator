// ===== Amostras de voz (public/samples/{voz}.mp3) =====
// O estado "qual amostra está tocando" fica aqui, fora do estado do app: tocar ou parar uma amostra redesenha
// só o botão dela (antes redesenhava o app inteiro e fazia o pop-up e o card de trás tremerem).
import React, { useSyncExternalStore } from 'react';
import { Howl } from 'howler';
import { Play, Pause } from 'lucide-react';

let tocando: string | null = null;
let som: Howl | null = null;
const ouvintes = new Set<() => void>();
const avisar = () => ouvintes.forEach(o => o());

function definir(code: string | null) {
  tocando = code;
  avisar();
}

export function toggleVoiceSample(e: React.MouseEvent | null, code: string) {
  e?.stopPropagation();
  e?.preventDefault();
  const eraEsta = tocando === code;
  try { som?.unload(); } catch { /* já parado */ }
  som = null;
  if (eraEsta) return definir(null);
  const novo = new Howl({
    src: [`/samples/${code}.mp3`],
    html5: true,
    onend: () => { if (som === novo) { som = null; definir(null); } },
    onloaderror: () => { if (som === novo) { som = null; definir(null); } },
    onplayerror: () => { if (som === novo) { som = null; definir(null); } },
  });
  som = novo;
  novo.play();
  definir(code);
}

export function usePlayingVoice(): string | null {
  return useSyncExternalStore(cb => { ouvintes.add(cb); return () => { ouvintes.delete(cb); }; }, () => tocando, () => tocando);
}

/** Botão de ouvir a amostra: branco/cinza (não usa a cor de destaque), também enquanto toca */
export function VoiceSampleButton({ code, size = 'sm', alwaysVisible = false }: { code: string; size?: 'sm' | 'md'; alwaysVisible?: boolean }) {
  const ativo = usePlayingVoice() === code;
  const dim = size === 'md' ? 'w-7 h-7' : 'w-6 h-6';
  const icone = size === 'md' ? 12 : 11;
  return (
    <span
      role="button"
      tabIndex={-1}
      title={ativo ? 'Parar amostra' : 'Ouvir amostra'}
      aria-label={ativo ? 'Parar amostra' : 'Ouvir amostra'}
      onClick={(e) => toggleVoiceSample(e, code)}
      className={`${dim} rounded-full flex items-center justify-center shrink-0 cursor-pointer border transition-[opacity,background-color,border-color] text-[var(--text-main)] ${
        ativo
          ? 'opacity-100 bg-white/20 border-white/35'
          : `${alwaysVisible ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} bg-card/80 border-[var(--text-main)]/15 hover:bg-white/20 hover:border-white/35`
      }`}
    >
      {ativo ? <Pause size={icone} fill="currentColor" /> : <Play size={icone} fill="currentColor" className="ml-px" />}
    </span>
  );
}

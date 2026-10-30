// ===== Tela: settings-about =====
import { motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { Info, Cpu, RefreshCw } from 'lucide-react';
import { transicaoConteudo } from '../navigation/transitions';
import { APP_VERSION } from '../app/screens';
import { useApp } from '../app/AppContext';

export function SettingsAboutScreen() {
  const { navigateTo, showToast } = useApp();

  // Estado do motor de conversão
  type Health = { python: string | null; edgeTts: boolean; ffmpeg: boolean; whisper: boolean };
  const [health, setHealth] = useState<Health | 'checking' | 'offline'>('checking');
  const checkEngine = useCallback(async () => {
    setHealth('checking');
    try {
      const res = await fetch('/api/health');
      setHealth(res.ok ? await res.json() : 'offline');
    } catch {
      setHealth('offline');
    }
  }, []);
  useEffect(() => { checkEngine(); }, [checkEngine]);

  let engineLabel = 'Verificando…';
  let engineDetail = 'Python, vozes neurais (Edge TTS) e FFmpeg';
  let engineTone = 'bg-card/75 border-[var(--text-main)]/10 text-[var(--text-muted)]';
  if (health === 'offline') {
    engineLabel = 'Sem resposta';
    engineDetail = 'O serviço local não respondeu. Feche e abra o app.';
    engineTone = 'bg-red-500/15 border-red-500/30 text-red-500';
  } else if (health !== 'checking') {
    const faltando = [
      !health.python && 'Python',
      !health.edgeTts && 'vozes (edge-tts)',
      !health.ffmpeg && 'FFmpeg',
    ].filter(Boolean) as string[];
    if (faltando.length === 0) {
      engineLabel = 'Pronto';
      engineDetail = `Python ${health.python} · vozes neurais · FFmpeg${health.whisper ? ' · alinhamento de texto' : ''}`;
      engineTone = 'bg-emerald-500/15 border-emerald-500/30 text-emerald-500';
    } else {
      engineLabel = 'Incompleto';
      engineDetail = `Falta: ${faltando.join(', ')}. Rode o instalador de novo para corrigir.`;
      engineTone = 'bg-amber-500/15 border-amber-500/30 text-amber-500';
    }
  }
  return (
    <motion.div
      key="screen-settings-about"
      variants={transicaoConteudo}
      initial="escondido"
      animate="visivel"
      exit="saindo"
      className="w-full flex flex-col"
    >
      <div className="mb-12 max-md:mb-6">
        <h1 className="text-4xl md:text-5xl font-semibold text-[var(--text-main)] tracking-tight">Sistema e sobre</h1>
      </div>

      <div className="space-y-2.5">
        {/* Versão */}
        <div className="settings-list-row py-3 sm:py-3.5 px-4 sm:px-5 rounded-[32px] bg-card/60 backdrop-blur-xl border border-[var(--text-main)]/10 transition-colors flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-winblue/10 text-winblue flex items-center justify-center shrink-0">
              <Info size={20} />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-base text-[var(--text-main)]">Audiobook Generator</span>
              <span className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">Conversor de e-books em audiobooks com vozes neurais</span>
            </div>
          </div>
          <div className="h-8 px-4 rounded-full bg-winblue/15 text-winblue text-xs font-bold flex items-center justify-center">
            v{APP_VERSION}
          </div>
        </div>

        {/* Motor de conversão: verificado de verdade (Python, voz, FFmpeg e alinhamento) */}
        <div className="settings-list-row py-3 sm:py-3.5 px-4 sm:px-5 rounded-[32px] bg-card/60 backdrop-blur-xl border border-[var(--text-main)]/10 transition-colors flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-10 h-10 rounded-full bg-winblue/10 text-winblue flex items-center justify-center shrink-0">
              <Cpu size={20} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-base text-[var(--text-main)]">Motor de conversão</span>
              <span className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">{engineDetail}</span>
            </div>
          </div>
          <motion.button
            type="button"
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={checkEngine}
            title="Verificar de novo"
            className={`h-8 px-4 rounded-full text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer border transition-[background-color,box-shadow] ${engineTone}`}
          >
            <span>{engineLabel}</span>
            <RefreshCw size={13} className={`shrink-0 ${health === 'checking' ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>

      </div>
    </motion.div>
  );
}

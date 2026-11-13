// ===== Tela: settings-about =====
import { motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { Info, Cpu, RefreshCw, Download, RotateCw, Sparkles, Loader2, ExternalLink, Feather } from 'lucide-react';
import { transicaoConteudo } from '../navigation/transitions';
import { APP_VERSION } from '../app/screens';
import { useApp } from '../app/AppContext';
import { SettingToggle } from '../components/cards/SettingToggle';
import { useSystemInfo } from '../lib/systemInfo';

// Novidades da versão (texto do GitHub Releases) em lista simples: títulos, itens e parágrafos
const SECOES: Record<string, string> = {
  added: 'Adicionado', changed: 'Alterado', fixed: 'Corrigido', removed: 'Removido',
  deprecated: 'Descontinuado', security: 'Segurança', improved: 'Melhorado', performance: 'Desempenho',
};
function Novidades({ texto }: { texto: string }) {
  const corte = texto.search(/^##\s*⚙️/m);
  const linhas = (corte >= 0 ? texto.slice(0, corte) : texto).split(/\r?\n/)
    .filter(l => l.trim() && !/^#\s/.test(l.trim()) && !/^-{3,}$/.test(l.trim()));
  const limpar = (s: string) => s.replace(/\*\*|`/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim();
  return (
    <div className="text-sm text-[var(--text-main)] space-y-1.5">
      {linhas.map((l, i) => {
        const t = l.trim();
        if (/^#{2,}\s/.test(t)) {
          const titulo = limpar(t.replace(/^#+\s*/, ''));
          // Títulos padrão do changelog (em inglês no GitHub) no idioma do app; a camada de tradução leva aos outros
          return <p key={i} className="pt-2 first:pt-0 text-xs font-semibold text-[var(--text-muted)]">{SECOES[titulo.toLowerCase()] || titulo}</p>;
        }
        if (/^[-*]\s/.test(t)) return <p key={i} className={`flex gap-2 ${/^\s{2,}/.test(l) ? 'pl-4' : ''}`}><span className="text-winblue shrink-0">•</span><span>{limpar(t.slice(2))}</span></p>;
        return <p key={i} className="text-[var(--text-muted)]">{limpar(t)}</p>;
      })}
    </div>
  );
}

export function SettingsAboutScreen() {
  const computador = useSystemInfo();
  const { navigateTo, showToast, liteMode, setLiteMode, autoUpdate, setAutoUpdate, updateInfo, updateStatus, updateError, checkForUpdates, installUpdate, restartToUpdate } = useApp();

  // Atualizações: texto e botão conforme a etapa
  const etapa = updateStatus.stage;
  const pct = `${Math.round((updateStatus.progress || 0) * 100)}%`;
  const ocupado = etapa === 'checking' || etapa === 'downloading' || etapa === 'installing' || etapa === 'deps' || etapa === 'restarting';
  let updateDetail = updateInfo ? `Você está na versão mais recente (${updateInfo.current})` : 'Procure uma versão nova no GitHub';
  if (updateError) updateDetail = updateError;
  if (updateInfo?.available) {
    updateDetail = `Nova versão ${updateInfo.latest} disponível (você tem a ${updateInfo.current})`;
    if (updateInfo.devFolder && !updateInfo.simulated) updateDetail += ' · pasta de desenvolvimento: atualize com git pull';
  }
  if (etapa === 'checking') updateDetail = 'Procurando atualizações…';
  if (etapa === 'downloading') updateDetail = `Baixando a versão ${updateStatus.version || ''}… ${pct}`;
  if (etapa === 'installing') updateDetail = `Instalando a versão ${updateStatus.version || ''}… ${pct}`;
  if (etapa === 'deps') updateDetail = 'Instalando os componentes novos…';
  if (etapa === 'ready') updateDetail = `Versão ${updateStatus.version || ''} instalada: reinicie para usar`;
  if (etapa === 'restarting') updateDetail = 'Reiniciando…';
  if (etapa === 'error') updateDetail = `A atualização falhou: ${updateStatus.message || 'erro desconhecido'}`;
  const updateButton = etapa === 'ready'
    ? { label: 'Reiniciar', icon: <RotateCw size={13} />, onClick: restartToUpdate, tone: 'bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25' }
    : updateInfo?.available && (etapa === 'idle' || etapa === 'error')
      ? { label: 'Baixar e instalar', icon: <Download size={13} />, onClick: installUpdate, tone: 'bg-winblue/15 text-winblue hover:bg-winblue/25' }
      : {
          label: ocupado ? (etapa === 'checking' ? 'Procurando' : etapa === 'restarting' ? 'Reiniciando' : pct) : 'Procurar',
          icon: ocupado ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />,
          onClick: () => { if (!ocupado) checkForUpdates(true); },
          tone: 'bg-card/75 text-[var(--text-main)] hover:bg-[var(--hover-fill)]',
        };

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
  let engineTone = 'bg-card/75 text-[var(--text-muted)] hover:bg-[var(--hover-fill)]';
  if (health === 'offline') {
    engineLabel = 'Sem resposta';
    engineDetail = 'O serviço local não respondeu. Feche e abra o app.';
    engineTone = 'bg-red-500/15 text-red-500 hover:bg-red-500/25';
  } else if (health !== 'checking') {
    const faltando = [
      !health.python && 'Python',
      !health.edgeTts && 'vozes (edge-tts)',
      !health.ffmpeg && 'FFmpeg',
    ].filter(Boolean) as string[];
    if (faltando.length === 0) {
      engineLabel = 'Pronto';
      engineDetail = `Python ${health.python} · vozes neurais · FFmpeg${health.whisper ? ' · alinhamento de texto' : ''}`;
      engineTone = 'bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25';
    } else {
      engineLabel = 'Incompleto';
      engineDetail = `Falta: ${faltando.join(', ')}. Rode o instalador de novo para corrigir.`;
      engineTone = 'bg-amber-500/15 text-amber-500 hover:bg-amber-500/25';
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
        <div className="settings-list-row py-3 sm:py-3.5 px-4 sm:px-5 rounded-[32px] bg-card/60 backdrop-blur-xl transition-colors flex items-center justify-between gap-4">
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

        {/* Atualizar automaticamente */}
        <div className="settings-list-row py-3 sm:py-3.5 px-4 sm:px-5 rounded-[32px] bg-card/60 backdrop-blur-xl transition-colors flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-winblue/10 text-winblue flex items-center justify-center shrink-0">
              <Download size={20} />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-base text-[var(--text-main)]">Atualizar automaticamente</span>
              <span className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">Baixa e instala as versões novas do GitHub sozinho; você só reinicia o app</span>
            </div>
          </div>
          <SettingToggle
            checked={autoUpdate}
            onChange={(v) => { setAutoUpdate(v); showToast(v ? 'Atualizações automáticas ligadas' : 'Atualizações automáticas desligadas'); }}
            enabledLabel="Ligado"
            disabledLabel="Desligado"
          />
        </div>

        {/* Atualizações: procurar, baixar e instalar, reiniciar */}
        <div className="settings-list-row py-3 sm:py-3.5 px-4 sm:px-5 rounded-[32px] bg-card/60 backdrop-blur-xl transition-colors">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-10 h-10 rounded-full bg-winblue/10 text-winblue flex items-center justify-center shrink-0">
                <RefreshCw size={20} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-base text-[var(--text-main)]">Atualizações</span>
                <span className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5 select-text">{updateDetail}</span>
              </div>
            </div>
            <motion.button
              type="button"
              onClick={updateButton.onClick}
              data-hover-grow className={`h-8 px-4 rounded-full backdrop-blur-3xl shadow-sm text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer transition-[background-color,box-shadow] [&_svg]:text-inherit ${updateButton.tone}`}
            >
              {updateButton.icon}
              <span>{updateButton.label}</span>
            </motion.button>
          </div>
          {(etapa === 'downloading' || etapa === 'installing') && (
            <div className="mt-3 ml-14 h-1.5 rounded-full bg-[var(--text-main)]/10 overflow-hidden">
              <div className="h-full bg-winblue rounded-full transition-[width] duration-300" style={{ width: pct }} />
            </div>
          )}
          {updateInfo?.available && updateInfo.notes && (
            <div className="mt-3 ml-14 p-4 rounded-[24px] bg-[var(--text-main)]/[0.04] max-h-72 overflow-y-auto select-text">
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="flex items-center gap-1.5 text-sm font-semibold text-[var(--text-main)]"><Sparkles size={15} className="text-winblue" /> Novidades da versão {updateInfo.latest}</span>
                {updateInfo.url && (
                  <a href={updateInfo.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-semibold text-winblue hover:underline shrink-0">
                    GitHub <ExternalLink size={12} />
                  </a>
                )}
              </div>
              <Novidades texto={updateInfo.notes} />
            </div>
          )}
        </div>

        {/* Modo leve */}
        <div className="settings-list-row py-3 sm:py-3.5 px-4 sm:px-5 rounded-[32px] bg-card/60 backdrop-blur-xl transition-colors flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-winblue/10 text-winblue flex items-center justify-center shrink-0">
              <Feather size={20} />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-base text-[var(--text-main)]">Modo leve</span>
                {computador?.weak && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500">Recomendado para este computador</span>}
              </div>
              {computador && (
                <span className="text-xs sm:text-sm text-[var(--text-main)]/80 mt-0.5">
                  Este computador: {computador.summary}{computador.weak ? ` (${computador.reasons.join(', ')})` : ''}
                </span>
              )}
              <span className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">Para computadores mais fracos. Na interface: sem desfoque, fundos parados e pop-ups opacos. Na conversão: um livro por vez, menos conexões de voz e prioridade mínima (mais lenta, mas o computador fica livre). Desligado, a conversão se adapta sozinha ao computador e à internet</span>
            </div>
          </div>
          <SettingToggle checked={liteMode} onChange={setLiteMode} enabledLabel="Ligado" disabledLabel="Desligado" />
        </div>

        {/* Motor de conversão: verificado de verdade (Python, voz, FFmpeg e alinhamento) */}
        <div className="settings-list-row py-3 sm:py-3.5 px-4 sm:px-5 rounded-[32px] bg-card/60 backdrop-blur-xl transition-colors flex items-center justify-between gap-4">
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
            onClick={checkEngine}
            title="Verificar de novo"
            data-hover-grow className={`h-8 px-4 rounded-full backdrop-blur-3xl shadow-sm text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer transition-[background-color,box-shadow] [&_svg]:text-inherit ${engineTone}`}
          >
            <span>{engineLabel}</span>
            <RefreshCw size={13} className={`shrink-0 ${health === 'checking' ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>

      </div>
    </motion.div>
  );
}

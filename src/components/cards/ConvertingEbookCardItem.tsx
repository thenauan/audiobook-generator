import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, Download, AlertCircle, RotateCcw, Layers, ChevronDown, Copy, Check } from 'lucide-react';
import { AppFile } from '../../app/types';
import { getCoverAmbientStyle, getCoverProgressStyle, getGenericBookCover } from '../../lib/covers';
import { CoverAmbientBackground } from './CoverAmbientBackground';
import { CARD_ANIMATE, CARD_EXIT, CONVERTING_INITIAL, cardTransition, ebookLayoutId } from './cardMotion';

export interface ConvertingEbookCardItemProps {
  file: AppFile;
  accentColor: string;
  resolvedTheme: 'light' | 'dark';
  onCancel: (triggerEl: HTMLElement) => void;
  onRetry?: (file: AppFile) => void;
}

const ConvertingEbookCardItemBase: React.FC<ConvertingEbookCardItemProps> = ({
  file,
  accentColor,
  resolvedTheme,
  onCancel,
  onRetry,
}) => {
  const isError = file.status === 'error';
  const coverUrl = file.customCover || file.cover || getGenericBookCover(file.title || 'Desconhecido', file.author || 'Desconhecido', file.coverColor);
  const ambientStyle = getCoverAmbientStyle(accentColor, resolvedTheme === 'dark', isError);
  const progressStyle = getCoverProgressStyle(accentColor, resolvedTheme === 'dark');

  const getStatusText = () => {
    if (file.status === 'idle') return 'Aguardando na fila...';
    if (file.status === 'success' || file.progress >= 100) return 'Audiobook gerado com sucesso!';
    const etapa = file.stageMessage || (file.status === 'translating' ? 'Traduzindo o texto' : file.status === 'syncing' ? 'Gerando o texto sincronizado' : 'Gerando o audiobook');
    return `${etapa.replace(/\s*\(\d+%\)/, '').replace(/[.…]+$/, '')}...`;
  };

  // Tempo restante pelo ritmo real da conversão: guarda o progresso ao longo do tempo e combina o ritmo do
  // último minuto (reage a etapas mais rápidas ou lentas) com o ritmo médio (estável). No começo, sem dados,
  // usa a estimativa inicial. O número é suavizado e desce de segundo em segundo entre as atualizações.
  const amostras = React.useRef<{ t: number; p: number }[]>([]);
  const restanteSuave = React.useRef<number | null>(null);
  const [, setTique] = React.useState(0);
  const ativo = file.status !== 'idle' && file.status !== 'success' && file.status !== 'error' && (file.progress || 0) < 100;

  React.useEffect(() => {
    if (!ativo) return;
    const lista = amostras.current;
    const agora = Date.now();
    const p = file.progress || 0;
    if (lista.length === 0 || p !== lista[lista.length - 1].p) lista.push({ t: agora, p });
    while (lista.length > 2 && agora - lista[1].t > 120000) lista.shift(); // janela de ~2 minutos (mais o ponto inicial)
  }, [file.progress, ativo]);

  // Uma vez por segundo: recalcula pelo ritmo e suaviza (fora da renderização, para não contar em dobro)
  const calcularRef = React.useRef<() => number | null>(() => null);
  React.useEffect(() => {
    if (!ativo) return;
    const passo = () => {
      const calculado = calcularRef.current();
      const anterior = restanteSuave.current;
      if (calculado != null) {
        // Entre atualizações o tempo desce 1 s por segundo; uma estimativa nova puxa aos poucos
        restanteSuave.current = anterior == null ? calculado : Math.max(0, anterior - 1) * 0.8 + calculado * 0.2;
      } else if (anterior != null) {
        restanteSuave.current = Math.max(0, anterior - 1);
      }
      setTique(n => n + 1);
    };
    passo();
    const id = setInterval(passo, 1000);
    return () => clearInterval(id);
  }, [ativo]);

  const estimativaInicialSeg = (() => {
    const str = file.processingTimeEst || '';
    let total = 0;
    const h = str.match(/(\d+)\s*h/i), m = str.match(/(\d+)\s*m(?:in)?/i), sg = str.match(/(\d+)\s*s/i);
    if (h) total += parseInt(h[1], 10) * 3600;
    if (m) total += parseInt(m[1], 10) * 60;
    if (sg) total += parseInt(sg[1], 10);
    return total > 0 ? total : null;
  })();

  const calcularRestante = (): number | null => {
    const lista = amostras.current;
    const p = file.progress || 0;
    const agora = Date.now();
    if (lista.length < 2) return estimativaInicialSeg != null ? estimativaInicialSeg * (100 - p) / 100 : null;
    const primeiro = lista[0];
    const decorrido = (agora - primeiro.t) / 1000;
    const ganhoTotal = p - primeiro.p;
    // Ritmo recente: do ponto de ~60 s atrás até agora
    const ref = [...lista].reverse().find(a => agora - a.t >= 60000) || primeiro;
    const ritmoRecente = (p - ref.p) / Math.max(1, (agora - ref.t) / 1000);
    const ritmoMedio = ganhoTotal / Math.max(1, decorrido);
    if (ganhoTotal < 0.5 || decorrido < 8) {
      return estimativaInicialSeg != null ? estimativaInicialSeg * (100 - p) / 100 : null;
    }
    const ritmo = ritmoRecente > 0 ? ritmoRecente * 0.6 + ritmoMedio * 0.4 : ritmoMedio;
    return ritmo > 0 ? (100 - p) / ritmo : null;
  };

  calcularRef.current = calcularRestante;

  const getTimeRemainingStr = () => {
    if (file.status === 'success' || file.progress >= 100) return 'Concluído';
    if (file.status === 'idle') return 'Aguardando fila...';
    const suave = restanteSuave.current;
    if (suave == null) return 'Calculando tempo...';
    const seg = Math.max(1, Math.round(suave));
    if (seg >= 3600) return `${Math.floor(seg / 3600)}h ${Math.round((seg % 3600) / 60)}m restante(s)`;
    if (seg >= 60) return `${Math.floor(seg / 60)}m ${String(seg % 60).padStart(2, '0')}s restante(s)`;
    return `${seg}s restante(s)`;
  };

  // Contagem da etapa atual (partes narradas, capítulos com volume ajustado, capítulos no M4B...)
  const partsLabel = file.partsTotal ? `${file.partsDone ?? 0}/${file.partsTotal} ${file.partsUnit || 'partes'}` : null;

  // Velocidade real de download do áudio, medida pelo conversor (fora da narração fica em 0)
  const getSpeedStr = () => {
    const bps = file.status === 'processing' ? (file.speedBps || 0) : 0;
    if (bps >= 1024 * 1024) return `${(bps / 1024 / 1024).toFixed(1)} MB/s`;
    return `${Math.round(bps / 1024)} KB/s`;
  };

  const currentProg = Math.round(file.progress || 0);

  return (
    <motion.div
      layout="position"
      layoutId={ebookLayoutId(file.id)}
      initial={CONVERTING_INITIAL}
      animate={CARD_ANIMATE}
      exit={CARD_EXIT}
      transition={cardTransition()}
      style={{ borderColor: ambientStyle.borderColor }}
      className={`p-5 sm:p-6 rounded-3xl backdrop-blur-3xl border ${isError ? 'border-red-500/50' : ''} relative isolate overflow-hidden group transition-[border-color,box-shadow,background-color] w-full select-none`}
    >
      {/* Fundo animado com os tons da capa (efeito do player em tela cheia) */}
      <CoverAmbientBackground color={accentColor} cover={coverUrl} isDark={resolvedTheme === 'dark'} />

      <div className="flex flex-row items-stretch gap-5 sm:gap-6 w-full">
        {/* Capa com proporção de livro e cantos arredondados, tamanho adequado à altura reduzida */}
        <div className="relative w-20 h-28 sm:w-24 sm:h-32 rounded-2xl overflow-hidden shrink-0 shadow-lg border border-white/10 bg-black/10 dark:bg-white/5">
          <img 
            src={coverUrl} 
            alt={file.title || 'Capa do Audiobook'} 
            className="w-full h-full object-cover" 
          />
        </div>

        {/* Coluna de Conteúdo */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          {/* Topo: Título, Autor e Botões de Ação no canto superior direito */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 pr-2">
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--text-main)] truncate tracking-tight">
                {file.title || 'Sem título'}
              </h3>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] font-medium truncate mt-0.5">
                {file.author || 'Autor desconhecido'}
              </p>
            </div>

            {/* Ações no canto superior direito: Tentar Novamente (quando der erro) e Cancelar/Excluir */}
            <div className="flex items-center gap-2 shrink-0">
              {isError && (
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRetry?.(file);
                  }}
                  className="h-8 px-3.5 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/15 text-[var(--text-main)] hover:text-white hover:bg-white/20 hover:border-white/35 hover:shadow-[0_0_14px_rgba(255,255,255,0.35)] flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer shadow-sm [&_svg]:text-inherit"
                  title="Tentar novamente"
                >
                  <RotateCcw size={13} />
                  <span>Tentar novamente</span>
                </motion.button>
              )}

              {/* Botão de Cancelamento / Excluir Circular */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.92 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel(e.currentTarget);
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-card/75 border border-red-500/25 text-red-500 hover:bg-red-500/20 hover:border-red-500/40 hover:shadow-[0_0_14px_rgba(239,68,68,0.4)] transition-all cursor-pointer shadow-sm shrink-0"
                title={isError ? "Remover" : "Cancelar geração"}
              >
                <X size={15} />
              </motion.button>
            </div>
          </div>

          {/* Área Inferior: Se der erro, a barra com suas informações some e surge a mensagem de erro */}
          {isError ? (
            <ErrorPanel message={file.errorMessage || 'Falha na conversão deste audiobook. Verifique o arquivo e tente novamente.'} details={file.errorDetails} />
          ) : (
            <div className="w-full min-w-0 mt-3">
              {/* Linha de Textos e Estatísticas */}
              <div className="flex flex-wrap sm:flex-nowrap items-baseline justify-between gap-x-4 gap-y-1 text-xs mb-2">
                <span className="text-[11px] sm:text-xs text-[var(--text-muted)] font-medium truncate">
                  {getStatusText()}
                </span>

                <div className="flex items-center gap-3 sm:gap-4 shrink-0 text-[11px] sm:text-xs text-[var(--text-muted)] font-medium">
                  {/* Tempo com ícone à esquerda */}
                  <div className="flex items-center gap-1.5" title="Tempo restante estimado">
                    <Clock size={12} className="opacity-80 shrink-0 text-inherit" />
                    <span>{getTimeRemainingStr()}</span>
                  </div>

                  {/* Contagem da etapa atual, com ícone à esquerda */}
                  {partsLabel && (
                    <div className="flex items-center gap-1.5" title="Andamento da etapa atual">
                      <Layers size={12} className="opacity-80 shrink-0 text-inherit" />
                      <span>{partsLabel}</span>
                    </div>
                  )}

                  {/* Download / Velocidade com ícone à esquerda */}
                  <div className="flex items-center gap-1.5" title="Velocidade de processamento">
                    <Download size={12} className="opacity-80 shrink-0 text-inherit" />
                    <span>{getSpeedStr()}</span>
                  </div>

                  {/* Porcentagem Maior e em Negrito */}
                  <span className="text-sm sm:text-base md:text-lg font-black text-[var(--text-main)] tracking-tight ml-1">
                    {currentProg}%
                  </span>
                </div>
              </div>

              {/* Barra de Progressão na mesma cor do destaque com tonalidade diferente e leve brilho */}
              <div 
                className="h-3 sm:h-3.5 w-full rounded-full overflow-hidden p-0.5 border border-black/5 dark:border-white/10"
                style={{ background: progressStyle.trackBg }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(2, Math.min(100, currentProg))}%`,
                    background: progressStyle.barFill,
                    boxShadow: progressStyle.barShadow
                  }}
                  transition={{ ease: "easeOut", duration: 0.35 }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};


// Erro da conversão: mensagem inteira (sem cortar) e detalhes técnicos; tudo pode ser selecionado e copiado
function ErrorPanel({ message, details }: { message: string; details?: string }) {
  const [open, setOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(details ? `${message}

${details}` : message).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }).catch(() => {});
  };
  const btn = "h-7 px-3 rounded-full bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500/20 hover:border-red-400/45 hover:shadow-[0_0_12px_rgba(239,68,68,0.25)] text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 [&_svg]:text-inherit";
  return (
    <div className="w-full min-w-0 mt-3 px-3.5 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 shadow-sm">
      <div className="flex items-start gap-2.5">
        <AlertCircle size={16} className="shrink-0 text-red-500 mt-0.5" />
        <p className="flex-1 min-w-0 text-xs sm:text-sm font-semibold leading-relaxed break-words select-text cursor-text">{message}</p>
      </div>
      <div className="flex items-center gap-2 mt-2.5 pl-[26px]">
        {details && (
          <motion.button type="button" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setOpen(o => !o)} className={btn} aria-expanded={open}>
            <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
            <span>{open ? 'Ocultar detalhes' : 'Ver detalhes'}</span>
          </motion.button>
        )}
        <motion.button type="button" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={copy} className={btn}>
          {copied ? <Check size={13} /> : <Copy size={13} />}
          <span>{copied ? 'Copiado' : 'Copiar erro'}</span>
        </motion.button>
      </div>
      <AnimatePresence initial={false}>
        {open && details && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 38 }}
            className="overflow-hidden"
          >
            <pre className="mt-2.5 ml-[26px] max-h-64 overflow-auto custom-scrollbar rounded-xl bg-black/20 dark:bg-black/30 p-3 text-[11px] leading-relaxed font-mono text-[var(--text-main)]/85 whitespace-pre-wrap break-words select-text cursor-text">{details}</pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Só redesenha quando o próprio livro (ou a cor/tema) muda: o progresso de um livro não redesenha os outros
export const ConvertingEbookCardItem = React.memo(ConvertingEbookCardItemBase, (a, b) =>
  a.file === b.file && a.accentColor === b.accentColor && a.resolvedTheme === b.resolvedTheme);

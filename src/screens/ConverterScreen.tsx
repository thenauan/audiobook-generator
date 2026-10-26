import React, { useEffect, useMemo, useRef, useState } from 'react';
// ===== Tela: converter =====
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import { CheckCircle2, FolderOpen, Headphones, Trash2, Play, Pause, RotateCcw, X } from 'lucide-react';
import { LuUpload } from 'react-icons/lu';
import { transicaoConteudo } from '../navigation/transitions';
import { getGenericBookCover, getGenericCoverColor } from '../lib/covers';
import { EbookCardItem } from '../components/cards/EbookCardItem';
import { ConvertingEbookCardItem } from '../components/cards/ConvertingEbookCardItem';
import { useApp } from '../app/AppContext';
import { AmbientOrbs } from '../components/AmbientOrbs';

// Fundo da área de arrastar: vai do topo da tela até a base, com 16 px de margem nos quatro lados
// (o mesmo recuo do menu lateral). O título e o conteúdo da área ficam por cima.
// A tela começa em (topo do cabeçalho + 60 px) e o conteúdo tem 32 px de margem lateral, daí os recuos.
const DROPZONE_BG_BOX: React.CSSProperties = {
  top: 'calc(16px - var(--app-header-top) - 60px)',
  bottom: 0,
  left: -16,
  right: -16,
};
// Bordas: somem até a cor de fundo da interface. A máscara é um retângulo de cantos bem arredondados,
// desfocado, desenhado no tamanho exato da área (assim os cantos do degradê também ficam redondos).
const FADE_INSET = 104;  // recuo do retângulo (≥ 3× o desfoque, para o degradê chegar a zero na borda)
const FADE_BLUR = 34;    // desfoque (largura da transição)
const FADE_RADIUS = 140; // raio dos cantos
function roundedFadeMask(w: number, h: number): React.CSSProperties {
  if (w <= 0 || h <= 0) return {};
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`
    + `<filter id="f" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${FADE_BLUR}"/></filter>`
    + `<rect x="${FADE_INSET}" y="${FADE_INSET}" width="${Math.max(0, w - FADE_INSET * 2)}" height="${Math.max(0, h - FADE_INSET * 2)}" rx="${FADE_RADIUS}" fill="#fff" filter="url(#f)"/></svg>`;
  const url = `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
  return { maskImage: url, WebkitMaskImage: url, maskSize: '100% 100%', WebkitMaskSize: '100% 100%', maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat' };
}

export function ConverterScreen() {
  const { accentColor, resolvedTheme, t, showToast, playingSnippet, toggleSnippet, phase, setPhase, files, setFiles, fileInputRef, coverColorsMap, outputFolder, fileTypeOption, selectedVoice, setSelectedVoice, setShowCancelModal, cancelModalAnchor, setCancelModalAnchor, setEditingCoverFileId, coverFileInputRef, handleOpenMetadataModal, activeSettingSelector, setActiveSettingSelector, handleFileUpload, handleRetryFile, availableVoices } = useApp();
  // Sem e-books: a área de arrastar ocupa todo o conteúdo, alinhando a base com a do menu lateral (16 px da borda)
  const showDropzone = phase === 0 || (phase === 1 && files.length === 0);
  const [dropHover, setDropHover] = useState(false);
  // Tamanho do fundo da área de arrastar, para desenhar a máscara de cantos arredondados
  const dropBgRef = useRef<HTMLDivElement>(null);
  const [dropBgSize, setDropBgSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = dropBgRef.current;
    if (!el) return;
    const update = () => setDropBgSize({ w: Math.round(el.offsetWidth), h: Math.round(el.offsetHeight) });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [showDropzone]);
  const dropFade = useMemo(() => roundedFadeMask(dropBgSize.w, dropBgSize.h), [dropBgSize.w, dropBgSize.h]);
  return (
    <motion.div
      key="screen-converter"
      variants={transicaoConteudo}
      initial="escondido"
      animate="visivel"
      exit="saindo"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          const evt = { target: { files: e.dataTransfer.files } } as any;
          handleFileUpload(evt);
        }
      }}
      className={`w-full flex flex-col ${showDropzone ? 'relative isolate min-h-[calc(100dvh-var(--app-header-top)-76px)] -mb-8' : ''}`}
    >
      {/* Fundo das cores do ícone em movimento, atrás do título e da área de arrastar */}
      <AnimatePresence>
        {showDropzone && (
          <motion.div
            key="dropzone-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            aria-hidden="true"
            ref={dropBgRef}
            className="absolute -z-10 pointer-events-none"
            style={DROPZONE_BG_BOX}
          >
            <AmbientOrbs className={`z-0 transition-opacity duration-500 ${dropHover ? 'opacity-100' : 'opacity-85'}`} style={dropFade} />
          </motion.div>
        )}
      </AnimatePresence>
      {/* Título Principal */}
      <div className="mb-12 max-md:mb-6">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-[var(--text-main)]">
          {t.converter}
        </h1>
      </div>

      {/* FASE 0: DROPZONE INICIAL VAZIA */}
      {showDropzone && (
        <motion.div
          key="dropzone-empty"
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -12 }}
          transition={{ type: "spring", stiffness: 500, damping: 35, mass: 0.55 }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files) {
              const evt = { target: { files: e.dataTransfer.files } } as any;
              handleFileUpload(evt);
            }
          }}
          className="relative flex-1 min-h-[280px] p-12 md:p-16 flex flex-col items-center justify-center text-center cursor-pointer group"
          onClick={() => fileInputRef.current?.click()}
          onMouseEnter={() => setDropHover(true)}
          onMouseLeave={() => setDropHover(false)}
        >
          {/* A área não cresce: o ícone e o texto é que dão zoom ao passar o mouse (como nos cards da Ajuda) */}
          <div className="flex flex-col items-center transition-transform duration-500 ease-out group-hover:scale-[1.06]">
            <div className="text-winblue flex items-center justify-center mb-5 transition-transform duration-500 ease-out group-hover:scale-[1.15]">
              <LuUpload size={48} />
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-[var(--text-main)] mb-2.5">
              {t.dragDropText}
            </h3>
            <p className="text-sm text-[var(--text-main)]/75 max-w-md leading-relaxed mb-4">
              {t.dropzoneHint}
            </p>
            <span className="text-xs font-semibold tracking-wide text-winblue">
              {t.dropzoneFormats}
            </span>
          </div>
        </motion.div>
      )}

      <LayoutGroup id="converter-cards">
      {/* FASE 1: LISTA DE LIVROS CARREGADOS & METADADOS */}
      {phase === 1 && files.length > 0 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 w-full">
            <AnimatePresence mode="popLayout" initial={false}>
              {files.map((file, index) => {
                const coverUrl = file.customCover || file.cover || getGenericBookCover(file.title || 'Desconhecido', file.author || 'Desconhecido', file.coverColor);
                const accentColor = file.coverColor || coverColorsMap[file.id] || getGenericCoverColor(undefined, file.filename || file.title || 'Desconhecido');

                return (
                  <EbookCardItem
                    key={file.id}
                    file={file}
                    accentColor={accentColor}
                    resolvedTheme={resolvedTheme}
                    fileTypeOption={fileTypeOption}
                    availableVoices={availableVoices}
                    selectedVoice={selectedVoice}
                    setSelectedVoice={setSelectedVoice}
                    onUpdateFile={(updated) => {
                      setFiles(prev => prev.map(f => f.id === file.id ? { ...f, ...updated } : f));
                    }}
                    onRemoveFile={() => {
                      setFiles(prev => {
                        const next = prev.filter(f => f.id !== file.id);
                        if (next.length === 0) {
                          setTimeout(() => setPhase(0), 220);
                        }
                        return next;
                      });
                    }}
                    onOpenMetadataModal={() => handleOpenMetadataModal(file)}
                    onEditCover={() => {
                      setEditingCoverFileId(file.id);
                      coverFileInputRef.current?.click();
                    }}
                    activeSettingSelector={activeSettingSelector}
                    setActiveSettingSelector={setActiveSettingSelector}
                    showToast={showToast}
                    enterDelay={Math.min(index, 6) * 0.06}
                  />
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* FASE 2: PROCESSAMENTO E BARRAS DE PROGRESSO (MANTENDO O DESTAQUE INDIVIDUAL REDUZIDO) */}
      {phase === 2 && (() => {
        const convertingFiles = files.filter(f => f.status !== 'idle');
        const pendingFiles = files.filter(f => f.status === 'idle');

        return (
          <div className="space-y-10 w-full">
            {/* Seção 1: A converter (aparece acima de Convertendo) */}
            {pendingFiles.length > 0 && (
              <section className="w-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-[var(--text-main)]">
                    A converter
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-4 w-full">
                  <AnimatePresence mode="popLayout" initial={false}>
                    {pendingFiles.map((file, index) => {
                      const coverUrl = file.customCover || file.cover || getGenericBookCover(file.title || 'Desconhecido', file.author || 'Desconhecido', file.coverColor);
                      const accentColor = file.coverColor || coverColorsMap[file.id] || getGenericCoverColor(undefined, file.filename || file.title || 'Desconhecido');

                      return (
                        <EbookCardItem
                          key={file.id}
                          file={file}
                          accentColor={accentColor}
                          resolvedTheme={resolvedTheme}
                          fileTypeOption={fileTypeOption}
                          availableVoices={availableVoices}
                          selectedVoice={selectedVoice}
                          setSelectedVoice={setSelectedVoice}
                          onUpdateFile={(updated) => {
                            setFiles(prev => prev.map(f => f.id === file.id ? { ...f, ...updated } : f));
                          }}
                          onRemoveFile={() => {
                            setFiles(prev => {
                              const next = prev.filter(f => f.id !== file.id);
                              if (next.length === 0 && convertingFiles.length === 0) {
                                setTimeout(() => setPhase(0), 220);
                              }
                              return next;
                            });
                          }}
                          onOpenMetadataModal={() => handleOpenMetadataModal(file)}
                          onEditCover={() => {
                            setEditingCoverFileId(file.id);
                            coverFileInputRef.current?.click();
                          }}
                          activeSettingSelector={activeSettingSelector}
                          setActiveSettingSelector={setActiveSettingSelector}
                          showToast={showToast}
                          enterDelay={Math.min(index, 6) * 0.06}
                        />
                      );
                    })}
                  </AnimatePresence>
                </div>
              </section>
            )}

            {/* Seção 2: Convertendo */}
            {convertingFiles.length > 0 && (
              <section className="w-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-[var(--text-main)]">
                    Convertendo
                  </h3>

                  <motion.button
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.94 }}
                    animate={cancelModalAnchor ? { scale: 1.22, opacity: 0, pointerEvents: 'none' } : { scale: 1, opacity: 1, pointerEvents: 'auto' }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCancelModalAnchor(e.currentTarget);
                      setShowCancelModal(true);
                    }}
                    className="h-8 pl-3.5 pr-3 rounded-full bg-card/75 backdrop-blur-3xl border border-red-500/20 shadow-sm hover:bg-red-500/20 hover:border-red-400/40 hover:shadow-[0_0_12px_rgba(239,68,68,0.25)] text-red-500 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 [&_svg]:text-inherit"
                    title="Cancelar todas as conversões"
                  >
                    <span>Cancelar todos</span>
                    <X size={13} />
                  </motion.button>
                </div>

                <div className="space-y-4 w-full">
                  <AnimatePresence mode="popLayout" initial={false}>
                    {convertingFiles.map((file) => {
                      const coverUrl = file.customCover || file.cover || getGenericBookCover(file.title || 'Desconhecido', file.author || 'Desconhecido', file.coverColor);
                      const accentColor = file.coverColor || coverColorsMap[file.id] || getGenericCoverColor(undefined, file.filename || file.title || 'Desconhecido');

                      return (
                        <ConvertingEbookCardItem
                          key={file.id}
                          file={file}
                          accentColor={accentColor}
                          resolvedTheme={resolvedTheme}
                          onRetry={handleRetryFile}
                          onCancel={(triggerEl) => {
                            if (file.status === 'error') {
                              setFiles(prev => prev.filter(f => f.id !== file.id));
                              showToast(`"${file.title}" removido.`);
                            } else {
                              setCancelModalAnchor(triggerEl);
                              setShowCancelModal(true);
                            }
                          }}
                        />
                      );
                    })}
                  </AnimatePresence>
                </div>
              </section>
            )}
          </div>
        );
      })()}

      </LayoutGroup>

      {/* FASE 3: CONCLUSÃO E RESULTADOS */}
      {phase === 3 && (
        <div className="p-8 rounded-3xl bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 shadow-2xl w-full space-y-6 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 mx-auto flex items-center justify-center shadow-lg">
            <CheckCircle2 size={36} />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-[var(--text-main)]">{t.completedSuccess}</h3>
            <p className="text-xs text-[var(--text-muted)] mt-1">Os arquivos gerados já foram salvos na sua pasta de destino configurada.</p>
          </div>

          <div className="space-y-3 text-left">
            {files.map((file) => (
              <div key={file.id} className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-winblue/15 text-winblue flex items-center justify-center shrink-0">
                    <Headphones size={20} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-[var(--text-main)] truncate">{file.title}</h4>
                    <p className="text-xs text-[var(--text-muted)] truncate">{file.durationEst} • {file.audioSizeEst}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {file.generatedPaths && file.generatedPaths.length > 0 && (
                    <button
                      onClick={() => toggleSnippet(file.generatedPaths![0])}
                      className="h-8 px-3.5 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 text-xs font-semibold text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      {playingSnippet?.path === file.generatedPaths[0] ? (
                        <>
                          <Pause size={13} className="text-winblue" />
                          <span>{t.stopSnippet}</span>
                        </>
                      ) : (
                        <>
                          <Play size={13} className="text-winblue" />
                          <span>{t.playSnippet}</span>
                        </>
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      const target = file.generatedPaths && file.generatedPaths.length > 0 ? file.generatedPaths[0] : outputFolder;
                      fetch('/api/open-folder', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: target, isFile: true }) });
                    }}
                    className="h-8 px-3.5 rounded-full bg-card/75 border border-winblue/40 text-winblue text-xs font-semibold hover:bg-winblue/15 hover:border-winblue/60 hover:shadow-[0_0_12px_rgba(var(--winblue-rgb),0.3)] shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <FolderOpen size={13} />
                    <span>{t.openFolder}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 flex justify-center gap-3">
            <button
              onClick={() => {
                setFiles([]);
                setPhase(0);
              }}
              className="h-11 px-7 rounded-full bg-winblue/20 border border-winblue/45 shadow-xl backdrop-blur-3xl hover:bg-winblue/30 hover:border-winblue/75 hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.25),0_0_22px_rgba(var(--winblue-rgb),0.45)] text-winblue text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
            >
              <RotateCcw size={15} />
              <span>{t.newConversion}</span>
            </button>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".epub,.pdf,.mobi,.txt"
        className="hidden"
        onChange={handleFileUpload}
      />
    </motion.div>
  );
}

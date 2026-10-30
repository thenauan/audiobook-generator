import React, { useState, useRef, useEffect } from 'react';
import { AUDIO_FORMATS, audioFormatInfo, type AudioFormat } from '../../app/audioFormats';
import { audioFormatIcon } from '../../app/audioFormatIcons';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, X, CheckCircle2, Headphones, BookOpen, Check, Info, Sparkles, Globe, Lightbulb, Bookmark, Layers, Cpu, Edit3, Camera, Tag, User, Mic, Calendar, Heart, Flame, Zap, Brain, TrendingUp, Landmark, Compass, Trash2, RotateCcw, Clock, HardDrive } from 'lucide-react';
import { LuFileAudio } from 'react-icons/lu';
import { getButtonCoverPopupStyle, clearButtonCoverAnchorCache } from '../Popovers';
import { ActiveSettingSelector, AppFile } from '../../app/types';
import { getCoverAmbientStyle, getGenericBookCover, normalizeLanguageName } from '../../lib/covers';
import { CoverAmbientBackground } from './CoverAmbientBackground';
import { useApp } from '../../app/AppContext';
import { estimateConversion } from '../../app/estimates';
import { voicesFor, narrationLang, effectiveVoice, languageCode } from '../../data/voices';
import { LANGUAGES, languageByName, translationTargets, targetLanguageName, appLangCode } from '../../data/languages';
import { RiTranslateAi2 } from 'react-icons/ri';
import { GENRES, SUBGENRES, genreSelectorOptions, splitGenres, joinGenres } from '../../data/genres';
import { voiceOptions as buildVoiceOptions } from '../../data/voiceOptions';
import { CARD_ANIMATE, CARD_EXIT, CARD_INITIAL, cardTransition, ebookLayoutId } from './cardMotion';

export interface EbookCardItemProps {
  file: AppFile;
  accentColor: string;
  resolvedTheme: 'light' | 'dark';
  fileTypeOption: 'ask' | AudioFormat;
  availableVoices: { code: string; label: string; flag: string }[];
  selectedVoice: string;
  setSelectedVoice: (v: string) => void;
  onUpdateFile: (updated: Partial<AppFile>) => void;
  onRemoveFile: () => void;
  onOpenMetadataModal: () => void;
  onEditCover: () => void;
  activeSettingSelector: ActiveSettingSelector | null;
  setActiveSettingSelector: (s: ActiveSettingSelector | null) => void;
  showToast: (msg: string) => void;
  /** Atraso da animação de entrada (cascata quando vários e-books entram juntos) */
  enterDelay?: number;
}

export const EbookCardItem: React.FC<EbookCardItemProps> = ({
  file,
  accentColor,
  resolvedTheme,
  fileTypeOption,
  availableVoices,
  selectedVoice,
  setSelectedVoice,
  onUpdateFile,
  onRemoveFile,
  onOpenMetadataModal,
  onEditCover,
  activeSettingSelector,
  setActiveSettingSelector,
  showToast,
  enterDelay = 0
}) => {
  const isTitleMissing = !file.title || !file.title.trim();
  const isAuthorMissing = !file.author || !file.author.trim();
  const isError = isTitleMissing || isAuthorMissing;
  const coverUrl = file.customCover || file.cover || getGenericBookCover(file.title || 'Desconhecido', file.author || 'Desconhecido', file.coverColor);
  const ambientStyle = getCoverAmbientStyle(accentColor, resolvedTheme === 'dark', isError);

  const tagsScrollRef = useRef<HTMLDivElement>(null);
  const [expectationsAnchor, setExpectationsAnchor] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!expectationsAnchor) return;
    const handleScrollOrResize = () => {
      clearButtonCoverAnchorCache(expectationsAnchor);
      setExpectationsAnchor(null);
    };
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [expectationsAnchor]);

  // Rolagem suave e irrestrita via roda do mouse (wheel) para a barra de tags
  useEffect(() => {
    const el = tagsScrollRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  const isDraggingTags = useRef(false);
  const startX = useRef(0);
  const scrollLeftPos = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingTags.current = true;
    startX.current = e.pageX - (tagsScrollRef.current?.offsetLeft || 0);
    scrollLeftPos.current = tagsScrollRef.current?.scrollLeft || 0;
  };
  const handleMouseLeaveOrUp = () => {
    isDraggingTags.current = false;
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingTags.current || !tagsScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - (tagsScrollRef.current?.offsetLeft || 0);
    const walk = (x - startX.current) * 1.5;
    tagsScrollRef.current.scrollLeft = scrollLeftPos.current - walk;
  };

  const effectiveFileType: AudioFormat = file.fileType || (fileTypeOption === 'ask' ? 'm4b' : fileTypeOption);
  // Vozes do idioma narrado (o do livro, ou o da voz padrão se o livro for traduzido); idioma desconhecido: todas
  const voiceOptions = voicesFor(narrationLang(file, selectedVoice));
  const currentVoiceCode = effectiveVoice(file, selectedVoice);
  const currentVoiceObj = availableVoices.find(v => v.code === currentVoiceCode);

  // Estados de seleção das tags (por padrão ou pelo usuário)
  const isVoiceSelected = true;
  const isFileTypeSelected = true;
  const isGenreSelected = Boolean(file.genre && file.genre.trim());
  const isSubgenreSelected = Boolean(file.subgenre && file.subgenre.trim());
  const isLanguageSelected = Boolean(file.language && file.language.trim());
  const isNarratorSelected = Boolean(file.narrator && file.narrator.trim());
  const isSyncTextSelected = true;
  const isYearSelected = Boolean(file.year && file.year.trim());

  // Ícones das tags: branco se selecionado; cinza se não selecionado
  const getTagIconClass = (isSelected: boolean) => {
    if (!isSelected) {
      return 'text-neutral-400 dark:text-neutral-500';
    }
    return 'text-[var(--text-main)]';
  };

  // Texto das tags: normal se selecionado; cinza se não selecionado
  const getTagTextClass = (isSelected: boolean) => {
    if (!isSelected) {
      return 'text-neutral-400 dark:text-neutral-500 transition-colors';
    }
    return 'text-[var(--text-main)] transition-colors';
  };

  // Estimativas do pop-up de informações: calculadas pelo tamanho do texto, formato e qualidade escolhidos
  const { audioQuality, interfaceLang } = useApp();
  const estimate = estimateConversion(file.charCount || 0, effectiveFileType, audioQuality, Boolean(file.requiresTranslation));
  const carregando = file.metadataStatus === 'loading';
  const semDados = !file.charCount;
  const estimatedProcTime = carregando ? 'Calculando…' : semDados ? '—' : estimate.timeLabel;
  const estimatedAudioDuration = carregando ? 'Calculando…' : semDados ? '—' : estimate.durationLabel;
  const estimatedFileSize = carregando ? 'Calculando…' : semDados ? '—' : estimate.sizeLabel;

  return (
    <motion.div 
      layout="position"
      layoutId={ebookLayoutId(file.id)}
      initial={CARD_INITIAL}
      animate={CARD_ANIMATE}
      exit={CARD_EXIT}
      transition={cardTransition(enterDelay)}
      style={{ borderColor: ambientStyle.borderColor }}
      className={`p-5 sm:p-6 rounded-3xl backdrop-blur-3xl border ${isError ? 'border-red-500/50' : ''} relative isolate overflow-hidden group transition-[border-color,box-shadow,background-color] w-full`}
    >
      {/* Fundo animado com os tons da capa (efeito do player em tela cheia) */}
      <CoverAmbientBackground color={accentColor} cover={coverUrl} isDark={resolvedTheme === 'dark'} />

      {/* POP-UP MORPHING: INFORMAÇÕES DE CONVERSÃO */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {expectationsAnchor && (
            <>
              <div 
                className="fixed inset-0 z-[9990] cursor-default" 
                onClick={() => {
                  clearButtonCoverAnchorCache(expectationsAnchor);
                  setExpectationsAnchor(null);
                }} 
              />
              <motion.div
                key={`expectations-${file.id}`}
                initial={{ opacity: 0, scale: 0.22 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.22, transition: { duration: 0.12, ease: [0.32, 0, 0.67, 0] } }}
                transition={{
                  opacity: { duration: 0.12, ease: "easeOut" },
                  scale: { type: "spring", stiffness: 540, damping: 36, mass: 0.55 },
                }}
                style={getButtonCoverPopupStyle(expectationsAnchor, 320, 205, 'right')}
                onClick={(e) => e.stopPropagation()}
                className="w-80 bg-card/95 backdrop-blur-3xl border border-[var(--button-secondary-bg)] rounded-[24px] shadow-2xl p-2 z-[9999] flex flex-col text-left overflow-hidden text-[var(--text-main)] select-none"
              >
                {/* Título: mesmo estilo de Ordenar por (maiúsculas e minúsculas, sem linhas divisórias, sem botão de X) */}
                <div className="px-3 pt-2 pb-1.5">
                  <h3 className="text-xl font-bold text-[var(--text-main)]">Informações de conversão</h3>
                </div>

                <div className="space-y-0.5">
                  {[
                    { icon: <Clock size={14} />, label: 'Tempo estimado', value: estimatedProcTime },
                    { icon: <Headphones size={14} />, label: 'Duração do audiobook', value: estimatedAudioDuration },
                    { icon: <HardDrive size={14} />, label: 'Tamanho do arquivo', value: estimatedFileSize },
                    { icon: audioFormatIcon(effectiveFileType, 14), label: 'Formato do áudio', value: audioFormatInfo(effectiveFileType).label },
                  ].map(row => (
                    <div key={row.label} className="w-full flex items-center justify-between gap-3 px-3 py-2 text-xs font-semibold rounded-2xl">
                      <span className="flex items-center gap-2.5 text-[var(--text-muted)] min-w-0">
                        <span className="shrink-0 flex text-[var(--text-muted)] [&_svg]:text-inherit">{row.icon}</span>
                        <span className="truncate">{row.label}</span>
                      </span>
                      <span className="font-bold text-[var(--text-main)] text-right truncate">{row.value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Conteúdo Principal do Card */}
      <div className="flex flex-col lg:flex-row items-stretch gap-7 sm:gap-8 w-full">
        {/* Capa */}
        <div className="relative w-36 h-52 sm:w-40 sm:h-56 lg:w-[145px] lg:h-auto lg:self-stretch rounded-2xl overflow-hidden shrink-0 shadow-lg border border-white/10 group/cover self-center lg:self-auto bg-black/10 dark:bg-white/5 flex flex-col">
          <img 
            src={coverUrl} 
            alt={file.title} 
            className="w-full h-full object-cover transition-transform duration-300 group-hover/cover:scale-105" 
          />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/cover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1 text-center backdrop-blur-xs">
            <button
              type="button"
              onClick={onEditCover}
              className="px-2.5 py-1 rounded-full bg-white/20 hover:bg-white/35 backdrop-blur-md text-white text-[10px] font-bold border border-white/30 flex items-center gap-1 shadow-md transition-all cursor-pointer"
              title="Trocar Capa"
            >
              <Camera size={11} />
              <span>Alterar</span>
            </button>
            {(file.customCover || file.cover) && (
              <button
                type="button"
                onClick={() => {
                  onUpdateFile({ customCover: undefined, cover: undefined });
                  showToast("Capa alterada para genérica.");
                }}
                className="px-2 py-0.5 rounded-full bg-black/40 border border-white/20 hover:border-white/40 hover:bg-black/60 text-white/90 text-[9px] font-medium transition-all cursor-pointer inline-flex items-center gap-1.5"
                title="Usar Capa Genérica"
              >
                <RotateCcw size={13} className="shrink-0" />
                <span>Genérica</span>
              </button>
            )}
          </div>
        </div>

        {/* Coluna Central: Título, Autor e Outros */}
        <div className="flex-1 min-w-0 flex flex-col justify-between space-y-3">
          {/* Cabeçalho do card: ações (informações, editar e excluir) */}
          <div className="flex items-center justify-end gap-3">
            <div className="flex items-center gap-2 shrink-0">
              <motion.button
                type="button"
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.92 }}
                animate={expectationsAnchor ? { scale: 1.22, opacity: 0, pointerEvents: 'none' } : { scale: 1, opacity: 1, pointerEvents: 'auto' }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setExpectationsAnchor(e.currentTarget);
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-card/75 border border-[var(--text-main)]/15 text-[var(--text-main)] hover:bg-white/15 hover:border-white/30 hover:shadow-[0_0_14px_rgba(255,255,255,0.3)] transition-[background-color,border-color,box-shadow] cursor-pointer shadow-sm [&_svg]:text-inherit"
                title="Informações de conversão"
                aria-label="Informações de conversão"
              >
                <Info size={14} />
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.92 }}
                onClick={onOpenMetadataModal}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-card/75 border border-[var(--text-main)]/15 text-[var(--text-main)] hover:bg-white/15 hover:border-white/30 hover:shadow-[0_0_14px_rgba(255,255,255,0.3)] transition-[background-color,border-color,box-shadow] cursor-pointer shadow-sm [&_svg]:text-inherit"
                title="Editar todos os metadados"
                aria-label="Editar todos os metadados"
              >
                <Edit3 size={14} />
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.92 }}
                onClick={onRemoveFile}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-card/75 border border-red-500/25 text-red-500 hover:bg-red-500/20 hover:border-red-500/45 hover:shadow-[0_0_14px_rgba(239,68,68,0.35)] transition-[background-color,border-color,box-shadow] cursor-pointer shadow-sm [&_svg]:text-inherit"
                title="Excluir da lista"
                aria-label="Excluir da lista"
              >
                <Trash2 size={14} />
              </motion.button>
            </div>
          </div>

          {/* Título */}
          <div>
            <div className="flex items-center gap-1.5 mb-1 px-1">
              <span className="text-xs font-semibold text-[var(--text-muted)]">Título</span>
              {isTitleMissing && (
                <motion.span 
                  animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  className="text-[10px] font-bold text-red-500 inline-block"
                >
                  * Obrigatório
                </motion.span>
              )}
            </div>
            <motion.div 
              animate={isTitleMissing ? { 
                scale: [1, 1.02, 1], 
                borderColor: ['rgba(239, 68, 68, 0.45)', 'rgba(239, 68, 68, 0.95)', 'rgba(239, 68, 68, 0.45)'],
                boxShadow: ['0 0 0px rgba(239, 68, 68, 0)', '0 0 16px rgba(239, 68, 68, 0.35)', '0 0 0px rgba(239, 68, 68, 0)']
              } : { scale: 1 }}
              transition={isTitleMissing ? { repeat: Infinity, duration: 1.5, ease: "easeInOut" } : { duration: 0.2 }}
              className={`w-full rounded-full px-4 py-2 bg-black/5 dark:bg-white/5 border ${isTitleMissing ? 'border-red-500/80 bg-red-500/5' : 'border-[var(--text-main)]/10 hover:border-white/20 focus-within:border-winblue focus-within:bg-winblue/5 focus-within:shadow-[0_0_12px_rgba(var(--winblue-rgb),0.2)]'} transition-all flex items-center`}
            >
              <input 
                type="text" 
                value={file.title} 
                placeholder="Título da Obra (Obrigatório)"
                onChange={(e) => onUpdateFile({ title: e.target.value })}
                className="w-full bg-transparent outline-none text-xs sm:text-sm font-bold text-[var(--text-main)] placeholder:text-[var(--text-muted)]/50"
              />
            </motion.div>
          </div>

          {/* Autor */}
          <div>
            <div className="flex items-center gap-1.5 mb-1 px-1">
              <span className="text-xs font-semibold text-[var(--text-muted)]">Autor</span>
              {isAuthorMissing && (
                <motion.span 
                  animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  className="text-[10px] font-bold text-red-500 inline-block"
                >
                  * Obrigatório
                </motion.span>
              )}
            </div>
            <motion.div 
              animate={isAuthorMissing ? { 
                scale: [1, 1.02, 1], 
                borderColor: ['rgba(239, 68, 68, 0.45)', 'rgba(239, 68, 68, 0.95)', 'rgba(239, 68, 68, 0.45)'],
                boxShadow: ['0 0 0px rgba(239, 68, 68, 0)', '0 0 16px rgba(239, 68, 68, 0.35)', '0 0 0px rgba(239, 68, 68, 0)']
              } : { scale: 1 }}
              transition={isAuthorMissing ? { repeat: Infinity, duration: 1.5, ease: "easeInOut" } : { duration: 0.2 }}
              className={`w-full rounded-full px-4 py-2 bg-black/5 dark:bg-white/5 border ${isAuthorMissing ? 'border-red-500/80 bg-red-500/5' : 'border-[var(--text-main)]/10 hover:border-white/20 focus-within:border-winblue focus-within:bg-winblue/5 focus-within:shadow-[0_0_12px_rgba(var(--winblue-rgb),0.2)]'} transition-all flex items-center`}
            >
              <input 
                type="text" 
                value={file.author} 
                placeholder="Nome do Autor (Obrigatório)"
                onChange={(e) => onUpdateFile({ author: e.target.value })}
                className="w-full bg-transparent outline-none text-xs sm:text-sm font-semibold text-[var(--text-main)] placeholder:text-[var(--text-muted)]/50"
              />
            </motion.div>
          </div>

          {/* Outros */}
          <div className="w-full min-w-0">
            <div className="flex items-center justify-between mb-0.5 px-1">
              <span className="text-xs font-semibold text-[var(--text-muted)]">Outros</span>
            </div>
            <div className="flex items-center w-full min-w-0 -mt-1.5">
              <div 
                ref={tagsScrollRef}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeaveOrUp}
                onMouseUp={handleMouseLeaveOrUp}
                onMouseMove={handleMouseMove}
                className="flex items-center gap-2 overflow-x-auto py-1.5 px-0.5 no-scrollbar w-full min-w-0 scroll-smooth cursor-grab active:cursor-grabbing select-none"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {/* Tag Voz */}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  animate={activeSettingSelector?.id === `voice-${file.id}` ? { scale: 1.22, opacity: 0, pointerEvents: 'none' } : { scale: 1, opacity: 1, pointerEvents: 'auto' }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveSettingSelector({
                      id: `voice-${file.id}`,
                      triggerEl: e.currentTarget,
                      title: 'Voz da Narração',
                      currentValue: currentVoiceCode,
                      options: buildVoiceOptions(voiceOptions, appLangCode(interfaceLang)),
                      onSelect: (val) => {
                        onUpdateFile({ voice: val });
                        showToast("Voz definida para este livro.");
                      }
                    });
                  }}
                  className="group/tag h-8 px-3.5 rounded-full bg-black/5 dark:bg-white/5 border border-[var(--text-main)]/10 hover:border-neutral-400 dark:hover:border-white/40 hover:bg-neutral-200/80 dark:hover:bg-white/15 hover:shadow-[0_0_12px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_0_12px_rgba(255,255,255,0.25)] text-[11px] font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
                  title="Selecionar voz neural"
                >
                  <Headphones size={12} className={`${getTagIconClass(isVoiceSelected)} shrink-0 transition-colors`} />
                  <span className={getTagTextClass(isVoiceSelected)}>{currentVoiceObj ? `${currentVoiceObj.flag} Voz: ${currentVoiceObj.label.split(' - ')[1]?.split(' ')[0] || currentVoiceObj.label}` : 'Voz Neural'}</span>
                </motion.button>

                {/* Tag Divisão de Arquivo (ao lado da voz) */}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  animate={activeSettingSelector?.id === `filetype-${file.id}` ? { scale: 1.22, opacity: 0, pointerEvents: 'none' } : { scale: 1, opacity: 1, pointerEvents: 'auto' }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveSettingSelector({
                      id: `filetype-${file.id}`,
                      triggerEl: e.currentTarget,
                      title: 'Formato do Arquivo',
                      currentValue: effectiveFileType,
                      options: AUDIO_FORMATS.map(f => ({ value: f.value, label: f.label, description: f.description, icon: audioFormatIcon(f.value) })),
                      onSelect: (val) => {
                        onUpdateFile({ fileType: val });
                        showToast("Formato do arquivo atualizado!");
                      }
                    });
                  }}
                  className="group/tag h-8 px-3.5 rounded-full bg-black/5 dark:bg-white/5 border border-[var(--text-main)]/10 hover:border-neutral-400 dark:hover:border-white/40 hover:bg-neutral-200/80 dark:hover:bg-white/15 hover:shadow-[0_0_12px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_0_12px_rgba(255,255,255,0.25)] text-[11px] font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
                  title="Escolher o formato do arquivo"
                >
                  <span className={`${getTagIconClass(isFileTypeSelected)} shrink-0 transition-colors flex`}>{audioFormatIcon(effectiveFileType, 12)}</span>
                  <span className={getTagTextClass(isFileTypeSelected)}>{audioFormatInfo(effectiveFileType).short}</span>
                </motion.button>

                {/* Tag Gênero */}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  animate={activeSettingSelector?.id === `genre-${file.id}` ? { scale: 1.22, opacity: 0, pointerEvents: 'none' } : { scale: 1, opacity: 1, pointerEvents: 'auto' }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveSettingSelector({
                      id: `genre-${file.id}`,
                      triggerEl: e.currentTarget,
                      title: 'Gêneros',
                      currentValue: file.genre,
                      multi: true,
                      inputPlaceholder: 'Digite um ou mais, separados por vírgula...',
                      options: genreSelectorOptions(GENRES, 'Digitar outros gêneros...', <Edit3 size={13} />),
                      onSelect: (val) => onUpdateFile({ genre: joinGenres(splitGenres(val)) })
                    });
                  }}
                  className="group/tag h-8 px-3.5 rounded-full bg-black/5 dark:bg-white/5 border border-[var(--text-main)]/10 hover:border-neutral-400 dark:hover:border-white/40 hover:bg-neutral-200/80 dark:hover:bg-white/15 hover:shadow-[0_0_12px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_0_12px_rgba(255,255,255,0.25)] text-[11px] font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
                  title="Definir gênero"
                >
                  <Tag size={12} className={`${getTagIconClass(isGenreSelected)} shrink-0 transition-colors`} />
                  <span className={`${getTagTextClass(isGenreSelected)} max-w-[220px] truncate`} title={file.genre}>{isGenreSelected ? file.genre : '+ Gênero'}</span>
                </motion.button>

                {/* Tag Subgênero */}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  animate={activeSettingSelector?.id === `subgenre-${file.id}` ? { scale: 1.22, opacity: 0, pointerEvents: 'none' } : { scale: 1, opacity: 1, pointerEvents: 'auto' }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveSettingSelector({
                      id: `subgenre-${file.id}`,
                      triggerEl: e.currentTarget,
                      title: 'Subgêneros',
                      currentValue: file.subgenre,
                      multi: true,
                      inputPlaceholder: 'Digite um ou mais, separados por vírgula...',
                      options: genreSelectorOptions(SUBGENRES, 'Digitar outros subgêneros...', <Edit3 size={13} />),
                      onSelect: (val) => onUpdateFile({ subgenre: joinGenres(splitGenres(val)) })
                    });
                  }}
                  className="group/tag h-8 px-3.5 rounded-full bg-black/5 dark:bg-white/5 border border-[var(--text-main)]/10 hover:border-neutral-400 dark:hover:border-white/40 hover:bg-neutral-200/80 dark:hover:bg-white/15 hover:shadow-[0_0_12px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_0_12px_rgba(255,255,255,0.25)] text-[11px] font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
                  title="Definir subgênero"
                >
                  <Layers size={12} className={`${getTagIconClass(isSubgenreSelected)} shrink-0 transition-colors`} />
                  <span className={`${getTagTextClass(isSubgenreSelected)} max-w-[220px] truncate`} title={file.subgenre}>{isSubgenreSelected ? file.subgenre : '+ Subgênero'}</span>
                </motion.button>

                {/* Tag Idioma */}
                <motion.button
                  data-lang-tag={file.id}
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  animate={activeSettingSelector?.id === `lang-${file.id}` ? { scale: 1.22, opacity: 0, pointerEvents: 'none' } : { scale: 1, opacity: 1, pointerEvents: 'auto' }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    const currentLang = normalizeLanguageName(file.language);
                    const bookCode = languageCode(currentLang);
                    const detected = languageByName(currentLang);
                    const flag = (f?: string) => <span className="text-sm leading-none w-4 text-center">{f || '🌐'}</span>;
                    const targets = translationTargets(bookCode, interfaceLang);
                    const translating = Boolean(file.requiresTranslation && file.translateTo && file.translateTo !== bookCode);
                    setActiveSettingSelector({
                      id: `lang-${file.id}`,
                      triggerEl: e.currentTarget,
                      title: 'Idioma',
                      hideTitle: true,
                      currentValue: translating ? '__translate__' : currentLang,
                      options: [
                        // O idioma reconhecido: escolher volta a narrar no idioma original (sem traduzir)
                        { value: currentLang, label: currentLang, icon: flag(detected?.flag), hint: 'Original' },
                        {
                          value: '__fix__', label: 'Corrigir idioma', icon: <Edit3 size={13} />, selected: false,
                          subpage: {
                            title: 'Corrigir idioma',
                            currentValue: null,
                            inputPlaceholder: 'Digite o idioma (ex: Grego, Sueco)...',
                            options: [
                              ...LANGUAGES.filter(l => l.name !== currentLang).map(l => ({ value: l.name, label: l.name, icon: flag(l.flag), hint: l.native !== l.name ? l.native : undefined })),
                              { value: '__custom__', label: 'Digitar outro idioma...', icon: <Edit3 size={13} />, isCustomInput: true },
                            ],
                            onSelect: (val) => {
                              const name = normalizeLanguageName(val);
                              const code = languageCode(name);
                              // A tradução para o mesmo idioma do livro deixa de fazer sentido
                              const keepTranslation = file.requiresTranslation && file.translateTo && file.translateTo !== code;
                              onUpdateFile({ language: name, isLanguageSelected: true, ...(keepTranslation ? {} : { requiresTranslation: false, translateTo: undefined }) });
                            },
                          },
                        },
                        {
                          value: '__translate__', label: 'Traduzir para', icon: <RiTranslateAi2 size={14} />,
                          hint: translating ? targetLanguageName(file.translateTo) : undefined,
                          subpage: {
                            title: 'Traduzir para',
                            currentValue: translating ? file.translateTo : null,
                            options: targets.map(l => ({
                              value: l.code,
                              label: targetLanguageName(l.code),
                              icon: flag(l.flag),
                              hint: l.code === appLangCode(interfaceLang) ? 'Em uso' : l.native,
                            })),
                            onSelect: (code) => onUpdateFile({ requiresTranslation: true, translateTo: code }),
                          },
                        },
                      ],
                      onSelect: () => onUpdateFile({ requiresTranslation: false, translateTo: undefined, isLanguageSelected: true }),
                    });
                  }}
                  className="group/tag h-8 px-3.5 rounded-full bg-black/5 dark:bg-white/5 border border-[var(--text-main)]/10 hover:border-neutral-400 dark:hover:border-white/40 hover:bg-neutral-200/80 dark:hover:bg-white/15 hover:shadow-[0_0_12px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_0_12px_rgba(255,255,255,0.25)] text-[11px] font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
                  title="Idioma do livro e tradução"
                >
                  {file.requiresTranslation && file.translateTo && file.translateTo !== languageCode(normalizeLanguageName(file.language)) ? (
                    <>
                      <RiTranslateAi2 size={13} className={`${getTagIconClass(true)} shrink-0 transition-colors`} />
                      <span className={getTagTextClass(true)}>{normalizeLanguageName(file.language)} → {targetLanguageName(file.translateTo)}</span>
                    </>
                  ) : (
                    <>
                      <Globe size={12} className={`${getTagIconClass(isLanguageSelected)} shrink-0 transition-colors`} />
                      <span className={getTagTextClass(isLanguageSelected)}>Idioma: {normalizeLanguageName(file.language)}</span>
                    </>
                  )}
                </motion.button>

                {/* Tag Narrador */}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  animate={activeSettingSelector?.id === `narrator-${file.id}` ? { scale: 1.22, opacity: 0, pointerEvents: 'none' } : { scale: 1, opacity: 1, pointerEvents: 'auto' }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    const voiceDisplayName = currentVoiceObj 
                      ? (currentVoiceObj.label?.split(' - ')[1]?.split(' (')[0] ? `${currentVoiceObj.label.split(' - ')[1].split(' (')[0]} Neural` : currentVoiceObj.label)
                      : 'Francisca Neural';
                    setActiveSettingSelector({
                      id: `narrator-${file.id}`,
                      triggerEl: e.currentTarget,
                      title: 'Narrador do Audiobook',
                      currentValue: file.narrator,
                      inputPlaceholder: 'Digite o nome do narrador...',
                      options: [
                        { value: voiceDisplayName, label: `${voiceDisplayName} (Voz Selecionada)`, icon: <Mic size={13} /> },
                        { value: 'Voz Neural Padrão', label: 'Voz Neural Padrão', icon: <Headphones size={13} /> },
                        { value: file.author ? `${file.author} (Autor)` : 'Autor', label: 'O próprio Autor', icon: <User size={13} /> },
                        { value: 'Inteligência Artificial', label: 'Inteligência Artificial', icon: <Sparkles size={13} /> },
                        { value: '__custom__', label: 'Digitar nome do narrador...', icon: <Edit3 size={13} />, isCustomInput: true },
                      ],
                      onSelect: (val) => onUpdateFile({ narrator: val })
                    });
                  }}
                  className="group/tag h-8 px-3.5 rounded-full bg-black/5 dark:bg-white/5 border border-[var(--text-main)]/10 hover:border-neutral-400 dark:hover:border-white/40 hover:bg-neutral-200/80 dark:hover:bg-white/15 hover:shadow-[0_0_12px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_0_12px_rgba(255,255,255,0.25)] text-[11px] font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
                  title="Definir narrador"
                >
                  <Mic size={12} className={`${getTagIconClass(isNarratorSelected)} shrink-0 transition-colors`} />
                  <span className={getTagTextClass(isNarratorSelected)}>{isNarratorSelected ? `Narrador: ${file.narrator}` : '+ Narrador'}</span>
                </motion.button>

                {/* Tag Texto Sincronizado */}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  animate={activeSettingSelector?.id === `synctext-${file.id}` ? { scale: 1.22, opacity: 0, pointerEvents: 'none' } : { scale: 1, opacity: 1, pointerEvents: 'auto' }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveSettingSelector({
                      id: `synctext-${file.id}`,
                      triggerEl: e.currentTarget,
                      title: 'Texto Sincronizado',
                      currentValue: file.generateSyncText !== false,
                      options: [
                        { 
                          value: true, 
                          label: 'Sim (Gerar texto sincronizado)', 
                          icon: <Check size={14} className="shrink-0" />
                        },
                        { 
                          value: false, 
                          label: 'Não (Apenas áudio)', 
                          icon: <X size={14} className="shrink-0" />
                        },
                      ],
                      onSelect: (val) => onUpdateFile({ generateSyncText: val, isSyncTextSelected: true })
                    });
                  }}
                  className="group/tag h-8 px-3.5 rounded-full bg-black/5 dark:bg-white/5 border border-[var(--text-main)]/10 hover:border-neutral-400 dark:hover:border-white/40 hover:bg-neutral-200/80 dark:hover:bg-white/15 hover:shadow-[0_0_12px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_0_12px_rgba(255,255,255,0.25)] text-[11px] font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
                  title="Alternar geração de texto sincronizado"
                >
                  <FileText size={12} className={`${getTagIconClass(isSyncTextSelected)} shrink-0 transition-colors`} />
                  <span className={getTagTextClass(isSyncTextSelected)}>{file.generateSyncText !== false ? 'Texto Sinc: Sim' : 'Texto Sinc: Não'}</span>
                </motion.button>

                {/* Tag Ano */}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  animate={activeSettingSelector?.id === `year-${file.id}` ? { scale: 1.22, opacity: 0, pointerEvents: 'none' } : { scale: 1, opacity: 1, pointerEvents: 'auto' }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    const curY = new Date().getFullYear();
                    const yList = [curY.toString(), (curY - 1).toString(), (curY - 2).toString(), '2020', '2015', '2010', '2000', 'Clássico'];
                    setActiveSettingSelector({
                      id: `year-${file.id}`,
                      triggerEl: e.currentTarget,
                      title: 'Ano de Publicação',
                      currentValue: file.year,
                      inputPlaceholder: 'Digite o ano (ex: 2026, 1984)...',
                      options: [
                        ...yList.map(y => ({ 
                          value: y, 
                          label: y, 
                          icon: <Calendar size={13} /> 
                        })),
                        { 
                          value: '__custom__', 
                          label: 'Digitar outro ano...', 
                          icon: <Edit3 size={13} />, 
                          isCustomInput: true 
                        }
                      ],
                      onSelect: (val) => onUpdateFile({ year: val })
                    });
                  }}
                  className="group/tag h-8 px-3.5 rounded-full bg-black/5 dark:bg-white/5 border border-[var(--text-main)]/10 hover:border-neutral-400 dark:hover:border-white/40 hover:bg-neutral-200/80 dark:hover:bg-white/15 hover:shadow-[0_0_12px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_0_12px_rgba(255,255,255,0.25)] text-[11px] font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
                  title="Definir ano de publicação"
                >
                  <Calendar size={12} className={`${getTagIconClass(isYearSelected)} shrink-0 transition-colors`} />
                  <span className={getTagTextClass(isYearSelected)}>{isYearSelected ? `Ano: ${file.year}` : '+ Ano'}</span>
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

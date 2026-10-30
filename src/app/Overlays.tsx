// ===== Camadas globais: pop-ups, folhas, confirmações, aviso e entradas de arquivo =====
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AUDIO_FORMATS } from './audioFormats';
import { ConfirmPanel } from '../components/ConfirmPanel';
import { ConfirmItemList } from '../components/ConfirmItemList';
import { PopupBackHeader } from '../components/PopupBackHeader';
import { AnchoredPopup } from '../components/AnchoredPopup';
import { audioFormatIcon } from './audioFormatIcons';
import { X, CheckCircle2, Clock, ChevronRight, ChevronLeft, Check, Sparkles, ArrowDownAZ, ArrowUpZA, CalendarClock, Timer, Copy, Play, Pause, Calendar, Headphones, FileText, Edit3, Info, FolderOpen, Trash2, Loader2, Eye } from 'lucide-react';
import { LuBookAudio, LuFileAudio } from 'react-icons/lu';
import { RiTranslateAi2 } from 'react-icons/ri';
import { BsCheck2 } from 'react-icons/bs';
import ZoomTransitionLayer from '../components/ZoomTransitionLayer';
import { ListRow } from '../components/Blocks';
import { PopupMorphContainer, MenuOptionItem, getButtonCoverPopupStyle, clearButtonCoverAnchorCache } from '../components/Popovers';
import { SortOption } from './types';
import { getGenericBookCover, getGenericTextCover } from '../lib/covers';
import { useApp } from './AppContext';
import { splitGenres, joinGenres, toggleGenre } from '../data/genres';
import { voiceLang } from '../data/voices';
import { targetLanguageName } from '../data/languages';

export function Overlays() {
  const { files, showCancelModal, setShowCancelModal, cancelModalAnchor, setCancelModalAnchor, handleCancelProcessing, mainScrollRef, activeScreenKeyRef, navigateTo, t, toastMessage, showToast, playingSnippet, toggleSnippet, playingVoiceCode, toggleVoiceSample, setFiles, fileInputRef, defaultVoice, showTranslationModal, setShowTranslationModal, foreignLangFile, selectedVoice, setSelectedVoice, viewingTextModal, setViewingTextModal, coverFileInputRef, handleCoverUpload, activeSettingSelector, setActiveSettingSelector, selectorMode, setSelectorMode, selectorDirection, setSelectorDirection, selectorInputValue, setSelectorInputValue, sortBy, handleSelectSort, activeBookMenu, setActiveBookMenu, sortMenuAnchor, setSortMenuAnchor, handleStartEditBook, handleDeleteHistoryItem, handleFileUpload, proceedWithConversion, availableVoices, syncTextDestination, syncingBookIds, syncTextInputRef, handleGenerateBookText, handlePickBookTextFile, handleSyncTextFileChosen, activeTextMenu, setActiveTextMenu, handleStartEditText, handleDeleteGeneratedText, viewingTextAnchor, setViewingTextAnchor } = useApp();
  return (
    <>
      {/* POP-UP: SELETOR DE AJUSTES EMERGINDO DO BOTÃO (Seção 31 do DESIGN_SYSTEM.md) */}
      {/* POP-UP: SELETOR DE AJUSTES EMERGINDO DO BOTÃO (Seção 31 do DESIGN_SYSTEM.md) */}
      <AnimatePresence>
        {activeSettingSelector && (
          <>
            <div 
              className="fixed inset-0 z-[9998] cursor-default" 
              onClick={() => {
                if (activeSettingSelector.triggerEl) {
                  clearButtonCoverAnchorCache(activeSettingSelector.triggerEl);
                }
                setActiveSettingSelector(null);
              }} 
            />
            {(() => {
              const sel = activeSettingSelector;
              const close = () => {
                if (sel.triggerEl) clearButtonCoverAnchorCache(sel.triggerEl);
                setActiveSettingSelector(null);
              };
              // Páginas do pop-up: 'select' (lista), 'input' (digitar), 'sub:N' (segunda página da opção N)
              // e 'subinput:N' (digitar dentro da segunda página)
              const subMatch = /^sub(input)?:(\d+)$/.exec(selectorMode);
              const subpage = subMatch ? sel.options?.[Number(subMatch[2])]?.subpage : undefined;
              const subIndex = subMatch ? Number(subMatch[2]) : -1;
              const isInput = selectorMode === 'input' || Boolean(subMatch?.[1]);
              const page = subpage
                ? { title: subpage.title, options: subpage.options, currentValue: subpage.currentValue, onSelect: subpage.onSelect, placeholder: subpage.inputPlaceholder }
                : { title: sel.title, options: sel.options || [], currentValue: sel.currentValue, onSelect: sel.onSelect, placeholder: sel.inputPlaceholder };

              const longestLabelLength = Math.max(
                sel.hideTitle || subpage ? 0 : (page.title?.length || 0),
                ...(page.options.map(o => (o.label?.length || 0) + (o.hint ? o.hint.length + 3 : 0)) || [0])
              );
              const hasIcons = page.options.some(o => o.icon || o.colorPreview);
              const iconOffset = hasIcons ? 64 : 44;
              // Largura pelo texto mais longo (~6,4 px por letra em text-xs) + ícone, folgas e o ✓.
              // No computador o pop-up ainda fica 20% maior (getButtonCoverPopupStyle).
              const dynamicWidth = isInput
                ? Math.max(240, Math.min(300, longestLabelLength * 6.4 + 110))
                : subpage
                  // Segunda página: voltar (≈90 px de cada lado) + título grande no centro
                  ? Math.min(400, Math.max(250, longestLabelLength * 5.6 + iconOffset, (subpage.title.length * 11) + 190))
                  : sel.captions && page.options.some(o => o.description)
                    // Com legendas: largura confortável para a descrição quebrar em no máximo duas linhas
                    ? Math.min(290, Math.max(230, longestLabelLength * 5.6 + iconOffset))
                    : Math.min(300, Math.max(180, longestLabelLength * 5.6 + iconOffset, sel.hideTitle ? 0 : (sel.title?.length || 0) * 11 + 40));

              const sectionsCount = new Set(page.options.map(o => o.section).filter(Boolean)).size;
              const estimatedHeight = isInput ? 165 : Math.min(420, page.options.length * (sel.captions ? 54 : 42) + sectionsCount * 26 + (subpage ? 56 : sel.hideTitle ? 16 : 56));

              const goBack = () => {
                setSelectorDirection(-1);
                setSelectorMode(subMatch?.[1] ? `sub:${subIndex}` : 'select');
              };

              return (
                <PopupMorphContainer
                  key={`setting-popup-${sel.id}`}
                  activeKey={selectorMode}
                  direction={selectorDirection}
                  targetWidth={dynamicWidth}
                  targetRadius={24}
                  style={getButtonCoverPopupStyle(sel.triggerEl, dynamicWidth, estimatedHeight, 'auto')}
                  className="text-[var(--text-main)]"
                >
                  {isInput ? (
                    <div className="p-3 space-y-3">
                      {/* Voltar para as opções e título centralizado */}
                      <PopupBackHeader
                        title={page.title}
                        onBack={subpage || page.options.length > 0 ? goBack : undefined}
                      />

                      {/* Barra de Digitação */}
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (selectorInputValue.trim()) {
                            if (sel.multi && !subpage) {
                              // Digitados (um ou vários, separados por vírgula) entram na lista
                              const novo = joinGenres([...splitGenres(page.currentValue), ...splitGenres(selectorInputValue)]);
                              page.onSelect(novo);
                              setActiveSettingSelector({ ...sel, currentValue: novo });
                              setSelectorInputValue('');
                              setSelectorDirection(-1);
                              setSelectorMode('select');
                            } else {
                              page.onSelect(selectorInputValue.trim());
                              close();
                            }
                          }
                        }}
                        className="space-y-3"
                      >
                        <div className="flex items-center gap-2 rounded-2xl px-3.5 py-2.5 bg-black/5 dark:bg-white/5 border border-[var(--text-main)]/15 focus-within:border-winblue focus-within:bg-winblue/5 focus-within:shadow-[0_0_12px_rgba(var(--winblue-rgb),0.25)] transition-all">
                          <input
                            type="text"
                            autoFocus
                            value={selectorInputValue}
                            onChange={(e) => setSelectorInputValue(e.target.value)}
                            placeholder={page.placeholder || "Digite aqui..."}
                            className="w-full bg-transparent outline-none text-xs font-semibold text-[var(--text-main)] placeholder:text-[var(--text-muted)]/50"
                          />
                          {selectorInputValue && (
                            <motion.button
                              type="button"
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.92 }}
                              onClick={() => setSelectorInputValue('')}
                              className="w-5 h-5 rounded-full bg-black/10 dark:bg-white/15 hover:bg-black/20 dark:hover:bg-white/25 text-[var(--text-muted)] hover:text-[var(--text-main)] dark:hover:text-white flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-xs"
                              title="Limpar texto"
                            >
                              <X size={11} strokeWidth={2.5} />
                            </motion.button>
                          )}
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-0.5">
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.94 }}
                            onClick={close}
                            className="h-7 px-3 rounded-full bg-card/75 border border-[var(--text-main)]/10 text-xs font-semibold text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:text-white hover:shadow-[0_0_12px_rgba(255,255,255,0.25)] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                            title="Cancelar"
                          >
                            <X size={13} className="shrink-0" />
<span>Cancelar</span>
                          </motion.button>
                          <motion.button
                            type="submit"
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.94 }}
                            disabled={!selectorInputValue.trim()}
                            className="h-7 px-3.5 rounded-full bg-winblue/20 hover:bg-winblue/30 text-winblue border border-winblue/40 hover:border-winblue/75 hover:shadow-[0_0_14px_rgba(var(--winblue-rgb),0.4)] disabled:opacity-40 disabled:pointer-events-none text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                            title="Salvar"
                          >
                            <Check size={13} className="shrink-0" />
<span>Salvar</span>
                          </motion.button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className="flex flex-col p-2">
                      {subpage ? (
                        // Segunda página: voltar (com o nome da primeira) e título centralizado
                        <div className="px-1 pt-1 pb-1.5">
                          <PopupBackHeader title={subpage.title} backLabel={sel.title} onBack={goBack} />
                        </div>
                      ) : !sel.hideTitle && (
                        // Título: mesmo estilo de Ordenar por (sem linhas divisórias, sem botão de X)
                        <div className="px-3 pt-2 pb-1.5">
                          <h3 className="text-xl font-bold text-[var(--text-main)] truncate">{sel.title}</h3>
                        </div>
                      )}
                      <div className="overflow-y-auto custom-scrollbar space-y-0.5 max-h-[320px]">
                        {page.options.map((option, idx) => {
                          const isSelected = option.selected ?? (sel.multi && !subpage
                            ? splitGenres(page.currentValue).some(g => g.toLowerCase() === String(option.value).toLowerCase())
                            : page.currentValue === option.value);
                          const isCustomAction = option.value === '__custom__' || option.isCustomInput;
                          const opensPage = Boolean(option.subpage);
                          const showSection = option.section && option.section !== page.options[idx - 1]?.section;

                          return (
                            <React.Fragment key={idx}>
                              {showSection && (
                                <div className={`px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] ${idx === 0 ? 'pt-0.5' : 'pt-2.5'}`}>
                                  {option.section}
                                </div>
                              )}
                              <button
                                onClick={() => {
                                  if (opensPage) {
                                    setSelectorDirection(1);
                                    setSelectorMode(`sub:${idx}`);
                                  } else if (isCustomAction) {
                                    if (subpage) setSelectorInputValue('');
                                    setSelectorDirection(1);
                                    setSelectorMode(subpage ? `subinput:${subIndex}` : 'input');
                                  } else if (sel.multi && !subpage) {
                                    // Várias escolhas: marca/desmarca e continua aberto
                                    const novo = toggleGenre(page.currentValue, option.value);
                                    page.onSelect(novo);
                                    setActiveSettingSelector({ ...sel, currentValue: novo });
                                  } else {
                                    page.onSelect(option.value);
                                    close();
                                  }
                                }}
                                className={`relative w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-2xl select-none transition-all duration-150 cursor-pointer group ${
                                  isSelected
                                    ? 'hover:bg-winblue/25 hover:shadow-[0_0_12px_rgba(var(--winblue-rgb),0.3)]'
                                    : 'hover:bg-white/15 hover:shadow-[0_0_12px_rgba(255,255,255,0.15)]'
                                }`}
                              >
                                {isSelected && (
                                  <motion.div
                                    layoutId={sel.multi ? undefined : "setting-active-pill"}
                                    className="absolute inset-0 bg-winblue/15 rounded-2xl shadow-[0_0_10px_rgba(var(--winblue-rgb),0.2)] pointer-events-none z-0"
                                    transition={{ type: "spring", stiffness: 520, damping: 36, mass: 0.55 }}
                                  />
                                )}
                                <div className={`relative z-10 flex items-center gap-2.5 min-w-0 transition-colors ${isSelected ? 'text-winblue font-bold' : 'text-[var(--text-main)]'}`}>
                                  {option.colorPreview ? (
                                    <div
                                      className="w-4 h-4 rounded-full border border-black/10 dark:border-white/20 shrink-0 shadow-sm"
                                      style={{ backgroundColor: option.colorPreview }}
                                    />
                                  ) : option.icon ? (
                                    <div className={`shrink-0 flex items-center justify-center [&_svg]:shrink-0 transition-colors ${isSelected ? 'text-winblue [&_svg]:!text-winblue' : 'text-[var(--text-main)] [&_svg]:!text-[var(--text-main)]'}`}>
                                      {option.icon}
                                    </div>
                                  ) : null}
                                  {sel.captions && option.description ? (
                                    <span className="flex flex-col min-w-0 text-left">
                                      <span className="whitespace-nowrap">{option.label}</span>
                                      <span className={`text-[10.5px] font-medium leading-snug mt-0.5 whitespace-normal ${isSelected ? 'text-winblue/75' : 'text-[var(--text-muted)]'}`}>{option.description}</span>
                                    </span>
                                  ) : (
                                    <span className="whitespace-nowrap truncate" title={option.label}>{option.label}</span>
                                  )}
                                </div>
                                <div className="relative z-10 flex items-center gap-1.5 shrink-0 ml-2">
                                  {option.sampleCode && (
                                    <span
                                      role="button"
                                      tabIndex={-1}
                                      title={playingVoiceCode === option.sampleCode ? 'Parar amostra' : 'Ouvir amostra'}
                                      aria-label={playingVoiceCode === option.sampleCode ? 'Parar amostra' : 'Ouvir amostra'}
                                      onClick={(e) => toggleVoiceSample(e, option.sampleCode!)}
                                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer border ${
                                        playingVoiceCode === option.sampleCode
                                          ? 'opacity-100 bg-winblue/20 border-winblue/45 text-winblue'
                                          : 'opacity-0 group-hover:opacity-100 bg-card/80 border-[var(--text-main)]/15 text-[var(--text-main)] hover:bg-white/20 hover:border-white/35 hover:shadow-[0_0_10px_rgba(255,255,255,0.3)]'
                                      }`}
                                    >
                                      {playingVoiceCode === option.sampleCode ? <Pause size={11} fill="currentColor" /> : <Play size={11} fill="currentColor" className="ml-px" />}
                                    </span>
                                  )}
                                  {option.hint && (
                                    <span className={`text-[11px] font-semibold whitespace-nowrap ${isSelected ? 'text-winblue' : 'text-[var(--text-muted)]'}`}>{option.hint}</span>
                                  )}
                                  {isSelected && !opensPage && (
                                    <motion.div
                                      layoutId={sel.multi ? undefined : "setting-active-check"}
                                      className="text-winblue shrink-0"
                                      transition={{ type: "spring", stiffness: 520, damping: 36, mass: 0.55 }}
                                    >
                                      <BsCheck2 size={16} />
                                    </motion.div>
                                  )}
                                  {(isCustomAction || opensPage) && (
                                    <ChevronRight size={13} className={`shrink-0 rtl:rotate-180 ${isSelected ? 'text-winblue' : 'text-current'}`} />
                                  )}
                                </div>
                              </button>
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </PopupMorphContainer>
              );
            })()}
          </>
        )}
      </AnimatePresence>




      {/* POPUP GLOBAL DE ORDENAÇÃO (TRANSFORMAÇÃO DO BOTÃO) */}
      <AnimatePresence>
        {sortMenuAnchor && (
          <>
            <div 
              className="fixed inset-0 z-[9998] cursor-default" 
              onClick={() => { 
                clearButtonCoverAnchorCache(sortMenuAnchor);
                setSortMenuAnchor(null); 
              }}
            />
            <motion.div 
              key="global-sort-menu"
              initial={{ opacity: 0, scale: 0.22 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.22, transition: { duration: 0.12, ease: [0.32, 0, 0.67, 0] } }}
              transition={{
                opacity: { duration: 0.12, ease: "easeOut" },
                scale: { type: "spring", stiffness: 540, damping: 36, mass: 0.55 },
              }}
              style={getButtonCoverPopupStyle(sortMenuAnchor, 256, 285, 'right')}
              data-popup-content="true"
              onClick={(e) => e.stopPropagation()}
              className="w-64 bg-card/95 backdrop-blur-3xl border border-[var(--button-secondary-bg)] rounded-[24px] shadow-2xl z-[9999] p-2 flex flex-col text-left overflow-hidden"
            >
              {/* Título: Ordenar por (maiúsculas e minúsculas, sem linhas divisórias) */}
              <div className="px-3 pt-2 pb-1.5">
                <h3 className="text-xl font-bold text-[var(--text-main)]">{t.sortBy || 'Ordenar por'}</h3>
              </div>

              <div className="space-y-0.5">
                {[
                  { id: 'name-asc', label: t.sortNameAsc || 'Título (A-Z)', icon: <ArrowDownAZ size={15} /> },
                  { id: 'name-desc', label: t.sortNameDesc || 'Título (Z-A)', icon: <ArrowUpZA size={15} /> },
                  { id: 'year-desc', label: t.sortYearDesc || 'Mais recentes (Ano)', icon: <Calendar size={15} /> },
                  { id: 'year-asc', label: t.sortYearAsc || 'Mais antigos (Ano)', icon: <CalendarClock size={15} /> },
                  { id: 'duration-desc', label: t.sortDurationDesc || 'Maior duração', icon: <Clock size={15} /> },
                  { id: 'duration-asc', label: t.sortDurationAsc || 'Menor duração', icon: <Timer size={15} /> },
                ].map(opt => {
                  const isSelected = sortBy === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectSort(opt.id as SortOption)}
                      className={`relative w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-2xl select-none transition-all duration-150 group cursor-pointer ${
                        isSelected
                          ? 'hover:bg-winblue/25 hover:shadow-[0_0_12px_rgba(var(--winblue-rgb),0.3)]'
                          : 'hover:bg-white/15 hover:shadow-[0_0_12px_rgba(255,255,255,0.15)]'
                      }`}
                    >
                      {isSelected && (
                        <motion.div
                          layoutId="sort-active-pill"
                          className="absolute inset-0 bg-winblue/15 rounded-2xl shadow-[0_0_10px_rgba(var(--winblue-rgb),0.2)] pointer-events-none z-0"
                          transition={{ type: "spring", stiffness: 520, damping: 36, mass: 0.55 }}
                        />
                      )}
                      <div className={`relative z-10 flex items-center gap-2.5 transition-colors ${isSelected ? 'text-winblue font-bold' : 'text-[var(--text-main)] group-hover:text-white'}`}>
                        <span className={`shrink-0 flex ${isSelected ? 'text-winblue' : 'text-inherit'}`}>{opt.icon}</span>
                        <span>{opt.label}</span>
                      </div>
                      {isSelected && (
                        <motion.div
                          layoutId="sort-active-check"
                          className="relative z-10 text-winblue shrink-0"
                          transition={{ type: "spring", stiffness: 520, damping: 36, mass: 0.55 }}
                        >
                          <Check size={16} />
                        </motion.div>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* POPUP GLOBAL DE OPÇÕES DO AUDIOBOOK (OPÇÕES / MAIS DETALHES / GERAR TEXTO) */}
      <AnimatePresence>
        {activeBookMenu && (
          <>
            <div
              className="fixed inset-0 z-[9990] cursor-default"
              onClick={() => {
                clearButtonCoverAnchorCache(activeBookMenu.anchorEl);
                setActiveBookMenu(null);
              }}
            />
            <PopupMorphContainer
              key={`book-menu-${activeBookMenu.item.id}`}
              activeKey={activeBookMenu.mode || 'options'}
              direction={activeBookMenu.direction ?? (activeBookMenu.mode === 'options' ? -1 : 1)}
              targetWidth={activeBookMenu.mode === 'details' ? 380 : activeBookMenu.mode === 'generate-text' ? 320 : activeBookMenu.mode === 'confirm-delete' ? 280 : 230}
              targetRadius={24}
              style={getButtonCoverPopupStyle(
                activeBookMenu.anchorEl,
                activeBookMenu.mode === 'details' ? 380 : activeBookMenu.mode === 'generate-text' ? 320 : activeBookMenu.mode === 'confirm-delete' ? 280 : 230,
                activeBookMenu.mode === 'details' ? 420 : activeBookMenu.mode === 'generate-text' ? 210 : activeBookMenu.mode === 'confirm-delete' ? 210 : 280,
                'right'
              )}
              className="text-[var(--text-main)]"
            >
              {activeBookMenu.mode === 'confirm-delete' ? (
                <ConfirmPanel
                  title={`Excluir "${activeBookMenu.item.title}"?`}
                  description="O audiobook sai de Convertidos e o arquivo de áudio vai para a Lixeira do computador."
                  confirmLabel="Excluir"
                  onConfirm={() => {
                    handleDeleteHistoryItem(activeBookMenu.item.id);
                    clearButtonCoverAnchorCache(activeBookMenu.anchorEl);
                    setActiveBookMenu(null);
                  }}
                  onCancel={() => {
                    clearButtonCoverAnchorCache(activeBookMenu.anchorEl);
                    setActiveBookMenu(null);
                  }}
                >
                  <ConfirmItemList items={[{ id: activeBookMenu.item.id, title: activeBookMenu.item.title, subtitle: activeBookMenu.item.author, cover: activeBookMenu.item.customCover || activeBookMenu.item.cover || getGenericBookCover(activeBookMenu.item.title, activeBookMenu.item.author, activeBookMenu.item.coverColor) }]} />
                </ConfirmPanel>
              ) : activeBookMenu.mode === 'details' ? (
                <div className="flex flex-col space-y-3 p-3">
                  <PopupBackHeader title="Mais detalhes" backLabel="Mais opções" onBack={() => setActiveBookMenu({ ...activeBookMenu, mode: 'options', direction: -1 })} />

                  <div className="space-y-2.5 px-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--text-muted)] font-medium">Gêneros</span>
                      <span className="text-xs font-semibold text-[var(--text-main)] text-right truncate max-w-[190px]">
                        {[activeBookMenu.item.genre, activeBookMenu.item.subgenre].filter(Boolean).join(', ') || 'Romance psicológico, Realismo'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--text-muted)] font-medium">Narrado por</span>
                      <span className="text-xs font-semibold text-[var(--text-main)] text-right truncate max-w-[190px]">
                        {activeBookMenu.item.narrator || 'Allex'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--text-muted)] font-medium">Idioma</span>
                      <span className="text-xs font-semibold text-[var(--text-main)]">{activeBookMenu.item.language || 'Português'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--text-muted)] font-medium">Ano</span>
                      <span className="text-xs font-bold text-[var(--text-main)]">{activeBookMenu.item.year || '1899'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--text-muted)] font-medium">Duração</span>
                      <span className="text-xs font-bold text-[var(--text-main)]">
                        {activeBookMenu.item.durationEst || activeBookMenu.item.duration || '8 horas e 36 minutos'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--text-muted)] font-medium">Tamanho</span>
                      <span className="text-xs font-bold text-[var(--text-main)]">
                        {activeBookMenu.item.sizeStr || activeBookMenu.item.size || '720 Mb'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--text-muted)] font-medium">Formato</span>
                      <span className="text-xs font-bold text-[var(--text-main)]">
                        {(() => {
                          const fmt = activeBookMenu.item.format || (activeBookMenu.item.path ? activeBookMenu.item.path.split('.').pop() : 'M4b') || 'M4b';
                          return fmt.charAt(0).toUpperCase() + fmt.slice(1).toLowerCase();
                        })()}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2 pt-1">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <span className="text-xs text-[var(--text-muted)] font-medium block mb-0.5">Local de armazenamento</span>
                          <p
                            className="text-[11px] text-[var(--text-main)] truncate"
                            title={activeBookMenu.item.path || `audiobook-generatior/audiobooks/${activeBookMenu.item.title}.m4b`}
                          >
                            {activeBookMenu.item.path || `audiobook-generatior/audiobooks/${activeBookMenu.item.title}.m4b`}
                          </p>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            const targetPath = activeBookMenu.item.path || `audiobook-generatior/audiobooks/${activeBookMenu.item.title}.m4b`;
                            fetch('/api/open-folder', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ path: targetPath, isFile: true })
                            });
                            showToast("Abrindo pasta no Explorer...");
                          }}
                          className="shrink-0 h-8 px-3.5 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 shadow-sm text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] flex items-center justify-center text-xs font-semibold transition-all cursor-pointer gap-1.5"
                          title="Ver na pasta"
                        >
                          <span>Ver na pasta</span>
<FolderOpen size={13} className="shrink-0" />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : activeBookMenu.mode === 'generate-text' ? (
                <div className="flex flex-col space-y-1.5 p-3">
                  <PopupBackHeader title="Gerar texto" backLabel="Mais opções" onBack={() => setActiveBookMenu({ ...activeBookMenu, mode: 'options', direction: -1 })} />
                  <p className="text-xs text-[var(--text-muted)] px-1 leading-relaxed">
                    {syncTextDestination === 'metadata' ? 'O texto será gravado nos metadados do audiobook.'
                      : syncTextDestination === 'library' ? 'O texto será salvo na pasta da biblioteca.'
                      : 'O texto será gravado no audiobook e salvo na biblioteca.'}
                  </p>
                  <div className="pt-1 space-y-1">
                    <MenuOptionItem
                      icon={<FileText size={14} />}
                      onClick={() => {
                        const book = activeBookMenu.item;
                        clearButtonCoverAnchorCache(activeBookMenu.anchorEl);
                        setActiveBookMenu(null);
                        handlePickBookTextFile(book);
                      }}
                    >
                      Áudio + texto do livro
                    </MenuOptionItem>
                    <MenuOptionItem
                      icon={<Headphones size={14} />}
                      onClick={() => {
                        const book = activeBookMenu.item;
                        clearButtonCoverAnchorCache(activeBookMenu.anchorEl);
                        setActiveBookMenu(null);
                        handleGenerateBookText(book);
                      }}
                    >
                      Só o áudio
                    </MenuOptionItem>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col space-y-0.5 p-2">
                  <MenuOptionItem icon={<Edit3 size={14} />} onClick={() => handleStartEditBook(activeBookMenu.item)}>
                    Editar dados
                  </MenuOptionItem>
                  <MenuOptionItem icon={<Info size={14} />} onClick={() => setActiveBookMenu({ ...activeBookMenu, mode: 'details', direction: 1 })}>
                    Mais detalhes
                  </MenuOptionItem>
                  {activeBookMenu.item.path && (
                    <MenuOptionItem
                      icon={playingSnippet?.path === activeBookMenu.item.path ? <Pause size={14} /> : <Play size={14} />}
                      onClick={() => {
                        toggleSnippet(activeBookMenu.item.path!);
                        clearButtonCoverAnchorCache(activeBookMenu.anchorEl);
                        setActiveBookMenu(null);
                      }}
                    >
                      {playingSnippet?.path === activeBookMenu.item.path ? 'Parar Áudio' : 'Ouvir Trecho'}
                    </MenuOptionItem>
                  )}
                  {activeBookMenu.item.path && (
                    <MenuOptionItem
                      icon={<FolderOpen size={14} />}
                      onClick={() => {
                        fetch('/api/open-folder', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ path: activeBookMenu.item.path, isFile: true })
                        });
                        showToast("Abrindo pasta no Explorer...");
                        clearButtonCoverAnchorCache(activeBookMenu.anchorEl);
                        setActiveBookMenu(null);
                      }}
                    >
                      Abrir na Pasta
                    </MenuOptionItem>
                  )}
                  <MenuOptionItem
                    icon={syncingBookIds.includes(activeBookMenu.item.id) ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                    onClick={() => {
                      if (syncingBookIds.includes(activeBookMenu.item.id)) {
                        showToast('O texto deste audiobook já está sendo gerado.');
                        return;
                      }
                      setActiveBookMenu({ ...activeBookMenu, mode: 'generate-text', direction: 1 });
                    }}
                  >
                    {syncingBookIds.includes(activeBookMenu.item.id) ? 'Gerando texto...' : 'Gerar texto'}
                  </MenuOptionItem>
                  <MenuOptionItem
                    danger
                    icon={<Trash2 size={14} />}
                    onClick={() => setActiveBookMenu({ ...activeBookMenu, mode: 'confirm-delete', direction: 1 })}
                  >
                    Excluir de Convertidos
                  </MenuOptionItem>
                </div>
              )}
            </PopupMorphContainer>
          </>
        )}
      </AnimatePresence>

      {/* POPUP GLOBAL DE OPÇÕES DO TEXTO (OPÇÕES / MAIS DETALHES) */}
      <AnimatePresence>
        {activeTextMenu && (
          <>
            <div
              className="fixed inset-0 z-[9990] cursor-default"
              onClick={() => {
                clearButtonCoverAnchorCache(activeTextMenu.anchorEl);
                setActiveTextMenu(null);
              }}
            />
            <PopupMorphContainer
              key={`text-menu-${activeTextMenu.item.id}`}
              activeKey={activeTextMenu.mode || 'options'}
              direction={activeTextMenu.direction ?? (activeTextMenu.mode === 'details' ? 1 : -1)}
              targetWidth={activeTextMenu.mode === 'details' ? 340 : activeTextMenu.mode === 'confirm-delete' ? 280 : 230}
              targetRadius={24}
              style={getButtonCoverPopupStyle(activeTextMenu.anchorEl, activeTextMenu.mode === 'details' ? 340 : activeTextMenu.mode === 'confirm-delete' ? 280 : 230, activeTextMenu.mode === 'details' ? 260 : activeTextMenu.mode === 'confirm-delete' ? 210 : 280, 'right')}
              className="text-[var(--text-main)]"
            >
              {activeTextMenu.mode === 'confirm-delete' ? (
                <ConfirmPanel
                  title={`Excluir "${activeTextMenu.item.title}"?`}
                  description="O texto sai de Convertidos e os arquivos (.lrc, .srt, .sync.json) vão para a Lixeira do computador."
                  confirmLabel="Excluir"
                  onConfirm={() => {
                    handleDeleteGeneratedText(activeTextMenu.item.id);
                    clearButtonCoverAnchorCache(activeTextMenu.anchorEl);
                    setActiveTextMenu(null);
                  }}
                  onCancel={() => {
                    clearButtonCoverAnchorCache(activeTextMenu.anchorEl);
                    setActiveTextMenu(null);
                  }}
                >
                  <ConfirmItemList items={[{ id: activeTextMenu.item.id, title: activeTextMenu.item.title, subtitle: activeTextMenu.item.author || activeTextMenu.item.genre, cover: activeTextMenu.item.cover || getGenericTextCover(activeTextMenu.item.title, activeTextMenu.item.author, activeTextMenu.item.coverColor), shape: 'square' }]} />
                </ConfirmPanel>
              ) : activeTextMenu.mode === 'details' ? (
                <div className="flex flex-col space-y-3 p-3">
                  <PopupBackHeader title="Mais detalhes" backLabel="Mais opções" onBack={() => setActiveTextMenu({ ...activeTextMenu, mode: 'options', direction: -1 })} />
                  <div className="space-y-2.5 px-0.5">
                    {[
                      ['Autor', activeTextMenu.item.author || 'Autor desconhecido'],
                      ['Tipo', activeTextMenu.item.genre || 'Texto'],
                      ['Formato', activeTextMenu.item.tone || '.txt'],
                      ['Palavras', String(activeTextMenu.item.wordCount ?? 0)],
                      ['Data', activeTextMenu.item.date || '—'],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between gap-3">
                        <span className="text-xs text-[var(--text-muted)] font-medium">{label}</span>
                        <span className="text-xs font-semibold text-[var(--text-main)] text-right truncate max-w-[200px]">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col space-y-0.5 p-2">
                  <MenuOptionItem
                    icon={<Eye size={14} />}
                    onClick={() => {
                      const item = activeTextMenu.item;
                      const anchor = activeTextMenu.anchorEl;
                      clearButtonCoverAnchorCache(anchor);
                      setActiveTextMenu(null);
                      setViewingTextAnchor(anchor);
                      setViewingTextModal(item);
                    }}
                  >
                    Ver texto
                  </MenuOptionItem>
                  <MenuOptionItem
                    icon={<Edit3 size={14} />}
                    onClick={() => {
                      const item = activeTextMenu.item;
                      clearButtonCoverAnchorCache(activeTextMenu.anchorEl);
                      setActiveTextMenu(null);
                      handleStartEditText(item);
                    }}
                  >
                    Editar dados
                  </MenuOptionItem>
                  <MenuOptionItem
                    icon={<Copy size={14} />}
                    onClick={() => {
                      navigator.clipboard.writeText(activeTextMenu.item.content || '');
                      showToast("Texto copiado para a área de transferência!");
                      clearButtonCoverAnchorCache(activeTextMenu.anchorEl);
                      setActiveTextMenu(null);
                    }}
                  >
                    Copiar texto
                  </MenuOptionItem>
                  <MenuOptionItem icon={<Info size={14} />} onClick={() => setActiveTextMenu({ ...activeTextMenu, mode: 'details', direction: 1 })}>
                    Mais detalhes
                  </MenuOptionItem>
                  <MenuOptionItem
                    danger
                    icon={<Trash2 size={14} />}
                    onClick={() => setActiveTextMenu({ ...activeTextMenu, mode: 'confirm-delete', direction: 1 })}
                  >
                    Excluir de Convertidos
                  </MenuOptionItem>
                </div>
              )}
            </PopupMorphContainer>
          </>
        )}
      </AnimatePresence>


      {/* CANCELAR CONVERSÃO: nasce do "Cancelar todos" ou do ✕ do card; encerra todas as conversões em andamento */}
      <AnimatePresence>
        {showCancelModal && cancelModalAnchor && (() => {
          const converting = files.filter(f => f.status !== 'idle' && f.status !== 'success' && f.status !== 'error');
          const close = () => { setShowCancelModal(false); setCancelModalAnchor(null); };
          return (
            <AnchoredPopup
              key="cancel-conversion"
              anchor={cancelModalAnchor}
              width={300}
              estimatedHeight={150 + Math.min(converting.length, 4) * 56}
              onClose={close}
            >
              <ConfirmPanel
                title={converting.length > 1 ? `Cancelar ${converting.length} conversões?` : 'Cancelar a conversão?'}
                description="A conversão para agora e os e-books voltam para a lista, prontos para converter de novo."
                confirmLabel="Cancelar conversão"
                cancelLabel="Continuar"
                icon={<X size={13} />}
                onConfirm={async () => { close(); await handleCancelProcessing(); }}
                onCancel={close}
              >
                <ConfirmItemList items={converting.map(f => ({ id: f.id, title: f.title || f.filename || 'E-book', subtitle: f.author, cover: f.customCover || f.cover || getGenericBookCover(f.title || 'Desconhecido', f.author || 'Desconhecido', f.coverColor) }))} />
              </ConfirmPanel>
            </AnchoredPopup>
          );
        })()}
      </AnimatePresence>

      {/* VISUALIZAR TEXTO GERADO: nasce do card ou da opção que o abriu */}
      <AnimatePresence>
        {viewingTextModal && (
          <AnchoredPopup
            key={`view-text-${viewingTextModal.id}`}
            anchor={viewingTextAnchor}
            width={420}
            estimatedHeight={460}
            onClose={() => { setViewingTextModal(null); setViewingTextAnchor(null); }}
            className="p-3 max-h-[min(560px,calc(100vh-48px))]"
          >
            <div className="relative flex items-center justify-center min-h-8 px-10">
              <h4 className="text-xl font-bold text-[var(--text-main)] truncate text-center">{viewingTextModal.title}</h4>
              <motion.button
                type="button"
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => {
                  navigator.clipboard.writeText(viewingTextModal.content);
                  showToast("Texto copiado para a área de transferência!");
                }}
                className="absolute right-0 rtl:right-auto rtl:left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center bg-card/75 border border-[var(--text-main)]/10 text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.25)] transition-[background-color,border-color,box-shadow] cursor-pointer"
                title="Copiar texto"
                aria-label="Copiar texto"
              >
                <Copy size={14} />
              </motion.button>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] text-center truncate mt-0.5 mb-2 px-2">
              {viewingTextModal.author ? `${viewingTextModal.author} • ` : ''}{viewingTextModal.genre} • {viewingTextModal.wordCount} palavras • {viewingTextModal.date}
            </p>
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-2 pb-1 text-sm leading-relaxed text-[var(--text-main)] whitespace-pre-wrap font-serif select-text">
              {viewingTextModal.content}
            </div>
          </AnchoredPopup>
        )}
      </AnimatePresence>

      {/* Abrir/fechar "de dentro do card" (estilo abrir app no iOS) */}
      <ZoomTransitionLayer
        getScrollContainer={() => mainScrollRef.current}
        getCurrentScreenKey={() => activeScreenKeyRef.current}
      />


      <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple accept=".epub,.pdf,.mobi,.azw,.azw3,.prc,.txt" className="hidden" />
      <input type="file" ref={coverFileInputRef} onChange={handleCoverUpload} accept="image/*" className="hidden" />
      {/* Texto do livro para sincronizar com um audiobook do histórico ("áudio + texto") */}
      <input type="file" ref={syncTextInputRef} onChange={handleSyncTextFileChosen} accept=".epub,.pdf,.mobi,.txt" className="hidden" />
    </>
  );
}

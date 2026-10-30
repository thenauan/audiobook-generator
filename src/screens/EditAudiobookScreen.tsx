import { useEffect } from 'react';
// ===== Tela: edit-audiobook =====
import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { AUDIO_FORMATS } from '../app/audioFormats';
import { audioFormatIcon } from '../app/audioFormatIcons';
import { Upload, Plus, FileText, Trash2, Check, Play, Pause, Scissors, X } from 'lucide-react';
import { LuFileAudio, LuFolderDown } from 'react-icons/lu';
import { RiTranslateAi2 } from 'react-icons/ri';
import { transicaoConteudo } from '../navigation/transitions';
import { getButtonCoverPopupStyle, clearButtonCoverAnchorCache } from '../components/Popovers';
import { COVER_COLOR_PICKER, getGenericBookCover } from '../lib/covers';
import { SettingToggle } from '../components/cards/SettingToggle';
import { useApp } from '../app/AppContext';
import { voicesFor, languageCode, voiceLang, hasSample } from '../data/voices';

export function EditAudiobookScreen() {
  const { showToast, playingVoiceCode, toggleVoiceSample, editingBook, editBookTitle, setEditBookTitle, editBookAuthor, setEditBookAuthor, editBookCategory, setEditBookCategory, editBookSubgenre, setEditBookSubgenre, editBookNarrator, setEditBookNarrator, editBookLanguage, setEditBookLanguage, editBookYear, setEditBookYear, editBookVoice, setEditBookVoice, editBookFileType, setEditBookFileType, editBookGenerateSyncText, setEditBookGenerateSyncText, editBookRequiresTranslation, setEditBookRequiresTranslation, editBookCover, setEditBookCover, editCoverColor, setEditCoverColor, editBookDescription, setEditBookDescription, editBookChapters, setEditBookChapters, editBookPronunciationMap, setEditBookPronunciationMap, pronOrigInput, setPronOrigInput, pronRepInput, setPronRepInput, previewChapter, setPreviewChapter, previewChapterAnchor, setPreviewChapterAnchor, editBookHasTranscript, setEditBookHasTranscript, editBookTranscriptFileName, setEditBookTranscriptFileName, editBookCoverInputRef, editBookTranscriptInputRef, pronTagsScrollRef, handlePronMouseDown, handlePronMouseLeaveOrUp, handlePronMouseMove, handleSplitLongChapter, availableVoices, editingFileId, defaultVoice } = useApp();
  // Editando um e-book da lista do Conversor (ainda não convertido) ou um audiobook pronto do Histórico
  const isPendingConversion = Boolean(editingFileId);
  return (() => {
    const getLangFamily = (langStr: string) => {
      const s = (langStr || '').toLowerCase().trim();
      if (s.includes('portug') || s.startsWith('pt')) return 'pt';
      if (s.includes('ingl') || s.includes('engl') || s.startsWith('en')) return 'en';
      if (s.includes('espan') || s.includes('españ') || s.includes('span') || s.startsWith('es')) return 'es';
      if (s.includes('franc') || s.startsWith('fr')) return 'fr';
      if (s.includes('alem') || s.includes('deu') || s.startsWith('de')) return 'de';
      if (s.includes('ital') || s.startsWith('it')) return 'it';
      if (s.includes('arab') || s.startsWith('ar')) return 'ar';
      return s;
    };

    // Tradução faz sentido quando o livro não está no idioma da voz padrão; com ela, as vozes são as do idioma da voz padrão
    const bookLang = languageCode(editBookLanguage);
    const canTranslate = bookLang !== voiceLang(defaultVoice);
    const narrLang = editBookRequiresTranslation && canTranslate ? voiceLang(defaultVoice) : bookLang;
    const voiceOptions = voicesFor(narrLang);
    // Se a voz escolhida não é do idioma narrado (mudou o idioma ou a tradução), passa para uma voz desse idioma
    useEffect(() => {
      if (!voiceOptions.some(v => v.code === editBookVoice)) {
        setEditBookVoice(voiceOptions.some(v => v.code === defaultVoice) ? defaultVoice : voiceOptions[0].code);
      }
    }, [narrLang]);

    const selectedVoiceObj = availableVoices.find(v => v.code === editBookVoice);
    const selectedVoiceName = selectedVoiceObj
      ? (selectedVoiceObj.label.split(' - ')[1]?.split(' (')[0] ? `${selectedVoiceObj.label.split(' - ')[1].split(' (')[0]} Neural` : selectedVoiceObj.label)
      : 'Francisca Neural';

    return (
    <motion.div
      key="screen-edit-audiobook"
      variants={transicaoConteudo}
      initial="escondido"
      animate="visivel"
      exit="saindo"
      className="w-full flex flex-col gap-8 pb-24 pt-2"
    >
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 w-full">
        {/* Coluna Esquerda: Capa & Paleta de Cores Genéricas */}
        <div className="flex flex-col items-center shrink-0">
          <div className="relative shrink-0 rounded-3xl overflow-hidden shadow-2xl w-[175px] h-[280px] aspect-[1/1.6] group">
            <img 
              src={editBookCover || getGenericBookCover(editBookTitle || editingBook?.title || 'Desconhecido', editBookAuthor || editingBook?.author || 'Desconhecido', editCoverColor)} 
              onError={(e) => {
                const fallback = getGenericBookCover(editBookTitle || editingBook?.title || 'Desconhecido', editBookAuthor || editingBook?.author || 'Desconhecido', editCoverColor);
                if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
              }}
              alt={editBookTitle || editingBook?.title || 'Desconhecido'} 
              className="w-full h-full object-cover rounded-3xl transition-all aspect-[1/1.6]"
            />
            <div className="absolute inset-0 bg-black/55 opacity-100 transition-opacity flex flex-col items-center justify-center gap-2.5 p-4 text-center backdrop-blur-xs">
              {Boolean(editBookCover) && (
                <motion.button 
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setEditBookCover(undefined)}
                  className="px-4 py-2 rounded-full bg-card/85 backdrop-blur-3xl border border-red-500/35 text-red-400 shadow-xl flex items-center gap-2 text-xs font-semibold hover:bg-red-500/20 hover:border-red-500/60 hover:text-red-300 transition-all cursor-pointer"
                >
                  <Trash2 size={14} />
                  <span>Remover capa</span>
                </motion.button>
              )}
              <motion.label 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 rounded-full bg-card/85 backdrop-blur-3xl border border-white/20 shadow-xl flex items-center gap-2 text-xs font-semibold text-white hover:bg-white/20 hover:border-white/30 transition-all cursor-pointer"
                title="Escolher capa do computador"
              >
                <Upload size={14} />
                <span>Alterar capa</span>
                <input 
                  ref={editBookCoverInputRef}
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        if (typeof event.target?.result === 'string') {
                          setEditBookCover(event.target.result);
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                    e.target.value = '';
                  }}
                />
              </motion.label>
            </div>
          </div>

          {/* Seletor de cores da capa genérica (quando não há imagem customizada) */}
          {!editBookCover && (
            <div className="mt-3.5 flex flex-col items-center gap-2 w-[175px]">
              <span className="text-xs font-semibold text-[var(--text-muted)]">
                Cor da capa
              </span>
              <div className="grid grid-cols-6 gap-x-3 gap-y-3.5 justify-items-center px-2.5 py-3 rounded-2xl bg-card/60 backdrop-blur-md border border-[var(--text-main)]/10 shadow-sm w-full">
                {COVER_COLOR_PICKER.map(c => {
                  const isSelected = editCoverColor.toLowerCase() === c.hex.toLowerCase();
                  return (
                    <button
                      key={c.id}
                      type="button"
                      title={c.name}
                      onClick={() => setEditCoverColor(c.hex)}
                      style={{ backgroundColor: c.hex }}
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all duration-150 cursor-pointer ${
                                isSelected 
                                  ? 'ring-2 ring-winblue ring-offset-[1.5px] ring-offset-black/50 shadow-[0_0_10px_rgba(var(--winblue-rgb),0.5)] hover:shadow-[0_0_14px_rgba(var(--winblue-rgb),0.75)]' 
                                  : 'opacity-85 hover:opacity-100 hover:ring-2 hover:ring-white/90 hover:ring-offset-[1.5px] hover:ring-offset-black/40 hover:shadow-[0_0_12px_rgba(255,255,255,0.75)]'
                              }`}
                    >
                      {isSelected && (
                        <Check size={9} strokeWidth={3.5} className="text-winblue drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] shrink-0 pointer-events-none" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Coluna Direita: Inputs dos Metadados Principais */}
        <div className="flex flex-col space-y-4 flex-1 w-full">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[var(--text-muted)] flex items-center gap-1.5">
                <span>Título da obra / audiobook</span>
                {!editBookTitle.trim() && (
                  <motion.span 
                    animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                    className="text-[10px] text-red-500 font-bold inline-block"
                  >
                    * Obrigatório
                  </motion.span>
                )}
              </label>
            </div>
            <motion.div
              animate={!editBookTitle.trim() ? { 
                scale: [1, 1.02, 1], 
                borderColor: ['rgba(239, 68, 68, 0.45)', 'rgba(239, 68, 68, 0.95)', 'rgba(239, 68, 68, 0.45)'],
                boxShadow: ['0 0 0px rgba(239, 68, 68, 0)', '0 0 16px rgba(239, 68, 68, 0.35)', '0 0 0px rgba(239, 68, 68, 0)']
              } : { scale: 1 }}
              transition={!editBookTitle.trim() ? { repeat: Infinity, duration: 1.5, ease: "easeInOut" } : { duration: 0.2 }}
              className={`w-full rounded-full border transition-all ${!editBookTitle.trim() ? 'border-red-500/80 bg-red-500/5' : 'border-[var(--text-main)]/10 bg-card/75'}`}
            >
              <input 
                type="text"
                value={editBookTitle}
                onChange={(e) => setEditBookTitle(e.target.value)}
                className="w-full h-11 px-5 rounded-full bg-transparent text-[var(--text-main)] text-sm font-semibold shadow-sm backdrop-blur-3xl focus:outline-none focus:border-winblue/60 focus:ring-2 focus:ring-winblue/30 focus:shadow-[0_0_15px_rgba(var(--winblue-rgb),0.35)] transition-all"
                placeholder="Título da obra (Obrigatório)"
              />
            </motion.div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[var(--text-muted)] flex items-center gap-1.5">
                <span>Autor(a)</span>
                {!editBookAuthor.trim() && (
                  <motion.span 
                    animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                    className="text-[10px] text-red-500 font-bold inline-block"
                  >
                    * Obrigatório
                  </motion.span>
                )}
              </label>
            </div>
            <motion.div
              animate={!editBookAuthor.trim() ? { 
                scale: [1, 1.02, 1], 
                borderColor: ['rgba(239, 68, 68, 0.45)', 'rgba(239, 68, 68, 0.95)', 'rgba(239, 68, 68, 0.45)'],
                boxShadow: ['0 0 0px rgba(239, 68, 68, 0)', '0 0 16px rgba(239, 68, 68, 0.35)', '0 0 0px rgba(239, 68, 68, 0)']
              } : { scale: 1 }}
              transition={!editBookAuthor.trim() ? { repeat: Infinity, duration: 1.5, ease: "easeInOut" } : { duration: 0.2 }}
              className={`w-full rounded-full border transition-all ${!editBookAuthor.trim() ? 'border-red-500/80 bg-red-500/5' : 'border-[var(--text-main)]/10 bg-card/75'}`}
            >
              <input 
                type="text"
                value={editBookAuthor}
                onChange={(e) => setEditBookAuthor(e.target.value)}
                className="w-full h-11 px-5 rounded-full bg-transparent text-[var(--text-main)] text-sm font-semibold shadow-sm backdrop-blur-3xl focus:outline-none focus:border-winblue/60 focus:ring-2 focus:ring-winblue/30 focus:shadow-[0_0_15px_rgba(var(--winblue-rgb),0.35)] transition-all"
                placeholder="Autor(a) (Obrigatório)"
              />
            </motion.div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1.5">
              Gênero / Categoria
            </label>
            <input 
              type="text"
              value={editBookCategory}
              onChange={(e) => setEditBookCategory(e.target.value)}
              className="w-full h-11 px-5 rounded-full bg-card/75 border border-[var(--text-main)]/10 text-[var(--text-main)] text-sm font-semibold shadow-sm backdrop-blur-3xl focus:outline-none focus:border-winblue/60 focus:ring-2 focus:ring-winblue/30 focus:shadow-[0_0_15px_rgba(var(--winblue-rgb),0.35)] transition-all"
              placeholder="Gênero / Categoria (ex: Ficção Científica, Romance...)"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {['Ficção', 'Fantasia', 'Romance', 'Mistério', 'Sci-Fi', 'Desenvolvimento Pessoal', 'Biografia', 'História'].map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setEditBookCategory(g)}
                  className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-card/75 border border-[var(--text-main)]/10 hover:bg-white/15 hover:border-white/25 hover:text-white hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] text-[var(--text-muted)] transition-all cursor-pointer"
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1.5">
                Subgênero
              </label>
              <input 
                type="text"
                value={editBookSubgenre}
                onChange={(e) => setEditBookSubgenre(e.target.value)}
                className="w-full h-11 px-5 rounded-full bg-card/75 border border-[var(--text-main)]/10 text-[var(--text-main)] text-sm font-semibold shadow-sm backdrop-blur-3xl focus:outline-none focus:border-winblue/60 focus:ring-2 focus:ring-winblue/30 focus:shadow-[0_0_15px_rgba(var(--winblue-rgb),0.35)] transition-all"
                placeholder="Subgênero (ex: Distopia)"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {['Distopia', 'Cyberpunk', 'Fantasia Sombria', 'Thriller', 'Aventura', 'Autoajuda', 'Espiritualidade', 'Finanças'].map(sg => (
                  <button
                    key={sg}
                    type="button"
                    onClick={() => setEditBookSubgenre(sg)}
                    className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-card/75 border border-[var(--text-main)]/10 hover:bg-white/15 hover:border-white/25 hover:text-white hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] text-[var(--text-muted)] transition-all cursor-pointer"
                  >
                    {sg}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1.5">
                Ano de Publicação
              </label>
              <input 
                type="text"
                value={editBookYear}
                onChange={(e) => setEditBookYear(e.target.value)}
                className="w-full h-11 px-5 rounded-full bg-card/75 border border-[var(--text-main)]/10 text-[var(--text-main)] text-sm font-semibold shadow-sm backdrop-blur-3xl focus:outline-none focus:border-winblue/60 focus:ring-2 focus:ring-winblue/30 focus:shadow-[0_0_15px_rgba(var(--winblue-rgb),0.35)] transition-all"
                placeholder="Ano (ex: 1899)"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {['2026', '2025', '2024', '2023', '2020', '2010', '2000', 'Século XIX', 'Clássico'].map(yr => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setEditBookYear(yr)}
                    className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-card/75 border border-[var(--text-main)]/10 hover:bg-white/15 hover:border-white/25 hover:text-white hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] text-[var(--text-muted)] transition-all cursor-pointer"
                  >
                    {yr}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1.5">
                Narrador(a) / Voz
              </label>
              <input 
                type="text"
                value={editBookNarrator}
                onChange={(e) => setEditBookNarrator(e.target.value)}
                className="w-full h-11 px-5 rounded-full bg-card/75 border border-[var(--text-main)]/10 text-[var(--text-main)] text-sm font-semibold shadow-sm backdrop-blur-3xl focus:outline-none focus:border-winblue/60 focus:ring-2 focus:ring-winblue/30 focus:shadow-[0_0_15px_rgba(var(--winblue-rgb),0.35)] transition-all"
                placeholder="Nome do(a) Narrador(a)"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[
                  selectedVoiceName,
                  ...(editBookAuthor?.trim() ? [`${editBookAuthor.trim()} (Autor)`] : ['O próprio Autor']),
                  'Voz Neural Padrão',
                  'Inteligência Artificial'
                ].map(nr => (
                  <button
                    key={nr}
                    type="button"
                    onClick={() => setEditBookNarrator(nr)}
                    className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-card/75 border border-[var(--text-main)]/10 hover:bg-white/15 hover:border-white/25 hover:text-white hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] text-[var(--text-muted)] transition-all cursor-pointer"
                  >
                    {nr}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1.5">
                Idioma
              </label>
              <input 
                type="text"
                value={editBookLanguage}
                onChange={(e) => setEditBookLanguage(e.target.value)}
                className="w-full h-11 px-5 rounded-full bg-card/75 border border-[var(--text-main)]/10 text-[var(--text-main)] text-sm font-semibold shadow-sm backdrop-blur-3xl focus:outline-none focus:border-winblue/60 focus:ring-2 focus:ring-winblue/30 focus:shadow-[0_0_15px_rgba(var(--winblue-rgb),0.35)] transition-all"
                placeholder="Idioma da obra"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[
                  { val: 'Português (Brasil)', label: '🇧🇷 Brasil' },
                  { val: 'Português (Portugal)', label: '🇵🇹 Portugal' },
                  { val: 'Inglês', label: '🇺🇸 Inglês' },
                  { val: 'Espanhol', label: '🇪🇸 Espanhol' },
                  { val: 'Francês', label: '🇫🇷 Francês' },
                  { val: 'Alemão', label: '🇩🇪 Alemão' },
                  { val: 'Italiano', label: '🇮🇹 Italiano' },
                  { val: 'Russo', label: '🇷🇺 Russo' },
                  { val: 'Árabe', label: '🇸🇦 Árabe' }
                ].map(l => (
                  <button
                    key={l.val}
                    type="button"
                    onClick={() => setEditBookLanguage(l.val)}
                    className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-card/75 border border-[var(--text-main)]/10 hover:bg-white/15 hover:border-white/25 hover:text-white hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] text-[var(--text-muted)] transition-all cursor-pointer"
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Opções de conversão: só para e-books que ainda vão ser convertidos (não para audiobooks prontos) */}
      {isPendingConversion && (<>
      {/* OPÇÕES COMPLETAS DE SÍNTESE, VOZ & FORMATO */}
      <div className="w-full flex flex-col gap-5 pt-2">
        <h2 className="text-xl font-bold text-[var(--text-main)]">
          Opções de Síntese e Formato
        </h2>

        {/* Seletor de Voz Neural */}
        <div className="w-full">
          <div className="mb-2">
            <label className="text-xs font-semibold text-[var(--text-muted)] block">
              Voz neural para narração
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {voiceOptions.map((v) => {
              const isSelected = editBookVoice === v.code;
              const isPlaying = playingVoiceCode === v.code;
              return (
                <div
                  key={v.code}
                  onClick={() => setEditBookVoice(v.code)}
                  className={`p-3 px-4 rounded-3xl border transition-all flex items-center justify-between cursor-pointer select-none ${
                            isSelected
                              ? 'bg-winblue/15 border-winblue text-winblue shadow-[0_0_14px_rgba(var(--winblue-rgb),0.3)]'
                              : 'bg-card/75 border-[var(--text-main)]/10 text-[var(--text-main)] hover:bg-white/10'
                          }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    {isSelected && (
                      <Check size={14} strokeWidth={3} className="text-winblue shrink-0" />
                    )}
                    <span className="text-lg shrink-0">{v.flag}</span>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold truncate">{v.label.split(' - ')[1] || v.label}</span>
                      <span className="text-[10px] text-[var(--text-muted)] truncate">{v.label.split(' - ')[0] || ''}</span>
                    </div>
                  </div>
                  {hasSample(v.code) && <motion.button
                    type="button"
                    whileHover={{ scale: 1.18 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={(e) => toggleVoiceSample(e, v.code)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-xs ${
                              isSelected
                                ? 'bg-winblue/25 border border-winblue/50 text-winblue hover:bg-winblue/35 hover:border-winblue/80 hover:shadow-[0_0_12px_rgba(var(--winblue-rgb),0.45)]'
                                : 'bg-card/90 border border-[var(--text-main)]/10 text-[var(--text-main)] hover:text-white hover:bg-white/20 hover:border-white/30 hover:shadow-[0_0_12px_rgba(255,255,255,0.25)]'
                            }`}
                    title="Ouvir amostra"
                  >
                    {isPlaying ? (
                      <Pause size={12} className={isSelected ? "text-winblue" : "text-inherit"} />
                    ) : (
                      <Play size={12} className={isSelected ? "text-winblue" : "text-inherit"} />
                    )}
                  </motion.button>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Estrutura dos Arquivos Gerados */}
        <div className="w-full">
          <label className="text-xs font-semibold text-[var(--text-muted)] block mb-2">
            Formato e estrutura dos arquivos de saída
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {AUDIO_FORMATS.map(f => {
              const selected = editBookFileType === f.value;
              return (
                <div
                  key={f.value}
                  onClick={() => setEditBookFileType(f.value)}
                  className={`p-4 rounded-3xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                    selected
                      ? 'bg-winblue/15 border-winblue text-winblue shadow-[0_0_16px_rgba(var(--winblue-rgb),0.3)]'
                      : 'bg-card/75 border-[var(--text-main)]/10 text-[var(--text-main)] hover:bg-white/10'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${selected ? 'bg-winblue/15 text-winblue' : 'bg-black/5 dark:bg-white/5 text-[var(--text-main)]'}`}>
                    {audioFormatIcon(f.value, 18)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold">{f.label}</span>
                      {selected && <Check size={16} className="text-winblue" />}
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-1">{f.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Switches: Texto Sincronizado e Tradução com Design de Ajustes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div 
            onClick={() => setEditBookGenerateSyncText(prev => !prev)}
            className="p-4 sm:p-5 rounded-3xl bg-card/75 border border-[var(--text-main)]/10 hover:border-winblue/40 flex items-center justify-between cursor-pointer transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-winblue/10 text-winblue flex items-center justify-center shrink-0">
                <FileText size={18} />
              </div>
              <div>
                <span className="text-xs font-bold text-[var(--text-main)] block">Gerar texto sincronizado</span>
                <span className="text-[11px] text-[var(--text-muted)]">Cria arquivos .LRC e .VTT para acompanhar leitura</span>
              </div>
            </div>
            <SettingToggle
              checked={editBookGenerateSyncText}
              onChange={(val) => setEditBookGenerateSyncText(val)}
              enabledLabel="Ativado"
              disabledLabel="Desativado"
            />
          </div>

          <div 
            onClick={() => {
              if (canTranslate) {
                setEditBookRequiresTranslation(prev => !prev);
              }
            }}
            className={`p-4 sm:p-5 rounded-3xl bg-card/75 border border-[var(--text-main)]/10 flex items-center justify-between transition-all ${
                      canTranslate 
                        ? 'hover:border-winblue/40 cursor-pointer' 
                        : 'opacity-50 cursor-not-allowed select-none'
                    }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${canTranslate ? 'bg-amber-500/10 text-amber-500' : 'bg-black/5 dark:bg-white/5 text-[var(--text-muted)]'}`}>
                <RiTranslateAi2 size={18} />
              </div>
              <div>
                <span className="text-xs font-bold text-[var(--text-main)] block">Traduzir obra com IA</span>
                <span className="text-[11px] text-[var(--text-muted)]">
                  {canTranslate 
                    ? 'Traduz automaticamente antes de gerar áudio' 
                    : 'Desativado: o idioma da obra já corresponde ao da voz'}
                </span>
              </div>
            </div>
            <SettingToggle
              checked={canTranslate && editBookRequiresTranslation}
              onChange={(val) => {
                if (canTranslate) setEditBookRequiresTranslation(val);
              }}
              disabled={!canTranslate}
              enabledLabel="Ativado"
              disabledLabel="Desativado"
            />
          </div>
        </div>
      </div>
      </>)}

      {/* Texto do Audiobook / Arquivo (também editável em audiobooks já gerados) */}
      <div className="w-full pt-2">
        <label className="text-xl font-bold text-[var(--text-main)] block mb-3">
          Texto da Obra / Transcrição
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <div 
            title={editBookHasTranscript ? (editBookTranscriptFileName || 'Texto nos metadados') : 'Texto não anexado'}
            className="h-9 px-4 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 shadow-sm text-xs font-medium text-winblue flex items-center max-w-[280px] md:max-w-md truncate select-all"
          >
            <span className="truncate">
              {editBookHasTranscript ? (editBookTranscriptFileName || 'Texto nos metadados') : 'Nenhum texto anexado'}
            </span>
          </div>

          <input
            ref={editBookTranscriptInputRef}
            type="file"
            accept=".epub,.json,.xml,.smil,.smi,.ts,.vtt,.srt,.lrc,.txt"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setEditBookHasTranscript(true);
                setEditBookTranscriptFileName(file.name);
                showToast(`Texto anexado: ${file.name}`);
              }
              e.target.value = '';
            }}
          />

          {editBookHasTranscript ? (
            <>
              <motion.button
                type="button"
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => {
                  setEditBookHasTranscript(false);
                  setEditBookTranscriptFileName(undefined);
                  showToast("Texto removido");
                }}
                className="h-9 px-4 rounded-full bg-card/75 border border-red-500/20 shadow-sm hover:bg-red-500/20 hover:border-red-400/40 hover:shadow-[0_0_15px_rgba(239,68,68,0.25)] text-red-500 font-semibold text-xs transition-all shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={14} />
                <span>Remover texto</span>
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => editBookTranscriptInputRef.current?.click()}
                className="h-9 px-4 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 shadow-sm text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] font-semibold text-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Upload size={14} />
                <span>Alterar texto</span>
              </motion.button>
            </>
          ) : (
            <motion.button
              type="button"
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => editBookTranscriptInputRef.current?.click()}
              className="h-9 px-4 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 shadow-sm text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] font-semibold text-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Upload size={14} />
              <span>Carregar texto</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Sinopse do Audiobook */}
      <div className="w-full pt-2">
        <label className="text-xl font-bold text-[var(--text-main)] block mb-4">
          Sinopse
        </label>
        <div className="relative w-full">
          <textarea 
            value={editBookDescription}
            onChange={(e) => setEditBookDescription(e.target.value.slice(0, 1500))}
            maxLength={1500}
            rows={8}
            className="w-full h-[232px] p-5 pb-7 rounded-3xl bg-card/75 border border-[var(--text-main)]/10 text-[var(--text-main)] text-sm leading-relaxed shadow-sm backdrop-blur-3xl focus:outline-none focus:border-winblue/60 focus:ring-2 focus:ring-winblue/30 focus:shadow-[0_0_15px_rgba(var(--winblue-rgb),0.35)] transition-all resize-none custom-scrollbar"
            placeholder="Sinopse da obra"
          />
          <span className="absolute bottom-2.5 right-3.5 text-[10px] text-[var(--text-muted)] pointer-events-none select-none">
            {editBookDescription.length}/1500
          </span>
        </div>
      </div>

      {isPendingConversion && (<>
      {/* Dicionário de Pronúncia Personalizada (Pronunciation Map) */}
      <div className="w-full pt-2">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-[var(--text-main)]">
            Dicionário de Pronúncia Personalizada
          </h2>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              value={pronOrigInput}
              onChange={(e) => setPronOrigInput(e.target.value)}
              placeholder="Palavra ou termo no texto (ex: Nietzsche)"
              className="flex-1 w-full h-10 px-4 rounded-full bg-card/75 border border-[var(--text-main)]/10 text-[var(--text-main)] text-sm font-medium shadow-sm backdrop-blur-3xl focus:outline-none focus:border-winblue/60 transition-all placeholder:text-[var(--text-muted)]/70"
            />
            <input
              type="text"
              value={pronRepInput}
              onChange={(e) => setPronRepInput(e.target.value)}
              placeholder="Pronúncia fonética para a IA (ex: Nitche)"
              className="flex-1 w-full h-10 px-4 rounded-full bg-card/75 border border-[var(--text-main)]/10 text-[var(--text-main)] text-sm font-medium shadow-sm backdrop-blur-3xl focus:outline-none focus:border-winblue/60 transition-all placeholder:text-[var(--text-muted)]/70"
            />
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const orig = pronOrigInput.trim();
                const rep = pronRepInput.trim();
                if (!orig || !rep) {
                  showToast("Digite o termo original e a pronúncia desejada.");
                  return;
                }
                setEditBookPronunciationMap(prev => {
                  const filtered = prev.filter(p => p.original.toLowerCase() !== orig.toLowerCase());
                  return [...filtered, { original: orig, replacement: rep }];
                });
                setPronOrigInput('');
                setPronRepInput('');
                showToast(`Regra adicionada: "${orig}" → "${rep}"`);
              }}
              className="w-full sm:w-auto h-10 px-5 rounded-full bg-winblue/20 hover:bg-winblue/30 text-winblue border border-winblue/45 hover:border-winblue/75 shadow-md flex items-center justify-center gap-1.5 text-xs font-bold transition-all shrink-0 cursor-pointer"
            >
              <Plus size={14} />
              <span>Adicionar regra</span>
            </motion.button>
          </div>

          {editBookPronunciationMap.length > 0 && (
            <div className="pt-2">
              <div className="mb-2.5">
                <h3 className="text-sm font-bold text-[var(--text-main)]">
                  Pronúncias adicionadas
                </h3>
              </div>

              <div 
                ref={pronTagsScrollRef}
                onMouseDown={handlePronMouseDown}
                onMouseLeave={handlePronMouseLeaveOrUp}
                onMouseUp={handlePronMouseLeaveOrUp}
                onMouseMove={handlePronMouseMove}
                className="flex items-center gap-2 overflow-x-auto py-1 px-0.5 no-scrollbar w-full min-w-0 scroll-smooth cursor-grab active:cursor-grabbing select-none"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {editBookPronunciationMap.map((item, idx) => (
                  <div
                    key={`${item.original}-${idx}`}
                    className="h-8 pl-3.5 pr-2 rounded-full bg-card/75 border border-[var(--text-main)]/10 flex items-center gap-2 text-xs font-semibold text-[var(--text-main)] shrink-0 shadow-xs"
                  >
                    <span>{item.original}</span>
                    <span className="text-[var(--text-muted)] font-normal">→</span>
                    <span className="text-winblue font-bold">{item.replacement}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditBookPronunciationMap(prev => prev.filter((_, i) => i !== idx));
                        showToast(`Regra removida: "${item.original}"`);
                      }}
                      className="w-5 h-5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center text-[var(--text-muted)] hover:text-red-500 transition-colors ml-0.5 cursor-pointer"
                      title="Remover regra"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Editar capítulos */}
      <div className="w-full pt-2">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-[var(--text-main)]">
            Editar capítulos
          </h2>
        </div>
        <div className="flex flex-col space-y-1">
          {editBookChapters.map((cap, i) => {
            const capContent = (cap.content || cap.snippet || '').trim();
            const wordCount = capContent ? capContent.split(/\s+/).length : 0;
            const isLongChapter = wordCount > 6000 || capContent.length > 35000;

            return (
              <React.Fragment key={cap.id || `cap-${i}`}>
                <div 
                  className="flex items-center justify-between py-2 px-4 sm:px-5 rounded-full bg-card/40 border border-[var(--text-main)]/5 mb-1.5 transition-all"
                >
                  <div className="flex items-center gap-3.5 flex-1 w-full">
                    <span className="w-6 text-center text-xs text-[var(--text-muted)] shrink-0 font-medium">
                      {i + 1}
                    </span>
                    <input 
                      type="text"
                      value={cap.title}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditBookChapters(prev => {
                          const next = [...prev];
                          if (next[i]) next[i] = { ...next[i], title: val };
                          return next;
                        });
                      }}
                      className="h-10 px-4 rounded-full bg-card/75 border border-[var(--text-main)]/10 text-[var(--text-main)] text-sm font-medium shadow-sm backdrop-blur-3xl focus:outline-none focus:border-winblue/60 focus:ring-2 focus:ring-winblue/30 focus:shadow-[0_0_15px_rgba(var(--winblue-rgb),0.35)] transition-all flex-1"
                      placeholder={`Capítulo ${i + 1}`}
                    />
                  </div>
                  <div className="flex items-center gap-2.5 ml-3 shrink-0">
                    {/* Ícone de texto para pré-visualização de trecho do capítulo */}
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.92 }}
                      animate={previewChapterAnchor && (previewChapter?.id ? previewChapter.id === cap.id : previewChapter?.title === cap.title) ? { scale: 1.22, opacity: 0, pointerEvents: 'none' } : { scale: 1, opacity: 1, pointerEvents: 'auto' }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewChapterAnchor(e.currentTarget);
                        setPreviewChapter(cap);
                      }}
                      className="w-7 h-7 rounded-full bg-card/75 border border-[var(--text-main)]/15 text-[var(--text-main)] hover:text-white hover:bg-white/20 hover:border-white/35 hover:shadow-[0_0_12px_rgba(255,255,255,0.3)] transition-all cursor-pointer shadow-sm flex items-center justify-center shrink-0 [&_svg]:text-inherit"
                      title="Ler trecho do capítulo"
                    >
                      <FileText size={13} />
                    </motion.button>

                    {/* Excluir marcação de capítulo (une conteúdo ao capítulo anterior) - Oculto se for o único capítulo */}
                    {editBookChapters.length > 1 && (
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => {
                          if (editBookChapters.length <= 1) {
                            showToast("O livro deve conter ao menos um capítulo inicial.");
                            return;
                          }
                          setEditBookChapters(prev => {
                            if (prev.length <= 1) return prev;
                            const next = [...prev];
                            if (i > 0) {
                              const prevCap = next[i - 1];
                              const appendedContent = (next[i].content || next[i].snippet || '').trim();
                              const mergedContent = prevCap.content 
                                ? `${prevCap.content}\n\n${appendedContent}` 
                                : appendedContent;
                              const mergedSnippet = prevCap.snippet || mergedContent.slice(0, 500);
                              next[i - 1] = {
                                ...prevCap,
                                content: mergedContent,
                                snippet: mergedSnippet
                              };
                              next.splice(i, 1);
                            } else {
                              const nextCap = next[1];
                              const prependedContent = (next[0].content || next[0].snippet || '').trim();
                              const mergedContent = nextCap.content 
                                ? `${prependedContent}\n\n${nextCap.content}` 
                                : prependedContent;
                              const mergedSnippet = next[0].snippet || mergedContent.slice(0, 500);
                              next[1] = {
                                ...nextCap,
                                content: mergedContent,
                                snippet: mergedSnippet
                              };
                              next.splice(0, 1);
                            }
                            return next;
                          });
                          showToast("Marcação excluída. Conteúdo integrado ao capítulo anterior.");
                        }}
                        className="w-7 h-7 rounded-full bg-card/75 border border-red-500/20 shadow-sm flex items-center justify-center text-red-500 hover:bg-red-500/15 hover:border-red-500/40 hover:shadow-[0_0_12px_rgba(239,68,68,0.25)] transition-all cursor-pointer shrink-0"
                        title="Excluir marcação de capítulo (unir ao anterior)"
                      >
                        <Trash2 size={13} />
                      </motion.button>
                    )}
                  </div>
                </div>

                {/* Banner inteligente para divisão de capítulos longos (> 6.000 palavras / 45 min) */}
                {isLongChapter && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 px-4 py-2.5 mb-2 ml-4 sm:ml-9 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Capítulo extenso (~{wordCount.toLocaleString()} palavras / ~45+ min).</span>
                      <span className="text-[var(--text-muted)] hidden md:inline">Dividir em partes menores garante síntese 100% estável.</span>
                    </div>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSplitLongChapter(i)}
                      className="h-7 px-3.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-800 dark:text-amber-200 font-bold text-[11px] flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-sm"
                    >
                      <Scissors size={12} />
                      <span>Dividir automaticamente</span>
                    </motion.button>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* POP-UP MORPHING: PRÉ-VISUALIZAÇÃO DE TRECHO DO CAPÍTULO */}
        {typeof document !== 'undefined' && createPortal(
          <AnimatePresence>
            {previewChapter && previewChapterAnchor && (
              <>
                <div 
                  className="fixed inset-0 z-[9990] cursor-default" 
                  onClick={() => {
                    clearButtonCoverAnchorCache(previewChapterAnchor);
                    setPreviewChapterAnchor(null);
                    setPreviewChapter(null);
                  }} 
                />
                <motion.div
                  key={`chapter-preview-${previewChapter.id || previewChapter.title}`}
                  initial={{ opacity: 0, scale: 0.25 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.25, transition: { duration: 0.12 } }}
                  transition={{
                    opacity: { duration: 0.12, ease: "easeOut" },
                    scale: { type: "spring", stiffness: 540, damping: 36, mass: 0.55 },
                  }}
                  style={getButtonCoverPopupStyle(previewChapterAnchor, 380, 260, 'right')}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-card/95 backdrop-blur-3xl border border-[var(--button-secondary-bg)] rounded-[24px] shadow-2xl p-4 z-[9999] flex flex-col text-left overflow-hidden text-[var(--text-main)] space-y-3"
                >
                  <div className="flex items-center justify-between pb-0.5">
                    <div className="min-w-0 pr-2">
                      <h4 className="text-xl font-bold text-[var(--text-main)] truncate">{previewChapter.title}</h4>
                    </div>
                  </div>

                  <div className="max-h-56 overflow-y-auto custom-scrollbar p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-[var(--text-main)]/5 text-xs text-[var(--text-main)]/90 leading-relaxed whitespace-pre-line select-text font-serif">
                    {previewChapter.snippet || previewChapter.content?.slice(0, 1000) || "Nenhum trecho de texto detectado para este capítulo."}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        clearButtonCoverAnchorCache(previewChapterAnchor);
                        setPreviewChapterAnchor(null);
                        setPreviewChapter(null);
                      }}
                      className="h-8 px-4 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 text-xs font-semibold hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] text-[var(--text-main)] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <X size={13} className="shrink-0" />
<span>Fechar</span>
                    </motion.button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
      </div>
      </>)}
    </motion.div>
    );
  })();
}

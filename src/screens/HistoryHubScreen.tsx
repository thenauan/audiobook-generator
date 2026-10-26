// ===== Tela: history =====
import { motion } from 'motion/react';
import { CheckCircle2, ChevronRight, Play, Pause, MoreHorizontal } from 'lucide-react';
import { RiBookOpenLine } from 'react-icons/ri';
import { transicaoConteudo } from '../navigation/transitions';
import { clearButtonCoverAnchorCache } from '../components/Popovers';
import { getGenericTextCover } from '../lib/covers';
import { UniversalCard } from '../components/cards/UniversalCard';
import { useApp } from '../app/AppContext';
import { SelectionCheck } from '../components/SelectionCheck';
import { AiStarsIcon } from '../components/AppGlyph';

export function HistoryHubScreen() {
  const { navigateTo, t, playingSnippet, toggleSnippet, history, generatedTexts, setViewingTextModal, setViewingTextAnchor, activeBookMenu, setActiveBookMenu, activeTextMenu, setActiveTextMenu , selectingConverted, selectedConverted, toggleConvertedSelection } = useApp();
  return (
      <motion.div
        key="screen-history"
        variants={transicaoConteudo}
        initial="escondido"
        animate="visivel"
        exit="saindo"
        className="w-full flex flex-col"
      >
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-[var(--text-main)] mb-12 max-md:mb-6">
          {t.history}
        </h1>

        {history.length === 0 && generatedTexts.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[48vh] text-center px-4">
            <div className="w-20 h-20 rounded-full bg-card/75 border border-[var(--text-main)]/10 flex items-center justify-center text-winblue shadow-xl backdrop-blur-3xl mb-5">
              <RiBookOpenLine size={36} />
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-[var(--text-main)] tracking-tight mb-2.5">
              Nada convertido ainda
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-md mb-7">
              Seus audiobooks e seus textos gerados aparecerão aqui.
            </p>
            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => navigateTo('converter')}
              className="h-11 px-6 rounded-full bg-winblue/20 hover:bg-winblue/30 text-winblue border border-winblue/45 hover:border-winblue/75 shadow-xl backdrop-blur-3xl hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.25),0_0_22px_rgba(var(--winblue-rgb),0.45)] font-semibold text-sm transition-all flex items-center gap-2.5 cursor-pointer [&_svg]:text-inherit"
            >
              <AiStarsIcon size={18} />
              <span>Ir para o Conversor</span>
            </motion.button>
          </div>
        ) : (
          <div className="space-y-12">
            {/* SEÇÃO 1: MEUS AUDIOBOOKS (SOMENTE SE TIVER AUDIOBOOKS) */}
            {history.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-[var(--text-main)]">{t.myAudiobooks}</h3>
                  </div>

                  <motion.button 
                    whileHover={{ scale: 1.06 }} 
                    whileTap={{ scale: 0.94 }}
                    onClick={() => navigateTo('history-audiobooks')}
                    className="h-8 pl-3.5 pr-2.5 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 shadow-sm text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.25)] flex items-center gap-1 text-xs font-semibold transition-all cursor-pointer [&_svg]:text-inherit"
                  >
                    <span>{t.seeAll}</span>
                    <ChevronRight size={15} className="-mr-0.5 rtl:rotate-180" />
                  </motion.button>
                </div>

                {/* Duas linhas de 6 audiobooks; o resto fica em "Ver todos" */}
                <div className="grid grid-cols-6 gap-4">
                  {history.slice(0, 12).map((item) => (
                    <UniversalCard
                      key={item.id}
                      id={item.id}
                      title={item.title}
                      subtitle={item.author}
                      image={item.cover}
                      onAction={item.path ? () => toggleSnippet(item.path!) : undefined}
                      actionIcon={playingSnippet?.path === item.path ? <Pause size={22} /> : <Play size={22} className="translate-x-[1px]" />}
                      actionTooltip={t.playSnippet}
                      isMenuOpen={activeBookMenu?.item.id === item.id}
                      onOptions={(anchorEl) => setActiveBookMenu({ item, anchorEl })}
                      selectMode={selectingConverted}
                      selected={selectedConverted.includes(`book:${item.id}`)}
                      onToggleSelect={() => toggleConvertedSelection(`book:${item.id}`)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* SEÇÃO 2: MEUS TEXTOS (SOMENTE SE TIVER TEXTOS) */}
            {generatedTexts.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-[var(--text-main)]">{t.myTexts}</h3>
                  </div>

                  <motion.button 
                    whileHover={{ scale: 1.06 }} 
                    whileTap={{ scale: 0.94 }}
                    onClick={() => navigateTo('history-texts')}
                    className="h-8 pl-3.5 pr-2.5 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 shadow-sm text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.25)] flex items-center gap-1 text-xs font-semibold transition-all cursor-pointer [&_svg]:text-inherit"
                  >
                    <span>{t.seeAll}</span>
                    <ChevronRight size={15} className="-mr-0.5 rtl:rotate-180" />
                  </motion.button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mobile-row">
                  {generatedTexts.map((text) => {
                    const isMenuOpen = activeTextMenu?.item.id === text.id;
                    const coverUrl = text.cover || getGenericTextCover(text.title, text.author, text.coverColor);
                    return (
                      <div 
                        key={text.id} 
                        onClick={(e) => {
                          if (selectingConverted) { toggleConvertedSelection(`text:${text.id}`); return; }
                          setViewingTextAnchor(e.currentTarget);
                          setViewingTextModal(text);
                        }}
                        className="flex flex-col group/textcard relative cursor-pointer"
                      >
                        <div className="aspect-square w-full rounded-[24px] shadow-lg group-hover/textcard:scale-[1.02] transition-all relative overflow-hidden bg-card/60">
                          <SelectionCheck active={selectingConverted} selected={selectedConverted.includes(`text:${text.id}`)} onToggle={() => toggleConvertedSelection(`text:${text.id}`)} rounded="rounded-[24px]" />
                          <img
                            src={coverUrl}
                            alt={text.title}
                            className="w-full h-full aspect-square object-cover rounded-[24px] transition-transform duration-500 group-hover/textcard:scale-105"
                          />
                        </div>

                        <div className="flex items-start justify-between gap-1.5 mt-2.5 px-0.5 relative">
                          <div className="flex-1 min-w-0 pr-1">
                            <h4 
                              title={text.title}
                              className="font-bold text-sm text-[var(--text-main)] truncate group-hover/textcard:text-winblue transition-colors"
                            >
                              {text.title}
                            </h4>
                            <p 
                              title={`${text.author ? `${text.author} • ` : ''}${text.genre} • ${text.wordCount} palavras`}
                              className="text-xs text-[var(--text-muted)] truncate mt-0.5"
                            >
                              {text.author ? `${text.author} • ` : ''}{text.genre} • {text.wordCount} palavras
                            </p>
                          </div>

                          <div className={`relative w-8 h-8 shrink-0 ${selectingConverted ? 'invisible' : isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover/textcard:opacity-100'} transition-opacity duration-200`}>
                            <motion.button
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.92 }}
                              animate={isMenuOpen ? { scale: 1.22, opacity: 0, pointerEvents: 'none' } : { scale: 1, opacity: 1, pointerEvents: 'auto' }}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                clearButtonCoverAnchorCache(e.currentTarget);
                                setActiveTextMenu({ item: text, anchorEl: e.currentTarget });
                              }}
                              className="w-8 h-8 flex items-center justify-center rounded-full backdrop-blur-3xl border border-[var(--text-main)]/10 text-[var(--text-main)] bg-card/75 hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] transition-all cursor-pointer"
                              title="Opções do Texto"
                            >
                              <MoreHorizontal size={16} />
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        )}
    </motion.div>
    );
}

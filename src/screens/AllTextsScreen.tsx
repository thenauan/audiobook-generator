// ===== Tela: all-texts =====
import { motion, AnimatePresence } from 'motion/react';
import { FileText, MoreHorizontal } from 'lucide-react';
import { transicaoConteudo } from '../navigation/transitions';
import { clearButtonCoverAnchorCache } from '../components/Popovers';
import { getGenericTextCover } from '../lib/covers';
import { useApp } from '../app/AppContext';
import { SelectionCheck } from '../components/SelectionCheck';
import { AiStarsIcon } from '../components/AppGlyph';

export function AllTextsScreen() {
  const { navigateTo, t, setViewingTextModal, setViewingTextAnchor, activeNavGroupId, sortBy, textsNavGroups, handleScrollToGroup, activeTextMenu, setActiveTextMenu, sendGeneratedTextToConverter , selectingConverted, selectedConverted, toggleConvertedSelection } = useApp();
  return (
    <motion.div
      key="screen-all-texts"
      variants={transicaoConteudo}
      initial="escondido"
      animate="visivel"
      exit="saindo"
      className={`w-full flex flex-col relative ${textsNavGroups.length > 0 ? (sortBy === 'name-asc' || sortBy === 'name-desc' ? 'pr-[60px]' : 'pr-[74px]') : ''}`}
    >
      <div className="mb-12 max-md:mb-6">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-[var(--text-main)]">
          {t.myTexts}
        </h1>
      </div>

      {textsNavGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[45vh] text-center px-4">
          <div className="w-20 h-20 rounded-full bg-card/75 border border-[var(--text-main)]/10 flex items-center justify-center text-winblue shadow-xl backdrop-blur-3xl mb-5">
            <FileText size={36} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-semibold text-[var(--text-main)] tracking-tight mb-2.5">
            Nenhum Texto
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-md mb-7">
            Seus textos gerados aparecerão aqui.
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
          <AnimatePresence>
            {textsNavGroups.map(group => (
              <motion.section
                key={group.id}
                layout="position"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                id={`group-section-${group.id}`}
                className="space-y-4 scroll-mt-24"
              >
                <h2 className="text-xl font-bold text-[var(--text-main)]">
                  {group.title}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {group.items.map((item) => {
                    const isMenuOpen = activeTextMenu?.item.id === item.id;
                    const coverUrl = item.cover || getGenericTextCover(item.title, item.author, item.coverColor);
                    return (
                      <div
                        key={item.id}
                        onClick={(e) => {
                          if (selectingConverted) { toggleConvertedSelection(`text:${item.id}`); return; }
                          setViewingTextAnchor(e.currentTarget);
                          setViewingTextModal(item);
                        }}
                        className="p-5 rounded-3xl bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 shadow-md hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between group/textcard relative"
                      >
                        <SelectionCheck active={selectingConverted} selected={selectedConverted.includes(`text:${item.id}`)} onToggle={() => toggleConvertedSelection(`text:${item.id}`)} />
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-winblue/15 text-winblue">
                              {item.genre}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-[var(--text-muted)]">{item.date}</span>
                              <motion.button
                                whileHover={{ scale: 1.15 }}
                                whileTap={{ scale: 0.92 }}
                                animate={isMenuOpen ? { scale: 1.22, opacity: 0, pointerEvents: 'none' } : { scale: 1, opacity: 1, pointerEvents: 'auto' }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  clearButtonCoverAnchorCache(e.currentTarget);
                                  setActiveTextMenu({ item, anchorEl: e.currentTarget });
                                }}
                                className="w-7 h-7 flex items-center justify-center rounded-full border border-[var(--text-main)]/10 text-[var(--text-main)] bg-card/75 hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] transition-all cursor-pointer [&_svg]:text-inherit"
                                title="Opções do Texto"
                              >
                                <MoreHorizontal size={14} />
                              </motion.button>
                            </div>
                          </div>

                          <div className="flex items-start gap-3.5 mb-2.5">
                            <img
                              src={coverUrl}
                              alt={item.title}
                              className="w-16 h-16 aspect-square rounded-2xl object-cover shrink-0 shadow-md border border-white/10 group-hover/textcard:scale-105 transition-transform"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-base font-bold text-[var(--text-main)] group-hover/textcard:text-winblue transition-colors line-clamp-1">
                                {item.title}
                              </h4>
                              {item.author && (
                                <p className="text-xs font-semibold text-[var(--text-muted)] truncate mt-0.5">
                                  {item.author}
                                </p>
                              )}
                              <p className="text-xs text-[var(--text-muted)] line-clamp-2 mt-1 leading-relaxed">
                                {item.content}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 flex items-center justify-between text-xs">
                          <span className="text-[var(--text-muted)]">{item.wordCount} palavras</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              sendGeneratedTextToConverter(item.content, item.title);
                            }}
                            className="h-7 px-3 rounded-full bg-card/75 border border-winblue/40 text-winblue font-semibold text-[11px] hover:bg-winblue/15 hover:border-winblue/60 hover:shadow-[0_0_12px_rgba(var(--winblue-rgb),0.3)] shadow-sm flex items-center gap-1 transition-all cursor-pointer [&_svg]:text-inherit"
                          >
                            <AiStarsIcon size={13} />
                            <span>Converter</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.section>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Pop up / Barra de Navegação e Filtro Vertical Fixa na Margem Direita */}
      {textsNavGroups.length > 0 && (() => {
        const isAlphabetMode = sortBy === 'name-asc' || sortBy === 'name-desc';
        const hasMoreThan12 = textsNavGroups.length > 12;
        const navMaxHeight = hasMoreThan12 
          ? (isAlphabetMode ? '458px' : '432px') 
          : undefined;

        return (
          <aside 
            className={`fixed z-30 pointer-events-auto flex items-center justify-center transition-all duration-300 right-6 top-1/2 -translate-y-1/2 select-none ${
                      isAlphabetMode ? 'w-11' : 'w-[58px]'
                    }`}
            style={{
              maxHeight: 'calc(100vh - 120px)',
            }}
            aria-label="Filtro de textos"
          >
            <nav 
              className={`w-full p-1.5 bg-card/85 backdrop-blur-3xl border border-[var(--text-main)]/10 shadow-2xl flex flex-col items-center overflow-y-auto no-scrollbar select-none transition-all duration-300 ${
                        isAlphabetMode
                          ? 'rounded-full gap-1'
                          : 'rounded-[18px] gap-1.5'
                      }`}
              style={{
                maxHeight: navMaxHeight || '100%',
              }}
            >
              {textsNavGroups.map(group => {
                const isSelected = (activeNavGroupId || textsNavGroups[0]?.id) === group.id;
                return (
                  <button
                    key={group.id}
                    id={`nav-item-${group.id}`}
                    onClick={() => handleScrollToGroup(group.id)}
                    className={`relative flex items-center justify-center font-bold transition-all duration-200 cursor-pointer shrink-0 ${
                              isAlphabetMode
                                ? 'aspect-square w-8 h-8 rounded-full text-xs'
                                : 'w-full h-7 px-1 rounded-[12px] text-[10px] tracking-tight'
                            } ${
                              isSelected
                                ? 'bg-winblue/20 text-winblue border border-winblue ring-1 ring-winblue/40 shadow-[0_0_14px_rgba(var(--winblue-rgb),0.45)] hover:bg-winblue/25 hover:shadow-[0_0_18px_rgba(var(--winblue-rgb),0.6)]'
                                : 'text-[var(--text-muted)] border border-transparent hover:text-[var(--text-main)] hover:bg-white/20 hover:border-white/35 hover:shadow-[0_0_12px_rgba(255,255,255,0.25)]'
                            }`}
                    title={group.title}
                  >
                    <span className="relative z-10 whitespace-nowrap select-none">
                      {group.navLabel}
                    </span>
                  </button>
                );
              })}
            </nav>
          </aside>
        );
      })()}
    </motion.div>
  );
}

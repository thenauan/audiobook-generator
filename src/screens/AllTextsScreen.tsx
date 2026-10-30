// ===== Tela: all-texts =====
import { motion, AnimatePresence } from 'motion/react';
import { FileText, MoreHorizontal } from 'lucide-react';
import { transicaoConteudo } from '../navigation/transitions';
import { clearButtonCoverAnchorCache } from '../components/Popovers';
import { getGenericTextCover } from '../lib/covers';
import { useApp } from '../app/AppContext';
import { TextTile } from '../components/cards/TextTile';
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
                <div className="grid grid-cols-6 gap-4">
                  {group.items.map((item) => <TextTile key={item.id} text={item} />)}
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
                                ? 'bg-winblue/20 text-winblue shadow-[0_0_14px_rgba(var(--winblue-rgb),0.45)] hover:bg-winblue/25 hover:shadow-[0_0_18px_rgba(var(--winblue-rgb),0.6)]'
                                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/20 hover:shadow-[0_0_12px_rgba(255,255,255,0.25)]'
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

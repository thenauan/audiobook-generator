// ===== Tela: history =====
import { motion } from 'motion/react';
import { CheckCircle2, ChevronRight, Play, Pause, MoreHorizontal } from 'lucide-react';
import { RiBookOpenLine } from 'react-icons/ri';
import { transicaoConteudo } from '../navigation/transitions';
import { clearButtonCoverAnchorCache } from '../components/Popovers';
import { getGenericTextCover } from '../lib/covers';
import { UniversalCard } from '../components/cards/UniversalCard';
import { useApp } from '../app/AppContext';
import { TextTile } from '../components/cards/TextTile';
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

                <div className="grid grid-cols-6 gap-4">
                  {generatedTexts.map((text) => <TextTile key={text.id} text={text} />)}
                </div>
              </section>
            )}
          </div>
        )}
    </motion.div>
    );
}

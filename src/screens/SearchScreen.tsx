// ===== Tela: search =====
import { motion, AnimatePresence } from 'motion/react';
import { Search, Clock, Code2, Trash2, Power } from 'lucide-react';
import { HeaderActionButtons } from '../components/HeaderActionButtons';
import { transicaoConteudo } from '../navigation/transitions';
import { useApp } from '../app/AppContext';

export function SearchScreen() {
  const { t, showToast, recentSearches, setRecentSearches, searchInputRef, setSearchQuery, isDevModeActive, handleExitDevMode, devModeOptions } = useApp();
  return (
    <motion.div
      key="screen-search"
      variants={transicaoConteudo}
      initial="escondido"
      animate="visivel"
      exit="saindo"
      className="w-full flex flex-col space-y-12"
    >
      {/* Quando não há busca digitada: Últimas Pesquisas */}
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[var(--text-main)]">{t.recentSearches}</h2>
          {recentSearches.length > 0 && (
            <HeaderActionButtons
              actions={[{
                id: 'clear-searches', icon: <Trash2 size={15} />, label: 'Limpar histórico de pesquisa', danger: true,
                confirm: {
                  title: 'Limpar histórico de pesquisa?',
                  description: 'Todas as suas pesquisas recentes serão removidas desta lista.',
                  confirmLabel: 'Excluir',
                  onConfirm: () => {
                    setRecentSearches([]);
                    try { localStorage.removeItem('recent_searches'); } catch {}
                    showToast('Histórico de pesquisa limpo.');
                  },
                },
              }]}
            />
          )}
        </div>

        {recentSearches.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <Clock size={36} className="text-[var(--text-muted)] opacity-35 mb-3" />
            <p className="text-sm font-medium text-[var(--text-muted)]">Nenhuma pesquisa recente</p>
          </div>
        ) : (
          <div className="space-y-1.5 w-full">
            {recentSearches.map((term, index) => (
              <div
                key={`${term}-${index}`}
                onClick={() => {
                  setSearchQuery(term);
                  searchInputRef.current?.focus();
                }}
                className="group flex items-center justify-between h-[52px] pl-[18px] pr-5 rounded-full hover:bg-[var(--button-secondary-bg)]/50 border border-transparent cursor-pointer transition-all w-full select-none"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="relative w-4 h-4 flex items-center justify-center shrink-0">
                    <Clock size={16} className="text-[var(--text-muted)] group-hover:hidden transition-colors" />
                    <div className="hidden group-hover:flex items-center justify-center relative">
                      <div className="absolute w-4 h-4 bg-white/70 blur-[6px] rounded-full pointer-events-none" />
                      <Search size={16} className="relative z-10 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.95)]" />
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-[var(--text-main)] transition-colors truncate">{term}</span>
                </div>
                <div className="text-xs text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity select-none shrink-0 pointer-events-none pr-1 font-medium">
                  <span>Toque para pesquisar</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PAINEL MODO DE DESENVOLVEDOR (se dev mode estiver ativo) */}
      {isDevModeActive && (
        <div className="p-6 rounded-3xl bg-card/80 backdrop-blur-3xl border border-amber-500/30 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
            <div className="flex items-center gap-2.5 text-amber-400 font-bold text-sm">
              <Code2 size={18} className="animate-pulse" />
              <span>Painel de Simulação do Modo Desenvolvedor</span>
            </div>
            <button
              onClick={handleExitDevMode}
              className="h-8 px-4 rounded-full bg-amber-500/15 border border-amber-500/35 hover:bg-amber-500/25 hover:border-amber-500/60 text-amber-300 text-xs font-semibold shadow-sm transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <Power size={13} className="shrink-0" />
              <span>Desativar</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {devModeOptions.map((opt, idx) => (
              <button
                key={idx}
                onClick={opt.onClick}
                className="p-3.5 rounded-2xl bg-card/75 border border-[var(--text-main)]/10 hover:border-amber-500/40 hover:bg-amber-500/10 text-left transition-all flex items-start gap-3 cursor-pointer shadow-sm group select-none"
              >
                <div className="mt-0.5 shrink-0">
                  {opt.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-[var(--text-main)] group-hover:text-amber-300 transition-colors truncate">
                    {opt.title}
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 mt-0.5 leading-snug">
                    {opt.desc}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

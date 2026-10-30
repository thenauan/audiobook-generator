// ===== Tela: search =====
import { motion, AnimatePresence } from 'motion/react';
import { Search, Clock, Trash2 } from 'lucide-react';
import { HeaderActionButtons } from '../components/HeaderActionButtons';
import { transicaoConteudo } from '../navigation/transitions';
import { useApp } from '../app/AppContext';

export function SearchScreen() {
  const { t, showToast, recentSearches, setRecentSearches, searchInputRef, setSearchQuery } = useApp();
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
                className="group flex items-center justify-between h-[52px] pl-[18px] pr-5 rounded-full hover:bg-[var(--button-secondary-bg)]/50 cursor-pointer transition-all w-full select-none"
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

    </motion.div>
  );
}

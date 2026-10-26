// ===== Tela: other-apps =====
// Mesma lógica dos textos em Convertidos: grade de itens com ícone (aqui redondo), nome, linha de detalhe
// e o botão de opções que aparece ao passar o mouse e abre o pop-up de opções / mais detalhes.
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, Info, MoreHorizontal } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import { transicaoConteudo } from '../navigation/transitions';
import { useApp } from '../app/AppContext';
import { OTHER_APPS, type OtherApp } from '../data/otherApps';
import { MenuOptionItem, PopupMorphContainer, clearButtonCoverAnchorCache, getButtonCoverPopupStyle } from '../components/Popovers';
import { PopupBackHeader } from '../components/PopupBackHeader';

const openUrl = (url: string) => window.open(url, '_blank', 'noopener,noreferrer');

type AppMenu = { item: OtherApp; anchorEl: HTMLElement; mode?: 'details'; direction?: 1 | -1 };

export function OtherAppsScreen() {
  const { t } = useApp();
  const [menu, setMenu] = useState<AppMenu | null>(null);

  const closeMenu = () => {
    if (menu) clearButtonCoverAnchorCache(menu.anchorEl);
    setMenu(null);
  };

  return (
    <motion.div
      key="screen-other-apps"
      variants={transicaoConteudo}
      initial="escondido"
      animate="visivel"
      exit="saindo"
      className="w-full flex flex-col"
    >
      <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-[var(--text-main)] mb-12">
        {t.otherApps}
      </h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {OTHER_APPS.map(item => {
          const isMenuOpen = menu?.item.id === item.id;
          return (
            <div key={item.id} className="flex flex-col group/appcard relative select-none">
              <div className="aspect-square w-full rounded-full shadow-lg group-hover/appcard:scale-[1.02] transition-all relative overflow-hidden bg-card/60">
                <img
                  src={item.icon}
                  alt={item.name}
                  draggable={false}
                  className="w-full h-full aspect-square object-cover rounded-full transition-transform duration-500 group-hover/appcard:scale-105"
                />
                {/* Ao passar o mouse: botão para abrir o app na web (mesmo estilo do play dos audiobooks) */}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/appcard:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      openUrl(item.appUrl);
                    }}
                    title="Abrir app na web"
                    aria-label={`Abrir ${item.name} na web`}
                    className="w-13 h-13 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-2xl border border-white/30 hover:border-white/75 shadow-2xl flex items-center justify-center text-white pointer-events-auto hover:shadow-[0_0_25px_rgba(255,255,255,0.65)] cursor-pointer"
                  >
                    <Globe size={24} />
                  </motion.button>
                </div>
              </div>

              <div className="flex items-start justify-between gap-1.5 mt-2.5 px-0.5 relative">
                <div className="flex-1 min-w-0 pr-1">
                  <h4 title={item.name} className="font-bold text-sm text-[var(--text-main)] truncate">
                    {item.name}
                  </h4>
                  <p title={item.url} className="text-xs text-[var(--text-muted)] truncate mt-0.5 flex items-center gap-1.5">
                    <FaGithub size={12} className="shrink-0" />
                    <span className="truncate">{item.owner}</span>
                  </p>
                </div>

                <div className={`relative w-8 h-8 shrink-0 ${isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover/appcard:opacity-100'} transition-opacity duration-200`}>
                  <motion.button
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.92 }}
                    animate={isMenuOpen ? { scale: 1.22, opacity: 0, pointerEvents: 'none' } : { scale: 1, opacity: 1, pointerEvents: 'auto' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      clearButtonCoverAnchorCache(e.currentTarget);
                      setMenu({ item, anchorEl: e.currentTarget });
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-full backdrop-blur-3xl border border-[var(--text-main)]/10 text-[var(--text-main)] bg-card/75 hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] transition-all cursor-pointer"
                    title="Opções do app"
                    aria-label={`Opções de ${item.name}`}
                  >
                    <MoreHorizontal size={16} />
                  </motion.button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pop-up de opções / mais detalhes, igual ao dos textos (portal: a tela tem transform, que quebraria o position: fixed) */}
      {createPortal(
        <AnimatePresence>
          {menu && (
            <>
              <div className="fixed inset-0 z-[9990] cursor-default" onClick={closeMenu} />
              <PopupMorphContainer
                key={`app-menu-${menu.item.id}`}
                activeKey={menu.mode || 'options'}
                direction={menu.direction ?? (menu.mode === 'details' ? 1 : -1)}
                targetWidth={menu.mode === 'details' ? 340 : 230}
                targetRadius={24}
                style={getButtonCoverPopupStyle(menu.anchorEl, menu.mode === 'details' ? 340 : 230, menu.mode === 'details' ? 300 : 180, 'right')}
                className="text-[var(--text-main)]"
              >
                {menu.mode === 'details' ? (
                  <div className="flex flex-col space-y-3 p-3">
                    <PopupBackHeader title="Mais detalhes" backLabel="Mais opções" onBack={() => setMenu({ ...menu, mode: undefined, direction: -1 })} />
                    <p className="text-xs leading-relaxed text-[var(--text-muted)] px-0.5">{menu.item.description}</p>
                    <div className="space-y-2.5 px-0.5">
                      {[['Desenvolvedor', menu.item.owner], ...menu.item.details].map(([label, value]) => (
                        <div key={label} className="flex items-center justify-between gap-3">
                          <span className="text-xs text-[var(--text-muted)] font-medium">{label}</span>
                          <span className="text-xs font-semibold text-[var(--text-main)] text-right truncate max-w-[200px]">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col space-y-0.5 p-2">
                    <MenuOptionItem icon={<Globe size={14} />} onClick={() => { openUrl(menu.item.appUrl); closeMenu(); }}>
                      Abrir app na web
                    </MenuOptionItem>
                    <MenuOptionItem icon={<FaGithub size={14} />} onClick={() => { openUrl(menu.item.url); closeMenu(); }}>
                      Acessar e baixar pelo GitHub
                    </MenuOptionItem>
                    <MenuOptionItem icon={<Info size={14} />} onClick={() => setMenu({ ...menu, mode: 'details', direction: 1 })}>
                      Mais detalhes
                    </MenuOptionItem>
                  </div>
                )}
              </PopupMorphContainer>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </motion.div>
  );
}

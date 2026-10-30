// ===== Navegação principal =====
// Computador (a partir de 1024px): menu lateral de vidro à esquerda.
// Celular/tablet: barra de abas flutuante na base (estilo iOS 26), com o destaque que desliza e pode ser
// arrastado entre as abas. Ao rolar para baixo, a barra se recolhe:
// - sem acessório (ex.: miniplayer): só encolhe um pouco;
// - com acessório, em pé: vira um botão redondo à esquerda (aba atual) e outro à direita (sideTabId),
//   e o acessório ocupa o espaço entre os dois;
// - lado a lado (celular deitado, iPad mini em pé): barra à esquerda e acessório à direita.
import React from 'react';
import { motion, LayoutGroup } from 'motion/react';
import { cn } from '../lib/cn';

export interface NavTab {
  id: string;
  label: string;
  icon: React.ReactNode;
  // Selo à direita do item no menu lateral (ex.: capa do último item adicionado ao histórico)
  badge?: React.ReactNode;
  // Destaque leve (o mesmo brilho do hover) enquanto o selo está visível
  highlight?: boolean;
}

export function SidebarItem({ icon, label, active, onClick, badge, highlight }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void; badge?: React.ReactNode; highlight?: boolean }) {
  // Mesmo padrão dos itens de pop-up: destaque branco/cinza com brilho no hover e cor de destaque quando selecionado
  return (
    <button
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        "w-full flex items-center gap-3 px-[15px] py-[11px] rounded-2xl text-sm font-semibold transition-all duration-150 select-none",
        active
          ? "bg-winblue/15 text-winblue shadow-[0_0_12px_rgba(var(--winblue-rgb),0.18)]"
          : highlight
            ? "bg-white/15 shadow-[0_0_12px_rgba(255,255,255,0.15)] text-[var(--text-main)]"
            : "text-[var(--text-main)] hover:bg-white/15 hover:text-white hover:shadow-[0_0_12px_rgba(255,255,255,0.15)]"
      )}
    >
      <span className="shrink-0 flex items-center justify-center text-inherit">{icon}</span>
      <span className="truncate">{label}</span>
      {badge}
    </button>
  );
}

export function Sidebar({
  brand,
  topItems,
  bottomItems = [],
  activeRoot,
  onSelect,
}: {
  brand: React.ReactNode;
  topItems: NavTab[];
  bottomItems?: NavTab[];
  activeRoot: string;
  onSelect: (id: string) => void;
}) {
  return (
    <aside className="sidebar-safe fixed left-4 rtl:left-auto rtl:right-4 top-4 bottom-4 w-64 bg-card/75 backdrop-blur-3xl border border-[var(--button-secondary-bg)] rounded-3xl p-5 pt-6 pb-6 flex flex-col justify-between z-30 shadow-2xl overflow-hidden overscroll-none select-none">
      <div>
        <div className="flex items-center gap-1.5 px-3 text-[var(--text-main)] text-xl tracking-tight mb-6">{brand}</div>
        <div className="flex flex-col gap-1.5 px-1">
          {topItems.map(item => (
            <SidebarItem key={item.id} icon={item.icon} label={item.label} badge={item.badge} highlight={item.highlight} active={activeRoot === item.id} onClick={() => onSelect(item.id)} />
          ))}
        </div>
      </div>
      <nav className="flex flex-col gap-1.5 px-1 mt-6">
        {bottomItems.map(item => (
          <SidebarItem key={item.id} icon={item.icon} label={item.label} badge={item.badge} highlight={item.highlight} active={activeRoot === item.id} onClick={() => onSelect(item.id)} />
        ))}
      </nav>
    </aside>
  );
}

// Medidas compartilhadas pela barra, pelos botões redondos e pelo miniplayer (simetria).
// Referência: barra de abas do iOS 26 com 62pt de altura; alvos de toque de no mínimo 44pt.
export const MOBILE_BAR = {
  side: 16,       // margem lateral (a mesma das margens do conteúdo)
  size: 62,       // altura da barra
  compact: 52,    // botões redondos e miniplayer
  gap: 8,         // espaço entre barra, botões e miniplayer
};
export const MOBILE_GLASS_SHADOW = '0 8px 24px -12px rgba(0, 0, 0, 0.35)';
// Escala da barra/miniplayer "encolhidos" (sem miniplayer ou lado a lado)
export const MOBILE_SHRINK_SCALE = 0.86;

// Estado "recolhida" fora do App: mudar durante a rolagem não re-renderiza o app inteiro
let tabBarCollapsed = false;
const tabBarListeners = new Set<() => void>();
export const tabBarStore = {
  get: () => tabBarCollapsed,
  set: (value: boolean) => {
    if (value === tabBarCollapsed) return;
    tabBarCollapsed = value;
    tabBarListeners.forEach(listener => listener());
  },
  subscribe: (listener: () => void) => {
    tabBarListeners.add(listener);
    return () => { tabBarListeners.delete(listener); };
  },
};
export function useTabBarCollapsed(): boolean {
  return React.useSyncExternalStore(tabBarStore.subscribe, tabBarStore.get, tabBarStore.get);
}

// Barra e miniplayer lado a lado quando há largura (celular deitado, iPad mini em pé, dobráveis abertos)
const SPLIT_QUERY = '(min-width: 640px)';
function subscribeSplit(cb: () => void) {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const mq = window.matchMedia(SPLIT_QUERY);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}
function getSplit() {
  return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(SPLIT_QUERY).matches;
}
export function useMobileBarSplit(): boolean {
  return React.useSyncExternalStore(subscribeSplit, getSplit, () => false);
}

// Se há acessório visível (ex.: miniplayer) — ele avisa ao montar/desmontar
let miniPresent = false;
const miniListeners = new Set<() => void>();
export const miniPresenceStore = {
  get: () => miniPresent,
  set: (value: boolean) => {
    if (value === miniPresent) return;
    miniPresent = value;
    miniListeners.forEach(listener => listener());
  },
  subscribe: (listener: () => void) => {
    miniListeners.add(listener);
    return () => { miniListeners.delete(listener); };
  },
};
export function useMiniPresent(): boolean {
  return React.useSyncExternalStore(miniPresenceStore.subscribe, miniPresenceStore.get, miniPresenceStore.get);
}

const BAR_SPRING = { type: 'spring' as const, stiffness: 620, damping: 46, mass: 0.55 };
const ICON_SPRING = { type: 'spring' as const, stiffness: 520, damping: 40, mass: 0.55 };

export interface MobileBottomBarProps {
  tabs: NavTab[];
  activeRoot: string;
  onSelect: (id: string) => void;
  // Aba que vira o botão redondo da direita quando a barra se recolhe com acessório (padrão: a última)
  sideTabId?: string;
}

export function MobileBottomBar({
  tabs: tabItems,
  activeRoot,
  onSelect,
  sideTabId,
}: MobileBottomBarProps) {
  const collapsedRaw = useTabBarCollapsed();
  const hasMini = useMiniPresent();
  const split = useMobileBarSplit();
  // Arranjo ao rolar: "split" (miniplayer entre dois botões redondos) só no celular em pé com miniplayer
  const morphMode = hasMini && !split;
  const collapsed = collapsedRaw && morphMode;
  const shrunk = collapsedRaw && !morphMode;

  const tabs = tabItems.map(tab => ({ ...tab, active: activeRoot === tab.id }));
  const activeIndex = Math.max(0, tabs.findIndex(tab => tab.active));
  const activeTab = tabs[activeIndex];
  // Aba que vira o botão redondo da direita quando a barra se recolhe com acessório (padrão: a última)
  const sideTab = tabs.find(tab => tab.id === sideTabId) || tabs[tabs.length - 1];
  const go = (id: string) => {
    tabBarStore.set(false);
    onSelect(id);
  };
  const glass = "bg-card/80 backdrop-blur-xl border border-[var(--button-secondary-bg)]";
  const { size, compact } = MOBILE_BAR;

  // Ao reabrir a partir dos botões redondos, a pesquisa fica parada no lugar do botão até a barra
  // crescer por baixo dela; só então desliza para a sua posição (não some nem pisca)
  const [reopening, setReopening] = React.useState(false);
  const prevCollapsedRef = React.useRef(collapsed);
  React.useEffect(() => {
    const was = prevCollapsedRef.current;
    prevCollapsedRef.current = collapsed;
    if (was && !collapsed) {
      setReopening(true);
      const timer = setTimeout(() => setReopening(false), 220);
      return () => clearTimeout(timer);
    }
  }, [collapsed]);

  // Arrastar o destaque entre os ícones (como no iOS 26): o destaque segue o dedo e, ao soltar, abre a aba
  const tabsRef = React.useRef<HTMLDivElement>(null);
  const [dragIndex, setDragIndex] = React.useState<number | null>(null);
  const pressRef = React.useRef<{ x: number; moved: boolean } | null>(null);
  const PAD = 4;
  const indexAt = (clientX: number) => {
    const el = tabsRef.current;
    if (!el) return activeIndex;
    const r = el.getBoundingClientRect();
    const rel = (clientX - r.left - PAD) / Math.max(1, r.width - PAD * 2);
    return Math.max(0, Math.min(tabs.length - 1, Math.floor(rel * tabs.length)));
  };
  const onTabsPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    pressRef.current = { x: e.clientX, moved: false };
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setDragIndex(indexAt(e.clientX));
  };
  const onTabsPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const press = pressRef.current;
    if (!press) return;
    if (Math.abs(e.clientX - press.x) > 6) press.moved = true;
    const idx = indexAt(e.clientX);
    if (idx !== dragIndex) setDragIndex(idx);
  };
  const onTabsPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const press = pressRef.current;
    pressRef.current = null;
    if (!press) return;
    const idx = indexAt(e.clientX);
    setDragIndex(null);
    go(tabs[idx].id);
  };
  const onTabsPointerCancel = () => {
    pressRef.current = null;
    setDragIndex(null);
  };
  const pillIndex = dragIndex ?? activeIndex;
  // Ícones compartilhados entre a barra e os botões redondos: ao reabrir, cada ícone sai do botão de onde estava
  const iconLayoutId = (id: string) => `mobile-tab-icon-${id}`;

  // Largura da barra expandida: inteira (em pé), metade (lado a lado com miniplayer) ou limitada (lado a lado sem miniplayer)
  const barWidth = split
    ? (hasMini ? `calc(50% - ${MOBILE_BAR.gap / 2}px)` : 'min(100%, 440px)')
    : '100%';

  return (
    <div
      data-mobile-tab-bar="true"
      // Ancorada pela altura total da tela (no app instalado no iPhone, até a base de verdade)
      className="md:hidden fixed inset-x-0 top-0 z-[95] pointer-events-none flex flex-col justify-end"
      style={{
        height: 'var(--screen-h)',
        paddingLeft: 'var(--mobile-bar-inset)',
        paddingRight: 'var(--mobile-bar-inset)',
        paddingBottom: 'var(--mobile-bar-bottom)',
      } as React.CSSProperties}
    >
      <LayoutGroup id="mobile-bottom-bar">
        <motion.div
          className={cn("relative", split && !hasMini && "mx-auto")}
          initial={false}
          animate={{ scale: shrunk ? MOBILE_SHRINK_SCALE : 1 }}
          transition={BAR_SPRING}
          style={{
            height: size,
            width: split && !hasMini ? 'min(100%, 440px)' : '100%',
            transformOrigin: split && hasMini ? 'bottom left' : 'bottom center',
          }}
        >
          {/* Fundo de vidro: barra completa <-> botão redondo da aba atual (a mesma forma encolhendo para a esquerda) */}
          <motion.div
            aria-hidden="true"
            initial={false}
            animate={{
              width: collapsed ? compact : (split && !hasMini ? '100%' : barWidth),
              height: collapsed ? compact : size,
              y: collapsed ? size - compact : 0,
              borderRadius: collapsed ? compact / 2 : size / 2,
            }}
            transition={BAR_SPRING}
            style={{ boxShadow: MOBILE_GLASS_SHADOW }}
            className={cn("absolute left-0 top-0 pointer-events-none", glass)}
          />

          {!collapsed ? (
            <div
              ref={tabsRef}
              role="tablist"
              onPointerDown={onTabsPointerDown}
              onPointerMove={onTabsPointerMove}
              onPointerUp={onTabsPointerUp}
              onPointerCancel={onTabsPointerCancel}
              className="absolute left-0 top-0 grid items-center touch-none select-none pointer-events-auto"
              style={{ width: split && !hasMini ? '100%' : barWidth, height: size, padding: PAD, gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
            >
              {tabs.map((tab, i) => {
                const isSearchHolding = tab.id === sideTab.id && reopening && activeTab.id !== sideTab.id;
                return (
                  <button
                    key={tab.id}
                    role="tab"
                    // Teclado (Enter/Espaço); toque/mouse é tratado pelo contêiner (permite arrastar)
                    onClick={(e) => { if (e.detail === 0) go(tab.id); }}
                    aria-label={tab.label}
                    aria-selected={tab.active}
                    aria-current={tab.active ? 'page' : undefined}
                    className={cn(
                      "relative h-full flex items-center justify-center rounded-full transition-colors duration-150",
                      i === pillIndex ? "text-winblue" : "text-[var(--text-main)]"
                    )}
                  >
                    {i === pillIndex && (
                      <motion.span
                        layoutId="mobile-tab-pill"
                        transition={BAR_SPRING}
                        className={cn(
                          "absolute inset-0 rounded-full bg-winblue/15",
                          dragIndex !== null && "bg-winblue/25"
                        )}
                      />
                    )}
                    {isSearchHolding ? (
                      // Mantém o espaço; o ícone fica no botão redondo até a barra chegar nele
                      <span className="relative z-10 w-[22px] h-[22px]" />
                    ) : (
                      <motion.span
                        layoutId={iconLayoutId(tab.id)}
                        transition={ICON_SPRING}
                        initial={tab.active || tab.id === sideTab.id ? false : { opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative z-10 flex items-center justify-center"
                      >
                        {tab.icon}
                      </motion.span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <button
              onClick={() => tabBarStore.set(false)}
              aria-label={activeTab.label}
              className="mobile-press absolute left-0 flex items-center justify-center text-winblue pointer-events-auto"
              style={{ width: compact, height: compact, top: size - compact }}
            >
              <motion.span layoutId={iconLayoutId(activeTab.id)} transition={ICON_SPRING} className="flex items-center justify-center">
                {activeTab.icon}
              </motion.span>
            </button>
          )}

          {/* Pesquisa (só no arranjo com miniplayer entre botões): botão redondo à direita */}
          {morphMode && (
            <motion.div
              initial={false}
              animate={{ opacity: collapsed ? 1 : 0, scale: collapsed ? 1 : 0.9 }}
              // Ao reabrir, o fundo do botão some quando a barra termina de crescer por baixo dele
              transition={collapsed ? BAR_SPRING : { opacity: { duration: 0.12, delay: 0.16 }, scale: { duration: 0.12, delay: 0.16 } }}
              aria-hidden="true"
              style={{ width: compact, height: compact, borderRadius: compact / 2, top: size - compact, boxShadow: MOBILE_GLASS_SHADOW }}
              className={cn("absolute right-0 pointer-events-none", glass)}
            />
          )}
          {morphMode && (collapsed || (reopening && activeTab.id !== sideTab.id)) && (
            <button
              onClick={() => go(sideTab.id)}
              aria-label={sideTab.label}
              style={{ width: compact, height: compact, borderRadius: compact / 2, top: size - compact }}
              className={cn(
                "mobile-press absolute right-0 flex items-center justify-center pointer-events-auto",
                activeRoot === sideTab.id ? "text-winblue" : "text-[var(--text-main)]"
              )}
            >
              {activeTab.id !== sideTab.id ? (
                <motion.span layoutId={iconLayoutId(sideTab.id)} transition={ICON_SPRING} className="flex items-center justify-center">
                  {sideTab.icon}
                </motion.span>
              ) : (
                sideTab.icon
              )}
            </button>
          )}
        </motion.div>
      </LayoutGroup>
    </div>
  );
}


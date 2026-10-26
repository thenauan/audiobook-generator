// ===== Transições entre telas =====
// Computador: surge suavemente. Celular: como a navegação do iOS — as duas telas se movem juntas:
// ao avançar, a nova entra por cima deslizando da direita e a anterior recua um terço para a esquerda,
// escurecendo um pouco; ao voltar, o contrário. Trocar de aba (ou abrir pela capa) só funde as telas.
// "popSwipe": o gesto da borda já levou a tela embora; a anterior só termina de voltar ao lugar.
// "instant": o próprio navegador (Safari) já animou o voltar com o gesto dele; aqui a troca é imediata.
export type NavDirection = 'push' | 'pop' | 'tab' | 'popSwipe' | 'instant';
let navDirection: NavDirection = 'tab';
let popSwipeAt = 0;
let instantAt = 0;
// Gesto da borda: quanto a tela já tinha andado (px) e a largura da área, para a animação continuar dali
let swipeOffsetPx = 0;
let swipeAreaWidth = 0;
export function setSwipeRelease(offset: number, width: number) { swipeOffsetPx = offset; swipeAreaWidth = width; }
export function setNavDirection(dir: NavDirection) {
  // O voltar logo depois do gesto da borda mantém o modo do gesto
  if (dir === 'pop' && Date.now() - popSwipeAt < 600) dir = 'popSwipe';
  if (dir === 'pop' && Date.now() - instantAt < 600) dir = 'instant';
  if (dir === 'popSwipe') popSwipeAt = Date.now();
  if (dir === 'instant') instantAt = Date.now();
  navDirection = dir;
}
export const isMobileNav = () => typeof window !== 'undefined' && !!window.matchMedia?.('(max-width: 1023px)').matches;
// Curva da navegação do iOS: rápida no começo e assentando suavemente (sem ultrapassar)
const IOS_NAV = { type: 'spring', stiffness: 300, damping: 34, mass: 0.9, restDelta: 0.5 };
// A tela que sai fica sobreposta à que entra (mesma posição), para as duas se moverem juntas.
// Como a rolagem volta ao topo na troca, a tela que sai é deslocada pelo quanto estava rolada
// (senão ela "pula" para o próprio topo e os itens piscam/se sobrepõem durante a animação).
let exitScrollTop = 0;
let exitTopPx: number | null = null;
// Durante a troca de telas, a barra de abas e o miniplayer ficam parados: as rolagens feitas pelo app
// (voltar ao topo, restaurar a posição da tela anterior) não recolhem nem expandem a barra
export let navBarFreezeUntil = 0;
// Até quando a barra de abas fica parada (rolagens feitas pelo app durante a troca de telas)
export const isNavBarFrozen = () => Date.now() < navBarFreezeUntil;
export function captureExitScroll(el: HTMLElement | null) {
  navBarFreezeUntil = Date.now() + 900;
  exitScrollTop = el?.scrollTop || 0;
  exitTopPx = null;
  if (!el) return;
  // Posição real da tela atual dentro da área rolável (a tela que sai fica exatamente onde estava)
  const screen = Array.from(el.children).find(c => getComputedStyle(c).position !== 'absolute' && c.getBoundingClientRect().height > 0);
  // (descontando a margem própria da tela, que continua valendo quando ela fica absoluta)
  if (screen) exitTopPx = screen.getBoundingClientRect().top - el.getBoundingClientRect().top - (parseFloat(getComputedStyle(screen).marginTop) || 0);
}
// A posição da tela que sai é aplicada na hora (sem animar o top/left/right)
const OVERLAY_T = { top: { duration: 0 }, left: { duration: 0 }, right: { duration: 0 }, position: { duration: 0 } };
const exitOverlay = () => ({
  position: 'absolute',
  top: exitTopPx !== null ? exitTopPx : `calc(var(--app-header-top) + 60px - ${exitScrollTop}px)`,
  left: 'max(var(--page-margin), var(--safe-left))',
  right: 'max(var(--page-margin), var(--safe-right))',
});
export const transicaoConteudo: any = {
  get escondido() {
    if (!isMobileNav()) return { opacity: 0, scale: 0.985, y: 8, x: 0, transformOrigin: 'center top' };
    // "relative": sem isso o zIndex da tela que entra não vale e a que sai (absoluta) fica por cima dela
    if (navDirection === 'push') return { x: '100%', opacity: 1, scale: 1, y: 0, zIndex: 2, position: 'relative' };
    if (navDirection === 'instant') return { opacity: 1, x: 0, scale: 1, y: 0, zIndex: 1 };
    if (navDirection === 'popSwipe') {
      // A tela anterior já estaria parcialmente revelada pelo dedo: começa proporcionalmente mais perto
      const w = swipeAreaWidth || window.innerWidth;
      return { x: -0.3 * w + swipeOffsetPx * 0.3, opacity: 0.4, scale: 1, y: 0, zIndex: 1, position: 'relative' };
    }
    if (navDirection === 'pop') return { x: '-30%', opacity: 0, scale: 1, y: 0, zIndex: 1, position: 'relative' };
    return { opacity: 0, x: 0, scale: 1, y: 0, zIndex: 1 };
  },
  get visivel() {
    if (!isMobileNav()) {
      return {
        opacity: 1, scale: 1, y: 0, x: 0,
        transition: { type: 'spring', stiffness: 520, damping: 38, mass: 0.55, opacity: { duration: 0.13, ease: 'easeOut' } },
      };
    }
    if (navDirection === 'tab') return { opacity: 1, x: 0, scale: 1, y: 0, transition: { duration: 0.18, ease: 'easeOut' } };
    if (navDirection === 'instant') return { opacity: 1, x: 0, scale: 1, y: 0, transition: { duration: 0 } };
    return { opacity: 1, x: 0, scale: 1, y: 0, transition: { x: IOS_NAV, opacity: { duration: 0.3, ease: 'easeOut' } } };
  },
  get saindo() {
    if (!isMobileNav()) return { opacity: 0, scale: 0.99, y: -4, transition: { duration: 0.08, ease: [0.32, 0, 0.67, 0] } };
    if (navDirection === 'push') return { ...exitOverlay(), x: '-30%', opacity: 0, zIndex: 1, transition: { ...OVERLAY_T, x: IOS_NAV, opacity: { duration: 0.22, ease: 'easeOut' } } };
    if (navDirection === 'pop') return { ...exitOverlay(), x: '100%', opacity: 0, zIndex: 2, transition: { ...OVERLAY_T, x: IOS_NAV, opacity: { duration: 0.3, ease: 'easeIn' } } };
    if (navDirection === 'popSwipe') {
      // Continua de onde o dedo soltou até sair pela direita
      const w = swipeAreaWidth || window.innerWidth;
      return { ...exitOverlay(), x: [swipeOffsetPx, w], opacity: 0, zIndex: 2, transition: { ...OVERLAY_T, x: { type: 'spring', stiffness: 380, damping: 40, mass: 0.7 }, opacity: { duration: 0.25, ease: 'easeIn' } } };
    }
    if (navDirection === 'instant') return { ...exitOverlay(), opacity: 0, transition: { ...OVERLAY_T, opacity: { duration: 0 } } };
    // Troca de aba / volta para a capa: a tela que sai sai do fluxo na hora (a nova não é empurrada para baixo)
    return { ...exitOverlay(), opacity: 0, transition: { ...OVERLAY_T, opacity: { duration: 0.12, ease: 'easeIn' } } };
  },
};

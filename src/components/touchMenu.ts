// ===== Pop-ups no toque (celular/tablet), como os menus do iOS =====
// Ao encostar numa opção, ela ganha o mesmo destaque do "passar o mouse" do computador. Mantendo o dedo
// na tela, dá para arrastar entre as opções (o destaque acompanha) e a opção só é escolhida ao soltar.
// Soltar fora das opções não escolhe nada.

const OPTION_SELECTOR = '[data-popup-content="true"] button.group.w-full, [data-popup-content="true"] [data-popup-option]';
const ACTIVE_ATTR = 'data-touch-active';

function optionAt(x: number, y: number, popup: Element): HTMLElement | null {
  const el = document.elementFromPoint(x, y) as HTMLElement | null;
  const option = el?.closest?.(OPTION_SELECTOR) as HTMLElement | null;
  return option && popup.contains(option) && !(option as HTMLButtonElement).disabled ? option : null;
}

// A lista do pop-up rola? Então o arrasto vertical continua rolando a lista (sem escolher por arrasto)
function scrollsVertically(from: HTMLElement, popup: Element): boolean {
  let el: HTMLElement | null = from;
  while (el && el !== popup.parentElement) {
    const oy = getComputedStyle(el).overflowY;
    if ((oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight + 1) return true;
    el = el.parentElement;
  }
  return false;
}

export function installTouchMenus(): () => void {
  if (typeof document === 'undefined') return () => {};
  let popup: Element | null = null;
  let active: HTMLElement | null = null;
  let start: { x: number; y: number } | null = null;
  let dragging = false;
  let scrollable = false;

  const setActive = (el: HTMLElement | null) => {
    if (active === el) return;
    active?.removeAttribute(ACTIVE_ATTR);
    active = el;
    active?.setAttribute(ACTIVE_ATTR, 'true');
    // Leve toque tátil ao passar para outra opção (Android; o iOS ignora)
    if (el && dragging) { try { navigator.vibrate?.(4); } catch { /* sem vibração */ } }
  };
  const reset = () => {
    setActive(null);
    popup = null;
    start = null;
    dragging = false;
  };

  const onStart = (e: TouchEvent) => {
    if (e.touches.length !== 1) { reset(); return; }
    const target = e.target as HTMLElement | null;
    const option = target?.closest?.(OPTION_SELECTOR) as HTMLElement | null;
    if (!option) { reset(); return; }
    popup = option.closest('[data-popup-content="true"]');
    start = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    dragging = false;
    scrollable = popup ? scrollsVertically(option, popup) : false;
    setActive(option);
  };

  const onMove = (e: TouchEvent) => {
    if (!start || !popup) return;
    const t = e.touches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (!dragging) {
      if (Math.hypot(dx, dy) < 6) return;
      // Lista com rolagem: o gesto rola a lista, como sempre
      if (scrollable && Math.abs(dy) > Math.abs(dx)) { reset(); return; }
      dragging = true;
    }
    if (e.cancelable) e.preventDefault();
    setActive(optionAt(t.clientX, t.clientY, popup));
  };

  const onEnd = (e: TouchEvent) => {
    if (!start) return;
    const chosen = active;
    const wasDragging = dragging;
    // O destaque fica um instante (como ao clicar no computador) e some
    const highlighted = active;
    active = null;
    popup = null;
    start = null;
    dragging = false;
    if (highlighted) setTimeout(() => highlighted.removeAttribute(ACTIVE_ATTR), 160);
    if (!wasDragging) return; // toque simples: o clique normal do navegador escolhe a opção
    // Arrastou: o navegador não gera o clique; escolhe a opção sob o dedo ao soltar
    if (e.cancelable) e.preventDefault();
    chosen?.click();
  };

  document.addEventListener('touchstart', onStart, { passive: true, capture: true });
  document.addEventListener('touchmove', onMove, { passive: false, capture: true });
  document.addEventListener('touchend', onEnd, { passive: false, capture: true });
  document.addEventListener('touchcancel', reset, { passive: true, capture: true });
  return () => {
    document.removeEventListener('touchstart', onStart, { capture: true } as any);
    document.removeEventListener('touchmove', onMove, { capture: true } as any);
    document.removeEventListener('touchend', onEnd, { capture: true } as any);
    document.removeEventListener('touchcancel', reset, { capture: true } as any);
  };
}

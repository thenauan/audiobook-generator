// ===== Bordas das áreas com rolagem sem "linha seca" =====
// Nas listas que rolam (pop-ups, folhas, resultados da pesquisa e letra do player em tela cheia), o
// conteúdo se dissolve suavemente na borda em vez de ser cortado. A transição só aparece do lado em que
// ainda há conteúdo para rolar: no início da lista não há efeito em cima, e no fim não há embaixo —
// assim nada importante ou clicável fica coberto quando a lista está parada nas pontas.

// Áreas com o efeito (as mesmas do CSS em index.css)
export const SCROLL_FADE_SELECTOR = [
  '[data-scroll-fade]',
  '.fullscreen-transcript',
  '[data-popup-content="true"].overflow-y-auto',
  '[data-popup-content="true"] .overflow-y-auto',
  '[data-mobile-sheet] .overflow-y-auto',
  '[data-mobile-confirm] .overflow-y-auto',
].join(', ');

function update(el: HTMLElement) {
  const canScroll = el.scrollHeight > el.clientHeight + 1;
  const top = canScroll && el.scrollTop > 1;
  const bottom = canScroll && el.scrollTop + el.clientHeight < el.scrollHeight - 1;
  if (top) el.setAttribute('data-fade-top', ''); else el.removeAttribute('data-fade-top');
  if (bottom) el.setAttribute('data-fade-bottom', ''); else el.removeAttribute('data-fade-bottom');
}

export function installScrollFades(): () => void {
  if (typeof document === 'undefined') return () => {};
  const observed = new WeakSet<Element>();
  const resizeObserver = typeof ResizeObserver !== 'undefined'
    ? new ResizeObserver(entries => entries.forEach(e => update(e.target as HTMLElement)))
    : null;

  let scheduled = false;
  const scan = () => {
    scheduled = false;
    document.querySelectorAll<HTMLElement>(SCROLL_FADE_SELECTOR).forEach(el => {
      update(el);
      if (resizeObserver && !observed.has(el)) {
        observed.add(el);
        resizeObserver.observe(el);
        // O conteúdo interno também muda de tamanho (itens carregando, páginas do menu)
        if (el.firstElementChild) resizeObserver.observe(el.firstElementChild);
      }
    });
  };
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(scan);
  };

  const onScroll = (e: Event) => {
    const el = e.target as HTMLElement;
    if (el?.matches?.(SCROLL_FADE_SELECTOR)) update(el);
  };
  const mutationObserver = new MutationObserver(schedule);
  mutationObserver.observe(document.body, { childList: true, subtree: true });
  document.addEventListener('scroll', onScroll, { capture: true, passive: true });
  schedule();
  return () => {
    mutationObserver.disconnect();
    resizeObserver?.disconnect();
    document.removeEventListener('scroll', onScroll, { capture: true } as any);
  };
}

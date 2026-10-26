// ===== Ajustes do aparelho (rodam uma vez, antes do app) =====
// Marcam no <html> o que a interface precisa saber do aparelho: rolagem ativa, teclado aberto,
// rotação, lado do notch no celular deitado, Safari do iPhone e app instalado na tela de início.
export {};

// Barras de rolagem aparecem só enquanto algo é rolado e somem logo depois
if (typeof document !== 'undefined') {
  const scrollTimers = new WeakMap<Element, ReturnType<typeof setTimeout>>();
  document.addEventListener('scroll', (e) => {
    const target = e.target instanceof Element ? e.target : document.scrollingElement;
    if (!target) return;
    target.classList.add('is-scrolling');
    const prev = scrollTimers.get(target);
    if (prev) clearTimeout(prev);
    scrollTimers.set(target, setTimeout(() => target.classList.remove('is-scrolling'), 800));
  }, { capture: true, passive: true });
}

// Teclado virtual aberto (campo de texto em foco e a área visível encolheu): esconde barra de abas e miniplayer
if (typeof document !== 'undefined') {
  const isTextField = (el: EventTarget | null) =>
    el instanceof HTMLTextAreaElement ||
    (el instanceof HTMLInputElement && !['checkbox', 'radio', 'range', 'file', 'button', 'submit'].includes(el.type));
  const updateKeyboard = () => {
    const vv = window.visualViewport;
    const open = isTextField(document.activeElement) && !!vv && window.innerHeight - vv.height > 120;
    document.documentElement.classList.toggle('keyboard-open', open);
  };
  document.addEventListener('focusin', () => setTimeout(updateKeyboard, 300));
  document.addEventListener('focusout', () => setTimeout(updateKeyboard, 50));
  window.visualViewport?.addEventListener('resize', updateKeyboard);
}

// Ao girar o aparelho, a interface some e reaparece rapidamente enquanto os itens se reorganizam
if (typeof window !== 'undefined' && window.matchMedia) {
  const mq = window.matchMedia('(orientation: portrait)');
  let rotateTimer: ReturnType<typeof setTimeout> | null = null;
  const onRotate = () => {
    if (!window.matchMedia('(pointer: coarse)').matches) return;
    const root = document.documentElement;
    root.classList.remove('is-rotating');
    void root.offsetWidth;
    root.classList.add('is-rotating');
    if (rotateTimer) clearTimeout(rotateTimer);
    rotateTimer = setTimeout(() => root.classList.remove('is-rotating'), 420);
  };
  mq.addEventListener?.('change', onRotate);
}

// Celular deitado com proporção de aparelho com notch/Dynamic Island (≈ 19,5:9): marca o lado do recorte
// (landscape-primary: topo do aparelho à esquerda; landscape-secondary: à direita)
if (typeof window !== 'undefined') {
  const updateNotchSide = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const isPhoneLandscape = w > h && h <= 600 && w / h >= 1.9 && !!window.matchMedia?.('(pointer: coarse)').matches;
    const type = (screen.orientation && screen.orientation.type) || '';
    const side = !isPhoneLandscape ? '' : type === 'landscape-secondary' ? 'right' : 'left';
    if (side) document.documentElement.setAttribute('data-notch', side);
    else document.documentElement.removeAttribute('data-notch');
  };
  updateNotchSide();
  window.addEventListener('resize', updateNotchSide);
  screen.orientation?.addEventListener?.('change', updateNotchSide);
}

// iPhone/iPad no Safari (não instalado): a barra de status fica sobre a página com um desfoque do sistema,
// mas a área segura do topo vem zerada. Reserva essa faixa para o cabeçalho não ficar por baixo dela.
if (typeof window !== 'undefined') {
  const ua = navigator.userAgent || '';
  const isIOS = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const isStandalone = (navigator as any).standalone === true || !!window.matchMedia?.('(display-mode: standalone)').matches;
  if (isIOS && !isStandalone) {
    const probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;top:0;visibility:hidden;padding-top:env(safe-area-inset-top);';
    document.documentElement.appendChild(probe);
    const top = parseFloat(getComputedStyle(probe).paddingTop) || 0;
    probe.remove();
    if (top < 20) document.documentElement.classList.add('ios-safari');
  }
}

// App instalado (aberto pela tela de início)
if (typeof window !== 'undefined') {
  const standalone = (navigator as any).standalone === true || !!window.matchMedia?.('(display-mode: standalone)').matches;
  if (standalone) document.documentElement.classList.add('standalone');
}

// iOS Safari só aplica o estado :active (destaque ao tocar) se houver um ouvinte de toque
if (typeof document !== 'undefined') {
  document.addEventListener('touchstart', () => {}, { passive: true });
}

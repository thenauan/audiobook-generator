// ===== Navegação entre telas =====
// Uma pilha de telas como a do iOS: abrir uma tela empilha a atual; "voltar" desempilha. Telas raiz
// (as abas) zeram a pilha. Cada nível também vira uma entrada no histórico do navegador, então o
// "voltar" do sistema (Android/navegador) e o gesto da borda esquerda funcionam. Pop-ups, folhas e
// confirmações abertos entram na mesma conta (useBackLayer) e são fechados antes de voltar de tela.
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { canZoomCloseTo, requestZoomClose } from '../components/ZoomTransitionLayer';
import { captureExitScroll, setNavDirection, setSwipeRelease } from './transitions';

export interface Screen {
  id: string;
  data?: any;
}

// Chave única de uma tela (mesma tela com dados diferentes = telas diferentes)
export const getScreenKey = (s: Screen) => `${s.id}:${s.data?.id ?? ''}`;

// ----- Camadas que o "voltar" fecha primeiro (folhas, confirmações, telas cheias) -----
type BackLayer = { id: number; close: () => void };
let layers: BackLayer[] = [];
let layerSeq = 0;
const layerListeners = new Set<() => void>();
const emitLayers = () => layerListeners.forEach(l => l());

// Registra uma camada aberta: enquanto "active", o voltar do sistema/gesto a fecha antes de trocar de tela
export function useBackLayer(active: boolean, close: () => void) {
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    if (!active) return;
    const layer = { id: ++layerSeq, close: () => closeRef.current() };
    layers = [...layers, layer];
    emitLayers();
    return () => {
      layers = layers.filter(l => l !== layer);
      emitLayers();
    };
  }, [active]);
}

function useLayerCount() {
  const [count, setCount] = useState(layers.length);
  useEffect(() => {
    const update = () => setCount(layers.length);
    layerListeners.add(update);
    return () => { layerListeners.delete(update); };
  }, []);
  return count;
}

export function useAppNavigation({
  initialScreen,
  rootIds,
  mainScrollRef,
}: {
  initialScreen: Screen;
  rootIds: string[];
  mainScrollRef: RefObject<HTMLDivElement | null>;
}) {
  const [activeScreen, setActiveScreen] = useState<Screen>(initialScreen);
  const [historyStack, setHistoryStack] = useState<Screen[]>([]);

  // Abrir pela capa/foto (emitZoomOrigin) já tem a expansão própria: a tela só aparece, sem deslizar
  const lastZoomOriginAtRef = useRef(0);
  useEffect(() => {
    const onZoom = () => { lastZoomOriginAtRef.current = Date.now(); };
    window.addEventListener('zoom-origin', onZoom);
    return () => window.removeEventListener('zoom-origin', onZoom);
  }, []);

  // opts.push: abre uma tela raiz como subtela (com voltar) — ex.: Ajustes aberto a partir de "Mais" no celular
  const navigateTo = useCallback((screenId: string, data?: any, opts?: { push?: boolean }) => {
    captureExitScroll(mainScrollRef.current);
    window.dispatchEvent(new Event('close-all-popups'));
    const isRoot = rootIds.includes(screenId) && !opts?.push;
    const openedByZoom = Date.now() - lastZoomOriginAtRef.current < 400;
    setNavDirection(isRoot || openedByZoom ? 'tab' : 'push');
    if (isRoot) setHistoryStack([]);
    else setHistoryStack(prev => [...prev, activeScreen]);
    setActiveScreen({ id: screenId, data });
    if (mainScrollRef.current) mainScrollRef.current.scrollTop = 0;
  }, [rootIds, mainScrollRef, activeScreen]);

  const goBack = useCallback(() => {
    if (historyStack.length === 0) return;
    captureExitScroll(mainScrollRef.current);
    window.dispatchEvent(new Event('close-all-popups'));
    const prev = historyStack[historyStack.length - 1];
    setNavDirection('pop');
    // Tela aberta por um card: volta "para dentro" dele, se o card estiver na tela de destino
    const zoomKey: string | undefined = activeScreen.data?.zoomKey;
    if (zoomKey && canZoomCloseTo(zoomKey, getScreenKey(prev))) {
      setNavDirection('tab');
      requestZoomClose(zoomKey);
    }
    setHistoryStack(curr => curr.slice(0, -1));
    setActiveScreen(prev);
    if (mainScrollRef.current) mainScrollRef.current.scrollTop = 0;
  }, [historyStack, activeScreen, mainScrollRef]);

  // ----- Histórico do navegador: cada nível (tela ou camada) é uma entrada -----
  const layerCount = useLayerCount();
  const navDepth = historyStack.length + layerCount;
  const browserDepthRef = useRef(0);
  const ignorePopRef = useRef(0);
  const systemBackRef = useRef<() => void>(() => {});
  systemBackRef.current = () => {
    // Primeiro fecha a última camada aberta; depois, pop-ups; por fim, volta de tela
    const top = layers[layers.length - 1];
    if (top) { top.close(); return; }
    if (document.querySelector('[data-popup-content="true"]')) {
      window.dispatchEvent(new Event('close-all-popups'));
      return;
    }
    goBack();
  };
  useEffect(() => {
    if (!window.history?.pushState) return;
    if (navDepth > browserDepthRef.current) {
      while (browserDepthRef.current < navDepth) {
        browserDepthRef.current += 1;
        window.history.pushState({ appDepth: browserDepthRef.current }, '');
      }
    } else if (navDepth < browserDepthRef.current) {
      const n = browserDepthRef.current - navDepth;
      browserDepthRef.current = navDepth;
      ignorePopRef.current += 1;
      window.history.go(-n);
    }
  }, [navDepth]);

  // No Safari, arrastar da borda também faz o navegador voltar sozinho: evita voltar duas vezes
  const edgeSwipeRef = useRef({ pendingBack: false, backAt: 0, edgeTouchAt: 0 });
  useEffect(() => {
    const onPop = () => {
      if (ignorePopRef.current > 0) { ignorePopRef.current -= 1; return; }
      const swipe = edgeSwipeRef.current;
      const now = Date.now();
      if (swipe.pendingBack) {
        swipe.pendingBack = false;
      } else if (now - swipe.backAt < 1200) {
        window.history.pushState({ appDepth: browserDepthRef.current }, '');
        return;
      } else if (now - swipe.edgeTouchAt < 1500) {
        // Só o navegador voltou (já animou com a própria prévia): troca de tela sem animar de novo
        setNavDirection('instant');
        const el = mainScrollRef.current;
        if (el) { el.style.transition = ''; el.style.transform = ''; }
      }
      browserDepthRef.current = Math.max(0, browserDepthRef.current - 1);
      systemBackRef.current();
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [mainScrollRef]);

  // ----- Gesto da borda esquerda: a tela acompanha o dedo e, ao soltar, termina de sair -----
  const pendingSwipeResetRef = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    const el = pendingSwipeResetRef.current;
    if (!el) return;
    pendingSwipeResetRef.current = null;
    el.style.transition = '';
    el.style.transform = '';
  }, [activeScreen]);
  const navDepthRef = useRef(navDepth);
  navDepthRef.current = navDepth;
  useEffect(() => {
    let start: { x: number; y: number; t: number } | null = null;
    let active = false;
    let target: HTMLElement | null = null;
    const EDGE = 24;
    const isRtl = () => document.documentElement.dir === 'rtl';
    const reset = (animateBack: boolean) => {
      if (target) {
        target.style.transition = animateBack ? 'transform 0.28s cubic-bezier(0.22, 1, 0.36, 1)' : '';
        target.style.transform = '';
        const el = target;
        setTimeout(() => { el.style.transition = ''; }, 300);
      }
      start = null; active = false; target = null;
    };
    const onStart = (e: TouchEvent) => {
      if (navDepthRef.current === 0 || e.touches.length !== 1) return;
      const x = e.touches[0].clientX;
      const fromEdge = isRtl() ? window.innerWidth - x : x;
      if (fromEdge > EDGE) return;
      if ((e.target as HTMLElement)?.closest?.('input, textarea, [data-popup-content="true"]')) return;
      edgeSwipeRef.current.edgeTouchAt = Date.now();
      start = { x, y: e.touches[0].clientY, t: performance.now() };
    };
    const onMove = (e: TouchEvent) => {
      if (!start) return;
      const dxRaw = e.touches[0].clientX - start.x;
      const dx = isRtl() ? -dxRaw : dxRaw;
      const dy = e.touches[0].clientY - start.y;
      if (!active) {
        if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) { start = null; return; }
        if (dx < 10) return;
        // Com uma camada aberta (folha/confirmação), o gesto só fecha a camada
        if (layers.length > 0) { start = null; systemBackRef.current(); return; }
        active = true;
        target = mainScrollRef.current;
      }
      if (e.cancelable) e.preventDefault();
      if (target) target.style.transform = `translateX(${(isRtl() ? -1 : 1) * Math.max(0, dx) * 0.85}px)`;
    };
    const onEnd = (e: TouchEvent) => {
      if (!start || !active) { reset(false); return; }
      const dxRaw = (e.changedTouches[0]?.clientX ?? start.x) - start.x;
      const dx = isRtl() ? -dxRaw : dxRaw;
      const dt = Math.max(1, performance.now() - start.t);
      const shouldGoBack = dx > window.innerWidth * 0.32 || (dx > 50 && dx / dt > 0.5);
      if (shouldGoBack && target) {
        const el = target;
        start = null; active = false; target = null;
        // A tela atual continua saindo a partir da posição do dedo (pela animação da troca de telas)
        setSwipeRelease(Math.max(0, dx * 0.85), el.clientWidth);
        setNavDirection('popSwipe');
        pendingSwipeResetRef.current = el;
        edgeSwipeRef.current.pendingBack = true;
        edgeSwipeRef.current.backAt = Date.now();
        window.history.back();
      } else {
        reset(true);
      }
    };
    const onCancel = () => reset(true);
    document.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd, { passive: true });
    document.addEventListener('touchcancel', onCancel, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onStart);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
      document.removeEventListener('touchcancel', onCancel);
    };
  }, [mainScrollRef]);

  return { activeScreen, historyStack, navigateTo, goBack };
}

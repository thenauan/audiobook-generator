// ===== Efeitos visuais: modo leve e pausa fora de foco =====
// - Modo leve (Ajustes › Interface e configuração inicial): sem desfoque de fundo, cards opacos e fundos de
//   cor parados, para computadores mais fracos. Classe `lite` no <html> (regras em index.css).
// - Fora de foco (janela minimizada, escondida ou em segundo plano): todas as animações param e voltam ao
//   focar. Classe `app-paused` no <html> para as animações em CSS; os fundos animados leem `paused`.
import { useSyncExternalStore } from 'react';

type Estado = { lite: boolean; paused: boolean };
let estado: Estado = { lite: false, paused: typeof document !== 'undefined' ? (document.hidden || !document.hasFocus()) : false };
const ouvintes = new Set<() => void>();

function aplicar(novo: Partial<Estado>) {
  const proximo = { ...estado, ...novo };
  if (proximo.lite === estado.lite && proximo.paused === estado.paused) return;
  estado = proximo;
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('lite', estado.lite);
    document.documentElement.classList.toggle('app-paused', estado.paused);
  }
  ouvintes.forEach(o => o());
}

export const setLiteMode = (lite: boolean) => aplicar({ lite });

if (typeof window !== 'undefined') {
  const atualizar = () => aplicar({ paused: document.hidden || !document.hasFocus() });
  window.addEventListener('focus', atualizar);
  window.addEventListener('blur', atualizar);
  document.addEventListener('visibilitychange', atualizar);
  document.documentElement.classList.toggle('app-paused', estado.paused);
}

/** { lite, paused } sempre atualizados */
export function useMotionPrefs(): Estado {
  return useSyncExternalStore(
    cb => { ouvintes.add(cb); return () => { ouvintes.delete(cb); }; },
    () => estado,
    () => estado,
  );
}

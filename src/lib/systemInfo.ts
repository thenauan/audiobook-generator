// ===== Configuração do computador =====
// Lê processador e memória (pelo servidor local) e diz se o computador é fraco, para sugerir o modo leve
// na configuração inicial, em Ajustes › Sistema e sobre e uma vez nas notificações do cabeçalho.
import { useEffect, useState } from 'react';

export interface SystemInfo {
  cores: number;
  cpuModel: string;
  ramGB: number;
  /** Computador fraco: o modo leve é recomendado */
  weak: boolean;
  /** Por que é fraco (ex.: "4 núcleos", "4 GB de memória") */
  reasons: string[];
  /** Resumo para mostrar (ex.: "Intel Core i5 · 4 núcleos · 8 GB") */
  summary: string;
  simulated?: boolean;
}

// Linhas de processador de entrada, mesmo com vários núcleos
const PROCESSADOR_BASICO = /\b(celeron|pentium|atom|athlon|sempron|e[12]-\d{3,4}|a[46]-\d{4}|mediatek|snapdragon 7c)\b/i;

export function avaliarComputador(cores: number, ramGB: number, cpuModel: string): SystemInfo {
  const reasons: string[] = [];
  if (cores > 0 && cores <= 4) reasons.push(`${cores} núcleos de processador`);
  if (ramGB > 0 && ramGB < 7.5) reasons.push(`${Math.round(ramGB)} GB de memória`);
  if (PROCESSADOR_BASICO.test(cpuModel)) reasons.push('processador de entrada');
  const nome = cpuModel.replace(/\((R|TM)\)/gi, '').replace(/\s+CPU\b.*$/i, '').replace(/\s+@.*$/, '').trim();
  return {
    cores, cpuModel, ramGB, weak: reasons.length > 0, reasons,
    summary: [nome, cores ? `${cores} núcleos` : '', ramGB ? `${Math.round(ramGB)} GB` : ''].filter(Boolean).join(' · '),
  };
}

let cache: SystemInfo | null = null;
let pedido: Promise<SystemInfo | null> | null = null;
const ouvintes = new Set<(s: SystemInfo | null) => void>();

export function getSystemInfo(): Promise<SystemInfo | null> {
  if (cache) return Promise.resolve(cache);
  if (!pedido) {
    pedido = fetch('/api/system-info')
      .then(r => r.json())
      .then(d => (cache = avaliarComputador(Number(d.cores) || 0, Number(d.ramGB) || 0, String(d.cpuModel || ''))))
      .catch(() => {
        // Sem servidor: o que o navegador sabe (núcleos e, em alguns, memória aproximada)
        const nav = navigator as Navigator & { deviceMemory?: number };
        if (!nav.hardwareConcurrency) return null;
        return (cache = avaliarComputador(nav.hardwareConcurrency, nav.deviceMemory || 0, ''));
      });
  }
  return pedido;
}

/** Modo de Desenvolvedor: finge um computador fraco (até recarregar) */
export function simularComputadorFraco() {
  cache = { ...avaliarComputador(2, 4, 'Intel(R) Celeron(R) N4020 CPU @ 1.10GHz'), simulated: true };
  pedido = Promise.resolve(cache);
  ouvintes.forEach(f => f(cache));
  return cache;
}

export function useSystemInfo(): SystemInfo | null {
  const [info, setInfo] = useState<SystemInfo | null>(cache);
  useEffect(() => {
    let vivo = true;
    getSystemInfo().then(s => { if (vivo) setInfo(s); });
    const ouvir = (s: SystemInfo | null) => setInfo(s);
    ouvintes.add(ouvir);
    return () => { vivo = false; ouvintes.delete(ouvir); };
  }, []);
  return info;
}

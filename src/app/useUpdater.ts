// ===== Atualizações automáticas (GitHub Releases) =====
// Procura a versão mais recente ao abrir o app (e a cada 6 h), baixa e instala sozinho quando "Atualizar
// automaticamente" está ligado, e avisa tudo nas notificações do cabeçalho. A versão nova vale depois de
// reiniciar. O Modo de Desenvolvedor simula o fluxo inteiro sem baixar nada.
import { useCallback, useEffect, useRef, useState } from 'react';

export interface UpdateInfo {
  current: string;
  latest: string;
  available: boolean;
  notes: string;
  url?: string;
  publishedAt?: string;
  downloadSize?: number;
  canInstall: boolean;
  devFolder?: boolean;
  simulated?: boolean;
}

export type UpdateStage = 'idle' | 'checking' | 'downloading' | 'installing' | 'deps' | 'ready' | 'restarting' | 'error';

export interface UpdateStatus {
  stage: UpdateStage;
  progress: number;
  version?: string;
  message?: string;
}

const safeGet = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const safeSet = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* bloqueado */ } };
const SEIS_HORAS = 6 * 60 * 60 * 1000;

const NOTAS_SIMULADAS = `# 🚀 Audiobook Generator with AI — Version 9.9.9

Simulação do Modo de Desenvolvedor: nada é baixado nem instalado.

### Added
- **Recurso de teste:** uma novidade fictícia para conferir a lista de novidades.
- Outra novidade, com um texto um pouco mais longo para ver como a lista quebra as linhas.

### Fixed
- Uma correção fictícia.`;

export function useUpdater(
  showToast: (msg: string, opcoes?: { action?: () => void; duration?: number }) => void,
  abrirAtualizacoes: () => void,
  conversoesAtivas: boolean,
) {
  const [autoUpdate, setAutoUpdateState] = useState(() => safeGet('auto_update') !== 'false');
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({ stage: 'idle', progress: 0 });
  const [updateError, setUpdateError] = useState<string | null>(null);
  const poll = useRef<ReturnType<typeof setInterval> | null>(null);
  const simulacao = useRef<ReturnType<typeof setInterval> | null>(null);
  const ultimaEtapa = useRef<UpdateStage>('idle');
  const avisar = useRef(showToast);
  avisar.current = showToast;
  const abrir = useRef(abrirAtualizacoes);
  abrir.current = abrirAtualizacoes;

  const setAutoUpdate = useCallback((v: boolean) => {
    setAutoUpdateState(v);
    safeSet('auto_update', v ? 'true' : 'false');
  }, []);

  // Avisos no cabeçalho a cada mudança de etapa
  const aplicarStatus = useCallback((s: UpdateStatus) => {
    setUpdateStatus(s);
    if (s.stage === ultimaEtapa.current) return;
    ultimaEtapa.current = s.stage;
    const v = s.version ? ` ${s.version}` : '';
    const ir = { action: () => abrir.current() };
    if (s.stage === 'downloading') avisar.current(`Baixando a atualização${v}…`, ir);
    else if (s.stage === 'installing') avisar.current(`Instalando a atualização${v}…`, ir);
    else if (s.stage === 'deps') avisar.current(`Instalando os componentes novos da versão${v}…`, ir);
    else if (s.stage === 'ready') avisar.current(`Atualização${v} instalada: reinicie o app para usar`, { ...ir, duration: 10000 });
    else if (s.stage === 'error') avisar.current(`A atualização falhou: ${s.message || 'erro desconhecido'}`, { ...ir, duration: 8000 });
  }, []);

  const pararPoll = () => { if (poll.current) { clearInterval(poll.current); poll.current = null; } };
  const acompanhar = useCallback(() => {
    pararPoll();
    poll.current = setInterval(async () => {
      try {
        const s: UpdateStatus = await (await fetch('/api/update/status')).json();
        aplicarStatus(s);
        if (s.stage === 'ready' || s.stage === 'error' || s.stage === 'idle') pararPoll();
      } catch { /* servidor ocupado: tenta no próximo */ }
    }, 800);
  }, [aplicarStatus]);

  // ----- Simulação (Modo de Desenvolvedor) -----
  const simularInstalacao = useCallback((versao: string) => {
    if (simulacao.current) clearInterval(simulacao.current);
    let p = 0;
    aplicarStatus({ stage: 'downloading', progress: 0, version: versao });
    simulacao.current = setInterval(() => {
      p += 0.08;
      if (p < 1) aplicarStatus({ stage: 'downloading', progress: p, version: versao });
      else if (p < 1.5) aplicarStatus({ stage: 'installing', progress: (p - 1) * 2, version: versao });
      else {
        clearInterval(simulacao.current!);
        simulacao.current = null;
        aplicarStatus({ stage: 'ready', progress: 1, version: versao });
      }
    }, 250);
  }, [aplicarStatus]);

  const simulateUpdate = useCallback(() => {
    const info: UpdateInfo = {
      current: updateInfo?.current || '0.0.0', latest: '9.9.9', available: true, notes: NOTAS_SIMULADAS,
      canInstall: true, simulated: true, downloadSize: 5_900_000,
    };
    ultimaEtapa.current = 'idle';
    setUpdateError(null);
    setUpdateStatus({ stage: 'idle', progress: 0 });
    setUpdateInfo(info);
    avisar.current('Nova versão 9.9.9 disponível (simulação): ver novidades', { action: () => abrir.current(), duration: 8000 });
  }, [updateInfo]);

  // ----- Instalar -----
  const installUpdate = useCallback(async () => {
    if (!updateInfo?.available) return;
    if (updateInfo.simulated) { simularInstalacao(updateInfo.latest); return; }
    if (!updateInfo.canInstall) {
      avisar.current(updateInfo.devFolder ? 'Pasta de desenvolvimento (git): atualize com git pull' : 'Esta versão não tem instalador para este sistema');
      return;
    }
    setUpdateError(null);
    try {
      const r = await fetch('/api/update/install', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const d = await r.json();
      if (!r.ok) { aplicarStatus({ stage: 'error', progress: 0, message: d.error }); return; }
      aplicarStatus({ stage: 'downloading', progress: 0, version: updateInfo.latest });
      acompanhar();
    } catch {
      aplicarStatus({ stage: 'error', progress: 0, message: 'o serviço local não respondeu' });
    }
  }, [updateInfo, simularInstalacao, aplicarStatus, acompanhar]);

  // ----- Procurar -----
  const checkForUpdates = useCallback(async (manual = false) => {
    if (manual) setUpdateStatus(s => (s.stage === 'idle' || s.stage === 'error' ? { stage: 'checking', progress: 0 } : s));
    setUpdateError(null);
    try {
      const info = await (await fetch('/api/update/check')).json();
      if (info.error) {
        setUpdateError(info.error);
        if (manual) avisar.current(`Não foi possível procurar atualizações: ${info.error}`);
        setUpdateStatus(s => (s.stage === 'checking' ? { stage: 'idle', progress: 0 } : s));
        return null;
      }
      setUpdateInfo(info);
      setUpdateStatus(s => (s.stage === 'checking' ? { stage: 'idle', progress: 0 } : s));
      if (!info.available) {
        if (manual) avisar.current(`Você já está na versão mais recente (${info.current})`);
        return info as UpdateInfo;
      }
      const automatico = safeGet('auto_update') !== 'false';
      if (automatico && info.canInstall && !manual) {
        avisar.current(`Nova versão ${info.latest} disponível: baixando automaticamente`, { action: () => abrir.current() });
      } else {
        avisar.current(`Nova versão ${info.latest} disponível: ver novidades`, { action: () => abrir.current(), duration: 8000 });
      }
      return info as UpdateInfo;
    } catch {
      if (manual) avisar.current('Não foi possível procurar atualizações: o serviço local não respondeu');
      setUpdateStatus(s => (s.stage === 'checking' ? { stage: 'idle', progress: 0 } : s));
      return null;
    }
  }, []);

  // Automático: ao abrir (depois de alguns segundos) e a cada 6 h; instala sozinho se estiver ligado
  const instalarAuto = useRef(false);
  useEffect(() => {
    const rodar = async () => {
      // Uma atualização em andamento (ex.: a janela foi recarregada) continua sendo acompanhada
      try {
        const s: UpdateStatus = await (await fetch('/api/update/status')).json();
        if (s.stage !== 'idle') { aplicarStatus(s); if (s.stage !== 'ready' && s.stage !== 'error') acompanhar(); return; }
      } catch { /* sem servidor */ }
      const info = await checkForUpdates(false);
      if (info?.available && info.canInstall && safeGet('auto_update') !== 'false') instalarAuto.current = true;
    };
    const inicio = setTimeout(rodar, 5000);
    const repetir = setInterval(rodar, SEIS_HORAS);
    return () => { clearTimeout(inicio); clearInterval(repetir); pararPoll(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (instalarAuto.current && updateInfo?.available && !updateInfo.simulated) {
      instalarAuto.current = false;
      installUpdate();
    }
  }, [updateInfo, installUpdate]);

  // ----- Reiniciar -----
  const restartToUpdate = useCallback(async () => {
    if (conversoesAtivas) {
      avisar.current('Há conversões em andamento: reinicie depois que elas terminarem');
      return;
    }
    if (updateInfo?.simulated) {
      avisar.current('Simulação: o app seria reiniciado agora com a versão 9.9.9');
      setUpdateInfo(null);
      ultimaEtapa.current = 'idle';
      setUpdateStatus({ stage: 'idle', progress: 0 });
      return;
    }
    setUpdateStatus(s => ({ ...s, stage: 'restarting' }));
    avisar.current('Reiniciando o app com a versão nova…', { duration: 60000 });
    try { await fetch('/api/update/restart', { method: 'POST' }); } catch { /* o servidor já está fechando */ }
    // Espera o servidor voltar e recarrega a interface
    const inicio = Date.now();
    await new Promise(ok => setTimeout(ok, 2500));
    for (;;) {
      try { if ((await fetch('/api/health', { cache: 'no-store' })).ok) break; } catch { /* ainda reiniciando */ }
      if (Date.now() - inicio > 180000) { avisar.current('O app não voltou sozinho: feche e abra de novo'); return; }
      await new Promise(ok => setTimeout(ok, 1500));
    }
    window.location.reload();
  }, [conversoesAtivas, updateInfo]);

  return { autoUpdate, setAutoUpdate, updateInfo, updateStatus, updateError, checkForUpdates, installUpdate, restartToUpdate, simulateUpdate };
}

// ===== Ajustes salvos em disco =====
// Os ajustes ficam no armazenamento da janela, que é separado por endereço (porta) e por programa (navegador ou
// app): abrindo o app de outro jeito, os ajustes voltavam ao padrão. Agora cada mudança também é gravada num
// arquivo na pasta do usuário (~/.audiobook-generator/settings.json), que é carregado antes de o app abrir.

// Listas grandes têm arquivo próprio (Convertidos fica em library.json)
const FORA = new Set(['audiobook_history', 'audiobook_generated_texts']);

function retrato(): Record<string, string> {
  const dados: Record<string, string> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && !FORA.has(k)) dados[k] = localStorage.getItem(k) ?? '';
    }
  } catch { /* armazenamento bloqueado */ }
  return dados;
}

let timer: ReturnType<typeof setTimeout> | undefined;
function gravar() {
  clearTimeout(timer);
  timer = undefined;
  fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ settings: retrato() }), keepalive: true }).catch(() => {});
}
function agendar() {
  clearTimeout(timer);
  timer = setTimeout(gravar, 400);
}

/** Carrega os ajustes do disco para a janela e passa a gravar cada mudança. Chamar antes de desenhar o app. */
export async function loadSettingsFromDisk(): Promise<void> {
  try {
    const controle = new AbortController();
    const limite = setTimeout(() => controle.abort(), 2000);
    const r = await (await fetch('/api/settings', { signal: controle.signal })).json();
    clearTimeout(limite);
    if (r.exists && r.settings && typeof r.settings === 'object') {
      for (const [k, v] of Object.entries(r.settings)) {
        if (!FORA.has(k) && typeof v === 'string') localStorage.setItem(k, v);
      }
    } else {
      gravar(); // primeira vez: leva para o disco os ajustes que já estavam nesta janela
    }
  } catch { /* sem servidor: usa os ajustes da janela */ }

  const original = { setItem: Storage.prototype.setItem, removeItem: Storage.prototype.removeItem, clear: Storage.prototype.clear };
  Storage.prototype.setItem = function (k: string, v: string) {
    original.setItem.call(this, k, v);
    if (this === localStorage && !FORA.has(k)) agendar();
  };
  Storage.prototype.removeItem = function (k: string) {
    original.removeItem.call(this, k);
    if (this === localStorage && !FORA.has(k)) agendar();
  };
  Storage.prototype.clear = function () {
    original.clear.call(this);
    if (this === localStorage) agendar();
  };
  // Fechando a janela com uma mudança ainda não gravada
  window.addEventListener('pagehide', () => { if (timer) gravar(); });
}

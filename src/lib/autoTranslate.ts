// ===== Tradução da interface =====
// Os textos do app estão em português direto no código. Em outro idioma, esta camada troca o texto que aparece
// na tela (e title, placeholder e aria-label) usando src/data/i18n/<idioma>.json, gerado por
// scripts/gerar-traducoes.cjs. Modelos como "Converter {0} e-books" mantêm o valor do meio. Em português nada
// disso roda. Campos de texto não são tocados, e [translate="no"] protege títulos e textos do usuário.

type Dicionario = Record<string, string>;

// Espanhol, árabe e russo foram traduzidos por máquina (o inglês foi revisto à mão): o usuário é avisado no idioma dele
export const AVISO_TRADUCAO_AUTOMATICA: Record<string, string> = {
  'es-ES': 'Traducción automática: puede contener errores.',
  'ar-SA': 'ترجمة آلية: قد تحتوي على أخطاء.',
  'ru-RU': 'Автоматический перевод: возможны ошибки.',
};
interface Modelo { regex: RegExp; texto: string }

const CARREGAR: Record<string, () => Promise<{ default: Dicionario }>> = {
  'en-US': () => import('../data/i18n/en-US.json'),
  'es-ES': () => import('../data/i18n/es-ES.json'),
  'ar-SA': () => import('../data/i18n/ar-SA.json'),
  'ru-RU': () => import('../data/i18n/ru-RU.json'),
};
const ATRIBUTOS = ['title', 'placeholder', 'aria-label'];
const LIMITE = 600; // texto mais longo que isso é conteúdo (livro, legenda), não interface

let dicionario: Dicionario | null = null;
let modelos: Modelo[] = [];
let cache = new Map<string, string>();
let observador: MutationObserver | null = null;
let pedidoAtual = 0;

// O que está na tela -> o texto original (para não traduzir de novo e para voltar ao português)
const textosOriginais = new WeakMap<Text, { original: string; mostrado: string }>();
const atributosOriginais = new WeakMap<Element, Record<string, { original: string; mostrado: string }>>();

const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function prepararModelos(d: Dicionario): Modelo[] {
  return Object.keys(d)
    .filter(k => /\{\d+\}/.test(k) && k.replace(/\{\d+\}/g, '').trim().length >= 3)
    .sort((a, b) => b.length - a.length) // o modelo mais específico primeiro
    .map(k => {
      const ordem: number[] = [];
      const corpo = k.split(/(\{\d+\})/).map(p => {
        const m = p.match(/^\{(\d+)\}$/);
        if (!m) return escapar(p);
        ordem.push(Number(m[1]));
        return '(.*?)';
      }).join('');
      const regex = new RegExp(`^${corpo}$`, 's');
      (regex as RegExp & { ordem?: number[] }).ordem = ordem;
      return { regex, texto: d[k] };
    });
}

function traduzirTexto(texto: string, profundidade = 0): string {
  if (!dicionario) return texto;
  const limpo = texto.trim();
  if (limpo.length < 2 || limpo.length > LIMITE || !/\p{L}/u.test(limpo)) return texto;
  const emCache = cache.get(limpo);
  let saida = emCache;
  if (saida === undefined) {
    saida = dicionario[limpo];
    if (saida === undefined) {
      saida = limpo;
      for (const m of modelos) {
        const r = limpo.match(m.regex);
        if (!r) continue;
        const ordem = (m.regex as RegExp & { ordem?: number[] }).ordem || [];
        saida = m.texto;
        ordem.forEach((n, i) => {
          // O valor do meio pode ser outro texto do app ("Voz" dentro de uma frase)
          const valor = profundidade < 2 ? traduzirTexto(r[i + 1], profundidade + 1) : r[i + 1];
          saida = saida!.split(`{${n}}`).join(valor);
        });
        break;
      }
    }
    if (cache.size > 5000) cache = new Map();
    cache.set(limpo, saida);
  }
  if (saida === limpo) return texto;
  const inicio = texto.match(/^\s*/)?.[0] || '';
  const fim = texto.match(/\s*$/)?.[0] || '';
  return inicio + saida + fim;
}

const protegido = (el: Element | null) => !el || Boolean(el.closest('[translate="no"], script, style, textarea, code, pre'));

function aplicarTexto(no: Text) {
  const atual = no.data;
  const reg = textosOriginais.get(no);
  if (reg && reg.mostrado === atual) return; // já é a nossa tradução
  if (protegido(no.parentElement)) return;
  const novo = traduzirTexto(atual);
  if (novo === atual) { textosOriginais.delete(no); return; }
  textosOriginais.set(no, { original: atual, mostrado: novo });
  no.data = novo;
}

function aplicarAtributo(el: Element, nome: string) {
  const atual = el.getAttribute(nome);
  if (!atual || protegido(el.parentElement)) return;
  const regs = atributosOriginais.get(el) || {};
  if (regs[nome]?.mostrado === atual) return;
  const novo = traduzirTexto(atual);
  if (novo === atual) return;
  regs[nome] = { original: atual, mostrado: novo };
  atributosOriginais.set(el, regs);
  el.setAttribute(nome, novo);
}

function percorrer(raiz: Node, fazer: (no: Text) => void, fazerEl: (el: Element) => void) {
  if (raiz.nodeType === Node.TEXT_NODE) { fazer(raiz as Text); return; }
  if (raiz.nodeType !== Node.ELEMENT_NODE) return;
  fazerEl(raiz as Element);
  const andar = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  for (let n = andar.nextNode(); n; n = andar.nextNode()) {
    if (n.nodeType === Node.TEXT_NODE) fazer(n as Text); else fazerEl(n as Element);
  }
}

const traduzirElemento = (el: Element) => ATRIBUTOS.forEach(a => { if (el.hasAttribute(a)) aplicarAtributo(el, a); });

function restaurarTudo() {
  percorrer(document.body, (no) => {
    const reg = textosOriginais.get(no);
    if (reg && reg.mostrado === no.data) no.data = reg.original;
    textosOriginais.delete(no);
  }, (el) => {
    const regs = atributosOriginais.get(el);
    if (!regs) return;
    for (const [nome, r] of Object.entries(regs)) if (el.getAttribute(nome) === r.mostrado) el.setAttribute(nome, r.original);
    atributosOriginais.delete(el);
  });
}

/** Liga a tradução no idioma pedido (português desliga e devolve os textos originais). */
export async function applyInterfaceLanguage(lang: string): Promise<void> {
  const pedido = ++pedidoAtual;
  observador?.disconnect();
  observador = null;
  if (dicionario) restaurarTudo();
  dicionario = null;
  modelos = [];
  cache = new Map();
  const carregar = CARREGAR[lang];
  if (!carregar) return;
  const d = (await carregar()).default;
  if (pedido !== pedidoAtual) return; // o idioma mudou de novo enquanto carregava
  dicionario = d;
  modelos = prepararModelos(d);
  percorrer(document.body, aplicarTexto, traduzirElemento);
  observador = new MutationObserver((mudancas) => {
    for (const m of mudancas) {
      if (m.type === 'characterData') aplicarTexto(m.target as Text);
      else if (m.type === 'attributes') aplicarAtributo(m.target as Element, m.attributeName!);
      else m.addedNodes.forEach(n => percorrer(n, aplicarTexto, traduzirElemento));
    }
  });
  observador.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATRIBUTOS });
}

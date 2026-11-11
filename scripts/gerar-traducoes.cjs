// Gera os dicionários da interface (src/data/i18n/<idioma>.json) a partir do próprio código:
//   node scripts/gerar-traducoes.cjs            traduz só os textos novos
//   node scripts/gerar-traducoes.cjs --listar   só mostra quantos textos existem
//   node scripts/gerar-traducoes.cjs --offline  sem internet: só o glossário e o que já existe
// Os textos são lidos da árvore do TypeScript (literais, modelos com ${...} e texto de JSX) e das mensagens do
// motor. O que já está em src/translations.ts vale como glossário; o resto passa pelo tradutor do Google.
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const RAIZ = path.resolve(__dirname, '..');
const SAIDA = path.join(RAIZ, 'src', 'data', 'i18n');
const IDIOMAS = { 'en-US': 'en', 'es-ES': 'es', 'ar-SA': 'ar', 'ru-RU': 'ru' };
const FORA = /(translations\.ts|i18n\.tsx|data[\\/]i18n|data[\\/]defaults|data[\\/]voices|voiceSamples|edgeVoices|autoTranslate|\.d\.ts$)/;
const ATRIBUTOS_DE_CODIGO = new Set(['className', 'style', 'key', 'id', 'd', 'fill', 'stroke', 'viewBox', 'href', 'src', 'type', 'role', 'name', 'accept', 'transition', 'variants', 'initial', 'animate', 'exit']);

// Termos do app: tradução fixa (o tradutor erraria sem contexto)
const GLOSSARIO = {
  'Ajustes': { 'en-US': 'Settings', 'es-ES': 'Ajustes', 'ar-SA': 'الإعدادات', 'ru-RU': 'Настройки' },
  'Ligado': { 'en-US': 'On', 'es-ES': 'Activado', 'ar-SA': 'تشغيل', 'ru-RU': 'Вкл.' },
  'Desligado': { 'en-US': 'Off', 'es-ES': 'Desactivado', 'ar-SA': 'إيقاف', 'ru-RU': 'Выкл.' },
  'Sim': { 'en-US': 'Yes', 'es-ES': 'Sí', 'ar-SA': 'نعم', 'ru-RU': 'Да' },
  'Não': { 'en-US': 'No', 'es-ES': 'No', 'ar-SA': 'لا', 'ru-RU': 'Нет' },
  'Modo leve': { 'en-US': 'Lite mode', 'es-ES': 'Modo ligero', 'ar-SA': 'الوضع الخفيف', 'ru-RU': 'Облегчённый режим' },
  'Capa': { 'en-US': 'Cover', 'es-ES': 'Portada', 'ar-SA': 'الغلاف', 'ru-RU': 'Обложка' },
  'Voz': { 'en-US': 'Voice', 'es-ES': 'Voz', 'ar-SA': 'الصوت', 'ru-RU': 'Голос' },
  'Alta': { 'en-US': 'High', 'es-ES': 'Alta', 'ar-SA': 'عالية', 'ru-RU': 'Высокое' },
  'Máxima': { 'en-US': 'Maximum', 'es-ES': 'Máxima', 'ar-SA': 'قصوى', 'ru-RU': 'Максимальное' },
  'Padrão': { 'en-US': 'Standard', 'es-ES': 'Estándar', 'ar-SA': 'قياسية', 'ru-RU': 'Стандартное' },
  'Escuro': { 'en-US': 'Dark', 'es-ES': 'Oscuro', 'ar-SA': 'داكن', 'ru-RU': 'Тёмная' },
  'Claro': { 'en-US': 'Light', 'es-ES': 'Claro', 'ar-SA': 'فاتح', 'ru-RU': 'Светлая' },
  'Tema': { 'en-US': 'Theme', 'es-ES': 'Tema', 'ar-SA': 'المظهر', 'ru-RU': 'Тема' },
};

function pareceInterface(s) {
  const t = s.trim();
  if (t.length < 2 || !/[A-Za-zÀ-ÿ]{2,}/.test(t)) return false;
  if (/^(https?:|data:|mailto:|\.{0,2}\/|image\/|audio\/|application\/|text\/)/.test(t)) return false;
  if (/^[a-z0-9_.:\/#%\-\[\]()]+$/.test(t)) return false; // identificadores e classes
  if (/^[A-Z0-9_]+$/.test(t) || /^[a-z]+[A-Z]\w*$/.test(t)) return false;
  if (/Neural$|^(calc|var|rgba?|hsla?|linear-gradient|cubic-bezier)\(|^\$|^\d[\d.,]*\s?(MB|GB|KB|px|ms|s)?$|\.(epub|pdf|mobi|txt|m4b|mp3)$/i.test(t)) return false;
  if (/(^|\s)(hover:|dark:|max-md:|sm:|md:)?(bg|text|flex|rounded|px|py|pl|pr|absolute|relative|items|border|shadow|w|h|gap|inset|z|top|left)-/.test(t)) return false;
  if (/=>|<\/?[a-z]|\bimport\b|\bfunction\b|[{;]\s*$/.test(t)) return false;
  return true;
}

function extrairDoTypeScript(arquivo, textos) {
  const codigo = fs.readFileSync(arquivo, 'utf8');
  const fonte = ts.createSourceFile(arquivo, codigo, ts.ScriptTarget.Latest, true, arquivo.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const ignorar = (no) => {
    const p = no.parent;
    if (!p) return false;
    if (ts.isImportDeclaration(p) || ts.isExportDeclaration(p) || ts.isLiteralTypeNode(p)) return true;
    if (ts.isJsxAttribute(p) || (ts.isJsxExpression(p) && ts.isJsxAttribute(p.parent))) {
      const atributo = ts.isJsxAttribute(p) ? p : p.parent;
      return ATRIBUTOS_DE_CODIGO.has(atributo.name.getText(fonte));
    }
    if (ts.isCallExpression(p) && /^(cn|clsx|require|fetch|safeGet|safeSet|getItem|setItem|removeItem|addEventListener|removeEventListener|querySelector)$/.test(p.expression.getText(fonte).split('.').pop())) return true;
    if (ts.isPropertyAssignment(p) && p.name === no) return true;
    if (ts.isElementAccessExpression(p) || ts.isCaseClause(p)) return false;
    return false;
  };
  const visitar = (no) => {
    if ((ts.isStringLiteral(no) || ts.isNoSubstitutionTemplateLiteral(no)) && !ignorar(no)) {
      if (pareceInterface(no.text)) textos.add(no.text.trim());
    } else if (ts.isTemplateExpression(no) && !ignorar(no)) {
      let s = no.head.text;
      no.templateSpans.forEach((sp, i) => { s += `{${i}}` + sp.literal.text; });
      if (pareceInterface(s.replace(/\{\d+\}/g, ' '))) textos.add(s.trim());
    } else if (ts.isJsxText(no)) {
      const s = no.text.replace(/\s+/g, ' ').trim();
      if (/[A-Za-zÀ-ÿ]{2,}/.test(s)) textos.add(s);
    }
    ts.forEachChild(no, visitar);
  };
  visitar(fonte);
}

function extrairDoMotor(textos) {
  for (const nome of ['converter.py', 'book_structure.py', 'audio_output.py']) {
    // Frases quebradas em duas linhas de código viram uma só, como chegam na tela
    const codigo = fs.readFileSync(path.join(RAIZ, nome), 'utf8').replace(/"\s*\r?\n\s*f?"/g, '');
    for (const m of codigo.matchAll(/(f?)"([A-ZÀ-Ý][^"\n]* [^"\n]+)"/g)) {
      let n = 0;
      const s = m[1] ? m[2].replace(/\{[^{}]+\}/g, () => `{${n++}}`) : m[2];
      if (pareceInterface(s.replace(/\{\d+\}/g, ' '))) textos.add(s.trim());
    }
  }
}

function listar(pasta, saida = []) {
  for (const nome of fs.readdirSync(pasta)) {
    const p = path.join(pasta, nome);
    if (fs.statSync(p).isDirectory()) listar(p, saida);
    else if (/\.tsx?$/.test(nome) && !FORA.test(p)) saida.push(p);
  }
  return saida;
}

// Pares já traduzidos à mão em src/translations.ts: pt-BR -> idioma, pela mesma chave
function glossarioDoApp() {
  const codigo = fs.readFileSync(path.join(RAIZ, 'src', 'translations.ts'), 'utf8');
  const blocos = {};
  for (const m of codigo.matchAll(/'([a-z]{2}-[A-Z]{2})':\s*\{([\s\S]*?)\n  \},?/g)) {
    blocos[m[1]] = Object.fromEntries([...m[2].matchAll(/^\s*(\w+):\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")/gm)].map(x => [x[1], (x[2] ?? x[3]).replace(/\\'/g, "'")]));
  }
  const pares = {};
  for (const [chave, pt] of Object.entries(blocos['pt-BR'] || {})) {
    if (!pareceInterface(pt)) continue;
    pares[pt] = {};
    for (const lang of Object.keys(IDIOMAS)) if (blocos[lang]?.[chave]) pares[pt][lang] = blocos[lang][chave];
  }
  return pares;
}

// Bloqueio do Google (página "sorry"): para na hora. Insistir só prolonga o bloqueio, que também afeta a tradução
// de livros do app nesta conexão. O que já foi traduzido fica salvo; rode de novo mais tarde.
class Bloqueado extends Error {}
const PAUSA_MS = 20000;
const espera = (ms) => new Promise(ok => setTimeout(ok, ms));

async function pedir(texto, alvo) {
  await espera(PAUSA_MS);
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=pt&tl=${alvo}&dt=t`;
  const r = await fetch(url, {
    method: 'POST', redirect: 'manual', body: new URLSearchParams({ q: texto }),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  if (!r.ok) throw new Bloqueado(`O tradutor respondeu ${r.status}.`);
  return (await r.json())[0].map(p => p[0]).join('');
}

const marcas = (s) => (s.match(/\{\d+\}/g) || []).sort().join();
// {0} vira um número protegido por colchetes duplos, que o tradutor costuma manter
const proteger = (s) => s.replace(/\{(\d+)\}/g, '[[$1]]');
const restaurar = (s) => s.replace(/\[\s*\[\s*(\d+)\s*\]\s*\]/g, '{$1}');

// Um pedido por lote; se o número de linhas não bater, divide o lote ao meio (nunca um pedido por texto)
async function traduzirLote(lote, alvo, guardar) {
  const linhas = (await pedir(lote.map(proteger).join('\n'), alvo)).split('\n');
  if (linhas.length === lote.length) {
    const res = {};
    lote.forEach((s, i) => {
      const t = restaurar(linhas[i]).trim();
      if (t && marcas(t) === marcas(s)) res[s] = t; // marca perdida: fica em português
    });
    guardar(res);
  } else if (lote.length > 1) {
    const meio = Math.ceil(lote.length / 2);
    await traduzirLote(lote.slice(0, meio), alvo, guardar);
    await traduzirLote(lote.slice(meio), alvo, guardar);
  }
}

(async () => {
  const textos = new Set();
  for (const a of [...listar(path.join(RAIZ, 'src')), path.join(RAIZ, 'server.ts')]) extrairDoTypeScript(a, textos);
  extrairDoMotor(textos);
  const lista = [...textos].filter(s => !s.includes('\n')).sort();
  console.log(`${lista.length} textos, ${lista.reduce((n, s) => n + s.length, 0)} caracteres`);
  if (process.argv.includes('--listar')) {
    fs.writeFileSync(process.argv[process.argv.indexOf('--listar') + 1] || 'textos.json', JSON.stringify(lista, null, 1));
    return;
  }
  const semRede = process.argv.includes('--offline'); // só o glossário e o que já foi traduzido
  const doApp = glossarioDoApp();
  fs.mkdirSync(SAIDA, { recursive: true });
  for (const [lang, alvo] of Object.entries(IDIOMAS)) {
    const arquivo = path.join(SAIDA, `${lang}.json`);
    const atual = fs.existsSync(arquivo) ? JSON.parse(fs.readFileSync(arquivo, 'utf8')) : {};
    const fixos = {};
    for (const [pt, tr] of Object.entries(doApp)) if (tr[lang]) fixos[pt] = tr[lang];
    for (const [pt, tr] of Object.entries(GLOSSARIO)) fixos[pt] = tr[lang];
    const salvar = () => {
      const final = {};
      for (const s of [...lista, ...Object.keys(fixos)].sort()) {
        const v = fixos[s] ?? atual[s];
        if (v && v !== s) final[s] = v;
      }
      fs.writeFileSync(arquivo, JSON.stringify(final, null, 0));
      return Object.keys(final).length;
    };
    salvar();
    const faltando = semRede ? [] : lista.filter(s => !(s in atual) && !(s in fixos));
    console.log(`${lang}: faltam ${faltando.length}`);
    let lote = [], tamanho = 0;
    const enviar = async () => {
      if (!lote.length) return;
      await traduzirLote(lote, alvo, (res) => { Object.assign(atual, res); salvar(); });
      lote = []; tamanho = 0;
    };
    try {
      for (const s of faltando) {
        if (tamanho + s.length > 1500) await enviar();
        lote.push(s); tamanho += s.length + 1;
      }
      await enviar();
    } catch (e) {
      console.error(`Parado: ${e.message} Rode de novo mais tarde; o que já foi traduzido está salvo.`);
      process.exit(2);
    }
    console.log(`${lang}: ${salvar()} entradas`);
  }
})();

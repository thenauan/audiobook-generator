// Abre o app na versão otimizada (npm start). Recompila a interface só quando o código é mais novo que a
// versão compilada (primeira vez ou depois de uma atualização) e prepara o servidor; depois inicia.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(raiz);

function maisRecente(alvo) {
  if (!fs.existsSync(alvo)) return 0;
  const st = fs.statSync(alvo);
  if (!st.isDirectory()) return st.mtimeMs;
  let max = 0;
  for (const nome of fs.readdirSync(alvo)) {
    if (nome === 'samples') continue; // trechos temporários de audiobook não pedem recompilar
    max = Math.max(max, maisRecente(path.join(alvo, nome)));
  }
  return max;
}

function rodar(rotulo, comando) {
  console.log(rotulo);
  const r = spawnSync(comando, { stdio: 'inherit', shell: true });
  if (r.status !== 0) {
    console.error(`Falhou: ${comando}`);
    process.exit(r.status || 1);
  }
}

const compilado = path.join(raiz, 'dist', 'index.html');
const codigo = Math.max(maisRecente('src'), maisRecente('index.html'), maisRecente('public'), maisRecente('package.json'));
if (!fs.existsSync(compilado) || fs.statSync(compilado).mtimeMs < codigo) {
  rodar('Preparando a interface (só na primeira vez ou depois de uma atualização)...', 'npx vite build --logLevel warn');
}

const servidor = path.join(raiz, 'server.mjs');
if (!fs.existsSync(servidor) || fs.statSync(servidor).mtimeMs < maisRecente('server.ts')) {
  rodar('Preparando o servidor...', 'npx esbuild server.ts --bundle --platform=node --format=esm --outfile=server.mjs --external:express --external:vite --external:multer --external:@vitejs/plugin-react --external:@tailwindcss/vite --log-level=warning');
}

await import(pathToFileURL(servidor).href);

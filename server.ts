import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import multer from "multer";
import { spawn, execFile, execFileSync } from "child_process";
import fs from "fs";
import net from "net";
import os from "os";
import https from "https";
import http from "http";

// Python do sistema (no Windows "python3" costuma não existir ou abrir a Microsoft Store) e saída em UTF-8
const PYTHON_CMD = process.platform === 'win32' ? 'python' : 'python3';
const PY_ENV = { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' };

// Um erro inesperado em uma rota não pode derrubar o servidor (e com ele as conversões em andamento)
process.on('uncaughtException', (err) => console.error('Erro não tratado:', err));
process.on('unhandledRejection', (err) => console.error('Promessa rejeitada sem tratamento:', err));

// Mensagem clara a partir do erro do Python
function explainPythonFailure(stderr: string, code: number | null): string {
  // 0xC000013A: o Windows encerrou o processo com Ctrl+C ou ao fechar uma janela de console
  if (code === 3221225786 || code === -1073741510) {
    return 'A conversão foi interrompida por um sinal do Windows (Ctrl+C ou uma janela de console fechada). Converta de novo: o que já foi narrado fica salvo e a conversão continua de onde parou.';
  }
  const missing = stderr.match(/No module named '([^']+)'/);
  if (missing) return `Falta a biblioteca do Python "${missing[1]}". Rode o instalador de novo (ou: pip install ${missing[1].replace(/_/g, '-')}).`;
  if (/ENOENT|not recognized|não é reconhecido/i.test(stderr)) return 'Python não encontrado. Rode o instalador de novo.';
  if (/No space left|ENOSPC|espaço insuficiente/i.test(stderr)) return 'Sem espaço em disco na pasta de destino.';
  if (/Permission denied|EACCES|PermissionError/i.test(stderr)) return 'Sem permissão para gravar na pasta de destino. Escolha outra pasta em Ajustes › Armazenamento e pastas.';
  if (/MemoryError|out of memory/i.test(stderr)) return 'Faltou memória para converter este livro. Feche outros programas e converta de novo: o que já foi narrado fica salvo.';
  const last = stderr.trim().split('\n').filter(Boolean).pop();
  if (!last) {
    // Encerrado sem mensagem (pelo sistema, antivírus ou falta de memória)
    return 'A conversão foi interrompida pelo sistema. Converta de novo: o que já foi narrado fica salvo e a conversão continua de onde parou.';
  }
  return `A conversão parou inesperadamente${code !== null ? ` (código ${code})` : ''}: ${last.slice(0, 200)}`;
}

// Só o próprio computador acessa o servidor (ele abre pastas e lê arquivos locais).
// Para usar pela rede local de propósito, inicie com HOST=0.0.0.0.
const HOST = process.env.HOST || '127.0.0.1';

// Arquivos de áudio que podem virar prévia (evita copiar arquivos quaisquer para a pasta pública)
const AUDIO_EXTENSIONS = new Set(['.mp3', '.m4a', '.m4b', '.aac', '.ogg', '.opus', '.wav', '.flac']);

// Uma porta está livre só se ninguém a usa nem no endereço local nem em "todas as interfaces"
// (no Windows, os dois podem ser ocupados ao mesmo tempo por programas diferentes)
function isPortFree(port: number, host: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', (err: any) => {
      if (err.code === 'EADDRINUSE' || err.code === 'EACCES') resolve(false);
      else if (err.code === 'EADDRNOTAVAIL' || err.code === 'EAFNOSUPPORT') resolve(true); // sem IPv6 nesta máquina
      else reject(err);
    });
    server.listen(port, host, () => server.close(() => resolve(true)));
  });
}

async function getAvailablePort(startPort: number, extraHosts: string[] = []): Promise<number> {
  for (let port = startPort; port < startPort + 100; port++) {
    let free = true;
    // "::" (IPv4 + IPv6) é o único teste que acusa no Windows uma porta já aberta em todas as interfaces
    for (const host of ['::', '0.0.0.0', HOST, ...extraHosts]) {
      if (!(await isPortFree(port, host))) { free = false; break; }
    }
    if (free) return port;
  }
  throw new Error(`Nenhuma porta livre a partir de ${startPort}`);
}

const upload = multer({ 
  dest: path.join(process.cwd(), 'uploads/'),
  limits: {
    fileSize: 1024 * 1024 * 1024, // 1GB limit para suportar audiolivros completos
    // Os dados dos livros (capítulos com o texto inteiro e a capa em base64) vão num campo só;
    // o padrão de 1 MB por campo recusava livros longos ou com capa grande ("Field value too long")
    fieldSize: 512 * 1024 * 1024,
  }
});

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

async function startServer() {
  const app = express();
  const PORT = await getAvailablePort(Number(process.env.PORT) || 3000);
  // A recarga do Vite abre em "localhost", que no Windows pode ser o IPv6 (::1)
  const hmrPort = await getAvailablePort(24678, ['::1']);

  // Ensure uploads directory exists and is writable
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  // Sobras de conversões interrompidas (app fechado no meio): nenhuma conversão roda antes do servidor subir
  try {
    for (const name of fs.readdirSync(process.cwd())) {
      if (/^config_\d+\.json$/.test(name)) fs.rmSync(path.join(process.cwd(), name), { force: true });
    }
    for (const name of fs.readdirSync(uploadsDir)) fs.rmSync(path.join(uploadsDir, name), { force: true, recursive: true });
  } catch { /* limpeza opcional */ }
  try {
    fs.accessSync(uploadsDir, fs.constants.W_OK);
    console.log("Uploads directory is writable:", uploadsDir);
  } catch (err) {
    console.error("Uploads directory is NOT writable:", err);
  }

  // Clean up residual audio snippets on server startup to prevent public folder bloating
  const samplesDir = path.join(process.cwd(), 'public', 'samples');
  if (fs.existsSync(samplesDir)) {
    try {
      const files = fs.readdirSync(samplesDir);
      for (const file of files) {
        if (file.startsWith('snippet_')) {
          fs.unlinkSync(path.join(samplesDir, file));
        }
      }
    } catch (e) { }
  }

  app.use(express.json());

  // Logging middleware
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });

  // SSE endpoint for progress updates
  const clients = new Set<express.Response>();

  app.get("/api/progress", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    clients.add(res);
    // Reconexão: o app recebe de novo o último estado de cada livro (nenhum "concluído" se perde)
    for (const event of lastEventByFile.values()) {
      try { res.write(`data: ${JSON.stringify(event)}\n\n`); } catch { /* conexão já fechada */ }
    }
    // Mantém a conexão viva atrás de proxies e antivírus que derrubam conexões ociosas
    const ping = setInterval(() => { try { res.write(': ping\n\n'); } catch { /* fechada */ } }, 25000);

    req.on("close", () => {
      clearInterval(ping);
      clients.delete(res);
    });
  });

  // Último evento de cada livro (progresso, concluído ou erro), para quem reconectar
  const lastEventByFile = new Map<string, any>();

  function broadcastProgress(data: any) {
    if (data && data.fileId && data.type !== 'log' && data.type !== 'speed') {
      lastEventByFile.set(data.fileId, data);
      if (lastEventByFile.size > 200) lastEventByFile.delete(lastEventByFile.keys().next().value as string);
    }
    const message = `data: ${JSON.stringify(data)}\n\n`;
    for (const client of clients) {
      try { client.write(message); } catch { clients.delete(client); }
    }
  }

  // Backup system for user data
  app.get("/api/backup", (req, res) => {
    const backupPath = path.join(process.cwd(), 'user_data.json');
    if (fs.existsSync(backupPath)) res.json(JSON.parse(fs.readFileSync(backupPath, 'utf-8')));
    else res.json({});
  });

  app.post("/api/backup", (req, res) => {
    const backupPath = path.join(process.cwd(), 'user_data.json');
    fs.writeFileSync(backupPath, JSON.stringify(req.body, null, 2));
    res.json({ success: true });
  });

  // Global state to track background update downloads
  let updateDownloadProgress = 0;
  let updateDownloadStatus = 'idle';

  // Check for new releases on GitHub
  app.get("/api/check-update", async (req, res) => {
    try {
      const currentVersion = req.query.current as string;
      // Quando você criar o repositório, garanta que o nome seja 'audiobook-generator' ou altere a URL abaixo:
      const repoUrl = "https://api.github.com/repos/thenauan/audiobook-generator/releases/latest";
      
      const response = await fetch(repoUrl, {
        headers: { "User-Agent": "Audiobook-Generator-App" }
      });
      
      if (!response.ok) {
        if (response.status === 404) return res.json({ available: false, error: "Repositório ou release não encontrado ainda." });
        throw new Error("Falha ao checar atualizações");
      }
      
      const data = await response.json();
      const latestVersion = data.tag_name.replace('v', ''); // Limpa o 'v' (ex: v1.0.1 -> 1.0.1)
      const isNewer = latestVersion.localeCompare(currentVersion, undefined, { numeric: true, sensitivity: 'base' }) > 0;
      
      // Procura o arquivo .exe nos assets da release, caso contrário usa a URL padrão
      const asset = data.assets?.find((a: any) => a.name.endsWith('.exe')) || data.assets?.[0];
      const downloadUrl = asset ? asset.browser_download_url : data.html_url;
      
      res.json({ available: isNewer, latestVersion: latestVersion, url: data.html_url, downloadUrl: downloadUrl, notes: data.body });
    } catch (error) {
      res.status(500).json({ error: "Erro ao verificar atualizações" });
    }
  });

  // Monitor update download progress
  app.get("/api/update-status", (req, res) => {
    res.json({ status: updateDownloadStatus, progress: updateDownloadProgress });
  });

  // Trigger background update download directly from GitHub release assets
  app.post("/api/download-update", express.json(), (req, res) => {
    const url = req.body.url;
    if (!url) return res.status(400).json({ error: "No URL provided" });
    
    updateDownloadStatus = 'downloading';
    updateDownloadProgress = 0;
    const dest = path.join(process.cwd(), 'update_installer.exe');
    
    const downloadFile = (fileUrl: string) => {
      const client = fileUrl.startsWith('https') ? https : http;
      client.get(fileUrl, (response) => {
        // Segue redirects comuns no GitHub Releases
        if (response.statusCode === 301 || response.statusCode === 302) {
          return downloadFile(response.headers.location!);
        }
        const file = fs.createWriteStream(dest);
        const total = parseInt(response.headers['content-length'] || '0', 10);
        let downloaded = 0;
        
        response.on('data', (chunk) => {
          downloaded += chunk.length;
          if (total) updateDownloadProgress = Math.round((downloaded / total) * 100);
        });
        
        response.pipe(file);
        file.on('finish', () => { file.close(); updateDownloadStatus = 'ready'; });
      }).on('error', (err) => {
        updateDownloadStatus = 'error';
        fs.unlink(dest, () => {});
      });
    };
    
    downloadFile(url);
    res.json({ success: true });
  });

  // Launch the update installer detached from the main process and terminate the application
  app.post("/api/install-update", (req, res) => {
    const updatePath = path.join(process.cwd(), 'update_installer.exe');
    if (process.platform === 'win32') {
      if (fs.existsSync(updatePath)) {
        spawn(updatePath, [], { detached: true, stdio: 'ignore' });
        res.json({ success: true });
        setTimeout(() => process.exit(0), 1000);
      } else {
        res.status(404).json({ error: "Instalador não encontrado." });
      }
    } else {
      res.json({ success: true, message: "Instalação manual necessária neste SO." });
    }
  });

  app.get("/api/find-drive", (req, res) => {
    const userProfile = process.env.USERPROFILE || '';
    const possiblePaths = [
      'G:\\Meu Drive',
      'G:\\My Drive',
      path.join(userProfile, 'Google Drive'),
      path.join(userProfile, 'Meu Drive'),
      path.join(userProfile, 'My Drive')
    ];
    
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        const targetPath = path.join(p, 'Audiobooks');
        if (!fs.existsSync(targetPath)) {
          try { fs.mkdirSync(targetPath, { recursive: true }); } catch (e) {}
        }
        return res.json({ path: targetPath });
      }
    }
    res.json({ path: null });
  });

  // Leitura de e-books em fila: no máximo alguns ao mesmo tempo. Carregar 20 livros de uma vez abria 20
  // processos Python juntos (memória e CPU), e com uma conversão rodando alguns falhavam.
  const META_PARALELO = Math.max(2, Math.min(4, Math.floor(os.cpus().length / 2)));
  let metaAtivos = 0;
  const metaFila: Array<() => void> = [];
  const metaEntrar = () => new Promise<void>((resolve) => {
    if (metaAtivos < META_PARALELO) { metaAtivos++; resolve(); }
    else metaFila.push(() => { metaAtivos++; resolve(); });
  });
  const metaSair = () => {
    metaAtivos = Math.max(0, metaAtivos - 1);
    const proximo = metaFila.shift();
    if (proximo) proximo();
  };

  app.post("/api/metadata", (req, res, next) => {
    console.log("Incoming metadata request...");
    upload.single('file')(req, res, (err) => {
      if (err) {
        console.error("Multer error:", err);
        return res.status(400).json({ error: "File upload failed: " + err.message });
      }
      next();
    });
  }, async (req, res) => {
    console.log("Received metadata request for:", req.file?.originalname);
    try {
      if (!req.file) {
        console.error("No file in metadata request. Body:", req.body);
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      const originalExt = path.extname(req.body.filename || req.file.originalname);
      const newPath = req.file.path + originalExt;
      fs.renameSync(req.file.path, newPath);

      // O nome original vai junto: livros sem título nos metadados usam o nome do arquivo (não o nome temporário)
      const originalName = String(req.body.filename || req.file.originalname || '');
      await metaEntrar();
      let saiu = false;
      const liberar = () => { if (!saiu) { saiu = true; metaSair(); } };
      const pythonProcess = spawn(PYTHON_CMD, ['extract_metadata.py', newPath, originalName], { env: PY_ENV, windowsHide: true });
      // Um arquivo problemático não pode deixar o pedido pendurado para sempre
      const metaTimer = setTimeout(() => { try { pythonProcess.kill(); } catch { /* já terminou */ } }, 180000);
      console.log("Spawned python process for metadata extraction");
      
      pythonProcess.on('error', (err) => {
        liberar();
        console.error("Failed to start python process:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: `Não foi possível iniciar o Python (${PYTHON_CMD}): ${err.message}` });
        }
      });

      // Cada linha JSON do Python vai para o app assim que sai: primeiro capa/título/autor, depois os capítulos
      let buffer = '';
      let errorOutput = '';
      let sentAny = false;
      let gotFinal = false;
      const sendLine = (line: string) => {
        const text = line.trim();
        if (!text.startsWith('{')) return;
        try {
          const obj = JSON.parse(text);
          if (!obj.partial) gotFinal = true;
        } catch { return; }
        if (!sentAny) {
          res.status(200).setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
          sentAny = true;
        }
        res.write(text + '\n');
      };
      pythonProcess.stdout.setEncoding('utf8');
      pythonProcess.stdout.on('data', (data) => {
        buffer += data;
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        lines.forEach(sendLine);
      });
      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      pythonProcess.on('close', (code) => {
        liberar();
        clearTimeout(metaTimer);
        console.log(`Python process closed with code ${code}`);
        if (errorOutput) console.error("Python stderr:", errorOutput);
        try {
          if (fs.existsSync(newPath)) fs.unlinkSync(newPath);
        } catch (e) {
          console.error("Failed to delete temp file:", newPath);
        }
        if (buffer) sendLine(buffer);
        if (gotFinal) return res.end();
        const ultima = errorOutput.trim().split('\n').filter(Boolean).pop() || '';
        const message = code === 0
          ? 'a leitura do arquivo terminou incompleta'
          : code === null
            ? 'a leitura demorou demais e foi interrompida'
            : `o leitor de e-books falhou (código ${code}${ultima ? `: ${ultima.slice(0, 160)}` : ''})`;
        if (sentAny) {
          res.write(JSON.stringify({ error: message }) + '\n');
          return res.end();
        }
        console.error("Metadata extraction failed with code:", code, "Error:", errorOutput);
        res.status(500).json({ error: message });
      });
    } catch (error) {
      console.error("Error extracting metadata:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Todas as conversões em andamento (uma por pedido); "Cancelar" encerra todas
  const runningPythonProcesses = new Set<ReturnType<typeof spawn>>();

  app.post("/api/cancel", (req, res) => {
    const killed = runningPythonProcesses.size > 0;
    for (const proc of runningPythonProcesses) {
      (proc as any).__cancelled = true;
      const pid = proc.pid;
      if (!pid) continue;
      if (process.platform === 'win32') {
        // Encerra o Python e todos os filhos (ffmpeg, etc.)
        spawn('taskkill', ['/pid', String(pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true }).on('error', (err) => console.error("taskkill error:", err));
      } else {
        try { proc.kill('SIGKILL'); } catch (e) { console.error("kill error:", e); }
      }
    }
    runningPythonProcesses.clear();
    lastEventByFile.clear(); // os livros cancelados voltam para a fila no app; nada de estado antigo
    if (process.platform === 'win32') {
      // Força o encerramento de instâncias órfãs do FFmpeg para liberar CPU e RAM
      spawn('taskkill', ['/IM', 'ffmpeg.exe', '/F'], { stdio: 'ignore', windowsHide: true }).on('error', () => {});
    }
    broadcastProgress({ type: "log", message: "Processo cancelado e recursos liberados imediatamente." });
    res.json({ success: true, message: killed ? "Process tree and FFmpeg killed" : "Cleaned up" });
  });

  // Rotas para Tocar Trecho (Preview)
  app.use('/samples', express.static(path.join(process.cwd(), 'public', 'samples')));

  app.post("/api/snippet", express.json(), (req, res) => {
    const filePath = req.body.path;
    if (typeof filePath !== 'string' || !fs.existsSync(filePath)) return res.status(404).json({ error: "File not found" });
    if (!AUDIO_EXTENSIONS.has(path.extname(filePath).toLowerCase())) return res.status(400).json({ error: "Not an audio file" });

    const tempName = 'snippet_' + Date.now() + '.mp3';
    const samplesDir = path.join(process.cwd(), 'public', 'samples');
    const outputPath = path.join(samplesDir, tempName);

    if (!fs.existsSync(samplesDir)) fs.mkdirSync(samplesDir, { recursive: true });

    // Argumentos separados (sem montar linha de comando): caminhos com aspas não viram comandos
    execFile('ffmpeg', ['-y', '-t', '60', '-i', filePath, '-c', 'copy', outputPath], (error) => {
      if (error) fs.copyFileSync(filePath, outputPath); // Fallback caso não tenha ffmpeg
      res.json({ url: '/samples/' + tempName });
    });
  });

  app.post("/api/delete-snippet", express.json(), (req, res) => {
    const tempUrl = req.body.tempUrl;
    if (tempUrl) {
      const fileName = path.basename(tempUrl);
      const outputPath = path.join(process.cwd(), 'public', 'samples', fileName);
      if (fs.existsSync(outputPath)) { try { fs.unlinkSync(outputPath); } catch (e) {} }
    }
    res.json({ success: true });
  });

  // Wipe all snippets at once (used when triggering a new conversion batch)
  app.post("/api/clear-snippets", (req, res) => {
    const samplesDir = path.join(process.cwd(), 'public', 'samples');
    if (fs.existsSync(samplesDir)) {
      try {
        const files = fs.readdirSync(samplesDir);
        for (const file of files) {
          if (file.startsWith('snippet_')) fs.unlinkSync(path.join(samplesDir, file));
        }
      } catch (e) { }
    }
    res.json({ success: true });
  });

  // Limpeza de cache temporário (áudios parciais, amostras e uploads descartados)
  app.post("/api/clean-cache", express.json(), (req, res) => {
    try {
      let deletedCount = 0;
      
      // 1. Limpar snippets temporários em public/samples
      const samplesDir = path.join(process.cwd(), 'public', 'samples');
      if (fs.existsSync(samplesDir)) {
        try {
          const files = fs.readdirSync(samplesDir);
          for (const file of files) {
            if (file.startsWith('snippet_') || file.startsWith('preview_') || file.startsWith('temp_')) {
              try {
                fs.unlinkSync(path.join(samplesDir, file));
                deletedCount++;
              } catch (e) {}
            }
          }
        } catch (e) {}
      }

      // 2. Limpar arquivos temporários na pasta uploads
      const uploadsDir = path.join(process.cwd(), 'uploads');
      if (fs.existsSync(uploadsDir)) {
        try {
          const files = fs.readdirSync(uploadsDir);
          for (const file of files) {
            try {
              const p = path.join(uploadsDir, file);
              if (fs.statSync(p).isFile()) {
                fs.unlinkSync(p);
                deletedCount++;
              }
            } catch (e) {}
          }
        } catch (e) {}
      }

      // 3. Limpar diretórios de cache de áudio (.cache_audiobooks)
      const possibleCacheDirs = [
        path.join(process.cwd(), '.cache_audiobooks'),
        path.join(process.cwd(), 'meus audiobooks', '.cache_audiobooks')
      ];
      if (req.body && req.body.outputFolder) {
        possibleCacheDirs.push(path.join(req.body.outputFolder, '.cache_audiobooks'));
      }
      for (const cDir of possibleCacheDirs) {
        if (fs.existsSync(cDir)) {
          try {
            fs.rmSync(cDir, { recursive: true, force: true });
            deletedCount++;
          } catch (e) {}
        }
      }

      res.json({ success: true, message: "Cache limpo com sucesso!", deleted: deletedCount });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  // Exclui do computador os arquivos de um audiobook ou texto de Convertidos. Vão para a Lixeira (dá para
  // recuperar). Só aceita arquivos de áudio e de texto sincronizado, e pastas "(Audiobook)" que tenham só isso.
  const DELETABLE_EXT = new Set([...AUDIO_EXTENSIONS, '.lrc', '.srt', '.vtt', '.json']);
  const isDeletableFile = (p: string) => {
    const lower = p.toLowerCase();
    return DELETABLE_EXT.has(path.extname(lower)) && (!lower.endsWith('.json') || lower.endsWith('.sync.json'));
  };
  const sendToTrash = (targets: string[]) => new Promise<void>((resolve, reject) => {
    if (targets.length === 0) return resolve();
    if (process.platform === 'win32') {
      const script = "$ErrorActionPreference='Stop'; Add-Type -AssemblyName Microsoft.VisualBasic; " +
        "$itens = [Console]::In.ReadToEnd() | ConvertFrom-Json; foreach ($p in $itens) { " +
        "if (Test-Path -LiteralPath $p -PathType Container) { [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteDirectory($p, 'OnlyErrorDialogs', 'SendToRecycleBin') } " +
        "elseif (Test-Path -LiteralPath $p) { [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile($p, 'OnlyErrorDialogs', 'SendToRecycleBin') } }";
      const child = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], { windowsHide: true });
      let err = '';
      child.stderr.on('data', (d) => { err += d.toString(); });
      child.on('error', reject);
      child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(err.trim() || `código ${code}`))));
      child.stdin.end(JSON.stringify(targets));
    } else {
      // macOS/Linux: lixeira do sistema quando disponível; senão, exclui
      const trash = process.platform === 'darwin' ? null : 'gio';
      if (trash) {
        execFile(trash, ['trash', ...targets], (e) => {
          if (!e) return resolve();
          try { targets.forEach(t => fs.rmSync(t, { recursive: true, force: true })); resolve(); } catch (e2) { reject(e2); }
        });
      } else {
        const script = targets.map(t => `tell application "Finder" to delete (POSIX file ${JSON.stringify(t)})`);
        execFile('osascript', script.flatMap(l => ['-e', l]), (e) => {
          if (!e) return resolve();
          try { targets.forEach(t => fs.rmSync(t, { recursive: true, force: true })); resolve(); } catch (e2) { reject(e2); }
        });
      }
    }
  });

  app.post("/api/delete-files", express.json(), async (req, res) => {
    const pedidos: string[] = Array.isArray(req.body?.paths) ? req.body.paths.filter((p: any) => typeof p === 'string' && p.trim()) : [];
    const targets: string[] = [];
    const skipped: string[] = [];
    for (const raw of pedidos) {
      const p = path.resolve(raw);
      if (!fs.existsSync(p)) continue; // já não existe: nada a fazer
      const st = fs.statSync(p);
      if (st.isDirectory()) {
        // Pasta de "um arquivo por capítulo": só se tiver apenas áudio/texto do audiobook
        const nome = path.basename(p);
        const conteudo = fs.readdirSync(p);
        if (/\(Audiobook\)( \(\d+\))?$/.test(nome) && conteudo.every(f => isDeletableFile(f))) targets.push(p);
        else skipped.push(p);
      } else if (isDeletableFile(p)) {
        targets.push(p);
      } else {
        skipped.push(p);
      }
    }
    try {
      await sendToTrash([...new Set(targets)]);
      res.json({ success: true, deleted: targets.length, skipped });
    } catch (e: any) {
      res.status(500).json({ error: `Não foi possível excluir os arquivos: ${e?.message || e}`, skipped });
    }
  });

  // Texto sincronizado de um audiobook: nos metadados do arquivo (MP3: SYLT/USLT; M4B: ©lyr; FLAC/Opus: LYRICS)
  // e/ou ao lado dele na pasta (.lrc, .srt, .sync.json)
  // ===== Biblioteca (Convertidos) em disco =====
  // Antes ficava só no armazenamento da janela, que é separado por endereço (porta) e por programa (navegador
  // ou app): abrindo o app em outra porta ou janela, Convertidos aparecia vazio. Agora a lista fica também num
  // arquivo na pasta do usuário, igual para qualquer janela, e sobrevive a reinstalações.
  const LIB_DIR = path.join(os.homedir(), '.audiobook-generator');
  const LIB_FILE = path.join(LIB_DIR, 'library.json');
  app.get("/api/library", (req, res) => {
    try {
      if (!fs.existsSync(LIB_FILE)) return res.json({ exists: false, history: [], texts: [] });
      const data = JSON.parse(fs.readFileSync(LIB_FILE, 'utf8'));
      res.json({ exists: true, history: Array.isArray(data.history) ? data.history : [], texts: Array.isArray(data.texts) ? data.texts : [] });
    } catch (e) {
      res.json({ exists: false, history: [], texts: [], error: String(e) });
    }
  });
  app.post("/api/library", express.json({ limit: '200mb' }), (req, res) => {
    try {
      const history = Array.isArray(req.body?.history) ? req.body.history : null;
      const texts = Array.isArray(req.body?.texts) ? req.body.texts : null;
      if (!history || !texts) return res.status(400).json({ error: 'dados inválidos' });
      fs.mkdirSync(LIB_DIR, { recursive: true });
      const tmp = LIB_FILE + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify({ version: 1, history, texts }));
      fs.renameSync(tmp, LIB_FILE); // troca de uma vez: nunca fica um arquivo pela metade
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  // Audiobooks que estão na pasta de salvamento (para recuperar em Convertidos o que foi convertido em outra janela)
  app.post("/api/scan-library", express.json(), (req, res) => {
    const pasta = typeof req.body?.folder === 'string' ? path.resolve(req.body.folder) : '';
    if (!pasta || !fs.existsSync(pasta)) return res.json({ items: [] });
    execFile(PYTHON_CMD, ['library_scan.py', pasta], { env: PY_ENV, windowsHide: true, timeout: 180000, maxBuffer: 200 * 1024 * 1024 }, (err, stdout) => {
      try { res.json({ items: err ? [] : JSON.parse(String(stdout).trim() || '[]') }); }
      catch { res.json({ items: [] }); }
    });
  });

  app.post("/api/sync-text-status", express.json(), (req, res) => {
    const audio = typeof req.body?.path === 'string' ? path.resolve(req.body.path) : '';
    if (!audio || !fs.existsSync(audio) || !AUDIO_EXTENSIONS.has(path.extname(audio).toLowerCase())) {
      return res.json({ exists: false, embedded: false, files: [] });
    }
    const base = audio.slice(0, -path.extname(audio).length);
    const files = ['.lrc', '.sync.json', '.srt'].map(e => base + e).filter(f => fs.existsSync(f));
    const script = [
      'import sys, mutagen',
      'f = mutagen.File(sys.argv[1])',
      'ok = False',
      'if f is not None and f.tags is not None:',
      '    keys = [str(k) for k in f.tags.keys()]',
      '    ok = any(k.startswith(("SYLT", "USLT")) or k in ("\xa9lyr", "LYRICS", "lyrics") for k in keys)',
      'print("1" if ok else "0")',
    ].join('\n');
    execFile(PYTHON_CMD, ['-c', script, audio], { env: PY_ENV, windowsHide: true, timeout: 20000 }, (err, stdout) => {
      res.json({ exists: true, embedded: !err && String(stdout).trim() === '1', files });
    });
  });

  app.post("/api/open-folder", express.json(), (req, res) => {
    try {
      let folderPath = req.body.path || path.join(process.cwd(), 'meus audiobooks');
      folderPath = path.normalize(String(folderPath)); // Higieniza as barras pro Windows Explorer não se perder
      if (folderPath.includes('"')) return res.status(400).json({ success: false });
      const isFile = req.body.isFile;
      // A pasta de salvamento pode ter sido apagada: recria em vez de abrir outro lugar
      if (!isFile && !fs.existsSync(folderPath)) {
        try { fs.mkdirSync(folderPath, { recursive: true }); } catch { return res.status(404).json({ success: false }); }
      }
      
      // Programa + argumentos separados (sem shell): o caminho nunca é interpretado como comando
      let program: string;
      let args: string[];
      if (process.platform === 'win32') {
        program = 'explorer.exe';
        // Mesmo formato que o Explorer espera (/select,"caminho"); aspas não são válidas em caminhos do Windows
        args = isFile ? [`/select,"${folderPath}"`] : [`"${folderPath}"`];
      } else if (process.platform === 'darwin') {
        program = 'open';
        args = isFile ? ['-R', folderPath] : [folderPath];
      } else {
        program = 'xdg-open';
        args = [isFile ? path.dirname(folderPath) : folderPath];
      }

      const child = spawn(program, args, { detached: true, stdio: 'ignore', windowsVerbatimArguments: process.platform === 'win32' });
      // O Explorer do Windows sai com código 1 mesmo quando abre a pasta: basta ter iniciado
      child.once('spawn', () => { child.unref(); res.json({ success: true }); });
      child.once('error', (error) => {
        console.error("Failed to open folder:", error);
        if (!res.headersSent) res.status(500).json({ success: false });
      });
    } catch (error) {
      res.status(500).json({ success: false });
    }
  });

  app.all("/api/select-folder", (req, res) => {
    // Caixa de seleção de pasta do sistema (usada quando o app roda no navegador; no Electron o seletor é nativo)
    let program: string;
    let args: string[];
    if (process.platform === 'win32') {
      const psScript = [
        '[Console]::OutputEncoding = [System.Text.Encoding]::UTF8',
        'Add-Type -AssemblyName System.Windows.Forms',
        '$owner = New-Object System.Windows.Forms.Form -Property @{ TopMost = $true; ShowInTaskbar = $false }',
        '$f = New-Object System.Windows.Forms.FolderBrowserDialog',
        '$f.ShowNewFolderButton = $true',
        "$f.Description = 'Selecione a pasta onde os audiobooks serão salvos'",
        'if ($f.ShowDialog($owner) -eq [System.Windows.Forms.DialogResult]::OK) { [Console]::Out.Write($f.SelectedPath) }',
      ].join('; ');
      program = 'powershell.exe';
      args = ['-NoProfile', '-STA', '-Command', psScript];
    } else if (process.platform === 'darwin') {
      program = 'osascript';
      args = ['-e', 'POSIX path of (choose folder with prompt "Selecione a pasta onde os audiobooks serão salvos")'];
    } else {
      program = 'zenity';
      args = ['--file-selection', '--directory', '--title=Selecione a pasta dos audiobooks'];
    }
    const child = spawn(program, args);
    let output = '';
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (data) => output += data);
    child.on('error', () => { if (!res.headersSent) res.status(501).json({ error: 'Seletor de pastas indisponível neste sistema' }); });
    child.on('close', () => {
      if (res.headersSent) return;
      const selected = output.trim().replace(/[\\/]+$/, '');
      res.json(selected ? { path: selected } : { cancelled: true });
    });
  });

  // Pasta padrão dos audiobooks (Documentos/Audiobook Generator), criada quando o usuário não escolhe uma
  app.post("/api/default-folder", (req, res) => {
    const home = process.env.USERPROFILE || process.env.HOME || process.cwd();
    let documents = '';
    if (process.platform === 'win32') {
      try {
        // A pasta Documentos de verdade (pode estar no OneDrive ou ter outro nome no idioma do sistema)
        documents = String(execFileSync('powershell.exe', ['-NoProfile', '-Command',
          "[Console]::OutputEncoding=[Text.Encoding]::UTF8; [Environment]::GetFolderPath('MyDocuments')"], { timeout: 15000 })).trim();
      } catch { documents = ''; }
    }
    const candidates = [documents, path.join(home, 'Documents'), path.join(home, 'Documentos'), home].filter(Boolean);
    for (const base of candidates) {
      try {
        if (!fs.existsSync(base)) continue;
        const folder = path.join(base, 'Audiobook Generator');
        fs.mkdirSync(folder, { recursive: true });
        fs.accessSync(folder, fs.constants.W_OK);
        return res.json({ path: folder });
      } catch { /* tenta o próximo lugar */ }
    }
    res.status(500).json({ error: 'Não foi possível criar a pasta padrão.' });
  });

  // Estado do motor de conversão: Python, voz (edge-tts), FFmpeg e alinhamento (faster-whisper)
  app.get("/api/health", (req, res) => {
    const check = [
      'import importlib.util as u, json, shutil, sys',
      'print(json.dumps({"python": sys.version.split()[0], "edgeTts": bool(u.find_spec("edge_tts")), "ffmpeg": bool(shutil.which("ffmpeg")), "whisper": bool(u.find_spec("faster_whisper"))}))',
    ].join('\n');
    execFile(PYTHON_CMD, ['-c', check], { timeout: 15000, env: PY_ENV }, (err, stdout) => {
      if (err) return res.json({ python: null, edgeTts: false, ffmpeg: false, whisper: false });
      try { res.json(JSON.parse(String(stdout).trim())); } catch { res.json({ python: null, edgeTts: false, ffmpeg: false, whisper: false }); }
    });
  });

  const handleProcessRequest = (req: express.Request, res: express.Response) => {
    try {
      let filesInfo: any[] = [];
      if (req.body.filesInfo) {
        filesInfo = typeof req.body.filesInfo === 'string' ? JSON.parse(req.body.filesInfo) : req.body.filesInfo;
      } else if (req.body.metadata) {
        filesInfo = typeof req.body.metadata === 'string' ? JSON.parse(req.body.metadata) : req.body.metadata;
      }

      let config: any = {};
      if (req.body.config) {
        config = typeof req.body.config === 'string' ? JSON.parse(req.body.config) : req.body.config;
      } else {
        config = {
          voice: req.body.voice,
          outputFolder: req.body.outputFolder,
          mode_folder: req.body.fileType === 'multiple' || req.body.mode_folder === true || req.body.mode_folder === 'true',
          file_format: req.body.fileType || 'm4b',
          target_lang: req.body.target_lang || 'pt'
        };
      }
      
      const fileFormat = config.file_format || config.fileType || req.body.fileType || (config.mode_folder ? 'multiple' : 'm4b');
      const isMultiple = fileFormat === 'multiple' || config.mode_folder === true || config.mode_folder === 'true';

      const generateSyncText = config.generate_sync_text !== undefined 
        ? config.generate_sync_text 
        : (req.body.generate_sync_text !== undefined ? (req.body.generate_sync_text === true || req.body.generate_sync_text === 'true') : true);
      // Onde guardar o texto sincronizado: metadados do áudio, pasta da biblioteca ou ambos
      const syncTextDestination = ['metadata', 'library', 'both'].includes(config.sync_text_destination) ? config.sync_text_destination : 'both';
      const syncTextGranularity = ['sentences', 'words', 'both'].includes(config.sync_text_granularity) ? config.sync_text_granularity : 'sentences';

      const files = (req.files as Express.Multer.File[]).map((file, index) => {
        const info = filesInfo[index] || {};
        const originalExt = path.extname(info.filename || file.originalname);
        const newPath = file.path + originalExt;
        fs.renameSync(file.path, newPath);
        
        return {
          id: info.id || `file_${index}`,
          path: newPath,
          title: info.title || 'Desconhecido',
          author: info.author || 'Desconhecido',
          genre: info.genre || '',
          subgenre: info.subgenre || '',
          year: info.year || '',
          narrator: info.narrator || '',
          language: info.language || '',
          voice: info.voice || config.voice || 'pt-BR-AntonioNeural',
          audio_quality: config.audio_quality,
          translate: info.requiresTranslation || info.translate || false,
          cover: info.cover || null,
          chapters: info.chapters || [],
          fileType: info.fileType || fileFormat,
          file_format: info.fileType || fileFormat,
          pronunciation_map: info.pronunciationMap || info.pronunciation_map || [],
          generate_sync_text: info.generate_sync_text !== undefined ? info.generate_sync_text : generateSyncText,
          sync_text_destination: syncTextDestination,
          sync_text_granularity: syncTextGranularity,
          config: { ...(info.config || config), file_format: info.fileType || fileFormat, pronunciation_map: info.pronunciationMap || info.pronunciation_map || [], generate_sync_text: info.generate_sync_text !== undefined ? info.generate_sync_text : generateSyncText, sync_text_destination: syncTextDestination, sync_text_granularity: syncTextGranularity }
        };
      });

      const pythonConfig = {
        files,
        voice: config.voice || 'pt-BR-AntonioNeural',
        outputFolder: config.outputFolder,
        target_lang: config.target_lang || 'pt',
        mode_folder: isMultiple,
        file_format: fileFormat,
        generate_sync_text: generateSyncText,
        sync_text_destination: syncTextDestination,
        sync_text_granularity: syncTextGranularity,
        lite: Boolean(config.lite),
        turbo: Boolean(config.turbo)
      };

      // Write configuration payload to a temp JSON file to completely bypass Windows CLI string limits
      const configPath = path.join(process.cwd(), `config_${Date.now()}.json`);
      fs.writeFileSync(configPath, JSON.stringify(pythonConfig));

      for (const f of files) lastEventByFile.delete(f.id); // nova tentativa: esquece o resultado anterior
      // Grupo de processos próprio (detached + janela oculta): Ctrl+C ou o fechamento de um console no
      // Windows não derrubam mais a conversão. A entrada (stdin) fica aberta: se o servidor fechar, ela
      // termina e o conversor se encerra sozinho (não fica rodando órfão).
      const pythonProc = spawn(PYTHON_CMD, ['-u', 'converter.py', configPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: PY_ENV,
        detached: process.platform === 'win32',
        windowsHide: true,
      });
      runningPythonProcesses.add(pythonProc);
      // Livros deste processo que ainda não terminaram (nem com sucesso nem com erro)
      const pending = new Set<string>(files.map(f => f.id));
      let stderrTail = '';
      const failPending = (message: string, details?: string) => {
        for (const id of pending) broadcastProgress({ type: 'error', fileId: id, error: message, details });
        pending.clear();
      };

      pythonProc.on('error', (err) => {
        runningPythonProcesses.delete(pythonProc);
        failPending(explainPythonFailure(String(err), null), `Não foi possível iniciar o Python (${PYTHON_CMD}).\n${String(err)}`);
        console.error("Failed to start python backend process:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Failed to start processing" });
        }
      });

      let stdoutBuffer = '';
      pythonProc.stdout.setEncoding('utf8');
      pythonProc.stdout.on('data', (data) => {
        stdoutBuffer += data.toString();
        const lines = stdoutBuffer.split('\n');
        stdoutBuffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const event = JSON.parse(line);
              if ((event.type === 'done' || event.type === 'error') && event.fileId) pending.delete(event.fileId);
              broadcastProgress(event);
            } catch (e) {
              console.log("Python stdout parse error:", line);
            }
          }
        }
      });

      pythonProc.stderr.on('data', (data) => {
        const text = data.toString();
        stderrTail = (stderrTail + text).slice(-4000);
        console.error("Python stderr:", text);
      });

      pythonProc.on('close', (code) => {
        console.log(`Python process exited with code ${code}`);
        runningPythonProcesses.delete(pythonProc);
        // Cancelado pelo usuário: o app já voltou os livros para a fila. Senão, nenhum livro fica "convertendo" para sempre.
        if ((pythonProc as any).__cancelled) pending.clear();
        else if (pending.size > 0) failPending(
          explainPythonFailure(stderrTail, code),
          `O processo de conversão terminou com código ${code} antes de concluir.\n\nÚltimas linhas do erro:\n${stderrTail.trim().split('\n').slice(-25).join('\n') || '(nenhuma mensagem)'}`
        );
        // Clean up uploaded files
        for (const file of files) {
          try {
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          } catch (e) {
            console.error("Failed to delete file:", file.path);
          }
        }
      try {
        if (fs.existsSync(configPath)) {
          fs.unlinkSync(configPath);
        }
      } catch (e) {}
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error processing request:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  app.post("/api/process", upload.array('files'), handleProcessRequest);
  app.post("/api/convert", upload.array('files'), handleProcessRequest);

  // ROTA DO AUDIOBOOK-TEXT: Sincronização e Extração de Texto Sincronizado
  const syncUpload = upload.fields([
    { name: 'ebook', maxCount: 1 },
    { name: 'ebookFile', maxCount: 1 },
    { name: 'audio', maxCount: 1 },
    { name: 'audioFile', maxCount: 1 }
  ]);

  // Texto sincronizado de um audiobook do histórico (menu de opções do audiobook):
  // "áudio + texto" (o usuário envia o livro em texto) ou "só o áudio" (transcrição).
  app.post("/api/sync-text", syncUpload, async (req, res) => {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const ebookFile = files?.ebook?.[0];
    const tempFilesToClean: string[] = [];
    try {
      const audioPath = typeof req.body.audioPath === 'string' ? req.body.audioPath : '';
      if (!audioPath || !fs.existsSync(audioPath)) {
        return res.status(400).json({ error: "O arquivo de áudio deste audiobook não foi encontrado." });
      }
      if (!AUDIO_EXTENSIONS.has(path.extname(audioPath).toLowerCase())) {
        return res.status(400).json({ error: "O arquivo deste audiobook não é um áudio." });
      }

      let ebookPath = '';
      if (ebookFile) {
        ebookPath = ebookFile.path + path.extname(ebookFile.originalname);
        fs.renameSync(ebookFile.path, ebookPath);
        tempFilesToClean.push(ebookPath);
      }

      const destination = ['metadata', 'library', 'both'].includes(req.body.destination) ? req.body.destination : 'both';
      const outputFolder = req.body.outputFolder || path.join(process.cwd(), 'meus audiobooks');
      const args = ['-u', 'sync_text_tools.py', '--audio', audioPath, '--out-dir', outputFolder,
        '--title', String(req.body.title || path.basename(audioPath, path.extname(audioPath))),
        '--author', String(req.body.author || ''), '--destination', destination];
      if (ebookPath) args.push('--ebook', ebookPath);

      const child = spawn(PYTHON_CMD, args, { stdio: ['ignore', 'pipe', 'pipe'], env: PY_ENV, windowsHide: true });
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', d => { stdout += d.toString(); });
      child.stderr.on('data', d => { stderr += d.toString(); });
      child.on('error', (err) => {
        if (!res.headersSent) res.status(500).json({ error: `Não foi possível iniciar o Python: ${err.message}` });
      });
      child.on('close', () => {
        for (const p of tempFilesToClean) { try { if (fs.existsSync(p)) fs.unlinkSync(p); } catch (e) {} }
        if (res.headersSent) return;
        // A última linha "result" do script traz o resumo
        const resultLine = stdout.trim().split(/\r?\n/).reverse().find(l => l.includes('"type": "result"'));
        let result: any = null;
        try { result = resultLine ? JSON.parse(resultLine) : null; } catch (e) {}
        if (result?.success) {
          res.json(result);
        } else {
          console.error("Sync text error:", stderr || stdout);
          res.status(500).json({ error: result?.error || "Falha ao gerar o texto sincronizado.", details: stderr.slice(-2000) });
        }
      });
    } catch (e: any) {
      for (const p of tempFilesToClean) { try { if (fs.existsSync(p)) fs.unlinkSync(p); } catch (err) {} }
      console.error("Error in /api/sync-text:", e);
      if (!res.headersSent) res.status(500).json({ error: e.message || "Erro interno do servidor." });
    }
  });

  // Injetar e salvar metadados no arquivo de audiobook (.mp3, .m4b, .m4a)
  app.post("/api/save-audiobook-metadata", express.json({ limit: '50mb' }), (req, res) => {
    try {
      const data = req.body;
      const filePath = data.filePath;

      // Se o arquivo não existir fisicamente no disco, apenas retorna sucesso para atualizar no estado/localStorage
      if (!filePath || !fs.existsSync(filePath)) {
        return res.json({
          success: true,
          fileUpdated: false,
          message: "Metadados salvos na biblioteca."
        });
      }

      // Salva payload temporário para evitar limite de argumentos de linha de comando no Windows
      const tempJson = path.join(process.cwd(), `meta_inject_${Date.now()}.json`);
      fs.writeFileSync(tempJson, JSON.stringify(data), 'utf-8');

      const child = spawn(PYTHON_CMD, ['-u', 'inject_metadata.py', tempJson], { env: PY_ENV, windowsHide: true });

      let stdout = '';
      let stderr = '';
      child.stdout.on('data', (d) => stdout += d.toString());
      child.stderr.on('data', (d) => stderr += d.toString());

      child.on('close', (code) => {
        try { if (fs.existsSync(tempJson)) fs.unlinkSync(tempJson); } catch {}
        try {
          const parsed = JSON.parse(stdout.trim());
          res.json(parsed);
        } catch {
          if (code === 0) {
            res.json({ success: true, fileUpdated: true, message: "Metadados injetados com sucesso." });
          } else {
            console.error("inject_metadata error:", stderr);
            res.status(500).json({ success: false, error: stderr || "Erro ao injetar metadados." });
          }
        }
      });
    } catch (err: any) {
      console.error("Error in /api/save-audiobook-metadata:", err);
      res.status(500).json({ success: false, error: err.message || "Erro interno." });
    }
  });

  // Catch-all for API routes to prevent falling through to Vite
  app.all('/api/*', (req, res) => {
    console.log(`API Route not found: ${req.method} ${req.url}`);
    res.status(404).json({ error: `API Route ${req.method} ${req.url} not found` });
  });

  // Uso normal: a versão compilada e otimizada (dist/). O modo de desenvolvimento (Vite, código sem compactar,
  // React checando tudo em dobro) só com --dev (npm run dev) ou sem a pasta dist.
  const distIndex = path.join(process.cwd(), 'dist', 'index.html');
  const modoDev = process.argv.includes('--dev') || process.env.NODE_ENV === 'development' || !fs.existsSync(distIndex);
  console.log(modoDev ? 'Interface em modo de desenvolvimento' : 'Interface otimizada (dist)');
  if (modoDev) {
    const { createServer: createViteServer } = await import('vite');
    const react = (await import('@vitejs/plugin-react')).default;
    const tailwindcss = (await import('@tailwindcss/vite')).default;
    
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        // Recarga automática (HMR) só para quem edita o código: com ela, uma página em segundo plano
        // que perdia a conexão com o servidor recarregava sozinha ao voltar (e perdia o estado da tela)
        hmr: process.env.HMR === 'true' ? { port: hmrPort } : false,
        ws: process.env.HMR === 'true' ? undefined : false,
        // Só o código da interface recarrega a página. Sem isso, os arquivos que a conversão grava na pasta
        // do app (uploads, config_*.json, cache) faziam a página recarregar no meio da conversão.
        watch: {
          ignored: (p: string) => {
            const rel = path.relative(process.cwd(), p);
            if (!rel) return false;
            if (rel.startsWith('..')) return true;
            return !['src', 'public', 'index.html'].includes(rel.split(/[\\/]/)[0]);
          },
        },
      },
      appType: "spa",
      configFile: false,
      plugins: [react(), tailwindcss()],
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { index: false, maxAge: '1h' }));
    // Arquivos criados com o app rodando (trechos de audiobook em public/samples) não estão no dist
    app.use(express.static(path.join(process.cwd(), 'public')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Unhandled error:", err);
    // Limites do envio de arquivos (multer): explica em vez de mostrar a mensagem técnica em inglês
    const limites: Record<string, string> = {
      LIMIT_FILE_SIZE: 'O arquivo é grande demais para enviar (limite de 1 GB).',
      LIMIT_FIELD_VALUE: 'Os dados do livro (texto dos capítulos e capa) passaram do limite de envio.',
      LIMIT_FIELD_COUNT: 'O pedido tem campos demais.',
      LIMIT_FILE_COUNT: 'Arquivos demais num pedido só. Converta em lotes menores.',
      LIMIT_UNEXPECTED_FILE: 'O app enviou um arquivo num campo inesperado.',
    };
    if (err?.code && limites[err.code]) {
      return res.status(413).json({ error: limites[err.code], details: `${err.code}: ${err.message}${err.field ? ` (campo ${err.field})` : ''}` });
    }
    res.status(500).json({ error: err.message || "Internal server error" });
  });

  // "localhost" pode apontar para o IPv4 (127.0.0.1) ou para o IPv6 (::1), conforme o sistema.
  // Escuta nos dois endereços locais para a janela do app sempre conectar (e nunca na rede externa).
  if (HOST === '127.0.0.1') {
    const v6 = http.createServer(app);
    v6.on('error', () => { /* sem IPv6 nesta máquina: o IPv4 basta */ });
    v6.listen(PORT, '::1');
  }

  app.listen(PORT, HOST, async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    const url = `http://localhost:${PORT}`;
    if (!process.env.ELECTRON_MODE) {
      import('child_process').then(({ exec }) => {
        let command = '';
        if (process.platform === 'win32') {
          command = `start msedge --app="${url}" || start chrome --app="${url}" || start "" "${url}"`;
        } else if (process.platform === 'darwin') {
          command = `open -n -a "Google Chrome" --args --app="${url}" || open -n -a "Microsoft Edge" --args --app="${url}" || open "${url}"`;
        } else {
          command = `google-chrome --app="${url}" || microsoft-edge --app="${url}" || chromium-browser --app="${url}" || xdg-open "${url}"`;
        }
        exec(command);
      });
    }
  });
}

startServer();

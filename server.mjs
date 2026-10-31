// server.ts
import express from "express";
import path from "path";
import multer from "multer";
import { spawn, execFile, execFileSync } from "child_process";
import fs from "fs";
import net from "net";
import os from "os";
import https from "https";
import http from "http";
var PYTHON_CMD = process.platform === "win32" ? "python" : "python3";
var PY_ENV = { ...process.env, PYTHONIOENCODING: "utf-8", PYTHONUTF8: "1" };
process.on("uncaughtException", (err) => console.error("Erro n\xE3o tratado:", err));
process.on("unhandledRejection", (err) => console.error("Promessa rejeitada sem tratamento:", err));
function explainPythonFailure(stderr, code) {
  if (code === 3221225786 || code === -1073741510) {
    return "A convers\xE3o foi interrompida por um sinal do Windows (Ctrl+C ou uma janela de console fechada). Converta de novo: o que j\xE1 foi narrado fica salvo e a convers\xE3o continua de onde parou.";
  }
  const missing = stderr.match(/No module named '([^']+)'/);
  if (missing) return `Falta a biblioteca do Python "${missing[1]}". Rode o instalador de novo (ou: pip install ${missing[1].replace(/_/g, "-")}).`;
  if (/ENOENT|not recognized|não é reconhecido/i.test(stderr)) return "Python n\xE3o encontrado. Rode o instalador de novo.";
  if (/No space left|ENOSPC|espaço insuficiente/i.test(stderr)) return "Sem espa\xE7o em disco na pasta de destino.";
  if (/Permission denied|EACCES|PermissionError/i.test(stderr)) return "Sem permiss\xE3o para gravar na pasta de destino. Escolha outra pasta em Ajustes \u203A Armazenamento e pastas.";
  if (/MemoryError|out of memory/i.test(stderr)) return "Faltou mem\xF3ria para converter este livro. Feche outros programas e converta de novo: o que j\xE1 foi narrado fica salvo.";
  const last = stderr.trim().split("\n").filter(Boolean).pop();
  if (!last) {
    return "A convers\xE3o foi interrompida pelo sistema. Converta de novo: o que j\xE1 foi narrado fica salvo e a convers\xE3o continua de onde parou.";
  }
  return `A convers\xE3o parou inesperadamente${code !== null ? ` (c\xF3digo ${code})` : ""}: ${last.slice(0, 200)}`;
}
var HOST = process.env.HOST || "127.0.0.1";
var AUDIO_EXTENSIONS = /* @__PURE__ */ new Set([".mp3", ".m4a", ".m4b", ".aac", ".ogg", ".opus", ".wav", ".flac"]);
function isPortFree(port, host) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", (err) => {
      if (err.code === "EADDRINUSE" || err.code === "EACCES") resolve(false);
      else if (err.code === "EADDRNOTAVAIL" || err.code === "EAFNOSUPPORT") resolve(true);
      else reject(err);
    });
    server.listen(port, host, () => server.close(() => resolve(true)));
  });
}
async function getAvailablePort(startPort, extraHosts = []) {
  for (let port = startPort; port < startPort + 100; port++) {
    let free = true;
    for (const host of ["::", "0.0.0.0", HOST, ...extraHosts]) {
      if (!await isPortFree(port, host)) {
        free = false;
        break;
      }
    }
    if (free) return port;
  }
  throw new Error(`Nenhuma porta livre a partir de ${startPort}`);
}
var upload = multer({
  dest: path.join(process.cwd(), "uploads/"),
  limits: {
    fileSize: 1024 * 1024 * 1024,
    // 1GB limit para suportar audiolivros completos
    // Os dados dos livros (capítulos com o texto inteiro e a capa em base64) vão num campo só;
    // o padrão de 1 MB por campo recusava livros longos ou com capa grande ("Field value too long")
    fieldSize: 512 * 1024 * 1024
  }
});
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}
async function startServer() {
  const app = express();
  const PORT = await getAvailablePort(Number(process.env.PORT) || 3e3);
  const hmrPort = await getAvailablePort(24678, ["::1"]);
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  try {
    for (const name of fs.readdirSync(process.cwd())) {
      if (/^config_\d+\.json$/.test(name)) fs.rmSync(path.join(process.cwd(), name), { force: true });
    }
    for (const name of fs.readdirSync(uploadsDir)) fs.rmSync(path.join(uploadsDir, name), { force: true, recursive: true });
  } catch {
  }
  try {
    fs.accessSync(uploadsDir, fs.constants.W_OK);
    console.log("Uploads directory is writable:", uploadsDir);
  } catch (err) {
    console.error("Uploads directory is NOT writable:", err);
  }
  const samplesDir = path.join(process.cwd(), "public", "samples");
  if (fs.existsSync(samplesDir)) {
    try {
      const files = fs.readdirSync(samplesDir);
      for (const file of files) {
        if (file.startsWith("snippet_")) {
          fs.unlinkSync(path.join(samplesDir, file));
        }
      }
    } catch (e) {
    }
  }
  app.use(express.json());
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });
  const clients = /* @__PURE__ */ new Set();
  app.get("/api/progress", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();
    clients.add(res);
    for (const event of lastEventByFile.values()) {
      try {
        res.write(`data: ${JSON.stringify(event)}

`);
      } catch {
      }
    }
    const ping = setInterval(() => {
      try {
        res.write(": ping\n\n");
      } catch {
      }
    }, 25e3);
    req.on("close", () => {
      clearInterval(ping);
      clients.delete(res);
    });
  });
  const lastEventByFile = /* @__PURE__ */ new Map();
  function broadcastProgress(data) {
    if (data && data.fileId && data.type !== "log" && data.type !== "speed") {
      lastEventByFile.set(data.fileId, data);
      if (lastEventByFile.size > 200) lastEventByFile.delete(lastEventByFile.keys().next().value);
    }
    const message = `data: ${JSON.stringify(data)}

`;
    for (const client of clients) {
      try {
        client.write(message);
      } catch {
        clients.delete(client);
      }
    }
  }
  app.get("/api/backup", (req, res) => {
    const backupPath = path.join(process.cwd(), "user_data.json");
    if (fs.existsSync(backupPath)) res.json(JSON.parse(fs.readFileSync(backupPath, "utf-8")));
    else res.json({});
  });
  app.post("/api/backup", (req, res) => {
    const backupPath = path.join(process.cwd(), "user_data.json");
    fs.writeFileSync(backupPath, JSON.stringify(req.body, null, 2));
    res.json({ success: true });
  });
  let updateDownloadProgress = 0;
  let updateDownloadStatus = "idle";
  app.get("/api/check-update", async (req, res) => {
    try {
      const currentVersion = req.query.current;
      const repoUrl = "https://api.github.com/repos/thenauan/audiobook-generator/releases/latest";
      const response = await fetch(repoUrl, {
        headers: { "User-Agent": "Audiobook-Generator-App" }
      });
      if (!response.ok) {
        if (response.status === 404) return res.json({ available: false, error: "Reposit\xF3rio ou release n\xE3o encontrado ainda." });
        throw new Error("Falha ao checar atualiza\xE7\xF5es");
      }
      const data = await response.json();
      const latestVersion = data.tag_name.replace("v", "");
      const isNewer = latestVersion.localeCompare(currentVersion, void 0, { numeric: true, sensitivity: "base" }) > 0;
      const asset = data.assets?.find((a) => a.name.endsWith(".exe")) || data.assets?.[0];
      const downloadUrl = asset ? asset.browser_download_url : data.html_url;
      res.json({ available: isNewer, latestVersion, url: data.html_url, downloadUrl, notes: data.body });
    } catch (error) {
      res.status(500).json({ error: "Erro ao verificar atualiza\xE7\xF5es" });
    }
  });
  app.get("/api/update-status", (req, res) => {
    res.json({ status: updateDownloadStatus, progress: updateDownloadProgress });
  });
  app.post("/api/download-update", express.json(), (req, res) => {
    const url = req.body.url;
    if (!url) return res.status(400).json({ error: "No URL provided" });
    updateDownloadStatus = "downloading";
    updateDownloadProgress = 0;
    const dest = path.join(process.cwd(), "update_installer.exe");
    const downloadFile = (fileUrl) => {
      const client = fileUrl.startsWith("https") ? https : http;
      client.get(fileUrl, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          return downloadFile(response.headers.location);
        }
        const file = fs.createWriteStream(dest);
        const total = parseInt(response.headers["content-length"] || "0", 10);
        let downloaded = 0;
        response.on("data", (chunk) => {
          downloaded += chunk.length;
          if (total) updateDownloadProgress = Math.round(downloaded / total * 100);
        });
        response.pipe(file);
        file.on("finish", () => {
          file.close();
          updateDownloadStatus = "ready";
        });
      }).on("error", (err) => {
        updateDownloadStatus = "error";
        fs.unlink(dest, () => {
        });
      });
    };
    downloadFile(url);
    res.json({ success: true });
  });
  app.post("/api/install-update", (req, res) => {
    const updatePath = path.join(process.cwd(), "update_installer.exe");
    if (process.platform === "win32") {
      if (fs.existsSync(updatePath)) {
        spawn(updatePath, [], { detached: true, stdio: "ignore" });
        res.json({ success: true });
        setTimeout(() => process.exit(0), 1e3);
      } else {
        res.status(404).json({ error: "Instalador n\xE3o encontrado." });
      }
    } else {
      res.json({ success: true, message: "Instala\xE7\xE3o manual necess\xE1ria neste SO." });
    }
  });
  app.get("/api/find-drive", (req, res) => {
    const userProfile = process.env.USERPROFILE || "";
    const possiblePaths = [
      "G:\\Meu Drive",
      "G:\\My Drive",
      path.join(userProfile, "Google Drive"),
      path.join(userProfile, "Meu Drive"),
      path.join(userProfile, "My Drive")
    ];
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        const targetPath = path.join(p, "Audiobooks");
        if (!fs.existsSync(targetPath)) {
          try {
            fs.mkdirSync(targetPath, { recursive: true });
          } catch (e) {
          }
        }
        return res.json({ path: targetPath });
      }
    }
    res.json({ path: null });
  });
  const META_PARALELO = Math.max(2, Math.min(4, Math.floor(os.cpus().length / 2)));
  let metaAtivos = 0;
  const metaFila = [];
  const metaEntrar = () => new Promise((resolve) => {
    if (metaAtivos < META_PARALELO) {
      metaAtivos++;
      resolve();
    } else metaFila.push(() => {
      metaAtivos++;
      resolve();
    });
  });
  const metaSair = () => {
    metaAtivos = Math.max(0, metaAtivos - 1);
    const proximo = metaFila.shift();
    if (proximo) proximo();
  };
  app.post("/api/metadata", (req, res, next) => {
    console.log("Incoming metadata request...");
    upload.single("file")(req, res, (err) => {
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
      const originalName = String(req.body.filename || req.file.originalname || "");
      await metaEntrar();
      let saiu = false;
      const liberar = () => {
        if (!saiu) {
          saiu = true;
          metaSair();
        }
      };
      const pythonProcess = spawn(PYTHON_CMD, ["extract_metadata.py", newPath, originalName], { env: PY_ENV, windowsHide: true });
      const metaTimer = setTimeout(() => {
        try {
          pythonProcess.kill();
        } catch {
        }
      }, 18e4);
      console.log("Spawned python process for metadata extraction");
      pythonProcess.on("error", (err) => {
        liberar();
        console.error("Failed to start python process:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: `N\xE3o foi poss\xEDvel iniciar o Python (${PYTHON_CMD}): ${err.message}` });
        }
      });
      let buffer = "";
      let errorOutput = "";
      let sentAny = false;
      let gotFinal = false;
      const sendLine = (line) => {
        const text = line.trim();
        if (!text.startsWith("{")) return;
        try {
          const obj = JSON.parse(text);
          if (!obj.partial) gotFinal = true;
        } catch {
          return;
        }
        if (!sentAny) {
          res.status(200).setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
          sentAny = true;
        }
        res.write(text + "\n");
      };
      pythonProcess.stdout.setEncoding("utf8");
      pythonProcess.stdout.on("data", (data) => {
        buffer += data;
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        lines.forEach(sendLine);
      });
      pythonProcess.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });
      pythonProcess.on("close", (code) => {
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
        const ultima = errorOutput.trim().split("\n").filter(Boolean).pop() || "";
        const message = code === 0 ? "a leitura do arquivo terminou incompleta" : code === null ? "a leitura demorou demais e foi interrompida" : `o leitor de e-books falhou (c\xF3digo ${code}${ultima ? `: ${ultima.slice(0, 160)}` : ""})`;
        if (sentAny) {
          res.write(JSON.stringify({ error: message }) + "\n");
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
  const runningPythonProcesses = /* @__PURE__ */ new Set();
  app.post("/api/cancel", (req, res) => {
    const killed = runningPythonProcesses.size > 0;
    for (const proc of runningPythonProcesses) {
      proc.__cancelled = true;
      const pid = proc.pid;
      if (!pid) continue;
      if (process.platform === "win32") {
        spawn("taskkill", ["/pid", String(pid), "/T", "/F"], { stdio: "ignore", windowsHide: true }).on("error", (err) => console.error("taskkill error:", err));
      } else {
        try {
          proc.kill("SIGKILL");
        } catch (e) {
          console.error("kill error:", e);
        }
      }
    }
    runningPythonProcesses.clear();
    lastEventByFile.clear();
    if (process.platform === "win32") {
      spawn("taskkill", ["/IM", "ffmpeg.exe", "/F"], { stdio: "ignore", windowsHide: true }).on("error", () => {
      });
    }
    broadcastProgress({ type: "log", message: "Processo cancelado e recursos liberados imediatamente." });
    res.json({ success: true, message: killed ? "Process tree and FFmpeg killed" : "Cleaned up" });
  });
  app.use("/samples", express.static(path.join(process.cwd(), "public", "samples")));
  app.post("/api/snippet", express.json(), (req, res) => {
    const filePath = req.body.path;
    if (typeof filePath !== "string" || !fs.existsSync(filePath)) return res.status(404).json({ error: "File not found" });
    if (!AUDIO_EXTENSIONS.has(path.extname(filePath).toLowerCase())) return res.status(400).json({ error: "Not an audio file" });
    const tempName = "snippet_" + Date.now() + ".mp3";
    const samplesDir2 = path.join(process.cwd(), "public", "samples");
    const outputPath = path.join(samplesDir2, tempName);
    if (!fs.existsSync(samplesDir2)) fs.mkdirSync(samplesDir2, { recursive: true });
    execFile("ffmpeg", ["-y", "-t", "60", "-i", filePath, "-c", "copy", outputPath], (error) => {
      if (error) fs.copyFileSync(filePath, outputPath);
      res.json({ url: "/samples/" + tempName });
    });
  });
  app.post("/api/delete-snippet", express.json(), (req, res) => {
    const tempUrl = req.body.tempUrl;
    if (tempUrl) {
      const fileName = path.basename(tempUrl);
      const outputPath = path.join(process.cwd(), "public", "samples", fileName);
      if (fs.existsSync(outputPath)) {
        try {
          fs.unlinkSync(outputPath);
        } catch (e) {
        }
      }
    }
    res.json({ success: true });
  });
  app.post("/api/clear-snippets", (req, res) => {
    const samplesDir2 = path.join(process.cwd(), "public", "samples");
    if (fs.existsSync(samplesDir2)) {
      try {
        const files = fs.readdirSync(samplesDir2);
        for (const file of files) {
          if (file.startsWith("snippet_")) fs.unlinkSync(path.join(samplesDir2, file));
        }
      } catch (e) {
      }
    }
    res.json({ success: true });
  });
  app.post("/api/clean-cache", express.json(), (req, res) => {
    try {
      let deletedCount = 0;
      const samplesDir2 = path.join(process.cwd(), "public", "samples");
      if (fs.existsSync(samplesDir2)) {
        try {
          const files = fs.readdirSync(samplesDir2);
          for (const file of files) {
            if (file.startsWith("snippet_") || file.startsWith("preview_") || file.startsWith("temp_")) {
              try {
                fs.unlinkSync(path.join(samplesDir2, file));
                deletedCount++;
              } catch (e) {
              }
            }
          }
        } catch (e) {
        }
      }
      const uploadsDir2 = path.join(process.cwd(), "uploads");
      if (fs.existsSync(uploadsDir2)) {
        try {
          const files = fs.readdirSync(uploadsDir2);
          for (const file of files) {
            try {
              const p = path.join(uploadsDir2, file);
              if (fs.statSync(p).isFile()) {
                fs.unlinkSync(p);
                deletedCount++;
              }
            } catch (e) {
            }
          }
        } catch (e) {
        }
      }
      const possibleCacheDirs = [
        path.join(process.cwd(), ".cache_audiobooks"),
        path.join(process.cwd(), "meus audiobooks", ".cache_audiobooks")
      ];
      if (req.body && req.body.outputFolder) {
        possibleCacheDirs.push(path.join(req.body.outputFolder, ".cache_audiobooks"));
      }
      for (const cDir of possibleCacheDirs) {
        if (fs.existsSync(cDir)) {
          try {
            fs.rmSync(cDir, { recursive: true, force: true });
            deletedCount++;
          } catch (e) {
          }
        }
      }
      res.json({ success: true, message: "Cache limpo com sucesso!", deleted: deletedCount });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });
  const DELETABLE_EXT = /* @__PURE__ */ new Set([...AUDIO_EXTENSIONS, ".lrc", ".srt", ".vtt", ".json"]);
  const isDeletableFile = (p) => {
    const lower = p.toLowerCase();
    return DELETABLE_EXT.has(path.extname(lower)) && (!lower.endsWith(".json") || lower.endsWith(".sync.json"));
  };
  const sendToTrash = (targets) => new Promise((resolve, reject) => {
    if (targets.length === 0) return resolve();
    if (process.platform === "win32") {
      const script = "$ErrorActionPreference='Stop'; Add-Type -AssemblyName Microsoft.VisualBasic; $itens = [Console]::In.ReadToEnd() | ConvertFrom-Json; foreach ($p in $itens) { if (Test-Path -LiteralPath $p -PathType Container) { [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteDirectory($p, 'OnlyErrorDialogs', 'SendToRecycleBin') } elseif (Test-Path -LiteralPath $p) { [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile($p, 'OnlyErrorDialogs', 'SendToRecycleBin') } }";
      const child = spawn("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", script], { windowsHide: true });
      let err = "";
      child.stderr.on("data", (d) => {
        err += d.toString();
      });
      child.on("error", reject);
      child.on("close", (code) => code === 0 ? resolve() : reject(new Error(err.trim() || `c\xF3digo ${code}`)));
      child.stdin.end(JSON.stringify(targets));
    } else {
      const trash = process.platform === "darwin" ? null : "gio";
      if (trash) {
        execFile(trash, ["trash", ...targets], (e) => {
          if (!e) return resolve();
          try {
            targets.forEach((t) => fs.rmSync(t, { recursive: true, force: true }));
            resolve();
          } catch (e2) {
            reject(e2);
          }
        });
      } else {
        const script = targets.map((t) => `tell application "Finder" to delete (POSIX file ${JSON.stringify(t)})`);
        execFile("osascript", script.flatMap((l) => ["-e", l]), (e) => {
          if (!e) return resolve();
          try {
            targets.forEach((t) => fs.rmSync(t, { recursive: true, force: true }));
            resolve();
          } catch (e2) {
            reject(e2);
          }
        });
      }
    }
  });
  app.post("/api/delete-files", express.json(), async (req, res) => {
    const pedidos = Array.isArray(req.body?.paths) ? req.body.paths.filter((p) => typeof p === "string" && p.trim()) : [];
    const targets = [];
    const skipped = [];
    for (const raw of pedidos) {
      const p = path.resolve(raw);
      if (!fs.existsSync(p)) continue;
      const st = fs.statSync(p);
      if (st.isDirectory()) {
        const nome = path.basename(p);
        const conteudo = fs.readdirSync(p);
        if (/\(Audiobook\)( \(\d+\))?$/.test(nome) && conteudo.every((f) => isDeletableFile(f))) targets.push(p);
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
    } catch (e) {
      res.status(500).json({ error: `N\xE3o foi poss\xEDvel excluir os arquivos: ${e?.message || e}`, skipped });
    }
  });
  const LIB_DIR = path.join(os.homedir(), ".audiobook-generator");
  const LIB_FILE = path.join(LIB_DIR, "library.json");
  app.get("/api/library", (req, res) => {
    try {
      if (!fs.existsSync(LIB_FILE)) return res.json({ exists: false, history: [], texts: [] });
      const data = JSON.parse(fs.readFileSync(LIB_FILE, "utf8"));
      res.json({ exists: true, history: Array.isArray(data.history) ? data.history : [], texts: Array.isArray(data.texts) ? data.texts : [] });
    } catch (e) {
      res.json({ exists: false, history: [], texts: [], error: String(e) });
    }
  });
  app.post("/api/library", express.json({ limit: "200mb" }), (req, res) => {
    try {
      const history = Array.isArray(req.body?.history) ? req.body.history : null;
      const texts = Array.isArray(req.body?.texts) ? req.body.texts : null;
      if (!history || !texts) return res.status(400).json({ error: "dados inv\xE1lidos" });
      fs.mkdirSync(LIB_DIR, { recursive: true });
      const tmp = LIB_FILE + ".tmp";
      fs.writeFileSync(tmp, JSON.stringify({ version: 1, history, texts }));
      fs.renameSync(tmp, LIB_FILE);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });
  const SETTINGS_FILE = path.join(LIB_DIR, "settings.json");
  app.get("/api/settings", (req, res) => {
    try {
      if (!fs.existsSync(SETTINGS_FILE)) return res.json({ exists: false, settings: {} });
      const data = JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf8"));
      res.json({ exists: true, settings: data.settings && typeof data.settings === "object" ? data.settings : {} });
    } catch (e) {
      res.json({ exists: false, settings: {}, error: String(e) });
    }
  });
  app.post("/api/settings", express.json({ limit: "20mb" }), (req, res) => {
    try {
      const settings = req.body?.settings;
      if (!settings || typeof settings !== "object" || Array.isArray(settings)) return res.status(400).json({ error: "dados inv\xE1lidos" });
      fs.mkdirSync(LIB_DIR, { recursive: true });
      const tmp = SETTINGS_FILE + ".tmp";
      fs.writeFileSync(tmp, JSON.stringify({ version: 1, settings }));
      fs.renameSync(tmp, SETTINGS_FILE);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });
  app.post("/api/scan-library", express.json(), (req, res) => {
    const pasta = typeof req.body?.folder === "string" ? path.resolve(req.body.folder) : "";
    if (!pasta || !fs.existsSync(pasta)) return res.json({ items: [] });
    execFile(PYTHON_CMD, ["library_scan.py", pasta], { env: PY_ENV, windowsHide: true, timeout: 18e4, maxBuffer: 200 * 1024 * 1024 }, (err, stdout) => {
      try {
        res.json({ items: err ? [] : JSON.parse(String(stdout).trim() || "[]") });
      } catch {
        res.json({ items: [] });
      }
    });
  });
  app.post("/api/sync-text-status", express.json(), (req, res) => {
    const audio = typeof req.body?.path === "string" ? path.resolve(req.body.path) : "";
    if (!audio || !fs.existsSync(audio) || !AUDIO_EXTENSIONS.has(path.extname(audio).toLowerCase())) {
      return res.json({ exists: false, embedded: false, files: [] });
    }
    const base = audio.slice(0, -path.extname(audio).length);
    const files = [".lrc", ".sync.json", ".srt"].map((e) => base + e).filter((f) => fs.existsSync(f));
    const script = [
      "import sys, mutagen",
      "f = mutagen.File(sys.argv[1])",
      "ok = False",
      "if f is not None and f.tags is not None:",
      "    keys = [str(k) for k in f.tags.keys()]",
      '    ok = any(k.startswith(("SYLT", "USLT")) or k in ("\xA9lyr", "LYRICS", "lyrics") for k in keys)',
      'print("1" if ok else "0")'
    ].join("\n");
    execFile(PYTHON_CMD, ["-c", script, audio], { env: PY_ENV, windowsHide: true, timeout: 2e4 }, (err, stdout) => {
      res.json({ exists: true, embedded: !err && String(stdout).trim() === "1", files });
    });
  });
  app.post("/api/open-folder", express.json(), (req, res) => {
    try {
      let folderPath = req.body.path || path.join(process.cwd(), "meus audiobooks");
      folderPath = path.normalize(String(folderPath));
      if (folderPath.includes('"')) return res.status(400).json({ success: false });
      const isFile = req.body.isFile;
      if (!isFile && !fs.existsSync(folderPath)) {
        try {
          fs.mkdirSync(folderPath, { recursive: true });
        } catch {
          return res.status(404).json({ success: false });
        }
      }
      let program;
      let args;
      if (process.platform === "win32") {
        program = "explorer.exe";
        args = isFile ? [`/select,"${folderPath}"`] : [`"${folderPath}"`];
      } else if (process.platform === "darwin") {
        program = "open";
        args = isFile ? ["-R", folderPath] : [folderPath];
      } else {
        program = "xdg-open";
        args = [isFile ? path.dirname(folderPath) : folderPath];
      }
      const child = spawn(program, args, { detached: true, stdio: "ignore", windowsVerbatimArguments: process.platform === "win32" });
      child.once("spawn", () => {
        child.unref();
        res.json({ success: true });
      });
      child.once("error", (error) => {
        console.error("Failed to open folder:", error);
        if (!res.headersSent) res.status(500).json({ success: false });
      });
    } catch (error) {
      res.status(500).json({ success: false });
    }
  });
  app.all("/api/select-folder", (req, res) => {
    let program;
    let args;
    if (process.platform === "win32") {
      const psScript = [
        "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8",
        "Add-Type -AssemblyName System.Windows.Forms",
        "$owner = New-Object System.Windows.Forms.Form -Property @{ TopMost = $true; ShowInTaskbar = $false }",
        "$f = New-Object System.Windows.Forms.FolderBrowserDialog",
        "$f.ShowNewFolderButton = $true",
        "$f.Description = 'Selecione a pasta onde os audiobooks ser\xE3o salvos'",
        "if ($f.ShowDialog($owner) -eq [System.Windows.Forms.DialogResult]::OK) { [Console]::Out.Write($f.SelectedPath) }"
      ].join("; ");
      program = "powershell.exe";
      args = ["-NoProfile", "-STA", "-Command", psScript];
    } else if (process.platform === "darwin") {
      program = "osascript";
      args = ["-e", 'POSIX path of (choose folder with prompt "Selecione a pasta onde os audiobooks ser\xE3o salvos")'];
    } else {
      program = "zenity";
      args = ["--file-selection", "--directory", "--title=Selecione a pasta dos audiobooks"];
    }
    const child = spawn(program, args);
    let output = "";
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (data) => output += data);
    child.on("error", () => {
      if (!res.headersSent) res.status(501).json({ error: "Seletor de pastas indispon\xEDvel neste sistema" });
    });
    child.on("close", () => {
      if (res.headersSent) return;
      const selected = output.trim().replace(/[\\/]+$/, "");
      res.json(selected ? { path: selected } : { cancelled: true });
    });
  });
  app.post("/api/default-folder", (req, res) => {
    const home = process.env.USERPROFILE || process.env.HOME || process.cwd();
    let documents = "";
    if (process.platform === "win32") {
      try {
        documents = String(execFileSync("powershell.exe", [
          "-NoProfile",
          "-Command",
          "[Console]::OutputEncoding=[Text.Encoding]::UTF8; [Environment]::GetFolderPath('MyDocuments')"
        ], { timeout: 15e3 })).trim();
      } catch {
        documents = "";
      }
    }
    const candidates = [documents, path.join(home, "Documents"), path.join(home, "Documentos"), home].filter(Boolean);
    for (const base of candidates) {
      try {
        if (!fs.existsSync(base)) continue;
        const folder = path.join(base, "Audiobook Generator");
        fs.mkdirSync(folder, { recursive: true });
        fs.accessSync(folder, fs.constants.W_OK);
        return res.json({ path: folder });
      } catch {
      }
    }
    res.status(500).json({ error: "N\xE3o foi poss\xEDvel criar a pasta padr\xE3o." });
  });
  app.get("/api/health", (req, res) => {
    const check = [
      "import importlib.util as u, json, shutil, sys",
      'print(json.dumps({"python": sys.version.split()[0], "edgeTts": bool(u.find_spec("edge_tts")), "ffmpeg": bool(shutil.which("ffmpeg")), "whisper": bool(u.find_spec("faster_whisper"))}))'
    ].join("\n");
    execFile(PYTHON_CMD, ["-c", check], { timeout: 15e3, env: PY_ENV }, (err, stdout) => {
      if (err) return res.json({ python: null, edgeTts: false, ffmpeg: false, whisper: false });
      try {
        res.json(JSON.parse(String(stdout).trim()));
      } catch {
        res.json({ python: null, edgeTts: false, ffmpeg: false, whisper: false });
      }
    });
  });
  const handleProcessRequest = (req, res) => {
    try {
      let filesInfo = [];
      if (req.body.filesInfo) {
        filesInfo = typeof req.body.filesInfo === "string" ? JSON.parse(req.body.filesInfo) : req.body.filesInfo;
      } else if (req.body.metadata) {
        filesInfo = typeof req.body.metadata === "string" ? JSON.parse(req.body.metadata) : req.body.metadata;
      }
      let config = {};
      if (req.body.config) {
        config = typeof req.body.config === "string" ? JSON.parse(req.body.config) : req.body.config;
      } else {
        config = {
          voice: req.body.voice,
          outputFolder: req.body.outputFolder,
          mode_folder: req.body.fileType === "multiple" || req.body.mode_folder === true || req.body.mode_folder === "true",
          file_format: req.body.fileType || "m4b",
          target_lang: req.body.target_lang || "pt"
        };
      }
      const fileFormat = config.file_format || config.fileType || req.body.fileType || (config.mode_folder ? "multiple" : "m4b");
      const isMultiple = fileFormat === "multiple" || config.mode_folder === true || config.mode_folder === "true";
      const generateSyncText = config.generate_sync_text !== void 0 ? config.generate_sync_text : req.body.generate_sync_text !== void 0 ? req.body.generate_sync_text === true || req.body.generate_sync_text === "true" : true;
      const syncTextDestination = ["metadata", "library", "both"].includes(config.sync_text_destination) ? config.sync_text_destination : "both";
      const syncTextGranularity = ["sentences", "words", "both"].includes(config.sync_text_granularity) ? config.sync_text_granularity : "sentences";
      const files = req.files.map((file, index) => {
        const info = filesInfo[index] || {};
        const originalExt = path.extname(info.filename || file.originalname);
        const newPath = file.path + originalExt;
        fs.renameSync(file.path, newPath);
        return {
          id: info.id || `file_${index}`,
          path: newPath,
          title: info.title || "Desconhecido",
          author: info.author || "Desconhecido",
          genre: info.genre || "",
          subgenre: info.subgenre || "",
          year: info.year || "",
          narrator: info.narrator || "",
          language: info.language || "",
          voice: info.voice || config.voice || "pt-BR-AntonioNeural",
          audio_quality: config.audio_quality,
          translate: info.requiresTranslation || info.translate || false,
          cover: info.cover || null,
          chapters: info.chapters || [],
          fileType: info.fileType || fileFormat,
          file_format: info.fileType || fileFormat,
          pronunciation_map: info.pronunciationMap || info.pronunciation_map || [],
          generate_sync_text: info.generate_sync_text !== void 0 ? info.generate_sync_text : generateSyncText,
          sync_text_destination: syncTextDestination,
          sync_text_granularity: syncTextGranularity,
          config: { ...info.config || config, file_format: info.fileType || fileFormat, pronunciation_map: info.pronunciationMap || info.pronunciation_map || [], generate_sync_text: info.generate_sync_text !== void 0 ? info.generate_sync_text : generateSyncText, sync_text_destination: syncTextDestination, sync_text_granularity: syncTextGranularity }
        };
      });
      const pythonConfig = {
        files,
        voice: config.voice || "pt-BR-AntonioNeural",
        outputFolder: config.outputFolder,
        target_lang: config.target_lang || "pt",
        mode_folder: isMultiple,
        file_format: fileFormat,
        generate_sync_text: generateSyncText,
        sync_text_destination: syncTextDestination,
        sync_text_granularity: syncTextGranularity,
        lite: Boolean(config.lite),
        turbo: Boolean(config.turbo)
      };
      const configPath = path.join(process.cwd(), `config_${Date.now()}.json`);
      fs.writeFileSync(configPath, JSON.stringify(pythonConfig));
      for (const f of files) lastEventByFile.delete(f.id);
      const pythonProc = spawn(PYTHON_CMD, ["-u", "converter.py", configPath], {
        stdio: ["pipe", "pipe", "pipe"],
        env: PY_ENV,
        detached: process.platform === "win32",
        windowsHide: true
      });
      runningPythonProcesses.add(pythonProc);
      const pending = new Set(files.map((f) => f.id));
      let stderrTail = "";
      const failPending = (message, details) => {
        for (const id of pending) broadcastProgress({ type: "error", fileId: id, error: message, details });
        pending.clear();
      };
      pythonProc.on("error", (err) => {
        runningPythonProcesses.delete(pythonProc);
        failPending(explainPythonFailure(String(err), null), `N\xE3o foi poss\xEDvel iniciar o Python (${PYTHON_CMD}).
${String(err)}`);
        console.error("Failed to start python backend process:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Failed to start processing" });
        }
      });
      let stdoutBuffer = "";
      pythonProc.stdout.setEncoding("utf8");
      pythonProc.stdout.on("data", (data) => {
        stdoutBuffer += data.toString();
        const lines = stdoutBuffer.split("\n");
        stdoutBuffer = lines.pop() || "";
        for (const line of lines) {
          if (line.trim()) {
            try {
              const event = JSON.parse(line);
              if ((event.type === "done" || event.type === "error") && event.fileId) pending.delete(event.fileId);
              broadcastProgress(event);
            } catch (e) {
              console.log("Python stdout parse error:", line);
            }
          }
        }
      });
      pythonProc.stderr.on("data", (data) => {
        const text = data.toString();
        stderrTail = (stderrTail + text).slice(-4e3);
        console.error("Python stderr:", text);
      });
      pythonProc.on("close", (code) => {
        console.log(`Python process exited with code ${code}`);
        runningPythonProcesses.delete(pythonProc);
        if (pythonProc.__cancelled) pending.clear();
        else if (pending.size > 0) failPending(
          explainPythonFailure(stderrTail, code),
          `O processo de convers\xE3o terminou com c\xF3digo ${code} antes de concluir.

\xDAltimas linhas do erro:
${stderrTail.trim().split("\n").slice(-25).join("\n") || "(nenhuma mensagem)"}`
        );
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
        } catch (e) {
        }
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Error processing request:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
  app.post("/api/process", upload.array("files"), handleProcessRequest);
  app.post("/api/convert", upload.array("files"), handleProcessRequest);
  const syncUpload = upload.fields([
    { name: "ebook", maxCount: 1 },
    { name: "ebookFile", maxCount: 1 },
    { name: "audio", maxCount: 1 },
    { name: "audioFile", maxCount: 1 }
  ]);
  app.post("/api/sync-text", syncUpload, async (req, res) => {
    const files = req.files;
    const ebookFile = files?.ebook?.[0];
    const tempFilesToClean = [];
    try {
      const audioPath = typeof req.body.audioPath === "string" ? req.body.audioPath : "";
      if (!audioPath || !fs.existsSync(audioPath)) {
        return res.status(400).json({ error: "O arquivo de \xE1udio deste audiobook n\xE3o foi encontrado." });
      }
      if (!AUDIO_EXTENSIONS.has(path.extname(audioPath).toLowerCase())) {
        return res.status(400).json({ error: "O arquivo deste audiobook n\xE3o \xE9 um \xE1udio." });
      }
      let ebookPath = "";
      if (ebookFile) {
        ebookPath = ebookFile.path + path.extname(ebookFile.originalname);
        fs.renameSync(ebookFile.path, ebookPath);
        tempFilesToClean.push(ebookPath);
      }
      const destination = ["metadata", "library", "both"].includes(req.body.destination) ? req.body.destination : "both";
      const outputFolder = req.body.outputFolder || path.join(process.cwd(), "meus audiobooks");
      const args = [
        "-u",
        "sync_text_tools.py",
        "--audio",
        audioPath,
        "--out-dir",
        outputFolder,
        "--title",
        String(req.body.title || path.basename(audioPath, path.extname(audioPath))),
        "--author",
        String(req.body.author || ""),
        "--destination",
        destination
      ];
      if (ebookPath) args.push("--ebook", ebookPath);
      const child = spawn(PYTHON_CMD, args, { stdio: ["ignore", "pipe", "pipe"], env: PY_ENV, windowsHide: true });
      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (d) => {
        stdout += d.toString();
      });
      child.stderr.on("data", (d) => {
        stderr += d.toString();
      });
      child.on("error", (err) => {
        if (!res.headersSent) res.status(500).json({ error: `N\xE3o foi poss\xEDvel iniciar o Python: ${err.message}` });
      });
      child.on("close", () => {
        for (const p of tempFilesToClean) {
          try {
            if (fs.existsSync(p)) fs.unlinkSync(p);
          } catch (e) {
          }
        }
        if (res.headersSent) return;
        const resultLine = stdout.trim().split(/\r?\n/).reverse().find((l) => l.includes('"type": "result"'));
        let result = null;
        try {
          result = resultLine ? JSON.parse(resultLine) : null;
        } catch (e) {
        }
        if (result?.success) {
          res.json(result);
        } else {
          console.error("Sync text error:", stderr || stdout);
          res.status(500).json({ error: result?.error || "Falha ao gerar o texto sincronizado.", details: stderr.slice(-2e3) });
        }
      });
    } catch (e) {
      for (const p of tempFilesToClean) {
        try {
          if (fs.existsSync(p)) fs.unlinkSync(p);
        } catch (err) {
        }
      }
      console.error("Error in /api/sync-text:", e);
      if (!res.headersSent) res.status(500).json({ error: e.message || "Erro interno do servidor." });
    }
  });
  app.post("/api/save-audiobook-metadata", express.json({ limit: "50mb" }), (req, res) => {
    try {
      const data = req.body;
      const filePath = data.filePath;
      if (!filePath || !fs.existsSync(filePath)) {
        return res.json({
          success: true,
          fileUpdated: false,
          message: "Metadados salvos na biblioteca."
        });
      }
      const tempJson = path.join(process.cwd(), `meta_inject_${Date.now()}.json`);
      fs.writeFileSync(tempJson, JSON.stringify(data), "utf-8");
      const child = spawn(PYTHON_CMD, ["-u", "inject_metadata.py", tempJson], { env: PY_ENV, windowsHide: true });
      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (d) => stdout += d.toString());
      child.stderr.on("data", (d) => stderr += d.toString());
      child.on("close", (code) => {
        try {
          if (fs.existsSync(tempJson)) fs.unlinkSync(tempJson);
        } catch {
        }
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
    } catch (err) {
      console.error("Error in /api/save-audiobook-metadata:", err);
      res.status(500).json({ success: false, error: err.message || "Erro interno." });
    }
  });
  app.all("/api/*", (req, res) => {
    console.log(`API Route not found: ${req.method} ${req.url}`);
    res.status(404).json({ error: `API Route ${req.method} ${req.url} not found` });
  });
  const distIndex = path.join(process.cwd(), "dist", "index.html");
  const modoDev = process.argv.includes("--dev") || process.env.NODE_ENV === "development" || !fs.existsSync(distIndex);
  console.log(modoDev ? "Interface em modo de desenvolvimento" : "Interface otimizada (dist)");
  if (modoDev) {
    const { createServer: createViteServer } = await import("vite");
    const react = (await import("@vitejs/plugin-react")).default;
    const tailwindcss = (await import("@tailwindcss/vite")).default;
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        // Recarga automática (HMR) só para quem edita o código: com ela, uma página em segundo plano
        // que perdia a conexão com o servidor recarregava sozinha ao voltar (e perdia o estado da tela)
        hmr: process.env.HMR === "true" ? { port: hmrPort } : false,
        ws: process.env.HMR === "true" ? void 0 : false,
        // Só o código da interface recarrega a página. Sem isso, os arquivos que a conversão grava na pasta
        // do app (uploads, config_*.json, cache) faziam a página recarregar no meio da conversão.
        watch: {
          ignored: (p) => {
            const rel = path.relative(process.cwd(), p);
            if (!rel) return false;
            if (rel.startsWith("..")) return true;
            return !["src", "public", "index.html"].includes(rel.split(/[\\/]/)[0]);
          }
        }
      },
      appType: "spa",
      configFile: false,
      plugins: [react(), tailwindcss()]
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath, { index: false, maxAge: "1h" }));
    app.use(express.static(path.join(process.cwd(), "public")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    const limites = {
      LIMIT_FILE_SIZE: "O arquivo \xE9 grande demais para enviar (limite de 1 GB).",
      LIMIT_FIELD_VALUE: "Os dados do livro (texto dos cap\xEDtulos e capa) passaram do limite de envio.",
      LIMIT_FIELD_COUNT: "O pedido tem campos demais.",
      LIMIT_FILE_COUNT: "Arquivos demais num pedido s\xF3. Converta em lotes menores.",
      LIMIT_UNEXPECTED_FILE: "O app enviou um arquivo num campo inesperado."
    };
    if (err?.code && limites[err.code]) {
      return res.status(413).json({ error: limites[err.code], details: `${err.code}: ${err.message}${err.field ? ` (campo ${err.field})` : ""}` });
    }
    res.status(500).json({ error: err.message || "Internal server error" });
  });
  if (HOST === "127.0.0.1") {
    const v6 = http.createServer(app);
    v6.on("error", () => {
    });
    v6.listen(PORT, "::1");
  }
  app.listen(PORT, HOST, async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    const url = `http://localhost:${PORT}`;
    if (!process.env.ELECTRON_MODE) {
      import("child_process").then(({ exec }) => {
        let command = "";
        if (process.platform === "win32") {
          command = `start msedge --app="${url}" || start chrome --app="${url}" || start "" "${url}"`;
        } else if (process.platform === "darwin") {
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

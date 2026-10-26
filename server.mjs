// server.ts
import express from "express";
import path from "path";
import multer from "multer";
import { spawn, execFile } from "child_process";
import fs from "fs";
import net from "net";
import https from "https";
import http from "http";
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
  limits: { fileSize: 1024 * 1024 * 1024 }
  // 1GB limit para suportar audiolivros completos
});
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}
async function startServer() {
  const app = express();
  const PORT = await getAvailablePort(3e3);
  const hmrPort = await getAvailablePort(24678, ["::1"]);
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
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
    req.on("close", () => {
      clients.delete(res);
    });
  });
  function broadcastProgress(data) {
    const message = `data: ${JSON.stringify(data)}

`;
    for (const client of clients) {
      client.write(message);
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
  app.post("/api/metadata", (req, res, next) => {
    console.log("Incoming metadata request...");
    upload.single("file")(req, res, (err) => {
      if (err) {
        console.error("Multer error:", err);
        return res.status(400).json({ error: "File upload failed: " + err.message });
      }
      next();
    });
  }, (req, res) => {
    console.log("Received metadata request for:", req.file?.originalname);
    try {
      if (!req.file) {
        console.error("No file in metadata request. Body:", req.body);
        return res.status(400).json({ error: "No file uploaded" });
      }
      const originalExt = path.extname(req.body.filename || req.file.originalname);
      const newPath = req.file.path + originalExt;
      fs.renameSync(req.file.path, newPath);
      const pythonProcess = spawn("python3", ["extract_metadata.py", newPath]);
      console.log("Spawned python process for metadata extraction");
      pythonProcess.on("error", (err) => {
        console.error("Failed to start python process:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Failed to start metadata extraction" });
        }
      });
      let output = "";
      let errorOutput = "";
      pythonProcess.stdout.on("data", (data) => {
        output += data.toString();
      });
      pythonProcess.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });
      pythonProcess.on("close", (code) => {
        console.log(`Python process closed with code ${code}`);
        if (errorOutput) console.error("Python stderr:", errorOutput);
        try {
          if (fs.existsSync(newPath)) {
            fs.unlinkSync(newPath);
          }
        } catch (e) {
          console.error("Failed to delete temp file:", newPath);
        }
        if (code === 0) {
          try {
            const lines = output.trim().split("\n");
            const lastLine = lines[lines.length - 1];
            const metadata = JSON.parse(lastLine);
            res.json(metadata);
          } catch (e) {
            console.error("Failed to parse metadata output:", output);
            res.status(500).json({ error: "Failed to parse metadata" });
          }
        } else {
          console.error("Metadata extraction failed with code:", code, "Output:", output, "Error:", errorOutput);
          res.status(500).json({ error: "Metadata extraction failed" });
        }
      });
    } catch (error) {
      console.error("Error extracting metadata:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  let currentPythonProcess = null;
  app.post("/api/cancel", (req, res) => {
    let killed = false;
    if (currentPythonProcess && currentPythonProcess.pid) {
      const pid = currentPythonProcess.pid;
      killed = true;
      if (process.platform === "win32") {
        import("child_process").then(({ exec }) => {
          exec(`taskkill /pid ${pid} /T /F`, (err) => {
            if (err) console.error("taskkill PID error:", err);
          });
          exec("taskkill /IM ffmpeg.exe /F", () => {
          });
        });
      } else {
        try {
          process.kill(-pid, "SIGKILL");
        } catch (e) {
          currentPythonProcess.kill("SIGKILL");
        }
      }
      currentPythonProcess = null;
    } else {
      if (process.platform === "win32") {
        import("child_process").then(({ exec }) => {
          exec("taskkill /IM ffmpeg.exe /F", () => {
          });
        });
      }
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
  app.post("/api/open-folder", express.json(), (req, res) => {
    try {
      let folderPath = req.body.path || path.join(process.cwd(), "meus audiobooks");
      folderPath = path.normalize(String(folderPath));
      if (folderPath.includes('"')) return res.status(400).json({ success: false });
      const isFile = req.body.isFile;
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
    if (process.platform === "win32") {
      const psScript = `
        Add-Type -AssemblyName System.windows.forms;
        $f = New-Object System.Windows.Forms.FolderBrowserDialog;
        $f.ShowNewFolderButton = $true;
        $f.Description = 'Selecione a pasta de destino';
        if($f.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK){
            $f.SelectedPath
        }
      `;
      const child = spawn("powershell.exe", ["-NoProfile", "-STA", "-Command", psScript]);
      let output = "";
      child.stdout.on("data", (data) => output += data.toString());
      child.on("close", () => {
        const path2 = output.trim();
        if (path2) {
          res.json({ path: path2 });
        } else {
          res.json({ cancelled: true });
        }
      });
    } else {
      res.status(501).json({ error: "Folder selection is only supported on Windows" });
    }
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
          file_format: req.body.fileType || "single",
          target_lang: req.body.target_lang || "pt"
        };
      }
      const fileFormat = config.file_format || config.fileType || req.body.fileType || (config.mode_folder ? "multiple" : "single");
      const isMultiple = fileFormat === "multiple" || config.mode_folder === true || config.mode_folder === "true";
      const generateSyncText = config.generate_sync_text !== void 0 ? config.generate_sync_text : req.body.generate_sync_text !== void 0 ? req.body.generate_sync_text === true || req.body.generate_sync_text === "true" : true;
      const syncTextDestination = ["metadata", "library", "both"].includes(config.sync_text_destination) ? config.sync_text_destination : "both";
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
          narrator: info.narrator || "",
          language: info.language || "",
          translate: info.requiresTranslation || info.translate || false,
          cover: info.cover || null,
          chapters: info.chapters || [],
          fileType: info.fileType || fileFormat,
          file_format: info.fileType || fileFormat,
          pronunciation_map: info.pronunciationMap || info.pronunciation_map || [],
          generate_sync_text: info.generate_sync_text !== void 0 ? info.generate_sync_text : generateSyncText,
          sync_text_destination: syncTextDestination,
          config: { ...info.config || config, file_format: info.fileType || fileFormat, pronunciation_map: info.pronunciationMap || info.pronunciation_map || [], generate_sync_text: info.generate_sync_text !== void 0 ? info.generate_sync_text : generateSyncText, sync_text_destination: syncTextDestination }
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
        sync_text_destination: syncTextDestination
      };
      const configPath = path.join(process.cwd(), `config_${Date.now()}.json`);
      fs.writeFileSync(configPath, JSON.stringify(pythonConfig));
      const pythonCmd = process.platform === "win32" ? "python" : "python3";
      currentPythonProcess = spawn(pythonCmd, ["-u", "converter.py", configPath], { stdio: ["pipe", "pipe", "pipe"] });
      currentPythonProcess.on("error", (err) => {
        console.error("Failed to start python backend process:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Failed to start processing" });
        }
      });
      let stdoutBuffer = "";
      currentPythonProcess.stdout.on("data", (data) => {
        stdoutBuffer += data.toString();
        const lines = stdoutBuffer.split("\n");
        stdoutBuffer = lines.pop() || "";
        for (const line of lines) {
          if (line.trim()) {
            try {
              const event = JSON.parse(line);
              broadcastProgress(event);
            } catch (e) {
              console.log("Python stdout parse error:", line);
            }
          }
        }
      });
      currentPythonProcess.stderr.on("data", (data) => {
        console.error("Python stderr:", data.toString());
      });
      currentPythonProcess.on("close", (code) => {
        console.log(`Python process exited with code ${code}`);
        currentPythonProcess = null;
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
      const pythonCmd = process.platform === "win32" ? "python" : "python3";
      const child = spawn(pythonCmd, args, { stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, PYTHONIOENCODING: "utf-8" } });
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
      const pythonCmd = process.platform === "win32" ? "python" : "python3";
      const child = spawn(pythonCmd, ["-u", "inject_metadata.py", tempJson]);
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
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const react = (await import("@vitejs/plugin-react")).default;
    const tailwindcss = (await import("@tailwindcss/vite")).default;
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== "true" ? { port: hmrPort } : false },
      appType: "spa",
      configFile: false,
      plugins: [react(), tailwindcss()]
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  });
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

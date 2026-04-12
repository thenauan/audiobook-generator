var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// server.ts
import express from "express";
import path from "path";
import multer from "multer";
import { spawn } from "child_process";
import fs from "fs";
import net from "net";
import https from "https";
import http from "http";
function getAvailablePort(startPort) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(startPort, "0.0.0.0", () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        resolve(getAvailablePort(startPort + 1));
      } else {
        reject(err);
      }
    });
  });
}
var upload = multer({
  dest: path.join(process.cwd(), "uploads/"),
  limits: { fileSize: 50 * 1024 * 1024 }
  // 50MB limit
});
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}
async function startServer() {
  const app = express();
  const PORT = await getAvailablePort(3e3);
  const hmrPort = await getAvailablePort(24678);
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
    if (currentPythonProcess) {
      currentPythonProcess.kill("SIGTERM");
      currentPythonProcess = null;
      res.json({ success: true, message: "Process cancelled" });
    } else {
      res.json({ success: false, message: "No process running" });
    }
  });
  app.use("/samples", express.static(path.join(process.cwd(), "public", "samples")));
  app.post("/api/snippet", express.json(), (req, res) => {
    const filePath = req.body.path;
    if (!filePath || !fs.existsSync(filePath)) return res.status(404).json({ error: "File not found" });
    const tempName = "snippet_" + Date.now() + ".mp3";
    const samplesDir2 = path.join(process.cwd(), "public", "samples");
    const outputPath = path.join(samplesDir2, tempName);
    if (!fs.existsSync(samplesDir2)) fs.mkdirSync(samplesDir2, { recursive: true });
    import("child_process").then(({ exec }) => {
      exec(`ffmpeg -t 60 -i "${filePath}" -c copy "${outputPath}"`, (error) => {
        if (error) fs.copyFileSync(filePath, outputPath);
        res.json({ url: "/samples/" + tempName });
      });
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
  app.post("/api/open-folder", express.json(), (req, res) => {
    try {
      let folderPath = req.body.path || path.join(process.cwd(), "meus audiobooks");
      folderPath = path.normalize(folderPath);
      const isFile = req.body.isFile;
      let command = "";
      if (process.platform === "win32") {
        command = isFile ? `explorer.exe /select,"${folderPath}"` : `explorer.exe "${folderPath}"`;
      } else if (process.platform === "darwin") {
        command = isFile ? `open -R "${folderPath}"` : `open "${folderPath}"`;
      } else {
        command = `xdg-open "${isFile ? __require("path").dirname(folderPath) : folderPath}"`;
      }
      import("child_process").then(({ exec }) => {
        exec(command, (error) => {
          if (error) {
            console.error("Failed to open folder:", error);
            res.status(500).json({ success: false });
          } else {
            res.json({ success: true });
          }
        });
      });
    } catch (error) {
      res.status(500).json({ success: false });
    }
  });
  app.post("/api/select-folder", (req, res) => {
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
      const child = spawn("powershell.exe", ["-NoProfile", "-Command", psScript]);
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
  app.post("/api/process", upload.array("files"), (req, res) => {
    try {
      const filesInfo = JSON.parse(req.body.filesInfo);
      const config = JSON.parse(req.body.config);
      const files = req.files.map((file, index) => {
        const info = filesInfo[index];
        const originalExt = path.extname(info.filename);
        const newPath = file.path + originalExt;
        fs.renameSync(file.path, newPath);
        return {
          id: info.id,
          path: newPath,
          title: info.title,
          author: info.author,
          translate: info.translate,
          cover: info.cover,
          config: info.config
        };
      });
      const pythonConfig = {
        files,
        voice: config.voice,
        outputFolder: config.outputFolder,
        target_lang: config.target_lang || "pt",
        mode_folder: config.mode_folder !== void 0 ? config.mode_folder : true
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
      plugins: [react(), tailwindcss()],
      define: {
        "process.env.GEMINI_API_KEY": JSON.stringify(process.env.GEMINI_API_KEY)
      }
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
  app.listen(PORT, "0.0.0.0", async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    const url = `http://localhost:${PORT}`;
    const start = process.platform == "darwin" ? "open" : process.platform == "win32" ? "start" : "xdg-open";
    import("child_process").then(({ exec }) => exec(`${start} ${url}`));
  });
}
startServer();

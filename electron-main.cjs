const { app, BrowserWindow, shell, ipcMain, dialog } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

let mainWindow;
let serverProcess;
let serverUrl = null;
let quitting = false;
let restarts = 0;
let startTimer = null;
let serverLog = '';

const MAX_RESTARTS = 3;
const START_TIMEOUT_MS = 90000;

// Uma cópia do app por vez (duas abririam dois servidores e disputariam as conversões)
if (!app.requestSingleInstanceLock()) {
    app.quit();
} else {
    app.on('second-instance', () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });
}

// Tela de abertura enquanto o servidor local inicia (no lugar de uma janela branca)
function splashHtml(message, isError = false) {
    let icon = '';
    try { icon = fs.readFileSync(path.join(__dirname, 'public', 'icon.svg'), 'utf8'); } catch (e) {}
    const safe = String(message).replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
    return `<!doctype html><html><head><meta charset="utf-8"><style>
        html,body{margin:0;height:100%;background:#161616;color:#f5f5f7;font-family:"Segoe UI",-apple-system,system-ui,sans-serif;-webkit-user-select:none;user-select:none}
        body{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px}
        .icon{width:112px;height:112px;filter:drop-shadow(0 18px 40px rgba(0,0,0,.55))}
        .icon svg{width:100%;height:100%}
        p{margin:0;font-size:14px;color:${isError ? '#ff6b6b' : '#a1a1aa'};max-width:460px;text-align:center;line-height:1.5}
        .dots::after{content:'';animation:d 1.2s steps(4,end) infinite}
        @keyframes d{0%{content:''}25%{content:'.'}50%{content:'..'}75%{content:'...'}}
    </style></head><body>
        <div class="icon">${icon}</div>
        <p class="${isError ? '' : 'dots'}">${safe}</p>
    </body></html>`;
}

function showSplash(message, isError) {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(splashHtml(message, isError))).catch(() => {});
}

// Servidor local (Express + Vite). Se cair com o app aberto, é reiniciado sozinho.
// Já existe um Audiobook Generator rodando na porta padrão (aberto pelo navegador, por exemplo)?
// Usar o mesmo servidor mantém o mesmo endereço e, com ele, os mesmos ajustes e histórico.
function findRunningServer(port = 3000) {
    return new Promise((resolve) => {
        const req = require('http').get({ host: '127.0.0.1', port, path: '/api/health', timeout: 1500 }, (res) => {
            let body = '';
            res.on('data', (c) => { body += c; });
            res.on('end', () => {
                try { resolve(res.statusCode === 200 && 'edgeTts' in JSON.parse(body) ? `http://localhost:${port}` : null); }
                catch (e) { resolve(null); }
            });
        });
        req.on('timeout', () => { req.destroy(); resolve(null); });
        req.on('error', () => resolve(null));
    });
}

async function startServer() {
    const running = await findRunningServer();
    if (running) {
        serverUrl = running;
        if (mainWindow && !mainWindow.isDestroyed()) mainWindow.loadURL(serverUrl).catch(() => {});
        return;
    }
    serverUrl = null;
    serverLog = '';
    clearTimeout(startTimer);
    serverProcess = spawn('npm', ['start'], {
        cwd: __dirname,
        shell: true,
        env: { ...process.env, ELECTRON_MODE: 'true' }
    });

    const onOutput = (data) => {
        const output = data.toString();
        serverLog = (serverLog + output).slice(-3000);
        const match = output.match(/http:\/\/(?:localhost|127\.0\.0\.1):(\d+)/);
        if (match && !serverUrl) {
            serverUrl = `http://localhost:${match[1]}`;
            clearTimeout(startTimer);
            if (mainWindow && !mainWindow.isDestroyed()) mainWindow.loadURL(serverUrl).catch(() => {});
        }
    };
    serverProcess.stdout.on('data', onOutput);
    serverProcess.stderr.on('data', (d) => { serverLog = (serverLog + d.toString()).slice(-3000); });

    startTimer = setTimeout(() => {
        if (!serverUrl) showSplash('O serviço local está demorando para iniciar. Se continuar assim, feche o app e rode o instalador de novo.', true);
    }, START_TIMEOUT_MS);

    serverProcess.on('exit', (code) => {
        clearTimeout(startTimer);
        if (quitting) return;
        const wasReady = Boolean(serverUrl);
        if (wasReady && restarts < MAX_RESTARTS) {
            restarts += 1;
            showSplash('O serviço local parou. Reiniciando');
            setTimeout(startServer, 1500);
            return;
        }
        const detalhe = /not recognized|não é reconhecido|ENOENT|command not found/i.test(serverLog)
            ? 'O Node.js não foi encontrado. Rode o instalador de novo.'
            : /Cannot find module|ERR_MODULE_NOT_FOUND/i.test(serverLog)
                ? 'Faltam arquivos do app. Rode o instalador de novo (ele executa "npm install").'
                : `Não foi possível iniciar o servidor local (código ${code}).`;
        showSplash(detalhe, true);
    });
}

function stopServer() {
    if (!serverProcess || serverProcess.exitCode !== null) return;
    if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', String(serverProcess.pid), '/f', '/t']);
    } else {
        try { serverProcess.kill('SIGTERM'); } catch (e) {}
    }
}

app.whenReady().then(() => {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        // App só para computador: abaixo de 1024 px a interface passaria ao layout de celular
        minWidth: 1024,
        minHeight: 640,
        autoHideMenuBar: true,
        backgroundColor: '#161616',
        icon: path.join(__dirname, 'public', process.platform === 'win32' ? 'icon.ico' : 'icon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            // Em segundo plano a página continua recebendo o progresso das conversões normalmente
            backgroundThrottling: false,
            preload: path.join(__dirname, 'preload.cjs')
        }
    });
    // Links externos (ex.: GitHub em Outros Apps) abrem no navegador padrão, não numa janela do app
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (/^https:\/\//i.test(url)) shell.openExternal(url);
        return { action: 'deny' };
    });
    // A página só navega dentro do app; links externos vão para o navegador
    mainWindow.webContents.on('will-navigate', (event, url) => {
        if (serverUrl && url.startsWith(serverUrl)) return;
        if (url.startsWith('data:')) return;
        event.preventDefault();
        if (/^https:\/\//i.test(url)) shell.openExternal(url);
    });
    // Se a interface travar ou fechar sozinha, recarrega (as conversões continuam no servidor)
    mainWindow.webContents.on('render-process-gone', (_e, details) => {
        if (details.reason !== 'clean-exit' && serverUrl && !mainWindow.isDestroyed()) {
            setTimeout(() => mainWindow.loadURL(serverUrl).catch(() => {}), 500);
        }
    });
    mainWindow.webContents.on('did-fail-load', (_e, code, _desc, url) => {
        // Falha ao carregar a interface (ex.: servidor reiniciando): tenta de novo em instantes
        if (serverUrl && url && url.startsWith(serverUrl) && code !== -3) {
            setTimeout(() => { if (!mainWindow.isDestroyed()) mainWindow.loadURL(serverUrl).catch(() => {}); }, 1500);
        }
    });

    showSplash('Iniciando o Audiobook Generator');
    startServer();
});

// Funções expostas à interface pelo preload.cjs
ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Selecione a pasta onde os audiobooks serão salvos',
        properties: ['openDirectory', 'createDirectory']
    });
    return result.canceled || !result.filePaths.length ? null : result.filePaths[0];
});
ipcMain.handle('close-app', () => {
    app.quit();
});

app.on('window-all-closed', () => {
    quitting = true;
    stopServer();
    if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
    quitting = true;
    stopServer();
});

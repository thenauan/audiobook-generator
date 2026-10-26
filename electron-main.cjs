const { app, BrowserWindow, shell } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

let mainWindow;
let serverProcess;
let serverReady = false;

// Tela de abertura enquanto o servidor local inicia (no lugar de uma janela branca)
function splashHtml(message, isError = false) {
    let icon = '';
    try { icon = fs.readFileSync(path.join(__dirname, 'public', 'icon.svg'), 'utf8'); } catch (e) {}
    return `<!doctype html><html><head><meta charset="utf-8"><style>
        html,body{margin:0;height:100%;background:#161616;color:#f5f5f7;font-family:"Segoe UI",-apple-system,system-ui,sans-serif;-webkit-user-select:none;user-select:none}
        body{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px}
        .icon{width:112px;height:112px;filter:drop-shadow(0 18px 40px rgba(0,0,0,.55))}
        .icon svg{width:100%;height:100%}
        p{margin:0;font-size:14px;color:${isError ? '#ff6b6b' : '#a1a1aa'};max-width:420px;text-align:center;line-height:1.5}
        .dots::after{content:'';animation:d 1.2s steps(4,end) infinite}
        @keyframes d{0%{content:''}25%{content:'.'}50%{content:'..'}75%{content:'...'}}
    </style></head><body>
        <div class="icon">${icon}</div>
        <p class="${isError ? '' : 'dots'}">${message}</p>
    </body></html>`;
}

function showSplash(message, isError) {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(splashHtml(message, isError)));
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
            contextIsolation: true
        }
    });
    // Links externos (ex.: GitHub em Outros Apps) abrem no navegador padrão, não numa janela do app
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (/^https:\/\//i.test(url)) shell.openExternal(url);
        return { action: 'deny' };
    });
    showSplash('Iniciando o Audiobook Generator');

    // Inicia o servidor backend
    serverProcess = spawn('npm', ['run', 'dev'], {
        shell: true,
        env: { ...process.env, ELECTRON_MODE: 'true' }
    });

    serverProcess.stdout.on('data', (data) => {
        const output = data.toString();
        const match = output.match(/http:\/\/localhost:(\d+)/);
        if (match && !serverReady) {
            serverReady = true;
            mainWindow.loadURL(match[0]);
        }
    });

    // Se o servidor parar antes de ficar pronto, explica em vez de deixar a janela parada
    serverProcess.on('exit', (code) => {
        if (!serverReady) {
            showSplash(`Não foi possível iniciar o servidor local (código ${code}). Verifique se o Node.js está instalado e rode "npm install" na pasta do app.`, true);
        }
    });
});

function stopServer() {
    if (!serverProcess || serverProcess.exitCode !== null) return;
    if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', String(serverProcess.pid), '/f', '/t']);
    } else {
        try { serverProcess.kill('SIGTERM'); } catch (e) {}
    }
}

app.on('window-all-closed', () => {
    stopServer();
    if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', stopServer);

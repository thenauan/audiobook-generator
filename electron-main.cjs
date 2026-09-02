const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const path = require('path');

let mainWindow;
let serverProcess;

app.whenReady().then(() => {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        autoHideMenuBar: true,
        icon: path.join(__dirname, 'public', 'icon.ico'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    // Inicia o servidor backend
    serverProcess = spawn('npm', ['run', 'dev'], { 
        shell: true, 
        env: { ...process.env, ELECTRON_MODE: 'true' } 
    });

    serverProcess.stdout.on('data', (data) => {
        const output = data.toString();
        const match = output.match(/http:\/\/localhost:(\d+)/);
        if (match) {
            mainWindow.loadURL(match[0]);
        }
    });
});

app.on('window-all-closed', () => {
    if (serverProcess) {
        spawn('taskkill', ['/pid', serverProcess.pid, '/f', '/t']);
    }
    if (process.platform !== 'darwin') app.quit();
});
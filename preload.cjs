// Ponte segura entre a interface e o Electron (só as funções abaixo ficam disponíveis para a página)
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    // Seletor de pasta nativo do sistema: devolve o caminho completo ou null se cancelar
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    // Fecha o aplicativo (e o servidor local junto)
    closeApp: () => ipcRenderer.invoke('close-app'),
});

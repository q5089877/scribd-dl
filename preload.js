import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
    download: (url, isImageMode) => ipcRenderer.invoke('start-download', { url, isImageMode }),
    onLog: (callback) => ipcRenderer.on('log-message', (_event, value) => callback(value))
});

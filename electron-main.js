import { app as electronApp, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { app as scribdApp } from './src/App.js';
import * as scribdFlag from './src/const/ScribdFlag.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function sendLogToWindow(message) {
    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0) {
        windows[0].webContents.send('log-message', message);
    }
}

// 清除 ANSI 顏色代碼的正則表達式
const stripAnsi = (str) => str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');

// 攔截 process.stdout 和 process.stderr 以捕捉所有輸出 (包含 console.log 和 cli-progress)
const originalStdoutWrite = process.stdout.write.bind(process.stdout);
const originalStderrWrite = process.stderr.write.bind(process.stderr);

process.stdout.write = (chunk, ...args) => {
    if (chunk) sendLogToWindow(stripAnsi(chunk.toString()));
    return originalStdoutWrite(chunk, ...args);
};

process.stderr.write = (chunk, ...args) => {
    if (chunk) sendLogToWindow(stripAnsi(chunk.toString()));
    return originalStderrWrite(chunk, ...args);
};

const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            sandbox: false
        },
    });

    win.loadFile(path.join(__dirname, 'index.html'));
};

electronApp.whenReady().then(() => {
    createWindow();

    electronApp.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

electronApp.on('window-all-closed', () => {
    if (process.platform !== 'darwin') electronApp.quit();
});

// 處理來自 UI 的下載請求
ipcMain.handle('start-download', async (event, { url, isImageMode }) => {
    try {
        console.log(`Starting download: ${url}, Image Mode: ${isImageMode}`);

        const flag = isImageMode ? scribdFlag.IMAGE : scribdFlag.DEFAULT;

        // 呼叫原本的 App 邏輯
        await scribdApp.execute(url, flag);

        return { success: true, message: '下載完成！請查看 output 資料夾。' };
    } catch (error) {
        console.error(error);
        return { success: false, message: `下載失敗: ${error.message}` };
    }
});

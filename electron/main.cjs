const { app, BrowserWindow, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: '星空日记 - Star Diary',
    icon: path.join(__dirname, 'icon.ico'),
    frame: true,
    autoHideMenuBar: true,
    backgroundColor: '#060618',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // In development, load from Vite dev server
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    // In production, load the built files
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ============================================================
// 自动更新
// ============================================================

function setupAutoUpdater() {
  // 开发环境不检查更新
  if (process.env.VITE_DEV_SERVER_URL) {
    console.log('[AutoUpdater] 开发模式，跳过更新检查');
    return;
  }

  autoUpdater.logger = console;
  autoUpdater.autoDownload = true;

  autoUpdater.on('checking-for-update', () => {
    console.log('[AutoUpdater] 正在检查更新...');
  });

  autoUpdater.on('update-available', (info) => {
    console.log('[AutoUpdater] 发现新版本:', info.version);
  });

  autoUpdater.on('update-not-available', () => {
    console.log('[AutoUpdater] 当前已是最新版本');
  });

  autoUpdater.on('download-progress', (progress) => {
    console.log(`[AutoUpdater] 下载进度: ${Math.round(progress.percent)}%`);
  });

  autoUpdater.on('update-downloaded', () => {
    console.log('[AutoUpdater] 更新已下载，提示用户重启');
    // 弹出对话框，用户确认后重启安装
    const { dialog } = require('electron');
    dialog.showMessageBox({
      type: 'info',
      title: '更新已就绪',
      message: '新版本已下载完成，是否立即重启安装？',
      buttons: ['立即重启', '稍后提醒'],
    }).then(({ response }) => {
      if (response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });

  autoUpdater.on('error', (err) => {
    console.error('[AutoUpdater] 更新出错:', err.message);
  });

  // 启动 5 秒后检查更新（等窗口加载完）
  setTimeout(() => {
    autoUpdater.checkForUpdatesAndNotify();
  }, 5000);
}

// ============================================================

app.whenReady().then(() => {
  createWindow();
  setupAutoUpdater();
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

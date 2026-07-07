const { app, BrowserWindow, shell, protocol, net, session } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');

// 注册自定义协议（必须在 app.ready 之前），解决 file:// 下 CloudBase API 的 CORS 问题
protocol.registerSchemesAsPrivileged([
  { scheme: 'stardiary', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } },
]);

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
      webSecurity: false,  // 桌面应用关闭 CORS 限制
    },
  });

  // In development, load from Vite dev server
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    // 生产环境用自定义协议替代 file://，确保 CloudBase API 正常工作
    mainWindow.loadURL('stardiary://app/index.html');
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
// 自定义协议处理：stardiary:// → 映射到 dist 目录
// ============================================================

function setupProtocol() {
  protocol.handle('stardiary', (request) => {
    const url = new URL(request.url);
    // stardiary://./index.html → dist/index.html
    let filePath = url.pathname.replace(/^\//, '');
    if (!filePath || filePath === '') filePath = 'index.html';
    const fullPath = path.join(__dirname, '../dist', filePath);
    return net.fetch('file:///' + fullPath.replace(/\\/g, '/'));
  });
}

// ============================================================
// 自动更新
// ============================================================

function setupAutoUpdater() {
  if (process.env.VITE_DEV_SERVER_URL) {
    console.log('[AutoUpdater] 开发模式，跳过更新检查');
    return;
  }

  autoUpdater.logger = console;
  autoUpdater.autoDownload = true;

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

  setTimeout(() => {
    autoUpdater.checkForUpdatesAndNotify();
  }, 5000);
}

// ============================================================

// ============================================================
// 拦截响应，强制添加 CORS 头（CloudBase API 不认 stardiary:// 来源）
// ============================================================

function setupCORS() {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Access-Control-Allow-Origin': ['*'],
        'Access-Control-Allow-Methods': ['GET, POST, PUT, DELETE, OPTIONS'],
        'Access-Control-Allow-Headers': ['*'],
        'Access-Control-Allow-Credentials': ['true'],
      },
    });
  });
}

app.whenReady().then(() => {
  setupProtocol();
  setupCORS();
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

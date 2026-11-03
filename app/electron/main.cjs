// Electron entry untuk versi Windows KopiPass Nusantara
const { app, BrowserWindow, shell, session } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 380,
    minHeight: 640,
    title: 'KopiPass Nusantara',
    backgroundColor: '#f6efe6',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));

  // Tautan eksternal (mis. atribusi peta) dibuka di browser bawaan
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  // Kebijakan ubin OpenStreetMap meminta User-Agent yang mengidentifikasi aplikasi dan Referer.
  // Halaman file:// tidak mengirim Referer, jadi ditambahkan di sini untuk permintaan ubin.
  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: ['https://tile.openstreetmap.org/*'] },
    (details, callback) => {
      details.requestHeaders['Referer'] = 'https://github.com/yudhis7/coffeepassnusantara';
      details.requestHeaders['User-Agent'] = `KopiPassNusantara/${app.getVersion()} (+https://github.com/yudhis7/coffeepassnusantara)`;
      callback({ requestHeaders: details.requestHeaders });
    },
  );
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

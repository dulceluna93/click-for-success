const { app, BrowserWindow, dialog, ipcMain, screen } = require('electron')
const fs = require('fs/promises')
const path = require('path')

let mainWindow = null
let fullWindowBounds = null
const MINIMAL_WIDTH = 430
const MINIMAL_HEIGHT = 88
const MINIMAL_MARGIN = 16

function createWindow() {
  fullWindowBounds = null
  mainWindow = new BrowserWindow({
    width: 1050,
    height: 594,
    minWidth: 180,
    minHeight: 135,
    transparent: true,
    frame: false,
    resizable: true,
    hasShadow: false,
    backgroundColor: '#00000000',
    icon: path.join(__dirname, '..', 'build', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.handle('desktop:get-always-on-top', () => {
  return mainWindow?.isAlwaysOnTop() ?? false
})

ipcMain.handle('desktop:toggle-always-on-top', () => {
  if (!mainWindow) return false
  const next = !mainWindow.isAlwaysOnTop()
  mainWindow.setAlwaysOnTop(next, 'screen-saver')
  return next
})

ipcMain.handle('desktop:close', () => {
  mainWindow?.close()
})

ipcMain.handle('desktop:minimize', () => {
  mainWindow?.minimize()
})

ipcMain.handle('desktop:set-ignore-mouse-events', (_event, ignore) => {
  mainWindow?.setIgnoreMouseEvents(Boolean(ignore), { forward: true })
})

ipcMain.handle('desktop:get-window-bounds', () => {
  return mainWindow?.getBounds() ?? null
})

ipcMain.handle('desktop:set-minimal-mode', (_event, enabled) => {
  if (!mainWindow) return false
  if (enabled && !fullWindowBounds) {
    fullWindowBounds = mainWindow.getBounds()
    const { x, y, width, height } = screen.getDisplayMatching(fullWindowBounds).workArea
    const stripWidth = Math.min(MINIMAL_WIDTH, width)
    mainWindow.setMinimumSize(stripWidth, MINIMAL_HEIGHT)
    mainWindow.setBounds({
      x: x + Math.round((width - stripWidth) / 2),
      y: y + height - MINIMAL_HEIGHT - MINIMAL_MARGIN,
      width: stripWidth,
      height: MINIMAL_HEIGHT
    })
  } else if (!enabled && fullWindowBounds) {
    mainWindow.setMinimumSize(180, 135)
    mainWindow.setBounds(fullWindowBounds)
    fullWindowBounds = null
  }

  return Boolean(fullWindowBounds)
})

ipcMain.handle('desktop:set-window-bounds', (_event, nextBounds) => {
  if (!mainWindow || !nextBounds) return null

  const [minWidth, minHeight] = mainWindow.getMinimumSize()
  const current = mainWindow.getBounds()
  const bounds = {
    x: Number.isFinite(nextBounds.x) ? Math.round(nextBounds.x) : current.x,
    y: Number.isFinite(nextBounds.y) ? Math.round(nextBounds.y) : current.y,
    width: Number.isFinite(nextBounds.width)
      ? Math.max(minWidth, Math.round(nextBounds.width))
      : current.width,
    height: Number.isFinite(nextBounds.height)
      ? Math.max(minHeight, Math.round(nextBounds.height))
      : current.height
  }

  mainWindow.setBounds(bounds)
  return mainWindow.getBounds()
})

ipcMain.handle('desktop:export-history', async (_event, payload) => {
  if (!mainWindow || typeof payload?.content !== 'string') return false

  const result = await dialog.showSaveDialog(mainWindow, {
    title: '导出完成记录',
    defaultPath: payload.fileName || 'Click-for-Success-完成记录.txt',
    filters: [{ name: '文本文件', extensions: ['txt'] }]
  })

  if (result.canceled || !result.filePath) return false
  await fs.writeFile(result.filePath, payload.content, 'utf8')
  return true
})

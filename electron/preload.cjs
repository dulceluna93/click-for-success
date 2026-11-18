const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('cfsDesktop', {
  getAlwaysOnTop: () => ipcRenderer.invoke('desktop:get-always-on-top'),
  toggleAlwaysOnTop: () => ipcRenderer.invoke('desktop:toggle-always-on-top'),
  setIgnoreMouseEvents: (ignore) => ipcRenderer.invoke('desktop:set-ignore-mouse-events', ignore),
  getWindowBounds: () => ipcRenderer.invoke('desktop:get-window-bounds'),
  setWindowBounds: (bounds) => ipcRenderer.invoke('desktop:set-window-bounds', bounds),
  exportHistory: (payload) => ipcRenderer.invoke('desktop:export-history', payload),
  minimize: () => ipcRenderer.invoke('desktop:minimize'),
  close: () => ipcRenderer.invoke('desktop:close')
})

window.addEventListener('DOMContentLoaded', () => {
  document.documentElement.classList.add('desktop-shell')
})

import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    // Task management functions
    getAppPath: () => ipcRenderer.invoke('get-app-path'),
    
    // File operations
    saveFile: (filePath: string, content: string) => 
      ipcRenderer.invoke('save-file', filePath, content),
    
    readFile: (filePath: string) => 
      ipcRenderer.invoke('read-file', filePath),
    
    // External integrations
    authenticateMicrosoft: () => 
      ipcRenderer.invoke('auth-microsoft'),
    
    authenticateGoogle: () => 
      ipcRenderer.invoke('auth-google'),
    
    // System operations
    showNotification: (title: string, body: string) => 
      ipcRenderer.invoke('show-notification', title, body)
  }
); 
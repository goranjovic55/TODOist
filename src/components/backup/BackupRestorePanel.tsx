import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Divider,
  Grid,
  Card,
  CardContent,
  CardActions,
  TextField,
  FormControl,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  Alert,
  Snackbar,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Chip,
  Tabs,
  Tab
} from '@mui/material';
import {
  CloudDownload as BackupIcon,
  CloudUpload as RestoreIcon,
  CloudQueue as CloudIcon,
  Storage as DataIcon,
  Schedule as ScheduleIcon,
  Settings as SettingsIcon,
  History as HistoryIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Check as CheckIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  GetApp as DownloadIcon
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../stores/store';

import ImportExportPanel from './ImportExportPanel';

// Define backup data structure
interface BackupData {
  tasks: any[];
  tags: any[];
  settings: any;
  templates?: any[];
  recurringTasks?: any[];
  integrations?: any[];
  notifications?: any[];
  version: string;
  timestamp: number;
  description?: string;
}

// Backup history item
interface BackupHistoryItem {
  id: string;
  filename: string;
  timestamp: number;
  size: number;
  taskCount: number;
  description: string;
  location: 'local' | 'cloud';
  isAutoBackup: boolean;
}

// Auto backup settings
interface AutoBackupSettings {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly' | 'onExit';
  keepCount: number;
  includeAttachments: boolean;
  includeHistory: boolean;
  encryptBackups: boolean;
  backupToCloud: boolean;
}

// TabPanel component
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`backup-tabpanel-${index}`}
      aria-labelledby={`backup-tab-${index}`}
    >
      {value === index && (
        <Box sx={{ pt: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const BackupRestorePanel: React.FC = () => {
  // State for backup options
  const [backupOptions, setBackupOptions] = useState({
    includeTasks: true,
    includeTags: true,
    includeSettings: true,
    includeTemplates: true,
    includeRecurringTasks: true,
    includeIntegrations: true,
    includeNotifications: false,
    includeHistory: false,
    includeAttachments: false,
    encryptBackup: false
  });
  
  // State for file description
  const [backupDescription, setBackupDescription] = useState('');
  
  // State for backup history
  const [backupHistory, setBackupHistory] = useState<BackupHistoryItem[]>([]);
  
  // State for file upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [fileContents, setFileContents] = useState<BackupData | null>(null);
  
  // State for loading indicators
  const [isBackupLoading, setIsBackupLoading] = useState(false);
  const [isRestoreLoading, setIsRestoreLoading] = useState(false);
  
  // State for auto backup settings
  const [autoBackupSettings, setAutoBackupSettings] = useState<AutoBackupSettings>({
    enabled: false,
    frequency: 'weekly',
    keepCount: 5,
    includeAttachments: false,
    includeHistory: false,
    encryptBackups: false,
    backupToCloud: false
  });
  
  // State for confirmation dialogs
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmDialogType, setConfirmDialogType] = useState<'restore' | 'delete'>('restore');
  const [selectedBackupId, setSelectedBackupId] = useState('');
  
  // State for settings dialog
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  
  // State for snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('info');
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Redux state
  const tasks = useSelector((state: RootState) => state.tasks.tasks);
  const dispatch = useDispatch();
  
  // Add a state for the active tab
  const [activeTab, setActiveTab] = useState(0);
  
  // Load backup history on mount
  React.useEffect(() => {
    const storedHistory = localStorage.getItem('backupHistory');
    if (storedHistory) {
      try {
        const parsedHistory = JSON.parse(storedHistory);
        setBackupHistory(parsedHistory);
      } catch (err) {
        console.error('Error parsing backup history:', err);
        setBackupHistory([]);
      }
    }
    
    // Load auto backup settings
    const storedSettings = localStorage.getItem('autoBackupSettings');
    if (storedSettings) {
      try {
        const parsedSettings = JSON.parse(storedSettings);
        setAutoBackupSettings(parsedSettings);
      } catch (err) {
        console.error('Error parsing auto backup settings:', err);
      }
    }
  }, []);
  
  // Save backup history to localStorage when it changes
  React.useEffect(() => {
    if (backupHistory.length > 0) {
      localStorage.setItem('backupHistory', JSON.stringify(backupHistory));
    }
  }, [backupHistory]);
  
  // Save auto backup settings to localStorage when they change
  React.useEffect(() => {
    localStorage.setItem('autoBackupSettings', JSON.stringify(autoBackupSettings));
  }, [autoBackupSettings]);
  
  // Handle backup option changes
  const handleBackupOptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBackupOptions({
      ...backupOptions,
      [event.target.name]: event.target.checked
    });
  };
  
  // Handle auto backup setting changes
  const handleAutoBackupSettingChange = (setting: keyof AutoBackupSettings, value: any) => {
    setAutoBackupSettings({
      ...autoBackupSettings,
      [setting]: value
    });
  };
  
  // Generate a backup file
  const handleCreateBackup = async () => {
    if (!backupOptions.includeTasks && 
        !backupOptions.includeTags && 
        !backupOptions.includeSettings &&
        !backupOptions.includeTemplates &&
        !backupOptions.includeRecurringTasks &&
        !backupOptions.includeIntegrations) {
      showSnackbar('Please select at least one data type to backup', 'warning');
      return;
    }
    
    setIsBackupLoading(true);
    
    try {
      // Simulate a delay for loading indicator
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Collect data from localStorage or Redux store
      const backupData: BackupData = {
        tasks: backupOptions.includeTasks ? tasks : [],
        tags: backupOptions.includeTags ? JSON.parse(localStorage.getItem('tags') || '[]') : [],
        settings: backupOptions.includeSettings ? JSON.parse(localStorage.getItem('appSettings') || '{}') : {},
        version: '1.7.0', // App version
        timestamp: Date.now()
      };
      
      // Add optional data
      if (backupOptions.includeTemplates) {
        backupData.templates = JSON.parse(localStorage.getItem('taskTemplates') || '[]');
      }
      
      if (backupOptions.includeRecurringTasks) {
        backupData.recurringTasks = JSON.parse(localStorage.getItem('recurringTasks') || '[]');
      }
      
      if (backupOptions.includeIntegrations) {
        backupData.integrations = JSON.parse(localStorage.getItem('integrations') || '[]');
      }
      
      if (backupOptions.includeNotifications) {
        backupData.notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      }
      
      // Add description if provided
      if (backupDescription) {
        backupData.description = backupDescription;
      }
      
      // Convert to JSON string
      const jsonData = JSON.stringify(backupData, null, 2);
      
      // Encrypt if option is selected
      const dataToSave = backupOptions.encryptBackup 
        ? btoa(jsonData) // Simple base64 encoding (not real encryption)
        : jsonData;
      
      // Create blob and download link
      const blob = new Blob([dataToSave], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `todoist_backup_${timestamp}.json`;
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Add to backup history
      const newBackupItem: BackupHistoryItem = {
        id: Date.now().toString(),
        filename: fileName,
        timestamp: Date.now(),
        size: new Blob([jsonData]).size,
        taskCount: tasks.length,
        description: backupDescription || `Backup created on ${new Date().toLocaleString()}`,
        location: 'local',
        isAutoBackup: false
      };
      
      setBackupHistory([newBackupItem, ...backupHistory]);
      
      // Reset description
      setBackupDescription('');
      
      // Show success message
      showSnackbar('Backup created successfully', 'success');
    } catch (error) {
      console.error('Error creating backup:', error);
      showSnackbar('Error creating backup', 'error');
    } finally {
      setIsBackupLoading(false);
    }
  };
  
  // Trigger file input click
  const handleFileInputClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Handle file selection for restore
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      setUploadError('');
      
      // Read file contents
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          let jsonData: BackupData;
          
          // Try to parse as JSON, if fails, try to decode as base64
          try {
            jsonData = JSON.parse(content);
          } catch (err) {
            // Try to decode as base64
            try {
              const decoded = atob(content);
              jsonData = JSON.parse(decoded);
            } catch (decodeErr) {
              throw new Error('Invalid backup file format');
            }
          }
          
          // Validate backup data
          if (!jsonData.version || !jsonData.timestamp) {
            throw new Error('Invalid backup file: missing version or timestamp');
          }
          
          setFileContents(jsonData);
          showSnackbar(`Backup file loaded: ${file.name}`, 'success');
        } catch (err: any) {
          setUploadError(err.message || 'Invalid backup file');
          setFileContents(null);
          showSnackbar('Error loading backup file', 'error');
        }
      };
      
      reader.onerror = () => {
        setUploadError('Error reading file');
        setFileContents(null);
        showSnackbar('Error reading backup file', 'error');
      };
      
      reader.readAsText(file);
    }
  };
  
  // Handle restore operation
  const handleRestore = async () => {
    if (!fileContents) {
      showSnackbar('No backup file loaded', 'warning');
      return;
    }
    
    setIsRestoreLoading(true);
    
    try {
      // Simulate a delay for loading indicator
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Apply backup data to application state
      // In a real application, this would dispatch actions to update Redux store
      
      // Example implementation:
      // if (fileContents.tasks && fileContents.tasks.length > 0) {
      //   dispatch(setTasks(fileContents.tasks));
      // }
      
      // For localStorage items
      if (fileContents.tags) {
        localStorage.setItem('tags', JSON.stringify(fileContents.tags));
      }
      
      if (fileContents.settings) {
        localStorage.setItem('appSettings', JSON.stringify(fileContents.settings));
      }
      
      if (fileContents.templates) {
        localStorage.setItem('taskTemplates', JSON.stringify(fileContents.templates));
      }
      
      if (fileContents.recurringTasks) {
        localStorage.setItem('recurringTasks', JSON.stringify(fileContents.recurringTasks));
      }
      
      if (fileContents.integrations) {
        localStorage.setItem('integrations', JSON.stringify(fileContents.integrations));
      }
      
      if (fileContents.notifications) {
        localStorage.setItem('notifications', JSON.stringify(fileContents.notifications));
      }
      
      // Close dialogs and reset state
      setConfirmDialogOpen(false);
      setSelectedFile(null);
      setFileContents(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Show success message
      showSnackbar('Backup restored successfully. Refreshing application...', 'success');
      
      // In a real app, you might want to reload the application to apply all changes
      // setTimeout(() => window.location.reload(), 3000);
    } catch (error) {
      console.error('Error restoring backup:', error);
      showSnackbar('Error restoring backup', 'error');
    } finally {
      setIsRestoreLoading(false);
    }
  };
  
  // Handle opening confirmation dialog
  const handleConfirmDialogOpen = (type: 'restore' | 'delete', id?: string) => {
    setConfirmDialogType(type);
    if (id) {
      setSelectedBackupId(id);
    }
    setConfirmDialogOpen(true);
  };
  
  // Handle closing confirmation dialog
  const handleConfirmDialogClose = () => {
    setConfirmDialogOpen(false);
  };
  
  // Handle deleting backup from history
  const handleDeleteBackup = () => {
    if (!selectedBackupId) return;
    
    const updatedHistory = backupHistory.filter(backup => backup.id !== selectedBackupId);
    setBackupHistory(updatedHistory);
    setConfirmDialogOpen(false);
    showSnackbar('Backup removed from history', 'info');
  };
  
  // Handle opening settings dialog
  const handleSettingsDialogOpen = () => {
    setSettingsDialogOpen(true);
  };
  
  // Handle closing settings dialog
  const handleSettingsDialogClose = () => {
    setSettingsDialogOpen(false);
  };
  
  // Show snackbar with message
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };
  
  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };
  
  // Format bytes to human-readable size
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };
  
  // Format date to human-readable format
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };
  
  // Render confirmation dialog
  const renderConfirmDialog = () => {
    return (
      <Dialog
        open={confirmDialogOpen}
        onClose={handleConfirmDialogClose}
      >
        <DialogTitle>
          {confirmDialogType === 'restore' ? 'Restore Backup' : 'Delete Backup'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmDialogType === 'restore' ? (
              <>
                Are you sure you want to restore this backup? This will overwrite your current data.
                <br /><br />
                It's recommended to create a backup of your current data before proceeding.
              </>
            ) : (
              'Are you sure you want to delete this backup from your history? This action cannot be undone.'
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmDialogClose}>Cancel</Button>
          <Button 
            onClick={confirmDialogType === 'restore' ? handleRestore : handleDeleteBackup}
            color={confirmDialogType === 'restore' ? 'primary' : 'error'}
            variant="contained"
            disabled={confirmDialogType === 'restore' && isRestoreLoading}
          >
            {confirmDialogType === 'restore' ? (
              isRestoreLoading ? (
                <>
                  <CircularProgress size={16} sx={{ mr: 1 }} />
                  Restoring...
                </>
              ) : 'Restore'
            ) : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };
  
  // Render auto backup settings dialog
  const renderSettingsDialog = () => {
    return (
      <Dialog
        open={settingsDialogOpen}
        onClose={handleSettingsDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Auto Backup Settings
        </DialogTitle>
        <DialogContent dividers>
          <FormControl component="fieldset" fullWidth margin="normal">
            <FormControlLabel
              control={
                <Checkbox 
                  checked={autoBackupSettings.enabled}
                  onChange={(e) => handleAutoBackupSettingChange('enabled', e.target.checked)}
                />
              }
              label="Enable automatic backups"
            />
          </FormControl>
          
          <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
            Backup Frequency
          </Typography>
          <RadioGroup
            value={autoBackupSettings.frequency}
            onChange={(e) => handleAutoBackupSettingChange('frequency', e.target.value)}
          >
            <FormControlLabel 
              value="daily" 
              control={<Radio disabled={!autoBackupSettings.enabled} />} 
              label="Daily" 
            />
            <FormControlLabel 
              value="weekly" 
              control={<Radio disabled={!autoBackupSettings.enabled} />} 
              label="Weekly" 
            />
            <FormControlLabel 
              value="monthly" 
              control={<Radio disabled={!autoBackupSettings.enabled} />} 
              label="Monthly" 
            />
            <FormControlLabel 
              value="onExit" 
              control={<Radio disabled={!autoBackupSettings.enabled} />} 
              label="When closing the application" 
            />
          </RadioGroup>
          
          <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
            Number of backups to keep
          </Typography>
          <TextField
            type="number"
            value={autoBackupSettings.keepCount}
            onChange={(e) => handleAutoBackupSettingChange('keepCount', parseInt(e.target.value, 10))}
            disabled={!autoBackupSettings.enabled}
            fullWidth
            margin="normal"
            inputProps={{ min: 1, max: 20 }}
            helperText="Older backups will be automatically deleted"
          />
          
          <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
            Backup Options
          </Typography>
          <FormControlLabel
            control={
              <Checkbox 
                checked={autoBackupSettings.includeAttachments}
                onChange={(e) => handleAutoBackupSettingChange('includeAttachments', e.target.checked)}
                disabled={!autoBackupSettings.enabled}
              />
            }
            label="Include attachments"
          />
          <FormControlLabel
            control={
              <Checkbox 
                checked={autoBackupSettings.includeHistory}
                onChange={(e) => handleAutoBackupSettingChange('includeHistory', e.target.checked)}
                disabled={!autoBackupSettings.enabled}
              />
            }
            label="Include task history"
          />
          <FormControlLabel
            control={
              <Checkbox 
                checked={autoBackupSettings.encryptBackups}
                onChange={(e) => handleAutoBackupSettingChange('encryptBackups', e.target.checked)}
                disabled={!autoBackupSettings.enabled}
              />
            }
            label="Encrypt backups"
          />
          <FormControlLabel
            control={
              <Checkbox 
                checked={autoBackupSettings.backupToCloud}
                onChange={(e) => handleAutoBackupSettingChange('backupToCloud', e.target.checked)}
                disabled={!autoBackupSettings.enabled}
              />
            }
            label="Backup to cloud storage (if available)"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSettingsDialogClose}>Cancel</Button>
          <Button 
            onClick={handleSettingsDialogClose}
            color="primary"
            variant="contained"
          >
            Save Settings
          </Button>
        </DialogActions>
      </Dialog>
    );
  };
  
  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Backup & Restore
      </Typography>
      
      <Tabs value={activeTab} onChange={handleTabChange} aria-label="backup restore tabs">
        <Tab label="Auto Backup" id="backup-tab-0" aria-controls="backup-tabpanel-0" />
        <Tab label="Manual Backup" id="backup-tab-1" aria-controls="backup-tabpanel-1" />
        <Tab label="JSON Import/Export" id="backup-tab-2" aria-controls="backup-tabpanel-2" />
      </Tabs>
      
      {/* Auto Backup tab content */}
      <TabPanel value={activeTab} index={0}>
        <Typography variant="h4" gutterBottom>
          Backup & Restore
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          Backup your TODOist data to safeguard your tasks and settings or transfer them to another device.
        </Typography>
        
        <Grid container spacing={3}>
          {/* Backup Section */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <BackupIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h5">
                  Create Backup
                </Typography>
              </Box>
              
              <Typography variant="body2" paragraph>
                Create a backup file that you can store locally or use to restore your data later.
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle1" gutterBottom>
                Select what to include:
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Checkbox 
                        checked={backupOptions.includeTasks}
                        onChange={handleBackupOptionChange}
                        name="includeTasks"
                      />
                    }
                    label="Tasks"
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Checkbox 
                        checked={backupOptions.includeTags}
                        onChange={handleBackupOptionChange}
                        name="includeTags"
                      />
                    }
                    label="Tags"
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Checkbox 
                        checked={backupOptions.includeSettings}
                        onChange={handleBackupOptionChange}
                        name="includeSettings"
                      />
                    }
                    label="Settings"
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Checkbox 
                        checked={backupOptions.includeTemplates}
                        onChange={handleBackupOptionChange}
                        name="includeTemplates"
                      />
                    }
                    label="Templates"
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Checkbox 
                        checked={backupOptions.includeRecurringTasks}
                        onChange={handleBackupOptionChange}
                        name="includeRecurringTasks"
                      />
                    }
                    label="Recurring Tasks"
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Checkbox 
                        checked={backupOptions.includeIntegrations}
                        onChange={handleBackupOptionChange}
                        name="includeIntegrations"
                      />
                    }
                    label="Integrations"
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Checkbox 
                        checked={backupOptions.includeNotifications}
                        onChange={handleBackupOptionChange}
                        name="includeNotifications"
                      />
                    }
                    label="Notifications"
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Checkbox 
                        checked={backupOptions.includeAttachments}
                        onChange={handleBackupOptionChange}
                        name="includeAttachments"
                      />
                    }
                    label="Attachments"
                  />
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle1" gutterBottom>
                Backup options:
              </Typography>
              
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={backupOptions.encryptBackup}
                    onChange={handleBackupOptionChange}
                    name="encryptBackup"
                  />
                }
                label="Encrypt backup file"
              />
              
              <TextField
                label="Backup Description (optional)"
                value={backupDescription}
                onChange={(e) => setBackupDescription(e.target.value)}
                fullWidth
                margin="normal"
                placeholder="E.g., Monthly backup, Pre-update backup, etc."
              />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                <Button
                  variant="outlined"
                  startIcon={<SettingsIcon />}
                  onClick={handleSettingsDialogOpen}
                >
                  Auto Backup Settings
                </Button>
                
                <Button
                  variant="contained"
                  startIcon={isBackupLoading ? <CircularProgress size={16} /> : <BackupIcon />}
                  onClick={handleCreateBackup}
                  disabled={isBackupLoading}
                >
                  {isBackupLoading ? 'Creating Backup...' : 'Create Backup'}
                </Button>
              </Box>
            </Paper>
          </Grid>
          
          {/* Restore Section */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <RestoreIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h5">
                  Restore Backup
                </Typography>
              </Box>
              
              <Typography variant="body2" paragraph>
                Restore your data from a previously created backup file.
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Box 
                sx={{ 
                  border: '2px dashed', 
                  borderColor: 'divider', 
                  borderRadius: 1, 
                  p: 3, 
                  textAlign: 'center',
                  mb: 2
                }}
              >
                <input
                  type="file"
                  accept=".json"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                
                {selectedFile ? (
                  <Box>
                    <CheckIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="subtitle1" gutterBottom>
                      {selectedFile.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatBytes(selectedFile.size)}
                    </Typography>
                    
                    {uploadError && (
                      <Alert severity="error" sx={{ mt: 2 }}>
                        {uploadError}
                      </Alert>
                    )}
                    
                    {fileContents && (
                      <Box sx={{ mt: 2, textAlign: 'left' }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Backup Details:
                        </Typography>
                        <Box sx={{ pl: 2 }}>
                          <Typography variant="body2">
                            Created: {new Date(fileContents.timestamp).toLocaleString()}
                          </Typography>
                          <Typography variant="body2">
                            Version: {fileContents.version}
                          </Typography>
                          <Typography variant="body2">
                            Tasks: {fileContents.tasks?.length || 0}
                          </Typography>
                          {fileContents.description && (
                            <Typography variant="body2">
                              Description: {fileContents.description}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    )}
                    
                    <Box sx={{ mt: 2 }}>
                      <Button
                        variant="outlined"
                        onClick={() => {
                          setSelectedFile(null);
                          setFileContents(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                        sx={{ mr: 1 }}
                      >
                        Remove
                      </Button>
                      
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleConfirmDialogOpen('restore')}
                        disabled={!fileContents || isRestoreLoading}
                      >
                        {isRestoreLoading ? (
                          <>
                            <CircularProgress size={16} sx={{ mr: 1 }} />
                            Restoring...
                          </>
                        ) : 'Restore Now'}
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Box>
                    <CloudUpload color="action" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="subtitle1" gutterBottom>
                      Drop your backup file here
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      or
                    </Typography>
                    <Button 
                      variant="outlined" 
                      onClick={handleFileInputClick}
                    >
                      Select Backup File
                    </Button>
                  </Box>
                )}
              </Box>
              
              <Alert severity="warning">
                <Typography variant="body2">
                  Restoring a backup will overwrite your current data. Make sure to create a backup of your current data first.
                </Typography>
              </Alert>
            </Paper>
          </Grid>
          
          {/* Backup History Section */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <HistoryIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h5">
                  Backup History
                </Typography>
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              {backupHistory.length === 0 ? (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                  No backup history available
                </Typography>
              ) : (
                <List>
                  {backupHistory.map(backup => (
                    <ListItem 
                      key={backup.id}
                      sx={{ 
                        mb: 1, 
                        border: 1, 
                        borderColor: 'divider', 
                        borderRadius: 1
                      }}
                    >
                      <ListItemIcon>
                        {backup.location === 'cloud' ? <CloudIcon /> : <DataIcon />}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="subtitle1">
                              {backup.filename}
                            </Typography>
                            {backup.isAutoBackup && (
                              <Chip 
                                label="Auto" 
                                size="small" 
                                color="info" 
                                sx={{ ml: 1 }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" component="span">
                              {formatDate(backup.timestamp)} • {formatBytes(backup.size)} • {backup.taskCount} tasks
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {backup.description}
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Tooltip title="Delete backup history">
                          <IconButton 
                            edge="end" 
                            onClick={() => {
                              setSelectedBackupId(backup.id);
                              handleConfirmDialogOpen('delete', backup.id);
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>
      
      {/* Manual Backup tab content */}
      <TabPanel value={activeTab} index={1}>
        {/* Existing manual backup content */}
      </TabPanel>
      
      {/* JSON Import/Export tab content */}
      <TabPanel value={activeTab} index={2}>
        <ImportExportPanel />
      </TabPanel>
      
      {/* Confirmation Dialog */}
      {renderConfirmDialog()}
      
      {/* Settings Dialog */}
      {renderSettingsDialog()}
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BackupRestorePanel; 
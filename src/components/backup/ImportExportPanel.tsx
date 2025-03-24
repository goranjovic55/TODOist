import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
  TextField,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid
} from '@mui/material';
import {
  Upload as UploadIcon,
  Download as DownloadIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Check as CheckIcon,
  RestoreFromTrash as RestoreIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';

import { RootState } from '../../stores/store';
import { importData, setLastExportDate } from '../../stores/tasksSlice';
import { saveAsJsonFile, importFromJsonFile } from '../../utils/importExportUtils';
import { formatDate } from '../../utils/dateUtils';

const ImportExportPanel: React.FC = () => {
  const dispatch = useDispatch();
  const { projects, groups, tasks, lastImportDate, lastExportDate } = useSelector((state: RootState) => state.tasks);
  
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('info');
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFilename, setExportFilename] = useState('todoist-export.json');
  const [importErrors, setImportErrors] = useState<string[]>([]);
  
  // Handle export
  const handleExport = () => {
    setLoading(true);
    
    try {
      saveAsJsonFile(projects, groups, tasks, exportFilename);
      dispatch(setLastExportDate());
      
      setSnackbarSeverity('success');
      setSnackbarMessage('Data exported successfully!');
      setSnackbarOpen(true);
      setExportDialogOpen(false);
    } catch (error) {
      setSnackbarSeverity('error');
      setSnackbarMessage('Error exporting data. Please try again.');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle import
  const handleImport = async () => {
    setLoading(true);
    
    try {
      const importedData = await importFromJsonFile();
      
      if (!importedData) {
        setSnackbarSeverity('error');
        setSnackbarMessage('No data was imported. Please check the file and try again.');
        setSnackbarOpen(true);
        setLoading(false);
        return;
      }
      
      dispatch(importData({
        projects: importedData.projects,
        groups: importedData.groups,
        tasks: importedData.tasks
      }));
      
      setSnackbarSeverity('success');
      setSnackbarMessage('Data imported successfully!');
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarSeverity('error');
      setSnackbarMessage('Error importing data. Please check the file and try again.');
      setSnackbarOpen(true);
      
      if (error instanceof Error) {
        setImportErrors([error.message]);
        setImportDialogOpen(true);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Open export dialog
  const openExportDialog = () => {
    setExportFilename(`todoist-export-${new Date().toISOString().slice(0, 10)}.json`);
    setExportDialogOpen(true);
  };
  
  // Close dialogs
  const handleCloseExportDialog = () => {
    setExportDialogOpen(false);
  };
  
  const handleCloseImportDialog = () => {
    setImportDialogOpen(false);
    setImportErrors([]);
  };
  
  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Data Import & Export
      </Typography>
      
      <Divider sx={{ my: 2 }} />
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Export Data
            </Typography>
            
            <Typography variant="body2" paragraph>
              Export all your projects, groups, and tasks to a JSON file that you can back up or transfer to another device.
            </Typography>
            
            {lastExportDate && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Last export: {formatDate(new Date(lastExportDate))}
              </Alert>
            )}
            
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={openExportDialog}
              disabled={loading}
              sx={{ mt: 2 }}
            >
              Export Data
            </Button>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Import Data
            </Typography>
            
            <Typography variant="body2" paragraph>
              Import projects, groups, and tasks from a JSON file. This will replace your current data.
            </Typography>
            
            {lastImportDate && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Last import: {formatDate(new Date(lastImportDate))}
              </Alert>
            )}
            
            <Alert severity="warning" sx={{ mb: 2 }}>
              Warning: Importing data will replace all your current projects, groups, and tasks.
            </Alert>
            
            <Button
              variant="contained"
              color="secondary"
              startIcon={<UploadIcon />}
              onClick={handleImport}
              disabled={loading}
              sx={{ mt: 2 }}
            >
              Import Data
            </Button>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onClose={handleCloseExportDialog}>
        <DialogTitle>Export Data</DialogTitle>
        <DialogContent>
          <Box sx={{ p: 1 }}>
            <TextField
              label="Filename"
              value={exportFilename}
              onChange={(e) => setExportFilename(e.target.value)}
              fullWidth
              margin="normal"
            />
            
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              This will export {projects.length} projects, {groups.length} groups, and {tasks.length} tasks.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseExportDialog}>Cancel</Button>
          <Button onClick={handleExport} variant="contained">
            {loading ? <CircularProgress size={24} /> : 'Export'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Import Errors Dialog */}
      <Dialog open={importDialogOpen} onClose={handleCloseImportDialog}>
        <DialogTitle>Import Errors</DialogTitle>
        <DialogContent>
          <Box sx={{ p: 1 }}>
            <Typography variant="body1" paragraph>
              The following errors occurred during import:
            </Typography>
            
            <List>
              {importErrors.map((error, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <WarningIcon color="error" />
                  </ListItemIcon>
                  <ListItemText primary={error} />
                </ListItem>
              ))}
            </List>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseImportDialog} variant="contained">
            OK
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ImportExportPanel; 
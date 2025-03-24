import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Switch,
  FormControlLabel,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  CircularProgress,
  Tooltip,
  Alert,
  Chip,
  Snackbar
} from '@mui/material';
import {
  CheckCircle as ConnectedIcon,
  Cancel as DisconnectedIcon,
  Sync as SyncIcon,
  Settings as SettingsIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Loop as SyncActiveIcon,
  CloudDownload as ImportIcon,
  CloudUpload as ExportIcon,
  Refresh as RefreshIcon,
  Google as GoogleIcon,
  GitHub as GitHubIcon,
  Apple as AppleIcon
} from '@mui/icons-material';
import MicrosoftIcon from '@mui/icons-material/Business';
import TrelloIcon from '@mui/icons-material/Dashboard';
import SlackIcon from '@mui/icons-material/AlternateEmail';
import DropboxIcon from '@mui/icons-material/CloudQueue';

// Define the integration service types
type IntegrationType = 
  | 'google_tasks' 
  | 'microsoft_todo' 
  | 'trello' 
  | 'github' 
  | 'slack' 
  | 'apple_reminders'
  | 'dropbox';

// Integration status
type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

// Integration data model
interface Integration {
  id: string;
  type: IntegrationType;
  name: string;
  description: string;
  status: ConnectionStatus;
  lastSync?: Date;
  settings: IntegrationSettings;
  taskCount?: number;
  icon: React.ReactNode;
}

// Settings for integration
interface IntegrationSettings {
  syncEnabled: boolean;
  syncFrequency: 'manual' | 'hourly' | 'daily' | 'realtime';
  syncDirection: 'import' | 'export' | 'bidirectional';
  syncCategories: string[];
  authToken?: string;
  credentials?: {
    username?: string;
    apiKey?: string;
    [key: string]: any;
  };
}

// API key form fields by service type
interface ApiFormFields {
  [key: string]: {
    label: string;
    placeholder: string;
    type: string;
    required: boolean;
  }[];
}

// Default integration settings
const defaultSettings: IntegrationSettings = {
  syncEnabled: true,
  syncFrequency: 'daily',
  syncDirection: 'bidirectional',
  syncCategories: ['all'],
};

// Form fields configuration for each service
const apiFormFields: ApiFormFields = {
  google_tasks: [
    { label: 'Client ID', placeholder: 'Your Google API Client ID', type: 'text', required: true },
    { label: 'Client Secret', placeholder: 'Your Google API Client Secret', type: 'password', required: true }
  ],
  microsoft_todo: [
    { label: 'Client ID', placeholder: 'Your Microsoft App ID', type: 'text', required: true },
    { label: 'Client Secret', placeholder: 'Your Microsoft App Secret', type: 'password', required: true }
  ],
  trello: [
    { label: 'API Key', placeholder: 'Your Trello API Key', type: 'text', required: true },
    { label: 'Token', placeholder: 'Your Trello Token', type: 'password', required: true }
  ],
  github: [
    { label: 'Personal Access Token', placeholder: 'Your GitHub PAT', type: 'password', required: true }
  ],
  slack: [
    { label: 'API Token', placeholder: 'Your Slack Bot Token', type: 'password', required: true },
    { label: 'Channel ID', placeholder: 'Channel to post to (optional)', type: 'text', required: false }
  ],
  apple_reminders: [
    { label: 'App ID', placeholder: 'Your Apple App ID', type: 'text', required: true },
    { label: 'App Secret', placeholder: 'Your Apple App Secret', type: 'password', required: true }
  ],
  dropbox: [
    { label: 'App Key', placeholder: 'Your Dropbox App Key', type: 'text', required: true },
    { label: 'App Secret', placeholder: 'Your Dropbox App Secret', type: 'password', required: true }
  ]
};

const IntegrationsPanel: React.FC = () => {
  // State for integrations
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  
  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  
  // Form state
  const [formValues, setFormValues] = useState<{ [key: string]: string }>({});
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [selectedService, setSelectedService] = useState<IntegrationType | null>(null);
  
  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [activeSyncId, setActiveSyncId] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('info');
  
  // Load integrations on mount
  useEffect(() => {
    // In a real app, this would load from localStorage or a backend API
    const storedIntegrations = localStorage.getItem('integrations');
    if (storedIntegrations) {
      try {
        const parsedIntegrations = JSON.parse(storedIntegrations);
        // Convert date strings back to Date objects
        const formattedIntegrations = parsedIntegrations.map((integration: any) => ({
          ...integration,
          lastSync: integration.lastSync ? new Date(integration.lastSync) : undefined
        }));
        setIntegrations(formattedIntegrations);
      } catch (error) {
        console.error('Error parsing stored integrations:', error);
        // Initialize with sample data if parsing fails
        setIntegrations(getSampleIntegrations());
      }
    } else {
      // Initialize with sample data
      const sampleIntegrations = getSampleIntegrations();
      setIntegrations(sampleIntegrations);
      localStorage.setItem('integrations', JSON.stringify(sampleIntegrations));
    }
  }, []);

  // Save integrations to localStorage when they change
  useEffect(() => {
    if (integrations.length > 0) {
      localStorage.setItem('integrations', JSON.stringify(integrations));
    }
  }, [integrations]);

  // Handle add integration dialog
  const handleOpenAddDialog = () => {
    setAddDialogOpen(true);
    setSelectedService(null);
    setFormValues({});
    setFormErrors({});
  };

  const handleCloseAddDialog = () => {
    setAddDialogOpen(false);
  };

  // Handle config dialog
  const handleOpenConfigDialog = (integration: Integration) => {
    setSelectedIntegration(integration);
    setConfigDialogOpen(true);
  };

  const handleCloseConfigDialog = () => {
    setConfigDialogOpen(false);
    setSelectedIntegration(null);
  };

  // Handle confirm delete dialog
  const handleOpenConfirmDialog = (integration: Integration) => {
    setSelectedIntegration(integration);
    setConfirmDialogOpen(true);
  };

  const handleCloseConfirmDialog = () => {
    setConfirmDialogOpen(false);
  };

  // Handle service selection
  const handleServiceSelect = (type: IntegrationType) => {
    setSelectedService(type);
  };

  // Handle form input change
  const handleFormChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormValues({
      ...formValues,
      [name]: value
    });
    
    // Clear error when field is modified
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  // Validate form
  const validateForm = () => {
    if (!selectedService) return false;
    
    const errors: { [key: string]: string } = {};
    const fields = apiFormFields[selectedService];
    
    fields.forEach(field => {
      if (field.required && !formValues[field.label]) {
        errors[field.label] = 'This field is required';
      }
    });
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle adding a new integration
  const handleAddIntegration = () => {
    if (!validateForm() || !selectedService) return;
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const newIntegration: Integration = {
        id: Date.now().toString(),
        type: selectedService,
        name: getServiceName(selectedService),
        description: getServiceDescription(selectedService),
        status: 'connected',
        lastSync: new Date(),
        settings: { ...defaultSettings },
        taskCount: Math.floor(Math.random() * 50) + 1,
        icon: getServiceIcon(selectedService)
      };
      
      setIntegrations([...integrations, newIntegration]);
      setIsLoading(false);
      handleCloseAddDialog();
      
      // Show success message
      showSnackbar('Integration connected successfully', 'success');
    }, 1500);
  };

  // Handle updating integration settings
  const handleUpdateSettings = () => {
    if (!selectedIntegration) return;
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const updatedIntegrations = integrations.map(integration => 
        integration.id === selectedIntegration.id
          ? selectedIntegration
          : integration
      );
      
      setIntegrations(updatedIntegrations);
      setIsLoading(false);
      handleCloseConfigDialog();
      
      // Show success message
      showSnackbar('Integration settings updated', 'success');
    }, 1000);
  };

  // Handle deleting an integration
  const handleDeleteIntegration = () => {
    if (!selectedIntegration) return;
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const updatedIntegrations = integrations.filter(
        integration => integration.id !== selectedIntegration.id
      );
      
      setIntegrations(updatedIntegrations);
      setIsLoading(false);
      handleCloseConfirmDialog();
      
      // Show success message
      showSnackbar('Integration removed', 'info');
    }, 1000);
  };

  // Handle toggling integration status
  const handleToggleStatus = (id: string) => {
    const updatedIntegrations = integrations.map(integration => 
      integration.id === id
        ? { 
            ...integration, 
            settings: { 
              ...integration.settings, 
              syncEnabled: !integration.settings.syncEnabled 
            } 
          }
        : integration
    );
    
    setIntegrations(updatedIntegrations);
    
    // Show status message
    const integration = updatedIntegrations.find(i => i.id === id);
    if (integration) {
      showSnackbar(
        `Sync ${integration.settings.syncEnabled ? 'enabled' : 'disabled'} for ${integration.name}`,
        'info'
      );
    }
  };

  // Handle sync frequency change
  const handleSyncFrequencyChange = (
    value: 'manual' | 'hourly' | 'daily' | 'realtime'
  ) => {
    if (!selectedIntegration) return;
    
    setSelectedIntegration({
      ...selectedIntegration,
      settings: {
        ...selectedIntegration.settings,
        syncFrequency: value
      }
    });
  };

  // Handle sync direction change
  const handleSyncDirectionChange = (
    value: 'import' | 'export' | 'bidirectional'
  ) => {
    if (!selectedIntegration) return;
    
    setSelectedIntegration({
      ...selectedIntegration,
      settings: {
        ...selectedIntegration.settings,
        syncDirection: value
      }
    });
  };

  // Handle manual sync
  const handleSync = (id: string) => {
    setActiveSyncId(id);
    
    // Simulate sync process
    setTimeout(() => {
      const updatedIntegrations = integrations.map(integration => 
        integration.id === id
          ? { ...integration, lastSync: new Date() }
          : integration
      );
      
      setIntegrations(updatedIntegrations);
      setActiveSyncId(null);
      
      // Show success message
      const integration = updatedIntegrations.find(i => i.id === id);
      if (integration) {
        showSnackbar(`Synced with ${integration.name} successfully`, 'success');
      }
    }, 2000);
  };

  // Show snackbar
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Get service display name
  const getServiceName = (type: IntegrationType): string => {
    switch (type) {
      case 'google_tasks':
        return 'Google Tasks';
      case 'microsoft_todo':
        return 'Microsoft To Do';
      case 'trello':
        return 'Trello';
      case 'github':
        return 'GitHub Issues';
      case 'slack':
        return 'Slack Reminders';
      case 'apple_reminders':
        return 'Apple Reminders';
      case 'dropbox':
        return 'Dropbox Paper';
      default:
        return 'Unknown Service';
    }
  };

  // Get service description
  const getServiceDescription = (type: IntegrationType): string => {
    switch (type) {
      case 'google_tasks':
        return 'Sync with your Google Tasks lists';
      case 'microsoft_todo':
        return 'Connect with Microsoft To Do for seamless task management';
      case 'trello':
        return 'Convert Trello cards to tasks and vice versa';
      case 'github':
        return 'Sync GitHub issues with your tasks';
      case 'slack':
        return 'Create tasks from Slack reminders and messages';
      case 'apple_reminders':
        return 'Sync with Apple Reminders across your devices';
      case 'dropbox':
        return 'Import tasks from Dropbox Paper documents';
      default:
        return 'Connect with an external service';
    }
  };

  // Get service icon
  const getServiceIcon = (type: IntegrationType): React.ReactNode => {
    switch (type) {
      case 'google_tasks':
        return <GoogleIcon />;
      case 'microsoft_todo':
        return <MicrosoftIcon />;
      case 'trello':
        return <TrelloIcon />;
      case 'github':
        return <GitHubIcon />;
      case 'slack':
        return <SlackIcon />;
      case 'apple_reminders':
        return <AppleIcon />;
      case 'dropbox':
        return <DropboxIcon />;
      default:
        return <SyncIcon />;
    }
  };

  // Get formatted date for last sync
  const getFormattedLastSync = (date?: Date): string => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    if (diffDays < 30) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    
    return date.toLocaleDateString();
  };

  // Get sync frequency display text
  const getSyncFrequencyText = (frequency: string): string => {
    switch (frequency) {
      case 'manual':
        return 'Manual sync only';
      case 'hourly':
        return 'Every hour';
      case 'daily':
        return 'Once a day';
      case 'realtime':
        return 'Real-time sync';
      default:
        return frequency;
    }
  };

  // Get sync direction display text and icon
  const getSyncDirectionDisplay = (direction: string): { text: string; icon: React.ReactNode } => {
    switch (direction) {
      case 'import':
        return { text: 'Import only', icon: <ImportIcon fontSize="small" /> };
      case 'export':
        return { text: 'Export only', icon: <ExportIcon fontSize="small" /> };
      case 'bidirectional':
        return { text: 'Two-way sync', icon: <SyncIcon fontSize="small" /> };
      default:
        return { text: direction, icon: <SyncIcon fontSize="small" /> };
    }
  };

  // Render service selection cards
  const renderServiceCards = () => {
    const services: IntegrationType[] = [
      'google_tasks', 
      'microsoft_todo', 
      'trello', 
      'github', 
      'slack', 
      'apple_reminders',
      'dropbox'
    ];
    
    // Filter out already connected services
    const availableServices = services.filter(
      service => !integrations.some(integration => integration.type === service)
    );
    
    if (availableServices.length === 0) {
      return (
        <Alert severity="info" sx={{ width: '100%', mt: 2 }}>
          All available services are already connected. You can configure or remove existing integrations.
        </Alert>
      );
    }
    
    return (
      <Grid container spacing={2} sx={{ mt: 1 }}>
        {availableServices.map(service => (
          <Grid item xs={12} sm={6} md={4} key={service}>
            <Card 
              onClick={() => handleServiceSelect(service)}
              sx={{ 
                cursor: 'pointer',
                border: selectedService === service ? 2 : 0,
                borderColor: 'primary.main',
                height: '100%',
                transition: 'all 0.2s',
                '&:hover': {
                  boxShadow: 3
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ mr: 1 }}>
                    {getServiceIcon(service)}
                  </Box>
                  <Typography variant="h6">
                    {getServiceName(service)}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {getServiceDescription(service)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  // Render API connection form
  const renderApiForm = () => {
    if (!selectedService) return null;
    
    const fields = apiFormFields[selectedService];
    
    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          Connect to {getServiceName(selectedService)}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          Enter your API credentials to connect with {getServiceName(selectedService)}.
        </Typography>
        
        {fields.map(field => (
          <TextField
            key={field.label}
            label={field.label}
            name={field.label}
            placeholder={field.placeholder}
            type={field.type}
            fullWidth
            margin="normal"
            value={formValues[field.label] || ''}
            onChange={handleFormChange}
            error={!!formErrors[field.label]}
            helperText={formErrors[field.label]}
            required={field.required}
          />
        ))}
      </Box>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Integrations
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Connect TODOist with external services to sync your tasks across platforms.
      </Typography>
      
      {/* Integrations List */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5">
              Connected Services
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenAddDialog}
            >
              Add Integration
            </Button>
          </Box>
          
          {integrations.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No integrations configured yet. Add your first integration to get started.
              </Typography>
              <Button 
                variant="outlined" 
                startIcon={<AddIcon />} 
                sx={{ mt: 2 }}
                onClick={handleOpenAddDialog}
              >
                Add Integration
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {integrations.map(integration => (
                <Grid item xs={12} md={6} lg={4} key={integration.id}>
                  <Paper sx={{ p: 2, height: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ mr: 1 }}>
                          {integration.icon}
                        </Box>
                        <Box>
                          <Typography variant="h6">
                            {integration.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {integration.description}
                          </Typography>
                        </Box>
                      </Box>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={integration.settings.syncEnabled}
                            onChange={() => handleToggleStatus(integration.id)}
                            size="small"
                          />
                        }
                        label=""
                      />
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Last sync:
                      </Typography>
                      <Typography variant="body2">
                        {getFormattedLastSync(integration.lastSync)}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Frequency:
                      </Typography>
                      <Typography variant="body2">
                        {getSyncFrequencyText(integration.settings.syncFrequency)}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Direction:
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getSyncDirectionDisplay(integration.settings.syncDirection).icon}
                        <Typography variant="body2" sx={{ ml: 0.5 }}>
                          {getSyncDirectionDisplay(integration.settings.syncDirection).text}
                        </Typography>
                      </Box>
                    </Box>
                    
                    {integration.taskCount !== undefined && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Synced tasks:
                        </Typography>
                        <Chip 
                          label={integration.taskCount} 
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </Box>
                    )}
                    
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<SettingsIcon />}
                        onClick={() => handleOpenConfigDialog(integration)}
                        sx={{ mr: 1 }}
                      >
                        Configure
                      </Button>
                      
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={activeSyncId === integration.id ? <CircularProgress size={16} /> : <RefreshIcon />}
                        disabled={activeSyncId !== null || !integration.settings.syncEnabled}
                        onClick={() => handleSync(integration.id)}
                      >
                        {activeSyncId === integration.id ? 'Syncing...' : 'Sync Now'}
                      </Button>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </Grid>
      </Grid>
      
      {/* Add Integration Dialog */}
      <Dialog 
        open={addDialogOpen} 
        onClose={handleCloseAddDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Add Integration</DialogTitle>
        <DialogContent dividers>
          {!selectedService ? (
            <>
              <Typography gutterBottom>
                Select a service to integrate with TODOist:
              </Typography>
              {renderServiceCards()}
            </>
          ) : (
            renderApiForm()
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddDialog}>Cancel</Button>
          {selectedService && (
            <Button 
              onClick={handleAddIntegration}
              variant="contained"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <CircularProgress size={16} sx={{ mr: 1 }} />
                  Connecting...
                </>
              ) : (
                'Connect'
              )}
            </Button>
          )}
        </DialogActions>
      </Dialog>
      
      {/* Configure Integration Dialog */}
      <Dialog 
        open={configDialogOpen} 
        onClose={handleCloseConfigDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedIntegration ? `Configure ${selectedIntegration.name}` : 'Configure Integration'}
        </DialogTitle>
        <DialogContent dividers>
          {selectedIntegration && (
            <>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Sync Settings
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={selectedIntegration.settings.syncEnabled}
                      onChange={() => {
                        setSelectedIntegration({
                          ...selectedIntegration,
                          settings: {
                            ...selectedIntegration.settings,
                            syncEnabled: !selectedIntegration.settings.syncEnabled
                          }
                        });
                      }}
                    />
                  }
                  label="Enable synchronization"
                />
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Sync Frequency
                </Typography>
                <Grid container spacing={1}>
                  {['manual', 'hourly', 'daily', 'realtime'].map((frequency) => (
                    <Grid item key={frequency}>
                      <Chip
                        label={getSyncFrequencyText(frequency)}
                        onClick={() => handleSyncFrequencyChange(frequency as any)}
                        color={selectedIntegration.settings.syncFrequency === frequency ? 'primary' : 'default'}
                        variant={selectedIntegration.settings.syncFrequency === frequency ? 'filled' : 'outlined'}
                        disabled={!selectedIntegration.settings.syncEnabled}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Sync Direction
                </Typography>
                <Grid container spacing={1}>
                  {['import', 'export', 'bidirectional'].map((direction) => (
                    <Grid item key={direction}>
                      <Chip
                        icon={getSyncDirectionDisplay(direction).icon}
                        label={getSyncDirectionDisplay(direction).text}
                        onClick={() => handleSyncDirectionChange(direction as any)}
                        color={selectedIntegration.settings.syncDirection === direction ? 'primary' : 'default'}
                        variant={selectedIntegration.settings.syncDirection === direction ? 'filled' : 'outlined'}
                        disabled={!selectedIntegration.settings.syncEnabled}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Connection Status
                  </Typography>
                  <Chip 
                    label={selectedIntegration.status === 'connected' ? 'Connected' : 'Disconnected'} 
                    color={selectedIntegration.status === 'connected' ? 'success' : 'error'}
                    size="small"
                  />
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Last synced
                  </Typography>
                  <Typography variant="body2">
                    {getFormattedLastSync(selectedIntegration.lastSync)}
                  </Typography>
                </Box>
                
                {selectedIntegration.taskCount !== undefined && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Synced tasks
                    </Typography>
                    <Typography variant="body2">
                      {selectedIntegration.taskCount}
                    </Typography>
                  </Box>
                )}
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography color="error">
                  Remove Integration
                </Typography>
                <Button 
                  variant="outlined" 
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => {
                    handleCloseConfigDialog();
                    handleOpenConfirmDialog(selectedIntegration);
                  }}
                >
                  Remove
                </Button>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfigDialog}>Cancel</Button>
          <Button 
            onClick={handleUpdateSettings}
            variant="contained"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                Updating...
              </>
            ) : (
              'Save Settings'
            )}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Confirm Delete Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={handleCloseConfirmDialog}
      >
        <DialogTitle>
          Remove Integration
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove the integration with 
            <strong> {selectedIntegration?.name}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This will disconnect TODOist from this service and stop all synchronization.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteIntegration}
            color="error"
            variant="contained"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                Removing...
              </>
            ) : (
              'Remove'
            )}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// Sample data for integrations
const getSampleIntegrations = (): Integration[] => {
  return [
    {
      id: '1',
      type: 'google_tasks',
      name: 'Google Tasks',
      description: 'Sync with your Google Tasks lists',
      status: 'connected',
      lastSync: new Date(Date.now() - 3600000), // 1 hour ago
      settings: {
        syncEnabled: true,
        syncFrequency: 'hourly',
        syncDirection: 'bidirectional',
        syncCategories: ['all']
      },
      taskCount: 24,
      icon: <GoogleIcon />
    },
    {
      id: '2',
      type: 'microsoft_todo',
      name: 'Microsoft To Do',
      description: 'Connect with Microsoft To Do for seamless task management',
      status: 'connected',
      lastSync: new Date(Date.now() - 86400000), // 1 day ago
      settings: {
        syncEnabled: true,
        syncFrequency: 'daily',
        syncDirection: 'import',
        syncCategories: ['work', 'personal']
      },
      taskCount: 42,
      icon: <MicrosoftIcon />
    },
    {
      id: '3',
      type: 'github',
      name: 'GitHub Issues',
      description: 'Sync GitHub issues with your tasks',
      status: 'connected',
      lastSync: new Date(Date.now() - 7200000), // 2 hours ago
      settings: {
        syncEnabled: false,
        syncFrequency: 'manual',
        syncDirection: 'import',
        syncCategories: ['development']
      },
      taskCount: 18,
      icon: <GitHubIcon />
    }
  ];
};

export default IntegrationsPanel; 
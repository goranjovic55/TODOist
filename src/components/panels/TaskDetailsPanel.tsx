import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
  IconButton,
  Divider
} from '@mui/material';
import {
  Save as SaveIcon,
  Delete as DeleteIcon,
  AttachFile as AttachFileIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';

import { RootState, AppDispatch } from '../../stores/store';
import { setDetailsTabIndex } from '../../stores/uiSlice';
import { updateTask } from '../../stores/tasksSlice';

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
      id={`task-tabpanel-${index}`}
      aria-labelledby={`task-tab-${index}`}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const TaskDetailsPanel: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { detailsTabIndex } = useSelector((state: RootState) => state.ui);
  const { tasks, selectedItemId } = useSelector((state: RootState) => ({
    tasks: state.tasks.tasks,
    selectedItemId: state.ui.selectedItemId
  }));
  
  const selectedTask = tasks.find(task => task.id === selectedItemId);
  
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    dispatch(setDetailsTabIndex(newValue));
  };
  
  if (!selectedTask) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Typography variant="body1" color="text.secondary">
          Select a task to view its details
        </Typography>
      </Box>
    );
  }
  
  return (
    <Paper sx={{ height: '100%', borderRadius: 0 }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
        <Tabs value={detailsTabIndex} onChange={handleTabChange}>
          <Tab label="Overview" />
          <Tab label="Details" />
          <Tab label="Attachments" />
          <Tab label="Notes" />
        </Tabs>
        <Box sx={{ flexGrow: 1 }} />
        <IconButton color="primary" sx={{ mx: 1 }}>
          <SaveIcon />
        </IconButton>
        <IconButton color="error" sx={{ mx: 1 }}>
          <DeleteIcon />
        </IconButton>
      </Box>
      
      <TabPanel value={detailsTabIndex} index={0}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h5" gutterBottom>
            {selectedTask.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Created: {new Date(selectedTask.createdAt).toLocaleString()}
          </Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Status
          </Typography>
          <Chip
            label={selectedTask.status.replace('_', ' ').toUpperCase()}
            color={
              selectedTask.status === 'completed' ? 'success' :
              selectedTask.status === 'in_progress' ? 'primary' :
              selectedTask.status === 'blocked' ? 'error' : 'default'
            }
          />
        </Box>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Priority
          </Typography>
          <Chip
            label={selectedTask.priority.toUpperCase()}
            color={
              selectedTask.priority === 'high' ? 'error' :
              selectedTask.priority === 'medium' ? 'warning' : 'success'
            }
          />
        </Box>
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Description
          </Typography>
          <Typography variant="body2">
            {selectedTask.description || 'No description provided'}
          </Typography>
        </Box>
      </TabPanel>
      
      <TabPanel value={detailsTabIndex} index={1}>
        <Box sx={{ display: 'grid', gap: 2 }}>
          <TextField
            label="Title"
            fullWidth
            defaultValue={selectedTask.title}
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={4}
            defaultValue={selectedTask.description}
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={selectedTask.status}
                label="Status"
              >
                <MenuItem value="not_started">Not Started</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="blocked">Blocked</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={selectedTask.priority}
                label="Priority"
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Start Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              fullWidth
              defaultValue={selectedTask.startDate ? new Date(selectedTask.startDate).toISOString().split('T')[0] : ''}
            />
            <TextField
              label="End Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              fullWidth
              defaultValue={selectedTask.endDate ? new Date(selectedTask.endDate).toISOString().split('T')[0] : ''}
            />
          </Box>
        </Box>
      </TabPanel>
      
      <TabPanel value={detailsTabIndex} index={2}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button variant="contained" startIcon={<AttachFileIcon />}>
              Add Attachment
            </Button>
          </Box>
          
          {selectedTask.attachments.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              No attachments yet
            </Typography>
          ) : (
            selectedTask.attachments.map(attachment => (
              <Paper key={attachment.id} sx={{ p: 2 }}>
                <Typography variant="subtitle2">
                  {attachment.fileName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Uploaded: {new Date(attachment.uploadedAt).toLocaleString()}
                </Typography>
              </Paper>
            ))
          )}
        </Box>
      </TabPanel>
      
      <TabPanel value={detailsTabIndex} index={3}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Add a note"
            multiline
            rows={3}
            fullWidth
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained">
              Add Note
            </Button>
          </Box>
          
          {selectedTask.notes.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              No notes yet
            </Typography>
          ) : (
            selectedTask.notes.map(note => (
              <Paper key={note.id} sx={{ p: 2 }}>
                <Typography variant="body2">
                  {note.content}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Last updated: {new Date(note.updatedAt).toLocaleString()}
                </Typography>
              </Paper>
            ))
          )}
        </Box>
      </TabPanel>
    </Paper>
  );
};

export default TaskDetailsPanel; 
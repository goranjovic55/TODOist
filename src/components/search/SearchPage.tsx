import React, { useState } from 'react';
import { Box, Grid, Paper, Typography } from '@mui/material';
import SearchPanel from './SearchPanel';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../stores/store';
import TaskDetailsView from '../details/TaskDetailsView';

const SearchPage: React.FC = () => {
  const { tasks } = useSelector((state: RootState) => state.tasks);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  
  const handleTaskSelect = (taskId: string) => {
    setSelectedTaskId(taskId);
  };
  
  const selectedTask = selectedTaskId ? tasks.find(task => task.id === selectedTaskId) : null;
  
  return (
    <Box sx={{ p: 3, height: '100%' }}>
      <Typography variant="h4" gutterBottom>
        Search
      </Typography>
      
      <Grid container spacing={3} sx={{ height: 'calc(100% - 50px)' }}>
        <Grid item xs={12} md={6} lg={4} sx={{ height: '100%' }}>
          <SearchPanel onSelectTask={handleTaskSelect} />
        </Grid>
        
        <Grid item xs={12} md={6} lg={8} sx={{ height: '100%' }}>
          {selectedTask ? (
            <TaskDetailsView task={selectedTask} />
          ) : (
            <Paper sx={{ 
              p: 3, 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flexDirection: 'column'
            }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Task Selected
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Select a task from the search results to view details
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default SearchPage; 
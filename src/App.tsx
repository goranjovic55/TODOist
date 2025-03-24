import React, { useEffect } from 'react';
import { Box, CssBaseline } from '@mui/material';

import AppHeader from './components/common/AppHeader';
import TaskTreeView from './components/treeview/TaskTreeView';
import TaskDetailsPanel from './components/panels/TaskDetailsPanel';
import TimelinePanel from './components/panels/TimelinePanel';

const App: React.FC = () => {
  // Effect to initialize the application
  useEffect(() => {
    console.log('Application initialized');
    // Future initialization logic
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <CssBaseline />
      <AppHeader />
      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        {/* Left panel: Tree view */}
        <Box sx={{ width: '25%', borderRight: 1, borderColor: 'divider', overflow: 'auto' }}>
          <TaskTreeView />
        </Box>
        
        {/* Right panel: Task details */}
        <Box sx={{ width: '75%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
            <TaskDetailsPanel />
          </Box>
          
          {/* Bottom panel: Timeline */}
          <Box sx={{ height: '200px', borderTop: 1, borderColor: 'divider', p: 1 }}>
            <TimelinePanel />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default App; 
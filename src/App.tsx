import React, { useState, useEffect } from 'react';
import { Box, CssBaseline, Tabs, Tab } from '@mui/material';
import { Routes, Route } from 'react-router-dom';

import AppHeader from './components/common/AppHeader';
import TaskTreeView from './components/treeview/TaskTreeView';
import TaskDetailsPanel from './components/panels/TaskDetailsPanel';
import TimelinePanel from './components/panels/TimelinePanel';
import TodoDashboard from './components/dashboard/TodoDashboard';
import CalendarView from './components/calendar/CalendarView';
import ReportsView from './components/reports/ReportsView';

// Tab panel component
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
      id={`app-tabpanel-${index}`}
      aria-labelledby={`app-tab-${index}`}
      style={{ height: '100%' }}
    >
      {value === index && (
        <Box sx={{ height: '100%' }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  // Effect to initialize the application
  useEffect(() => {
    console.log('Application initialized');
    // Future initialization logic
  }, []);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <CssBaseline />
      <AppHeader />
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          aria-label="application tabs"
        >
          <Tab label="Dashboard" id="app-tab-0" aria-controls="app-tabpanel-0" />
          <Tab label="Tasks" id="app-tab-1" aria-controls="app-tabpanel-1" />
          <Tab label="Calendar" id="app-tab-2" aria-controls="app-tabpanel-2" />
          <Tab label="Reports" id="app-tab-3" aria-controls="app-tabpanel-3" />
        </Tabs>
      </Box>
      
      <TabPanel value={activeTab} index={0}>
        <TodoDashboard />
      </TabPanel>
      
      <TabPanel value={activeTab} index={1}>
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
      </TabPanel>
      
      <TabPanel value={activeTab} index={2}>
        <Box sx={{ height: '100%', overflow: 'auto' }}>
          <CalendarView />
        </Box>
      </TabPanel>
      
      <TabPanel value={activeTab} index={3}>
        <Box sx={{ height: '100%', overflow: 'auto' }}>
          <ReportsView />
        </Box>
      </TabPanel>
    </Box>
  );
};

export default App; 
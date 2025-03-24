import React, { useState, useEffect } from 'react';
import { Box, CssBaseline, Tabs, Tab } from '@mui/material';
import { Routes, Route } from 'react-router-dom';

import AppHeader from './components/common/AppHeader';
import TaskTreeView from './components/treeview/TaskTreeView';
import TaskDetailsPanel from './components/panels/TaskDetailsPanel';
import TimelinePanel from './components/panels/TimelinePanel';
import Dashboard from './components/dashboard/Dashboard';
import CalendarView from './components/calendar/CalendarView';
import ReportsView from './components/reports/ReportsView';
import SearchPage from './components/search/SearchPage';
import TemplateLibrary from './components/templates/TemplateLibrary';
import RecurringTasksView from './components/recurring/RecurringTasksView';
import IntegrationsPanel from './components/integrations/IntegrationsPanel';
import BackupRestorePanel from './components/backup/BackupRestorePanel';
import TimeTrackingPanel from './components/timeTracking/TimeTrackingPanel';
import KanbanBoard from './components/kanban/KanbanBoard';
import GoalTracker from './components/goals/GoalTracker';
import AnalyticsDashboard from './components/analytics/AnalyticsDashboard';

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
          <Tab label="Search" id="app-tab-4" aria-controls="app-tabpanel-4" />
          <Tab label="Templates" id="app-tab-5" aria-controls="app-tabpanel-5" />
          <Tab label="Recurring" id="app-tab-6" aria-controls="app-tabpanel-6" />
          <Tab label="Integrations" id="app-tab-7" aria-controls="app-tabpanel-7" />
          <Tab label="Backup & Restore" id="app-tab-8" aria-controls="app-tabpanel-8" />
          <Tab label="Time Tracking" id="app-tab-9" aria-controls="app-tabpanel-9" />
          <Tab label="Kanban Board" id="app-tab-10" aria-controls="app-tabpanel-10" />
          <Tab label="Goal Tracker" id="app-tab-11" aria-controls="app-tabpanel-11" />
          <Tab label="Analytics" id="app-tab-12" aria-controls="app-tabpanel-12" />
        </Tabs>
      </Box>
      
      <TabPanel value={activeTab} index={0}>
        <Dashboard />
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
      
      <TabPanel value={activeTab} index={4}>
        <Box sx={{ height: '100%', overflow: 'auto' }}>
          <SearchPage />
        </Box>
      </TabPanel>
      
      <TabPanel value={activeTab} index={5}>
        <Box sx={{ height: '100%', overflow: 'auto' }}>
          <TemplateLibrary />
        </Box>
      </TabPanel>
      
      <TabPanel value={activeTab} index={6}>
        <Box sx={{ height: '100%', overflow: 'auto' }}>
          <RecurringTasksView />
        </Box>
      </TabPanel>
      
      <TabPanel value={activeTab} index={7}>
        <Box sx={{ height: '100%', overflow: 'auto' }}>
          <IntegrationsPanel />
        </Box>
      </TabPanel>
      
      <TabPanel value={activeTab} index={8}>
        <Box sx={{ height: '100%', overflow: 'auto' }}>
          <BackupRestorePanel />
        </Box>
      </TabPanel>
      
      <TabPanel value={activeTab} index={9}>
        <Box sx={{ height: '100%', overflow: 'auto' }}>
          <TimeTrackingPanel />
        </Box>
      </TabPanel>
      
      <TabPanel value={activeTab} index={10}>
        <Box sx={{ height: '100%', overflow: 'auto' }}>
          <KanbanBoard />
        </Box>
      </TabPanel>
      
      <TabPanel value={activeTab} index={11}>
        <Box sx={{ height: '100%', overflow: 'auto' }}>
          <GoalTracker />
        </Box>
      </TabPanel>
      
      <TabPanel value={activeTab} index={12}>
        <Box sx={{ height: '100%', overflow: 'auto' }}>
          <AnalyticsDashboard />
        </Box>
      </TabPanel>
    </Box>
  );
};

export default App; 
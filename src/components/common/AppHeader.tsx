import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  InputBase,
  Button,
  Switch,
  FormControlLabel,
  alpha,
  styled,
  Tab,
  Box
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  FilterList as FilterIcon,
  Menu as MenuIcon,
  AccountCircle,
  Settings
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';

import { RootState, AppDispatch } from '../../stores/store';
import { setTheme, setSearchQuery } from '../../stores/uiSlice';
import NotificationCenter from '../notifications/NotificationCenter';
import TaskForm from '../forms/TaskForm';
import TaskFilters from '../filters/TaskFilters';

// Styled components
const SearchContainer = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
  },
}));

const AppHeader: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { theme, searchQuery } = useSelector((state: RootState) => state.ui);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  
  const handleThemeToggle = () => {
    dispatch(setTheme(theme === 'dark' ? 'light' : 'dark'));
  };
  
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setSearchQuery(event.target.value));
  };
  
  const handleNewTaskClick = () => {
    setTaskFormOpen(true);
  };
  
  const handleTaskFormClose = () => {
    setTaskFormOpen(false);
  };
  
  const handleFilterClick = () => {
    setFilterDialogOpen(true);
  };
  
  const handleFilterClose = () => {
    setFilterDialogOpen(false);
  };
  
  const handleNavigation = (index: number) => {
    // Implement navigation logic based on the index
    console.log(`Navigating to tab ${index}`);
  };
  
  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ display: { xs: 'none', sm: 'block' } }}
          >
            TODOist
          </Typography>
          
          <SearchContainer>
            <SearchIconWrapper>
              <SearchIcon />
            </SearchIconWrapper>
            <StyledInputBase
              placeholder="Search…"
              inputProps={{ 'aria-label': 'search' }}
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </SearchContainer>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <Box>
            <NotificationCenter />
            <IconButton color="inherit" aria-label="settings">
              <Settings />
            </IconButton>
          </Box>
          
          <FormControlLabel
            control={
              <Switch
                checked={theme === 'dark'}
                onChange={handleThemeToggle}
                icon={<LightModeIcon />}
                checkedIcon={<DarkModeIcon />}
              />
            }
            label=""
          />
          
          <IconButton 
            color="inherit" 
            aria-label="filter tasks"
            onClick={handleFilterClick}
          >
            <FilterIcon />
          </IconButton>
          
          <Button
            variant="contained"
            color="secondary"
            startIcon={<AddIcon />}
            sx={{ ml: 2 }}
            onClick={handleNewTaskClick}
          >
            New Task
          </Button>
          
          <Tab
            label="Calendar"
            onClick={() => handleNavigation(2)}
            sx={{ color: 'white' }}
          />
          <Tab
            label="Reports"
            onClick={() => handleNavigation(3)}
            sx={{ color: 'white' }}
          />
        </Toolbar>
      </AppBar>
      
      <TaskForm
        open={taskFormOpen}
        onClose={handleTaskFormClose}
      />
      
      <TaskFilters
        open={filterDialogOpen}
        onClose={handleFilterClose}
      />
    </>
  );
};

export default AppHeader; 
import React from 'react';
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
  styled
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';

import { RootState, AppDispatch } from '../../stores/store';
import { setTheme, setSearchQuery } from '../../stores/uiSlice';

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
  
  const handleThemeToggle = () => {
    dispatch(setTheme(theme === 'dark' ? 'light' : 'dark'));
  };
  
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setSearchQuery(event.target.value));
  };
  
  return (
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
        
        <div style={{ flexGrow: 1 }} />
        
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
        
        <IconButton color="inherit" aria-label="filter tasks">
          <FilterIcon />
        </IconButton>
        
        <Button
          variant="contained"
          color="secondary"
          startIcon={<AddIcon />}
          sx={{ ml: 2 }}
        >
          New Task
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default AppHeader; 
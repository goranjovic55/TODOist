import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define UI state interface
export interface UiState {
  sidebarWidth: number;
  detailsTabIndex: number;
  theme: 'light' | 'dark' | 'system';
  showCompletedTasks: boolean;
  expandedNodes: string[];
  searchQuery: string;
  filterOptions: {
    status: ('not_started' | 'in_progress' | 'completed' | 'blocked')[];
    priority: ('low' | 'medium' | 'high')[];
    tags: string[];
    dateRange: {
      start: Date | null;
      end: Date | null;
    };
  };
}

// Initial state
const initialState: UiState = {
  sidebarWidth: 300, // Default sidebar width in pixels
  detailsTabIndex: 0, // Default to first tab
  theme: 'system', // Default to system theme
  showCompletedTasks: true, // Show completed tasks by default
  expandedNodes: [], // No nodes expanded by default
  searchQuery: '', // No search query by default
  filterOptions: {
    status: ['not_started', 'in_progress', 'completed', 'blocked'], // All statuses by default
    priority: ['low', 'medium', 'high'], // All priorities by default
    tags: [], // No tag filters by default
    dateRange: {
      start: null,
      end: null
    }
  }
};

// Create the UI slice
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setSidebarWidth: (state, action: PayloadAction<number>) => {
      state.sidebarWidth = action.payload;
    },
    
    setDetailsTabIndex: (state, action: PayloadAction<number>) => {
      state.detailsTabIndex = action.payload;
    },
    
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
    },
    
    setShowCompletedTasks: (state, action: PayloadAction<boolean>) => {
      state.showCompletedTasks = action.payload;
    },
    
    toggleNodeExpansion: (state, action: PayloadAction<string>) => {
      const nodeId = action.payload;
      const index = state.expandedNodes.indexOf(nodeId);
      
      if (index === -1) {
        // Node is not expanded, expand it
        state.expandedNodes.push(nodeId);
      } else {
        // Node is expanded, collapse it
        state.expandedNodes.splice(index, 1);
      }
    },
    
    expandAllNodes: (state, action: PayloadAction<string[]>) => {
      // Expand all nodes in the payload
      const uniqueNodeIds = new Set([...state.expandedNodes, ...action.payload]);
      state.expandedNodes = Array.from(uniqueNodeIds);
    },
    
    collapseAllNodes: (state) => {
      // Collapse all nodes
      state.expandedNodes = [];
    },
    
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    
    setStatusFilter: (state, action: PayloadAction<('not_started' | 'in_progress' | 'completed' | 'blocked')[]>) => {
      state.filterOptions.status = action.payload;
    },
    
    setPriorityFilter: (state, action: PayloadAction<('low' | 'medium' | 'high')[]>) => {
      state.filterOptions.priority = action.payload;
    },
    
    setTagsFilter: (state, action: PayloadAction<string[]>) => {
      state.filterOptions.tags = action.payload;
    },
    
    setDateRangeFilter: (state, action: PayloadAction<{ start: Date | null, end: Date | null }>) => {
      state.filterOptions.dateRange = action.payload;
    },
    
    resetFilters: (state) => {
      state.filterOptions = initialState.filterOptions;
      state.searchQuery = '';
    }
  }
});

// Export actions and reducer
export const { 
  setSidebarWidth, setDetailsTabIndex, setTheme, setShowCompletedTasks,
  toggleNodeExpansion, expandAllNodes, collapseAllNodes,
  setSearchQuery, setStatusFilter, setPriorityFilter, setTagsFilter, setDateRangeFilter,
  resetFilters
} = uiSlice.actions;

export default uiSlice.reducer; 
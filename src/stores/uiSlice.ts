import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Task filter interface
export interface TaskFilters {
  status: string[];
  priority: string[];
  projectIds: string[];
  groupIds: string[];
  tags: string[];
  startDateFrom: string | null;
  startDateTo: string | null;
  endDateFrom: string | null;
  endDateTo: string | null;
  searchText: string;
}

// Define UI state interface
export interface UiState {
  sidebarWidth: number;
  detailsTabIndex: number;
  theme: 'light' | 'dark' | 'system';
  showCompletedTasks: boolean;
  expandedNodes: string[];
  searchQuery: string;
  filters: TaskFilters;
}

// Initial filter state
const initialFilters: TaskFilters = {
  status: [],
  priority: [],
  projectIds: [],
  groupIds: [],
  tags: [],
  startDateFrom: null,
  startDateTo: null,
  endDateFrom: null,
  endDateTo: null,
  searchText: ''
};

// Initial state
const initialState: UiState = {
  sidebarWidth: 300, // Default sidebar width in pixels
  detailsTabIndex: 0, // Default to first tab
  theme: 'system', // Default to system theme
  showCompletedTasks: true, // Show completed tasks by default
  expandedNodes: [], // No nodes expanded by default
  searchQuery: '', // No search query by default
  filters: initialFilters
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
    
    // Set all filters at once
    setFilters: (state, action: PayloadAction<TaskFilters>) => {
      state.filters = action.payload;
    },
    
    // Set individual filter options
    setStatusFilter: (state, action: PayloadAction<string[]>) => {
      state.filters.status = action.payload;
    },
    
    setPriorityFilter: (state, action: PayloadAction<string[]>) => {
      state.filters.priority = action.payload;
    },
    
    setProjectFilter: (state, action: PayloadAction<string[]>) => {
      state.filters.projectIds = action.payload;
    },
    
    setGroupFilter: (state, action: PayloadAction<string[]>) => {
      state.filters.groupIds = action.payload;
    },
    
    setTagsFilter: (state, action: PayloadAction<string[]>) => {
      state.filters.tags = action.payload;
    },
    
    setStartDateRangeFilter: (state, action: PayloadAction<{ from: string | null, to: string | null }>) => {
      state.filters.startDateFrom = action.payload.from;
      state.filters.startDateTo = action.payload.to;
    },
    
    setEndDateRangeFilter: (state, action: PayloadAction<{ from: string | null, to: string | null }>) => {
      state.filters.endDateFrom = action.payload.from;
      state.filters.endDateTo = action.payload.to;
    },
    
    setSearchTextFilter: (state, action: PayloadAction<string>) => {
      state.filters.searchText = action.payload;
    },
    
    resetFilters: (state) => {
      state.filters = initialFilters;
    }
  }
});

// Export actions and reducer
export const { 
  setSidebarWidth, setDetailsTabIndex, setTheme, setShowCompletedTasks,
  toggleNodeExpansion, expandAllNodes, collapseAllNodes,
  setSearchQuery, setFilters, setStatusFilter, setPriorityFilter, 
  setProjectFilter, setGroupFilter, setTagsFilter,
  setStartDateRangeFilter, setEndDateRangeFilter, setSearchTextFilter,
  resetFilters
} = uiSlice.actions;

export default uiSlice.reducer; 
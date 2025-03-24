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

// Define UI state structure
interface UIState {
  expandedNodes: string[]; // IDs of expanded tree nodes
  selectedItemId: string | null; // ID of the selected item
  detailsTabIndex: number; // Current tab in task details panel
  draggingItemId: string | null; // ID of the item being dragged
  filters: TaskFilters; // Task filtering options
  navMenuOpen: boolean; // Navigation menu open state (for mobile)
  sidebarWidth: number; // Current sidebar width
  sidebarCollapsed: boolean; // Whether sidebar is collapsed
  darkMode: boolean; // Theme preference
}

// Default filters
const defaultFilters: TaskFilters = {
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
const initialState: UIState = {
  expandedNodes: [],
  selectedItemId: null,
  detailsTabIndex: 0,
  draggingItemId: null,
  filters: defaultFilters,
  navMenuOpen: false,
  sidebarWidth: 280, // Default width in pixels
  sidebarCollapsed: false,
  darkMode: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
};

// Create the UI slice
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Tree view actions
    toggleNodeExpansion: (state, action: PayloadAction<string>) => {
      const nodeId = action.payload;
      const isExpanded = state.expandedNodes.includes(nodeId);
      
      if (isExpanded) {
        state.expandedNodes = state.expandedNodes.filter(id => id !== nodeId);
      } else {
        state.expandedNodes.push(nodeId);
      }
    },
    
    expandNode: (state, action: PayloadAction<string>) => {
      const nodeId = action.payload;
      if (!state.expandedNodes.includes(nodeId)) {
        state.expandedNodes.push(nodeId);
      }
    },
    
    collapseNode: (state, action: PayloadAction<string>) => {
      state.expandedNodes = state.expandedNodes.filter(id => id !== action.payload);
    },
    
    expandAllNodes: (state, action: PayloadAction<string[]>) => {
      const nodeIds = action.payload;
      state.expandedNodes = [...new Set([...state.expandedNodes, ...nodeIds])];
    },
    
    collapseAllNodes: (state) => {
      state.expandedNodes = [];
    },
    
    // Selection actions
    setSelectedItem: (state, action: PayloadAction<string | null>) => {
      state.selectedItemId = action.payload;
    },
    
    // Details panel actions
    setDetailsTabIndex: (state, action: PayloadAction<number>) => {
      state.detailsTabIndex = action.payload;
    },
    
    // Drag and drop actions
    setDraggingItem: (state, action: PayloadAction<string | null>) => {
      state.draggingItemId = action.payload;
    },
    
    // Filter actions
    setFilters: (state, action: PayloadAction<TaskFilters>) => {
      state.filters = action.payload;
    },
    
    updateFilter: (state, action: PayloadAction<Partial<TaskFilters>>) => {
      state.filters = {
        ...state.filters,
        ...action.payload
      };
    },
    
    resetFilters: (state) => {
      state.filters = defaultFilters;
    },
    
    // UI layout actions
    toggleNavMenu: (state) => {
      state.navMenuOpen = !state.navMenuOpen;
    },
    
    setSidebarWidth: (state, action: PayloadAction<number>) => {
      state.sidebarWidth = action.payload;
    },
    
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    
    // Theme actions
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
    },
    
    setDarkMode: (state, action: PayloadAction<boolean>) => {
      state.darkMode = action.payload;
    }
  }
});

// Export actions and reducer
export const { 
  toggleNodeExpansion, expandNode, collapseNode, expandAllNodes, collapseAllNodes,
  setSelectedItem, setDetailsTabIndex, setDraggingItem,
  setFilters, updateFilter, resetFilters,
  toggleNavMenu, setSidebarWidth, toggleSidebar,
  toggleDarkMode, setDarkMode
} = uiSlice.actions;

export default uiSlice.reducer; 
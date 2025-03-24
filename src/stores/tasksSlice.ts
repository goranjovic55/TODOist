import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import { loadSampleData } from '../utils/sampleData';

// Define the task interfaces
export interface Attachment {
  id: string;
  fileName: string;
  fileType: string;
  filePath: string;
  uploadedAt: Date;
}

export interface Note {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high';
  startDate?: Date;
  endDate?: Date;
  parentId?: string;
  tags: string[];
  attachments: Attachment[];
  notes: Note[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

// Define the state structure
interface TasksState {
  projects: Project[];
  groups: Group[];
  tasks: Task[];
  selectedItemId: string | null;
  loading: boolean;
  error: string | null;
}

// Get initial sample data
const sampleData = loadSampleData();

// Initial state
const initialState: TasksState = {
  projects: sampleData.projects,
  groups: sampleData.groups,
  tasks: sampleData.tasks,
  selectedItemId: null,
  loading: false,
  error: null
};

// Create the tasks slice
const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    // Project actions
    addProject: (state, action: PayloadAction<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>) => {
      const newProject: Project = {
        id: uuidv4(),
        ...action.payload,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      state.projects.push(newProject);
    },
    
    updateProject: (state, action: PayloadAction<Partial<Project> & { id: string }>) => {
      const index = state.projects.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.projects[index] = {
          ...state.projects[index],
          ...action.payload,
          updatedAt: new Date()
        };
      }
    },
    
    deleteProject: (state, action: PayloadAction<string>) => {
      state.projects = state.projects.filter(p => p.id !== action.payload);
      // Also delete related groups and tasks
      state.groups = state.groups.filter(g => {
        // Get top-level groups for this project
        const isGroupInProject = state.projects.some(p => p.id === g.parentId);
        return !isGroupInProject;
      });
      // Remove orphaned tasks as well
    },
    
    // Group actions
    addGroup: (state, action: PayloadAction<Omit<Group, 'id' | 'createdAt' | 'updatedAt'>>) => {
      const newGroup: Group = {
        id: uuidv4(),
        ...action.payload,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      state.groups.push(newGroup);
    },
    
    updateGroup: (state, action: PayloadAction<Partial<Group> & { id: string }>) => {
      const index = state.groups.findIndex(g => g.id === action.payload.id);
      if (index !== -1) {
        state.groups[index] = {
          ...state.groups[index],
          ...action.payload,
          updatedAt: new Date()
        };
      }
    },
    
    deleteGroup: (state, action: PayloadAction<string>) => {
      // Recursively delete this group and all child groups and tasks
      const groupsToDelete: string[] = [action.payload];
      
      // Find all child groups
      let i = 0;
      while (i < groupsToDelete.length) {
        const childGroups = state.groups
          .filter(g => g.parentId === groupsToDelete[i])
          .map(g => g.id);
        
        groupsToDelete.push(...childGroups);
        i++;
      }
      
      // Delete all found groups
      state.groups = state.groups.filter(g => !groupsToDelete.includes(g.id));
      
      // Delete all tasks whose parent is one of the deleted groups
      state.tasks = state.tasks.filter(t => !groupsToDelete.includes(t.parentId || ''));
    },
    
    // Task actions
    addTask: (state, action: PayloadAction<Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'attachments' | 'notes' | 'tags'>>) => {
      const newTask: Task = {
        id: uuidv4(),
        ...action.payload,
        tags: [],
        attachments: [],
        notes: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      state.tasks.push(newTask);
    },
    
    updateTask: (state, action: PayloadAction<Partial<Task> & { id: string }>) => {
      const index = state.tasks.findIndex(t => t.id === action.payload.id);
      if (index !== -1) {
        state.tasks[index] = {
          ...state.tasks[index],
          ...action.payload,
          updatedAt: new Date()
        };
      }
    },
    
    deleteTask: (state, action: PayloadAction<string>) => {
      state.tasks = state.tasks.filter(t => t.id !== action.payload);
      // Also delete child tasks
      state.tasks = state.tasks.filter(t => t.parentId !== action.payload);
    },
    
    // Other actions
    setSelectedItem: (state, action: PayloadAction<string | null>) => {
      state.selectedItemId = action.payload;
    },
    
    addTaskAttachment: (state, action: PayloadAction<{ taskId: string, attachment: Omit<Attachment, 'id' | 'uploadedAt'> }>) => {
      const taskIndex = state.tasks.findIndex(t => t.id === action.payload.taskId);
      if (taskIndex !== -1) {
        const newAttachment: Attachment = {
          id: uuidv4(),
          ...action.payload.attachment,
          uploadedAt: new Date()
        };
        state.tasks[taskIndex].attachments.push(newAttachment);
        state.tasks[taskIndex].updatedAt = new Date();
      }
    },
    
    addTaskNote: (state, action: PayloadAction<{ taskId: string, content: string }>) => {
      const taskIndex = state.tasks.findIndex(t => t.id === action.payload.taskId);
      if (taskIndex !== -1) {
        const newNote: Note = {
          id: uuidv4(),
          content: action.payload.content,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        state.tasks[taskIndex].notes.push(newNote);
        state.tasks[taskIndex].updatedAt = new Date();
      }
    },
    
    updateTaskNote: (state, action: PayloadAction<{ taskId: string, noteId: string, content: string }>) => {
      const taskIndex = state.tasks.findIndex(t => t.id === action.payload.taskId);
      if (taskIndex !== -1) {
        const noteIndex = state.tasks[taskIndex].notes.findIndex(n => n.id === action.payload.noteId);
        if (noteIndex !== -1) {
          state.tasks[taskIndex].notes[noteIndex].content = action.payload.content;
          state.tasks[taskIndex].notes[noteIndex].updatedAt = new Date();
          state.tasks[taskIndex].updatedAt = new Date();
        }
      }
    },
    
    // Error handling
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    }
  }
});

// Export actions and reducer
export const { 
  addProject, updateProject, deleteProject,
  addGroup, updateGroup, deleteGroup,
  addTask, updateTask, deleteTask,
  setSelectedItem, addTaskAttachment, addTaskNote, updateTaskNote,
  setError, setLoading
} = tasksSlice.actions;

export default tasksSlice.reducer; 
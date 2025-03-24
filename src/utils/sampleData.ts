import { v4 as uuidv4 } from 'uuid';
import { Project, Group, Task } from '../stores/tasksSlice';

// Generate dates relative to today
const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const nextWeek = new Date(today);
nextWeek.setDate(nextWeek.getDate() + 7);

// Sample projects
export const sampleProjects: Project[] = [
  {
    id: uuidv4(),
    name: 'Work',
    description: 'Work-related tasks and projects',
    createdAt: yesterday,
    updatedAt: yesterday
  },
  {
    id: uuidv4(),
    name: 'Personal',
    description: 'Personal tasks and goals',
    createdAt: yesterday,
    updatedAt: yesterday
  }
];

// Sample groups
export const sampleGroups: Group[] = [
  {
    id: uuidv4(),
    name: 'Website Redesign',
    description: 'Tasks related to the website redesign project',
    parentId: sampleProjects[0].id,
    createdAt: yesterday,
    updatedAt: yesterday
  },
  {
    id: uuidv4(),
    name: 'Marketing Campaign',
    description: 'Tasks related to the Q2 marketing campaign',
    parentId: sampleProjects[0].id,
    createdAt: yesterday,
    updatedAt: yesterday
  },
  {
    id: uuidv4(),
    name: 'Home Improvement',
    description: 'Tasks related to home improvements',
    parentId: sampleProjects[1].id,
    createdAt: yesterday,
    updatedAt: yesterday
  },
  {
    id: uuidv4(),
    name: 'Fitness',
    description: 'Exercise and health goals',
    parentId: sampleProjects[1].id,
    createdAt: yesterday,
    updatedAt: yesterday
  }
];

// Sample tasks
export const sampleTasks: Task[] = [
  // Work - Website Redesign tasks
  {
    id: uuidv4(),
    title: 'Create wireframes',
    description: 'Create wireframes for the homepage and product pages',
    status: 'completed',
    priority: 'high',
    parentId: sampleGroups[0].id,
    startDate: yesterday,
    endDate: today,
    tags: ['design', 'website'],
    attachments: [],
    notes: [],
    createdAt: yesterday,
    updatedAt: today
  },
  {
    id: uuidv4(),
    title: 'Design mockups',
    description: 'Create design mockups based on the approved wireframes',
    status: 'in_progress',
    priority: 'high',
    parentId: sampleGroups[0].id,
    startDate: today,
    endDate: tomorrow,
    tags: ['design', 'website'],
    attachments: [],
    notes: [],
    createdAt: yesterday,
    updatedAt: today
  },
  {
    id: uuidv4(),
    title: 'Implement frontend',
    description: 'Implement the frontend using React components',
    status: 'not_started',
    priority: 'medium',
    parentId: sampleGroups[0].id,
    startDate: tomorrow,
    endDate: nextWeek,
    tags: ['development', 'website'],
    attachments: [],
    notes: [],
    createdAt: yesterday,
    updatedAt: yesterday
  },
  
  // Work - Marketing Campaign tasks
  {
    id: uuidv4(),
    title: 'Create campaign strategy',
    description: 'Define the Q2 marketing campaign strategy',
    status: 'completed',
    priority: 'high',
    parentId: sampleGroups[1].id,
    startDate: yesterday,
    endDate: yesterday,
    tags: ['marketing', 'strategy'],
    attachments: [],
    notes: [],
    createdAt: yesterday,
    updatedAt: yesterday
  },
  {
    id: uuidv4(),
    title: 'Design social media assets',
    description: 'Create images and videos for social media platforms',
    status: 'in_progress',
    priority: 'medium',
    parentId: sampleGroups[1].id,
    startDate: today,
    endDate: tomorrow,
    tags: ['marketing', 'design'],
    attachments: [],
    notes: [],
    createdAt: yesterday,
    updatedAt: today
  },
  
  // Personal - Home Improvement tasks
  {
    id: uuidv4(),
    title: 'Paint living room',
    description: 'Buy paint and paint the living room walls',
    status: 'not_started',
    priority: 'medium',
    parentId: sampleGroups[2].id,
    startDate: nextWeek,
    endDate: new Date(nextWeek.getTime() + 2 * 24 * 60 * 60 * 1000),
    tags: ['home', 'diy'],
    attachments: [],
    notes: [],
    createdAt: yesterday,
    updatedAt: yesterday
  },
  
  // Personal - Fitness tasks
  {
    id: uuidv4(),
    title: 'Go for a run',
    description: '30-minute run in the morning',
    status: 'in_progress',
    priority: 'medium',
    parentId: sampleGroups[3].id,
    startDate: today,
    endDate: today,
    tags: ['fitness', 'exercise'],
    attachments: [],
    notes: [
      {
        id: uuidv4(),
        content: 'Remember to stretch before and after',
        createdAt: yesterday,
        updatedAt: yesterday
      }
    ],
    createdAt: yesterday,
    updatedAt: yesterday
  },
  {
    id: uuidv4(),
    title: 'Gym workout',
    description: 'Strength training at the gym',
    status: 'not_started',
    priority: 'high',
    parentId: sampleGroups[3].id,
    startDate: tomorrow,
    endDate: tomorrow,
    tags: ['fitness', 'exercise'],
    attachments: [],
    notes: [],
    createdAt: yesterday,
    updatedAt: yesterday
  }
];

// Helper function to load sample data into the Redux store
export const loadSampleData = () => {
  return {
    projects: sampleProjects,
    groups: sampleGroups,
    tasks: sampleTasks
  };
}; 
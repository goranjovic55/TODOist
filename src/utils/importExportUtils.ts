import { Task, Group, Project, Attachment, Note } from '../stores/tasksSlice';

interface ExportData {
  projects: Project[];
  groups: Group[];
  tasks: Task[];
  version: string;
  exportDate: string;
}

/**
 * Exports projects, groups, and tasks to a JSON string
 */
export const exportToJson = (
  projects: Project[], 
  groups: Group[], 
  tasks: Task[]
): string => {
  const exportData: ExportData = {
    projects,
    groups,
    tasks,
    version: '1.0',
    exportDate: new Date().toISOString()
  };
  
  return JSON.stringify(exportData, null, 2);
};

/**
 * Saves projects, groups, and tasks as a downloadable JSON file
 */
export const saveAsJsonFile = (
  projects: Project[], 
  groups: Group[], 
  tasks: Task[],
  filename = 'todoist-export.json'
): void => {
  const json = exportToJson(projects, groups, tasks);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  // Create a temporary anchor element to download the file
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  
  // Clean up
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Interface for import validation result
 */
interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates imported JSON data
 */
export const validateImportData = (data: any): ValidationResult => {
  const errors: string[] = [];
  
  // Check if required properties exist
  if (!data) {
    errors.push('Import data is empty');
    return { valid: false, errors };
  }
  
  if (!Array.isArray(data.projects)) {
    errors.push('Projects must be an array');
  }
  
  if (!Array.isArray(data.groups)) {
    errors.push('Groups must be an array');
  }
  
  if (!Array.isArray(data.tasks)) {
    errors.push('Tasks must be an array');
  }
  
  // Check if the required properties exist on each item
  if (Array.isArray(data.projects)) {
    data.projects.forEach((project: any, index: number) => {
      if (!project.id) errors.push(`Project at index ${index} missing id`);
      if (!project.name) errors.push(`Project at index ${index} missing name`);
    });
  }
  
  if (Array.isArray(data.groups)) {
    data.groups.forEach((group: any, index: number) => {
      if (!group.id) errors.push(`Group at index ${index} missing id`);
      if (!group.name) errors.push(`Group at index ${index} missing name`);
    });
  }
  
  if (Array.isArray(data.tasks)) {
    data.tasks.forEach((task: any, index: number) => {
      if (!task.id) errors.push(`Task at index ${index} missing id`);
      if (!task.title) errors.push(`Task at index ${index} missing title`);
      if (!task.status) errors.push(`Task at index ${index} missing status`);
    });
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Imports data from JSON string
 */
export const importFromJson = (jsonString: string): ExportData | null => {
  try {
    const data = JSON.parse(jsonString);
    const validationResult = validateImportData(data);
    
    if (!validationResult.valid) {
      console.error('Invalid import data:', validationResult.errors);
      return null;
    }
    
    // Convert dates from strings to Date objects
    data.projects = data.projects.map((project: any) => ({
      ...project,
      createdAt: new Date(project.createdAt),
      updatedAt: new Date(project.updatedAt)
    }));
    
    data.groups = data.groups.map((group: any) => ({
      ...group,
      createdAt: new Date(group.createdAt),
      updatedAt: new Date(group.updatedAt)
    }));
    
    data.tasks = data.tasks.map((task: any) => ({
      ...task,
      createdAt: new Date(task.createdAt),
      updatedAt: new Date(task.updatedAt),
      startDate: task.startDate ? new Date(task.startDate) : undefined,
      endDate: task.endDate ? new Date(task.endDate) : undefined,
      attachments: (task.attachments || []).map((attachment: any) => ({
        ...attachment,
        uploadedAt: new Date(attachment.uploadedAt)
      })),
      notes: (task.notes || []).map((note: any) => ({
        ...note,
        createdAt: new Date(note.createdAt),
        updatedAt: new Date(note.updatedAt)
      }))
    }));
    
    return data;
  } catch (error) {
    console.error('Error importing from JSON:', error);
    return null;
  }
};

/**
 * Opens a file picker and reads JSON file
 */
export const importFromJsonFile = async (): Promise<ExportData | null> => {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const data = importFromJson(content);
        resolve(data);
      };
      
      reader.onerror = () => {
        console.error('Error reading file');
        resolve(null);
      };
      
      reader.readAsText(file);
    };
    
    // Trigger file picker
    input.click();
  });
}; 
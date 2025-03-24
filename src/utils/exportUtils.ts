import { ExportOptions } from '../components/reports/ReportsExport';
import { Task, Project, Group } from '../stores/tasksSlice';

/**
 * Generate a CSV string from an array of objects
 */
export const generateCSV = (data: any[], columns: string[]): string => {
  // Get headers
  const headers = columns.join(',');
  
  // Map data to rows
  const rows = data.map(item => 
    columns.map(column => {
      const value = item[column];
      // Handle special cases
      if (value === null || value === undefined) return '';
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`;
      }
      return value;
    }).join(',')
  );
  
  // Combine headers and rows
  return [headers, ...rows].join('\n');
};

/**
 * Download a string as a file
 */
export const downloadAsFile = (content: string, fileName: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  
  // Append to the DOM
  document.body.appendChild(link);
  
  // Trigger download
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export tasks data based on export options
 */
export const exportTasks = (
  options: ExportOptions, 
  tasks: Task[], 
  projects: Project[], 
  groups: Group[]
): void => {
  // Filter tasks based on date range
  const filteredTasks = filterTasksByDateRange(tasks, options.dateRange);
  
  // Prepare data based on format
  switch (options.format) {
    case 'csv':
      exportAsCSV(filteredTasks, options, projects, groups);
      break;
    case 'excel':
      // For Excel, we'd typically use a library like xlsx or exceljs
      // For simplicity, we'll just use CSV export here
      exportAsCSV(filteredTasks, options, projects, groups);
      break;
    case 'pdf':
      // For PDF, we'd typically use a library like jspdf or pdfmake
      alert('PDF export would be implemented with a library like jsPDF');
      break;
  }
};

/**
 * Filter tasks by date range
 */
const filterTasksByDateRange = (tasks: Task[], dateRange: string): Task[] => {
  const now = new Date();
  let startDate: Date;
  
  switch (dateRange) {
    case 'week':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'quarter':
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 3);
      break;
    case 'year':
      startDate = new Date(now);
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      // 'all' or undefined - return all tasks
      return [...tasks];
  }
  
  return tasks.filter(task => {
    const taskDate = task.updatedAt ? new Date(task.updatedAt) : new Date(task.createdAt);
    return taskDate >= startDate;
  });
};

/**
 * Export tasks as CSV
 */
const exportAsCSV = (
  tasks: Task[], 
  options: ExportOptions, 
  projects: Project[], 
  groups: Group[]
): void => {
  // Define columns based on options
  const columns = ['id', 'title', 'status', 'priority', 'createdAt', 'updatedAt'];
  
  // Add project and group info
  const enhancedTasks = tasks.map(task => {
    const result = { ...task };
    
    if (task.parentId) {
      const group = groups.find(g => g.id === task.parentId);
      if (group) {
        result.groupName = group.name;
        
        // Find project
        const project = projects.find(p => p.id === group.parentId);
        if (project) {
          result.projectName = project.name;
        }
      }
    }
    
    return result;
  });
  
  // Generate CSV
  const csvContent = generateCSV(enhancedTasks, [
    ...columns, 
    'groupName', 
    'projectName'
  ]);
  
  // Download file
  downloadAsFile(
    csvContent,
    `todolist-export-${new Date().toISOString().split('T')[0]}.csv`,
    'text/csv;charset=utf-8;'
  );
}; 
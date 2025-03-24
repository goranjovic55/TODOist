import { Task } from '../stores/tasksSlice';

// Check if notifications are supported
const areNotificationsSupported = () => {
  return 'Notification' in window;
};

// Request notification permissions
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!areNotificationsSupported()) {
    console.warn('Notifications are not supported in this browser');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

// Send a notification
export const sendNotification = (title: string, options: NotificationOptions = {}): boolean => {
  if (!areNotificationsSupported()) {
    console.warn('Notifications are not supported in this browser');
    return false;
  }

  if (Notification.permission !== 'granted') {
    console.warn('Notification permission not granted');
    return false;
  }

  try {
    const defaultOptions: NotificationOptions = {
      icon: '/logo.png',
      silent: false
    };

    new Notification(title, { ...defaultOptions, ...options });
    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
};

// Check for upcoming deadlines and send notifications
export const checkForDeadlineNotifications = (tasks: Task[]): void => {
  if (!areNotificationsSupported() || Notification.permission !== 'granted') {
    return;
  }

  const now = new Date();
  const oneDayInMs = 24 * 60 * 60 * 1000;

  tasks.forEach(task => {
    if (task.status === 'completed' || !task.endDate) {
      return;
    }

    const endDate = new Date(task.endDate);
    const timeUntilDeadline = endDate.getTime() - now.getTime();

    // Notify for tasks due today
    if (timeUntilDeadline >= 0 && timeUntilDeadline <= oneDayInMs) {
      const hoursLeft = Math.ceil(timeUntilDeadline / (60 * 60 * 1000));
      
      sendNotification(`Task Due Soon: ${task.title}`, {
        body: `This task is due in ${hoursLeft} hours.`,
        tag: `deadline-reminder-${task.id}`,
        data: { taskId: task.id }
      });
    }
    
    // Notify for overdue tasks
    if (timeUntilDeadline < 0) {
      const daysOverdue = Math.ceil(Math.abs(timeUntilDeadline) / oneDayInMs);
      
      sendNotification(`Overdue Task: ${task.title}`, {
        body: `This task is overdue by ${daysOverdue} day${daysOverdue > 1 ? 's' : ''}.`,
        tag: `overdue-reminder-${task.id}`,
        data: { taskId: task.id }
      });
    }
  });
};

// Schedule deadline checks
export const startDeadlineNotifications = (tasks: Task[], intervalMinutes: number = 30): number => {
  // Do an initial check
  checkForDeadlineNotifications(tasks);
  
  // Schedule regular checks
  const intervalId = window.setInterval(() => {
    checkForDeadlineNotifications(tasks);
  }, intervalMinutes * 60 * 1000);
  
  return intervalId;
};

// Stop scheduled deadline checks
export const stopDeadlineNotifications = (intervalId: number): void => {
  window.clearInterval(intervalId);
}; 
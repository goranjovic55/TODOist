# TODOist - Task Management Application

A comprehensive task management application with hierarchical organization for projects, groups, and tasks.

## Features

- **Hierarchical Organization**: Organize tasks into projects and groups
- **Task Details**: Add descriptions, due dates, priorities, and tags to tasks
- **Notifications**: Get alerts for upcoming deadlines and overdue tasks
- **Timeline View**: Visualize tasks on a timeline
- **Calendar View**: View tasks in a monthly calendar with upcoming tasks
- **Dark/Light Mode**: Toggle between dark and light themes
- **Responsive Design**: Works on desktop and mobile devices
- **TODO Dashboard**: View pending, overdue, and upcoming tasks in an intuitive dashboard
- **Git Integration**: Automatic commits to GitHub when milestones are completed

## Technology Stack

- **Frontend**: React, TypeScript, Material-UI
- **State Management**: Redux Toolkit with Redux Persist for local storage
- **Desktop Application**: Electron
- **Build Tools**: Webpack
- **Version Control**: Automatic Git integration for milestone tracking

## Setup Instructions

### Prerequisites

- Node.js (v14.0.0 or higher)
- npm (v6.0.0 or higher)
- Git (for automatic milestone commits)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/todoist.git
   cd todoist
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

### Building for Production

To build the application for production:

```bash
npm run build
```

To package the application as a desktop app:

```bash
npm run package
```

## Project Structure

- `/src`: Source code
  - `/components`: React components
    - `/common`: Shared components
    - `/dashboard`: Dashboard components including TODO view
    - `/forms`: Form components
    - `/panels`: Panel components
    - `/treeview`: Tree view components
    - `/calendar`: Calendar view components
  - `/stores`: Redux state management
  - `/styles`: Theme and styling
  - `/utils`: Utility functions
    - `gitUtils.ts`: Git integration utilities
    - `filterUtils.ts`: Task filtering utilities
    - `notifications.ts`: Notification utilities
  - `/electron`: Electron main process files
- `/public`: Static files
- `/build`: Production build output

## Calendar View

The calendar view allows you to:

- Visualize tasks on a monthly calendar
- Quickly see due dates at a glance
- View task details by hovering over tasks
- Navigate between months
- See upcoming tasks for the next two weeks
- Identify task status and priority through colors

## Git Integration

TODOist automatically creates Git commits when significant milestones are achieved:

- When all tasks in a group are completed
- When project phases are completed
- On major feature implementations

This ensures your progress is automatically tracked and versioned, creating a clear history of your project development.

## Planned Features

- Integration with external services (Microsoft To-Do, Google Tasks)
- Improved offline support
- Data synchronization across devices
- Enhanced reporting and visualization
- Mobile applications

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- The project is based on an initial concept that has been enhanced with additional features and implementation details.
- Built with Electron, React, and TypeScript to provide a cross-platform desktop experience.

---

*Project Status: Planning Phase - See [Status](project/STATUS.md) for current information.* 
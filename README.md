# TODOist - Modern Task Management Application

TODOist is a comprehensive task management application designed to help individuals and teams organize, track, and complete tasks efficiently.

## Features

### Task Management
- Create, edit, and delete tasks with rich details
- Assign due dates, priorities, and tags
- Organize tasks into projects and categories
- Set recurring tasks with customizable patterns
- Add subtasks and dependencies

### Dashboard Analytics Features
- Visualize task completion rates and productivity metrics
- Track time spent on different tasks and projects
- Filter and sort tasks by various criteria
- Export reports in multiple formats

#### Time Tracking
- Built-in timer for tracking time spent on tasks
- Start, pause, stop, and reset timer controls
- Select task being worked on
- Manual time entry for past work
- Detailed time log with edit/delete capabilities
- Filter time entries by period (today, week, month, all time)
- Visualize time distribution by task
- Notes for time entries
- Statistics showing total time tracked and entry count
- Automatic calculation of time durations
- Modern stopwatch interface with real-time updates

#### Kanban Board
- Visual task organization with customizable columns
- Drag and drop interface for managing workflow
- Task cards with priority indicators and due dates
- Filter tasks by various criteria
- Column management (add, edit, delete)
- Task details view with all relevant information

### Collaboration Features
- Share tasks and projects with team members
- Assign tasks to specific users
- Comment and discussion threads on tasks
- Notification system for updates and mentions
- Activity history tracking

## Technology Stack

- **Frontend**: React, TypeScript, Material-UI
- **State Management**: Redux with Redux Toolkit
- **Build Tools**: Webpack, Babel
- **Testing**: Jest, React Testing Library
- **Code Quality**: ESLint, Prettier

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository:
```
git clone https://github.com/yourusername/todoist.git
cd todoist
```

2. Install dependencies:
```
npm install
```

3. Start the development server:
```
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

## Development Workflow

TODOist includes several automation scripts to streamline the development process:

### Automatic Commits

Automatically commit changes with smart detection of documentation vs. code files:

```
powershell -ExecutionPolicy Bypass -File scripts/git/commit_project.ps1
```

### Changelog Management

Add entries to the changelog:

```
python scripts/update_changelog.py add "Added" "New feature description"
```

### Version Management

Update version numbers across the project:

```
powershell -ExecutionPolicy Bypass -File scripts/quick_version_update.ps1 "1.2.3"
```

For more details, see [Automation Guide](doc/AUTOMATION_GUIDE.md).

## Testing

The TODOist application has a comprehensive testing infrastructure to ensure code quality and reliability.

### Running Tests

Run all tests:
```
npm test
```

Run specific tests:
```
npm test -- TaskKanbanBoard
```

Run tests with coverage:
```
npm test -- --coverage
```

### Testing Infrastructure

- **Component Tests**: Verify that components render correctly and respond to user interactions
- **API Integration Tests**: Ensure components interact correctly with APIs
- **Redux Store Tests**: Validate Redux actions and reducers function as expected
- **Error Handling Tests**: Verify components handle errors gracefully

### Testing Documentation

Detailed documentation on the testing strategy can be found in:
- [Testing Guide](doc/TESTING_GUIDE.md): Comprehensive guide for writing and running tests
- [Testing Summary](doc/TESTING_SUMMARY.md): Overview of the testing implementation

## Project Structure

```
src/
  components/        # React components
  store/             # Redux store and slices
  services/          # API and service layer
  utils/             # Utility functions
  types/             # TypeScript type definitions
  assets/            # Static assets
  styles/            # Global styles
  __tests__/         # Test files
doc/                 # Documentation
scripts/             # Automation scripts
public/              # Public assets
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [React Documentation](https://reactjs.org/docs/getting-started.html)
- [Material-UI Documentation](https://mui.com/getting-started/usage/)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org/introduction/getting-started)
- [Jest Documentation](https://jestjs.io/docs/getting-started)

## Planned Features

- Integration with external services (Microsoft To-Do, Google Tasks)
- Improved offline support
- Data synchronization across devices
- Enhanced reporting and visualization
- Mobile applications

## Dashboard Analytics Features

The application now includes a comprehensive analytics dashboard with the following features:

### Task Status Tracking
- Visual breakdown of tasks by status (not started, in progress, blocked, completed)
- Overall completion rate calculation
- Overdue task counts and status

### Productivity Analytics
- Key metrics for tasks completed, current tasks, and backlog
- Completion rate trends over time
- Productivity visualization by day, week, and month

### Task Progress Timeline
- Bar charts showing completion rates over time
- Trend visualization for productivity patterns
- Historical data comparison

### Workload Distribution
- Visualization of task assignments across team members
- Team workload statistics and balance metrics
- Assignment count breakdown

### Task Assignment Tracking
- Performance metrics by assignee
- Visual comparison of assignment completion rates
- Efficiency analytics for team members

### Task Assignment Report
- Detailed tabular view of all task assignments
- Filtering options by assignee, status, and date range
- Sorting capabilities for all columns
- CSV export functionality for further analysis
- Performance metrics for each team member

### Time Tracking
- Built-in timer for tracking time spent on tasks
- Timer controls (start, pause, stop, reset)
- Task selection for time tracking
- Manual time entry option with date picker
- Detailed time log with editing and deleting capabilities
- Time filtering by period (today, week, month, all time)
- Visualization of time distribution by task
- Notes for time entries
- Statistics on total time tracked and entry count
- Automatic calculation of time durations
- Modern stopwatch interface with real-time updates

### Kanban Board
- Visual task organization with customizable columns
- Drag and drop interface for moving tasks between statuses
- Real-time status updates when tasks are moved
- Customizable columns with work-in-progress (WIP) limits
- Color coding for columns to indicate workflow stages
- Task cards with priority indicators and due dates
- Quick task details view with comprehensive information
- Filtering options by assignee, priority, and due date
- Column management (add, edit, delete columns)
- Status indicators for overdue tasks and WIP limits

### Task Priority View
- Visual representation of tasks by priority
- Quick filtering by priority level
- Progress tracking by priority

### Customizable Task Views
- Configurable task lists with custom filters
- Save and load view configurations
- Personal dashboard preferences

### Improved Dashboard Experience
- Tabbed interface for better organization of features
- Optimized layout for different screen sizes
- Performance improvements for large data sets
- Centralized utility functions for consistent calculations

All analytics components utilize centralized utility functions for consistent calculations and data processing, ensuring reliable insights across the application.

---

*Project Status: Planning Phase - See [Status](project/STATUS.md) for current information.* 
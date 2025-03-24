## [Unreleased]

## [0.1.3] - 2025-03-24

# TODOist Changelog

## [0.1.2] - 2025-03-24

### Update
- Automatic update from commit script
### Added
- Test entry for changelog
- Automation scripts for development workflow:
  - Automated commit workflow with smart file type detection
  - Changelog update script for easy documentation
  - Version management script for releases
  - Documentation on using automation tools
- Comprehensive test suite for Kanban Board component:
  - Component rendering tests using React Testing Library
  - Integration tests for API interactions
  - Redux store tests for actions and reducers
  - Custom mock implementations for external dependencies
  - Test utilities for common testing scenarios
- Testing infrastructure for component testing:
  - Jest configuration for TypeScript components
  - Custom mocks for React Beautiful DnD
  - Type definitions for testing libraries
  - Documentation for test strategies and best practices
- End-to-End testing with Cypress:
  - Custom commands for common operations
  - Test fixtures for consistent test data
  - Tests for critical user flows
  - Special handling for React DnD
  - TypeScript support for end-to-end tests
  - Integration with GitHub Actions
- Continuous Integration pipeline:
  - GitHub Actions workflow for automated testing
  - Separate jobs for unit tests and E2E tests
  - Preview deployment for pull requests
  - Test coverage reporting
  - Coverage thresholds enforcement
- Kanban board view for visual task organization
  - Drag and drop interface for managing tasks
  - Multiple workflow columns
  - Task filtering capabilities
  - Task detail view
- Time tracking system with timer controls and manual time logging
- Dashboard analytics with task status breakdown
- Data export functionality in multiple formats
- Notification system for task deadlines and mentions
- Complete task tagging and categorization system

### Changed
- Improved dashboard UI with responsive layout
- Enhanced task priority visualization
- Updated navigation flow for better user experience
- Optimized state management for better performance
- Improved development workflow with automated testing
- Enhanced TypeScript configuration with better type safety

### Fixed
- Changelog ordering issue for version releases
- TypeScript errors in test files with proper type definitions
- Task status updates now properly reflect in real-time
- Date calculation issues in recurring tasks
- Search functionality accuracy improvements
- Mobile layout issues in task detail view

## [0.1.0] - 2023-07-15

### Added
- Initial project setup
- Basic task management functionality
- Simple dashboard with task overview
- User authentication framework
- Task prioritization system

## [1.0.0] - 2023-07-10

### Added
- Initial project setup with core structure and components
- Electron configuration with main process and secure context bridge
- React application with Material-UI theme
- Redux store for state management
- Core navigation, task display, and editing components
- Task tree view for hierarchical organization of tasks
- Task details panel with editing capabilities
- Timeline view for task history and scheduling
- Dashboard view with task summary and quick actions

## [1.1.0] - 2023-07-15

### Added
- Reports & Analytics feature
  - Visual data presentation with charts and tables
  - Task status distribution charts
  - Priority distribution visualization
  - Project progress tracking
  - Productivity metrics and trending
  - Time-based filtering options

### Improved
- Dashboard layout for better information hierarchy
- Task filtering capabilities

## [1.2.0] - 2023-07-18

### Added
- Report export functionality
  - Export to PDF, CSV, and Excel formats
  - Customizable export options
  - Section selection for exports
  - Date range filtering for exports

### Fixed
- UI layout issues in reports view
- Chart rendering on smaller screens

## [1.3.0] - 2023-07-21

### Added
- Advanced search functionality
  - Full-text search across tasks
  - Multi-criteria filtering (status, priority, tags, projects)
  - Date range filters
  - Search results view with rich details
  - Saved searches with persistence
  - Task detail view from search results

### Improved
- Overall application performance
- Task loading and filtering speed

## [1.4.0] - 2023-07-25

### Added
- Task Templates feature
  - Create and manage reusable task templates
  - Template categories and organization
  - Favorite templates for quick access
  - Quick task creation from templates
  - Template library with filtering and sorting
  - Usage tracking for templates

### Improved
- Task creation workflow
- UI consistency across components

## [1.5.0] - 2023-07-28

### Added
- Recurring Tasks functionality
  - Set up tasks that automatically repeat on schedule
  - Multiple frequency options (daily, weekly, monthly, custom)
  - Start/end date configuration
  - Occurrence limit options
  - Automatic next due date calculation
  - Manual generation of recurring tasks
  - Active/inactive status toggle

### Improved
- Task scheduling capabilities
- Date handling throughout the application
- State persistence with localStorage

### Fixed
- Various date formatting issues
- UI responsiveness on different screen sizes

## [1.6.0] - 2023-08-02

### Added
- Notifications System
  - Real-time notifications for upcoming task deadlines
  - System notifications for application updates
  - Recurring task generation alerts
  - Task update notifications
  - Customizable notification preferences
  - Desktop notification support
  - Notification priority levels with visual indicators
  - Notification center with filtering options
  - Mark as read/unread functionality
  - Notification actions for quick task interaction

### Improved
- User interface with notification badges
- Task deadline awareness throughout the application
- Settings management with dedicated notification preferences
- Cross-component communication for notification generation

### Fixed
- Various minor UI inconsistencies
- Date handling for notification timing

## [1.7.0] - 2023-08-06

### Added
- Integrations System
  - Connect with external task management services
  - Multiple service integrations (Google Tasks, Microsoft To Do, GitHub, etc.)
  - Customizable synchronization settings
  - Configuration options for sync frequency and direction
  - Manual and automated synchronization
  - Task import/export capabilities
  - Connection status monitoring
  - Secure API credential management

### Improved
- Cross-platform task management
- Data persistence between services
- User interface for managing external connections
- Task portability across platforms

### Fixed
- Task format inconsistencies between services
- Synchronization conflict handling

## [1.8.0] - 2023-08-10

### Added
- Data Backup & Restore System
  - Create and download backup files of application data
  - Restore from previously created backups
  - Selective backup of specific data types
  - Backup encryption option
  - Backup history tracking
  - Auto-backup scheduling capabilities
  - Backup file verification and validation
  - Descriptive backup naming
  - Cloud backup support framework

### Improved
- Data security and portability
- User control over application data
- Recovery options for accidental data loss
- Application migration capabilities between devices

### Fixed
- Edge cases in data persistence
- Storage handling for larger datasets

## [1.9.0] - 2023-08-15

### Added
- Time Tracking & Pomodoro Timer System
  - Track time spent on tasks with flexible timer
  - Pomodoro technique implementation with customizable intervals
  - Automatic break timing and session tracking
  - Task association with time entries
  - Detailed time entry history and filtering
  - Daily tracking summaries
  - Tagging system for time entries
  - Customizable Pomodoro settings (work duration, break length, etc.)
  - Audio notifications for session transitions
  - Session notes and documentation

### Improved
- Task management with integrated time recording
- Productivity facilitation through structured work sessions
- User experience with visual time tracking
- Data collection for productivity analytics

### Fixed
- Various UI refinements
- Performance optimizations for timer accuracy

## [2.0.0] - 2023-08-20

### Added
- Kanban Board View
  - Visual task management with customizable columns
  - Drag and drop interface for task organization
  - Task status visualization across workflow stages
  - Customizable columns with color coding
  - Work-in-progress (WIP) limits for columns
  - Column reordering capability
  - Board persistence with localStorage
  - Task cards with priority indicators and due dates
  - Column management (add, edit, delete)
  - Board settings customization

### Improved
- Task visualization and workflow management
- Intuitive status transitions through drag-and-drop
- Project management capabilities
- Visual workflow representation
- Productivity by limiting work-in-progress

### Fixed
- UI consistency for multi-view application interfaces
- Drag and drop performance optimizations

## [2.1.0] - 2023-08-25

### Added
- Goal Tracking System
  - Create and manage long-term goals and objectives
  - Link tasks to specific goals for progress tracking
  - Automatic goal progress calculation based on linked tasks
  - Goal categorization with customizable categories
  - Visual progress indicators and deadlines
  - Goal status management (active, completed, archived)
  - Deadline visualization with warnings for approaching dates
  - Goal dashboard with filterable views
  - Category management with color coding

### Improved
- Task organization around strategic objectives
- Productivity visualization with goal-oriented metrics
- Long-term planning capabilities
- User motivation through progress visualization
- Structured approach to task management

### Fixed
- Various UI refinements in goal-related interfaces
- Data persistence optimizations 

## [2.2.0] - 2023-08-28

### Added
- Analytics & Insights Dashboard
  - Comprehensive task metrics and statistics visualization
  - Productivity analysis with personalized insights
  - Interactive charts for task completion trends
  - Category and priority distribution analytics
  - Time-of-day productivity patterns
  - Goal progress tracking and visualization
  - Customizable date range filtering (day, week, month, all-time)
  - Productivity tips based on usage patterns
  - Streak tracking for consecutive task completion

### Improved
- Data-driven decision making for task planning
- Visual representation of productivity patterns
- Goal progress monitoring with integrated metrics
- Performance tracking across different time periods

### Fixed
- Visual display optimizations for different screen sizes
- Data calculation efficiency for large task collections 
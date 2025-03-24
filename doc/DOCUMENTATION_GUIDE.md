# MODMeta Documentation Guide

This file explains the documentation structure of the MODMeta project, including the purpose and update frequency of each document. Use this guide to maintain consistent documentation practices or to quickly understand the project's documentation system.

## Core Documentation Files

### Project Management Documents

1. **PROJECT_PLAN.md**
   - **Purpose**: Outlines the original project plan, architecture, and development phases
   - **Content**: Comprehensive development strategy, technical specifications, implementation phases
   - **Update Frequency**: Infrequent - only when fundamental project approach changes
   - **Updated By**: Lead developer during major architectural changes

2. **PROJECT_STATUS.md**
   - **Purpose**: Tracks the current development status and progress
   - **Content**: Build status, recently modified files, next steps, pending issues
   - **Update Frequency**: Regular - at the end of each development session
   - **Updated By**: Developers after completing work on features or fixes

3. **ROADMAP.md**
   - **Purpose**: Outlines the implementation strategy with defined milestones
   - **Content**: Long-term vision, planned features, version milestones, target dates
   - **Update Frequency**: Periodic - when strategic direction changes or milestones are reached
   - **Updated By**: Project lead when planning future development phases

4. **TODO.md**
   - **Purpose**: Tracks ideas, tasks, and pending improvements
   - **Content**: Prioritized tasks (High/Medium/Low), implementation ideas, technical debt
   - **Update Frequency**: Frequent - when new ideas arise or tasks are completed
   - **Updated By**: Any team member who identifies new tasks or completes existing ones

5. **CHANGELOG.md**
   - **Purpose**: Records all changes made to the project
   - **Content**: Version-organized list of additions, changes, fixes
   - **Update Frequency**: Automatic - with every significant code change
   - **Updated By**: Automatically updated through scripts/update_changelog.py

### Technical Documents

6. **global_code_setup.md**
   - **Purpose**: Defines coding standards and practices
   - **Content**: Style guidelines, documentation requirements, best practices
   - **Update Frequency**: Rare - when coding standards change
   - **Updated By**: Lead developer or code quality manager

7. **git_settings.md**
   - **Purpose**: Git workflow and repository management
   - **Content**: Branch strategies, commit message formats, Git hooks configuration
   - **Update Frequency**: Rare - when Git workflow changes
   - **Updated By**: DevOps or repository manager

8. **testing_debugging.md**
   - **Purpose**: Testing framework and debugging procedures
   - **Content**: Test strategies, debugging tools, test coverage requirements
   - **Update Frequency**: Occasional - when testing approaches change
   - **Updated By**: QA lead or test engineer

## Component Design Documents (.model files)

The `.model` files contain detailed design specifications for project components that will be implemented in the future:

1. **BLOCKSCANNER.model**
   - **Purpose**: Design document for the block scanning component
   - **Content**: Architecture, interfaces, implementation details for block scanning
   - **Used**: When building the block scanning functionality

2. **DB_MANAGER.model**
   - **Purpose**: Design document for the database management system
   - **Content**: Database schema, query interfaces, storage strategies
   - **Used**: When implementing database features

3. **VISUALIZER.model**
   - **Purpose**: Design document for visualization components
   - **Content**: UI designs, visualization algorithms, display strategies
   - **Used**: When building visualization features

4. **MISC.model**
   - **Purpose**: Design for miscellaneous components
   - **Content**: Various smaller components that don't warrant their own files
   - **Used**: When implementing auxiliary features

## Documentation Maintenance

### How to Update Documentation

1. **CHANGELOG.md**: Updated automatically using:
   ```
   python scripts/update_changelog.py add "Category" "Change description"
   ```
   
2. **Version Updates**: 
   ```
   powershell -ExecutionPolicy Bypass -File scripts/quick_version_update.ps1
   ```

3. **Manual Updates**: Edit other documentation files directly when needed.

### Documentation in Commit Workflow

All documentation files are included in the automated commit workflow:
```
powershell -ExecutionPolicy Bypass -File scripts/git/commit_project.ps1
```

This ensures documentation changes are properly tracked and committed. 
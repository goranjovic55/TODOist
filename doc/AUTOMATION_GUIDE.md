# TODOist Automation Guide

This document explains the automation scripts available in the TODOist project, including how to use them for automatic commits, changelog updates, and version management.

## Table of Contents

- [Automatic Commits](#automatic-commits)
- [Changelog Updates](#changelog-updates)
- [Version Management](#version-management)
- [Setting Up Git Hooks](#setting-up-git-hooks)

## Automatic Commits

The project includes an automated commit workflow that handles staging, committing, and pushing changes to the repository.

### Using the Commit Script

To automatically commit all changes in your working directory:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/git/commit_project.ps1
```

This script will:

1. Identify different types of files (documentation, code, other)
2. Create separate commits for each type of change
3. Push the changes to the remote repository (if configured)

### Features

- **Smart Commits**: Creates separate commits for documentation and code changes
- **Automatic Changelog Updates**: Integrates with the changelog update script
- **Git Configuration**: Sets up Git user information if not already configured
- **Error Handling**: Gracefully handles errors during the commit process

## Changelog Updates

The project maintains a changelog that can be automatically updated using a Python script.

### Adding a Changelog Entry

To add a new entry to the changelog:

```bash
python scripts/update_changelog.py add "Category" "Change description"
```

For example:
```bash
python scripts/update_changelog.py add "Added" "New dashboard analytics feature"
```

This will add the entry under the appropriate category in the Unreleased section.

### Creating a Release

To convert the Unreleased section to a new release:

```bash
python scripts/update_changelog.py release "1.2.3"
```

This will:
1. Convert the Unreleased section to a release with the specified version and today's date
2. Create a new empty Unreleased section at the top of the file

## Version Management

The project includes a quick version update script that handles version bumps across multiple files.

### Bumping the Version

To update the project's version number:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/quick_version_update.ps1 "1.2.3"
```

This script will:

1. Update the version in package.json
2. Update the changelog by creating a new release
3. Commit the changes
4. Create a Git tag for the release

## Setting Up Git Hooks

For more automated workflows, you can set up Git hooks to run these scripts automatically at specific points in the Git workflow.

### Pre-Commit Hook

Create a file at `.git/hooks/pre-commit` with the following content:

```bash
#!/bin/sh
python scripts/update_changelog.py add "Update" "Automatic update from pre-commit hook"
exit 0
```

Make the hook executable:
```bash
chmod +x .git/hooks/pre-commit
```

### Post-Commit Hook

Create a file at `.git/hooks/post-commit` with the following content:

```bash
#!/bin/sh
# Run after a commit has been created
echo "Commit created successfully. To push changes, run: git push"
exit 0
```

Make the hook executable:
```bash
chmod +x .git/hooks/post-commit
```

## Automating Regular Commits

To set up automatic commits at regular intervals (useful during development sessions), you can:

### Windows Task Scheduler

1. Open Task Scheduler
2. Create a new Task
3. Set a trigger (e.g., every 30 minutes)
4. Add an action: Program `powershell.exe`, Arguments `-ExecutionPolicy Bypass -File "D:\_APP\TODOist\scripts\git\commit_project.ps1"`
5. Set the "Start in" field to your project directory

### Cron Job (Linux/Mac)

Add a cron job to run the commit script periodically:

```
*/30 * * * * cd /path/to/todoist && python scripts/update_changelog.py add "Update" "Automatic update" && git add . && git commit -m "Automatic commit" && git push
```

This will run every 30 minutes. 
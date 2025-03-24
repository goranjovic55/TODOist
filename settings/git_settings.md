# Git Configuration for MODMeta

This document outlines how Git is configured to track all files in the MODMeta repository, including large binary files, database files, and other files that Git might normally exclude.

## Tracking All Files

By default, Git has limitations with large files and binary content. In this project, we've configured Git to track all files regardless of size or type.

### .gitattributes Configuration

We use a `.gitattributes` file at the root of the repository to force Git to track all files:

```
# Set default behavior to track all files
* -text

# Binary file specific settings
*.sqlite !filter !diff !merge
*.db !filter !diff !merge
```

This configuration:
- Disables text conversion for all files (`* -text`)
- Disables filtering, diffing, and merging for database files to prevent corruption

### Large File Support

For large files, we've considered the following approaches:

1. **Standard Git**: We're currently using standard Git with the modifications above.
2. **Git LFS**: Git Large File Storage is available if needed but not currently implemented.
3. **Custom Handling**: For extremely large files, we have a custom script to handle external storage.

## Committing Large Files

When committing large files:

1. **Use the PowerShell commit script** which handles large files appropriately:
   ```powershell
   .\commit_large_files.ps1 "Commit message"
   ```

2. **Always include a descriptive message** indicating changes to large files:
   ```
   Added database snapshot for version 0.2.3
   - Includes schema updates
   - Contains sample test data
   ```

3. **Split large changes** into separate commits when possible.

## Database Files Strategy

For SQLite database files:

1. **Main Development Database**: Tracked in Git (`module_hierarchy.sqlite`)
2. **Backup Snapshots**: Named with date stamps (`module_hierarchy_2025-03-22.sqlite`)
3. **Test Databases**: Prefixed with "test_" (`test_module_hierarchy.sqlite`)

## Ignored Files

Some files are still excluded to keep the repository manageable:

```
# Temporary files
*.tmp
*.bak
*.swp

# IDE files
.idea/
.vscode/
__pycache__/

# Log files over 10MB
large_logs/*.log
```

## Branches and Merges

Special care is needed when merging branches that contain large files:

1. **Create a backup** before merging:
   ```
   .\backup_large_files.ps1
   ```

2. **Resolve conflicts manually** for binary files:
   ```
   git checkout --ours path/to/large/file.sqlite
   # or
   git checkout --theirs path/to/large/file.sqlite
   ```

3. **Test after merges** to ensure database integrity.

## Repository Maintenance

To keep the repository manageable:

1. **Regular cleanup** using the cleanup script:
   ```
   .\cleanup_repository.ps1
   ```

2. **Commit log compression** using Git's garbage collection:
   ```
   git gc --aggressive
   ```

3. **Periodic rebasing** of long-lived feature branches.

## Collaboration Guidelines

When collaborating with others:

1. **Communicate before pushing** large file changes
2. **Pull before making changes** to large files
3. **Use appropriate branch naming**: `feature/database-update-v2`
4. **Include details** in PR descriptions: "Updated database with new schema tables for module relationships" 
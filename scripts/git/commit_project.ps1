# Automatic Project Commit Script
# This script automatically commits all changes to the project repository
# It should be run from the project root directory

# Configure Git if needed
if (!(git config --get user.name)) {
    Write-Host "Configuring Git user name..."
    git config --global user.name "TODOist Automation"
}

if (!(git config --get user.email)) {
    Write-Host "Configuring Git user email..."
    git config --global user.email "automation@todoist.example.com"
}

# Update the changelog first using the Python script
try {
    Write-Host "Updating changelog..."
    python scripts/update_changelog.py add "Update" "Automatic update from commit script"
} catch {
    Write-Host "Could not update changelog. Continuing with commit..." -ForegroundColor Yellow
}

# Show status before commit
Write-Host "Current Git status:" -ForegroundColor Cyan
git status

# Get a list of modified documentation files
$docFiles = git status --porcelain | Where-Object { $_ -match '.*\.(md|txt|json|yaml|yml)$' } | ForEach-Object { $_.Substring(3) }

# If there are documentation changes, create a specific commit for them
if ($docFiles.Count -gt 0) {
    Write-Host "Documentation files modified:" -ForegroundColor Green
    $docFiles | ForEach-Object { Write-Host "  $_" }
    
    # Create a commit message listing the changed docs
    $docCommitMsg = "Updated documentation files:`n`n"
    $docFiles | ForEach-Object { $docCommitMsg += "- $_`n" }
    
    # Stage and commit documentation changes
    git add *.md *.txt *.json *.yaml *.yml
    git commit -m $docCommitMsg
    
    Write-Host "Documentation changes committed." -ForegroundColor Green
}

# Get a list of modified code files
$codeFiles = git status --porcelain | Where-Object { $_ -match '.*\.(ts|tsx|js|jsx|css|scss|html)$' } | ForEach-Object { $_.Substring(3) }

# If there are code changes, create a separate commit for them
if ($codeFiles.Count -gt 0) {
    Write-Host "Code files modified:" -ForegroundColor Blue
    $codeFiles | ForEach-Object { Write-Host "  $_" }
    
    # Create a commit message for code changes
    $codeCommitMsg = "Updated code files:`n`n"
    $codeFiles | ForEach-Object { $codeCommitMsg += "- $_`n" }
    
    # Stage and commit code changes
    git add *.ts *.tsx *.js *.jsx *.css *.scss *.html
    git commit -m $codeCommitMsg
    
    Write-Host "Code changes committed." -ForegroundColor Blue
}

# Commit any remaining changes
$remainingChanges = git status --porcelain
if ($remainingChanges) {
    Write-Host "Other changes detected. Committing..." -ForegroundColor Yellow
    git add .
    git commit -m "Miscellaneous changes"
    Write-Host "Miscellaneous changes committed." -ForegroundColor Yellow
}

# Push to remote repository if one is configured
$remoteExists = git remote -v
if ($remoteExists) {
    $branch = git rev-parse --abbrev-ref HEAD
    
    Write-Host "Pushing changes to remote repository ($branch)..." -ForegroundColor Magenta
    try {
        git push origin $branch
        Write-Host "Changes pushed successfully!" -ForegroundColor Green
    } catch {
        Write-Host "Failed to push changes. You may need to push manually." -ForegroundColor Red
        Write-Host "Error: $_"
    }
} else {
    Write-Host "No remote repository configured. Changes committed locally only." -ForegroundColor Yellow
    Write-Host "To push changes, configure a remote repository and use 'git push'."
}

Write-Host "Commit process complete!" -ForegroundColor Green 
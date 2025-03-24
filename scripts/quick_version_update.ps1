# Quick Version Update Script
# This script updates version numbers across the project
# It updates package.json and calls the changelog script to create a new release

param(
    [Parameter(Mandatory=$true)]
    [string]$Version
)

# Check if the version follows semver pattern
if ($Version -notmatch '^\d+\.\d+\.\d+(-\w+(\.\d+)?)?$') {
    Write-Host "Error: Version should follow semantic versioning (e.g., 1.2.3 or 1.2.3-beta.1)" -ForegroundColor Red
    exit 1
}

# Update package.json
Write-Host "Updating version in package.json..." -ForegroundColor Cyan
$packageJsonPath = "package.json"

if (Test-Path $packageJsonPath) {
    $packageJson = Get-Content $packageJsonPath -Raw | ConvertFrom-Json
    $oldVersion = $packageJson.version
    $packageJson.version = $Version
    $packageJson | ConvertTo-Json -Depth 10 | Set-Content $packageJsonPath -Encoding UTF8
    Write-Host "Updated package.json version from $oldVersion to $Version" -ForegroundColor Green
} else {
    Write-Host "Warning: package.json not found" -ForegroundColor Yellow
}

# Update the changelog
Write-Host "Updating changelog..." -ForegroundColor Cyan
try {
    python scripts/update_changelog.py release $Version
    Write-Host "Changelog updated for version $Version" -ForegroundColor Green
} catch {
    Write-Host "Error updating changelog: $_" -ForegroundColor Red
    Write-Host "You may need to update the changelog manually." -ForegroundColor Yellow
}

# Commit the version changes
Write-Host "Committing version changes..." -ForegroundColor Cyan
git add package.json CHANGELOG.md
git commit -m "Bump version to $Version"

# Create a tag for the release
Write-Host "Creating git tag for version $Version..." -ForegroundColor Cyan
git tag -a "v$Version" -m "Version $Version"

Write-Host "Version update complete!" -ForegroundColor Green
Write-Host "To push the changes, run: git push && git push --tags" -ForegroundColor Yellow 
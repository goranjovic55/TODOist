#!/usr/bin/env python3
# Changelog Update Script
# This script automatically updates the CHANGELOG.md file with new entries
# Usage: python update_changelog.py add "Category" "Change description"
#   e.g. python update_changelog.py add "Added" "New feature X"

import sys
import os
import re
from datetime import datetime
import semver

CHANGELOG_FILE = "CHANGELOG.md"
UNRELEASED_PATTERN = r"## \[Unreleased\]"
VERSION_PATTERN = r"## \[(\d+\.\d+\.\d+(-\w+(\.\d+)?)?)\]"

def get_changelog_content():
    """Read the current changelog content."""
    if not os.path.exists(CHANGELOG_FILE):
        return None
    
    with open(CHANGELOG_FILE, "r", encoding="utf-8") as file:
        return file.read()

def add_changelog_entry(category, description):
    """Add a new entry to the changelog under the specified category."""
    content = get_changelog_content()
    if not content:
        print(f"Error: {CHANGELOG_FILE} not found")
        return False
    
    # Find the Unreleased section
    unreleased_match = re.search(UNRELEASED_PATTERN, content)
    if not unreleased_match:
        print(f"Error: Could not find [Unreleased] section in {CHANGELOG_FILE}")
        return False
    
    # Find the position to insert the new entry
    pos = unreleased_match.end()
    
    # Look for the category section
    category_pattern = f"### {category}"
    category_match = re.search(category_pattern, content[pos:])
    
    if category_match:
        # Category exists, add entry under it
        entry_pos = pos + category_match.end()
        
        # Find the next line after the category
        next_line_pos = content.find("\n", entry_pos)
        if next_line_pos != -1:
            entry_pos = next_line_pos + 1
        
        # Add the new entry
        new_entry = f"- {description}\n"
        updated_content = content[:entry_pos] + new_entry + content[entry_pos:]
    else:
        # Category doesn't exist, create it
        # Find a good position to insert (after unreleased header)
        new_section_pos = content.find("\n", pos)
        if new_section_pos == -1:
            new_section_pos = pos
        else:
            new_section_pos += 1
        
        # Check if there's an existing category
        next_category = re.search(r"### ", content[new_section_pos:])
        if next_category:
            # Insert before the next category
            new_section_pos = new_section_pos + next_category.start()
        
        # Add the new category and entry
        new_section = f"\n### {category}\n- {description}\n"
        updated_content = content[:new_section_pos] + new_section + content[new_section_pos:]
    
    # Write back to the file
    with open(CHANGELOG_FILE, "w", encoding="utf-8") as file:
        file.write(updated_content)
    
    print(f"Added '{description}' to '{category}' in {CHANGELOG_FILE}")
    return True

def create_release(version):
    """Convert Unreleased section to a release with version number and date, ensuring proper version ordering."""
    content = get_changelog_content()
    if not content:
        print(f"Error: {CHANGELOG_FILE} not found")
        return False
    
    # Find the Unreleased section
    unreleased_match = re.search(UNRELEASED_PATTERN, content)
    if not unreleased_match:
        print(f"Error: Could not find [Unreleased] section in {CHANGELOG_FILE}")
        return False
    
    # Get today's date
    today = datetime.now().strftime("%Y-%m-%d")
    
    # Extract the content from the Unreleased section
    unreleased_content_start = unreleased_match.end()
    
    # Find where the next version header starts, if any
    next_version_match = re.search(VERSION_PATTERN, content[unreleased_content_start:])
    
    if next_version_match:
        unreleased_content_end = unreleased_content_start + next_version_match.start()
    else:
        unreleased_content_end = len(content)
    
    unreleased_content = content[unreleased_content_start:unreleased_content_end]
    
    # Remove the original unreleased section
    content_without_unreleased = content[:unreleased_match.start()] + content[unreleased_content_end:]
    
    # Create the new version section
    new_version_section = f"## [{version}] - {today}{unreleased_content}"
    
    # Find all existing versions to determine where to insert the new version
    existing_versions = re.findall(VERSION_PATTERN, content_without_unreleased)
    
    # If there are existing versions, find the right place to insert the new version
    if existing_versions:
        # Try to parse the current version with semver
        try:
            curr_version = version
            # Normalize versions to standard semver if needed
            if not curr_version.startswith('v'):
                curr_version = curr_version
                
            # Find the correct position to insert the new version
            position_found = False
            
            for match in re.finditer(VERSION_PATTERN, content_without_unreleased):
                existing_ver = match.group(1)
                
                # Check if the existing version is older than the current version
                try:
                    if semver.compare(curr_version, existing_ver) > 0:
                        # Current version is newer, insert before this position
                        position = match.start()
                        content_without_unreleased = (
                            content_without_unreleased[:position] + 
                            new_version_section + 
                            content_without_unreleased[position:]
                        )
                        position_found = True
                        break
                except:
                    # If semver comparison fails, try simple string comparison
                    if curr_version > existing_ver:
                        position = match.start()
                        content_without_unreleased = (
                            content_without_unreleased[:position] + 
                            new_version_section + 
                            content_without_unreleased[position:]
                        )
                        position_found = True
                        break
                    
            # If no position found, add to the end
            if not position_found:
                # Find the earliest position after the title/header
                first_header_pos = content_without_unreleased.find('#')
                if first_header_pos >= 0:
                    title_end_pos = content_without_unreleased.find('\n', first_header_pos)
                    if title_end_pos >= 0:
                        content_without_unreleased = (
                            content_without_unreleased[:title_end_pos+1] + 
                            new_version_section + 
                            content_without_unreleased[title_end_pos+1:]
                        )
                    else:
                        content_without_unreleased += new_version_section
                else:
                    content_without_unreleased += new_version_section
                        
        except Exception as e:
            # If there's any error with semver, just add after the unreleased section
            print(f"Warning: Error parsing versions: {e}")
            content_without_unreleased = (
                content_without_unreleased[:unreleased_match.start()] + 
                new_version_section + 
                content_without_unreleased[unreleased_match.start():]
            )
    else:
        # No existing versions, add after the title
        first_header_pos = content_without_unreleased.find('#')
        if first_header_pos >= 0:
            title_end_pos = content_without_unreleased.find('\n', first_header_pos)
            if title_end_pos >= 0:
                content_without_unreleased = (
                    content_without_unreleased[:title_end_pos+1] + 
                    new_version_section + 
                    content_without_unreleased[title_end_pos+1:]
                )
            else:
                content_without_unreleased += new_version_section
        else:
            content_without_unreleased += new_version_section
    
    # Add a new Unreleased section at the top
    new_unreleased = f"## [Unreleased]\n\n"
    first_header_pos = content_without_unreleased.find('#')
    if first_header_pos >= 0:
        content_with_unreleased = (
            content_without_unreleased[:first_header_pos] + 
            new_unreleased + 
            content_without_unreleased[first_header_pos:]
        )
    else:
        content_with_unreleased = new_unreleased + content_without_unreleased
    
    # Write back to the file
    with open(CHANGELOG_FILE, "w", encoding="utf-8") as file:
        file.write(content_with_unreleased)
    
    print(f"Created release version {version} dated {today} in {CHANGELOG_FILE}")
    return True

def main():
    """Main function to process command line arguments."""
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python update_changelog.py add \"Category\" \"Change description\"")
        print("  python update_changelog.py release \"version\"")
        return
    
    command = sys.argv[1].lower()
    
    if command == "add" and len(sys.argv) >= 4:
        category = sys.argv[2]
        description = sys.argv[3]
        add_changelog_entry(category, description)
    elif command == "release" and len(sys.argv) >= 3:
        version = sys.argv[2]
        create_release(version)
    else:
        print("Invalid command or missing arguments")
        print("Usage:")
        print("  python update_changelog.py add \"Category\" \"Change description\"")
        print("  python update_changelog.py release \"version\"")

if __name__ == "__main__":
    main()
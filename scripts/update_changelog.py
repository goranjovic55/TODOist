#!/usr/bin/env python3
# Changelog Update Script
# This script automatically updates the CHANGELOG.md file with new entries
# Usage: python update_changelog.py add "Category" "Change description"
#   e.g. python update_changelog.py add "Added" "New feature X"

import sys
import os
import re
from datetime import datetime

CHANGELOG_FILE = "CHANGELOG.md"
UNRELEASED_PATTERN = r"## \[Unreleased\]"

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
    """Convert Unreleased section to a release with version number and date."""
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
    
    # Replace [Unreleased] with [version] - date
    start_pos = unreleased_match.start()
    end_pos = unreleased_match.end()
    
    new_header = f"## [{version}] - {today}"
    updated_content = content[:start_pos] + new_header + content[end_pos:]
    
    # Add a new Unreleased section at the top
    new_unreleased = f"## [Unreleased]\n\n"
    insert_pos = content.find("#")
    if insert_pos == -1:
        insert_pos = 0
    
    updated_content = updated_content[:insert_pos] + new_unreleased + updated_content[insert_pos:]
    
    # Write back to the file
    with open(CHANGELOG_FILE, "w", encoding="utf-8") as file:
        file.write(updated_content)
    
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
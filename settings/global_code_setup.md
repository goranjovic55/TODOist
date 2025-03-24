# Global Code Setup for MODMeta

This document outlines the coding conventions, style guides, and best practices for the MODMeta project. Following these guidelines ensures consistency and maintainability across the codebase.

## Python Coding Style

### General Guidelines

- Follow [PEP 8](https://peps.python.org/pep-0008/) for code style
- Use 4 spaces for indentation (not tabs)
- Maximum line length of 100 characters
- Use descriptive variable and function names
- Add docstrings to all modules, classes, and functions
- Organize imports in the following order:
  1. Standard library imports
  2. Related third-party imports
  3. Local application imports
- Target Python 3.8+ compatibility

### Naming Conventions

- `snake_case` for variables, functions, and methods
- `CamelCase` for classes
- `UPPER_CASE` for constants
- Prefix private attributes and methods with a single underscore (`_private_method`)

### Example

```python
import os
import sys
from typing import List, Dict, Optional

import numpy as np
import pandas as pd

from modmeta.utils import file_helper
from modmeta.core import processor


CONSTANT_VALUE = 42


class ModuleProcessor:
    """
    Processes module files and extracts metadata.
    
    This class handles parsing, extraction, and transformation of
    module metadata from various file formats.
    """
    
    def __init__(self, input_dir: str, output_dir: Optional[str] = None):
        self.input_dir = input_dir
        self._output_dir = output_dir or os.path.join(input_dir, 'output')
        
    def process_file(self, filename: str) -> Dict:
        """
        Process a single module file and extract metadata.
        
        Args:
            filename: Path to the file to process
            
        Returns:
            Dictionary containing extracted metadata
        """
        # Implementation
        pass

## Project Structure Guidelines

### Directory Organization

Follow the established directory structure for the MODMeta project:

- `/modmeta/` - Main package containing application code
  - `/modmeta/core/` - Core functionality and data models
  - `/modmeta/cli/` - Command Line Interface implementation
  - `/modmeta/gui/` - Graphical User Interface implementation
  - `/modmeta/database/` - Database access and management
  - `/modmeta/parsers/` - File format parsers
  - `/modmeta/utils/` - Utility functions and helpers

- `/scripts/` - Utility scripts and development tools
  - `/scripts/debug/` - Debugging utilities
  - `/scripts/test/` - Test utilities
  
- `/tests/` - Automated tests
  - `/tests/unit/` - Unit tests for individual components
  - `/tests/integration/` - Integration tests for system components
  - `/tests/scripts/` - Test scripts
  - `/tests/output/export/` - Test export files and data
  - `/tests/output/reconstructed/` - Reconstructed test files

- `/project/` - Project management documents
  - `/project/models/` - Data models and diagrams
  - Roadmaps, plans, and implementation status documents

- `/settings/` - Project configuration files
  - Development guidelines and setup documents
  - Environment configuration

- `/docs/` - Documentation for users and developers

### File Placement Guidelines

- Place test data files in the `tests/data/` directory, not the root
- Store output files in dedicated output directories within `/tests/output/`
- Keep temporary files out of version control by adding patterns to `.gitignore`
- Place executable scripts in the `/scripts/` directory
- Place reusable utility functions in the appropriate `/modmeta/utils/` module

### Imports and Module Organization

- Avoid importing specific functions/classes from modules when it makes the code less maintainable
- Import full modules when there might be many functions/classes used from that module
- Organize imports with standard library first, then third-party libraries, then local modules

## Component-Specific Standards

### API Development Standards

- RESTful design principles for all endpoints
- JSON for all request/response payloads
- Consistent error handling and status codes
- API versioning in URL path (/api/v1/...)
- Modular architecture with clear separation of concerns
- Efficient database access patterns
- Comprehensive input validation
- OpenAPI/Swagger documentation for all endpoints
- Document authentication requirements

### CLI Development Standards

- Consistent command syntax across all operations
- Comprehensive help text for all commands
- Support for verbose/quiet modes
- Exit codes for scripting integration
- Use argparse for command parsing
- Reuse API core functionality where possible
- Implement progress indicators for long operations
- Support for configuration files

### GUI Development Standards

- Consistent visual design language
- Responsive layouts for all screen sizes
- Accessibility compliance
- Clear navigation hierarchy
- Separate presentation from business logic
- Load data asynchronously to prevent UI freezing
- Handle and display errors gracefully
- Support for theming/customization
- Automated UI testing where possible
- Defined user interaction test cases
- Cross-platform testing requirements

## Database Operations

- Use parameterized queries to prevent SQL injection
- Implement consistent error handling for database operations
- Close connections properly after use (preferably using context managers)
- Document schema changes in commit messages and/or migration scripts

## Project-Specific Best Practices

The following best practices are based on our project history and specific needs:

### File Processing

- Use context managers for file operations to ensure proper closing
- Implement progress reporting for long-running operations
- Consider memory usage when processing large files
- Handle file encoding consistently (prefer UTF-8 where possible)

### Block Operations

- Validate block structure before processing
- Use meaningful block identifiers for better debugging
- Implement hierarchical relationships between blocks properly
- Track block provenance to assist with debugging

### Testing and Verification

- Always verify file hashes after reconstruction operations
- Include test cases for binary file content preservation
- Test with both minimal and comprehensive datasets
- Implement proper cleanup of test artifacts
- Minimum 80% test coverage for all code
- Write unit tests for each module
- Include integration tests for component interfaces
- Implement automated test runners for each phase

### CLI Implementation

- Follow a consistent command structure: `command subcommand --option`
- Implement proper help documentation for each command
- Use the same argument names across similar commands
- Provide sensible default values for optional arguments

### Error Handling Strategies

- Implement retries for transient failures (especially I/O operations)
- Log both the exception and the context for better debugging
- Use custom exception types to differentiate between error categories
- Ensure proper resource cleanup in error conditions

### Documentation Standards

- Document the purpose and usage of every script
- Keep code comments focused on "why" rather than "what"
- Update documentation immediately when interfaces change
- Use doctests for simple function examples
- Maintain separate documentation for API, CLI, and GUI interfaces

### Performance Improvements

- Add caching for frequently accessed database records
- Use batch operations for database changes
- Process files in chunks to avoid memory issues
- Measure and log performance metrics for critical operations
- Profile and optimize critical paths
- Implement caching for expensive operations
- Minimize memory usage in large data operations
- Set clear performance benchmarks for each phase

### Scalability Standards

- Design for horizontal scaling
- Use batch operations for database efficiency
- Implement pagination for large result sets
- Document resource requirements and limits

### Collaboration Practices

- Prefix work-in-progress commit messages with "WIP:"
- Request code reviews for complex changes
- Write descriptive pull request descriptions
- Comment on challenging sections of code with explanations

## Error Handling

- Use specific exception types rather than catching general exceptions
- Log exceptions with appropriate context information
- Provide meaningful error messages to users
- Consider error recovery strategies where appropriate

```python
try:
    process_file(filename)
except FileNotFoundError:
    logger.error(f"File not found: {filename}")
    # Handle missing file
except PermissionError:
    logger.error(f"Permission denied: {filename}")
    # Handle permission issues
except Exception as e:
    logger.exception(f"Unexpected error processing {filename}: {e}")
    # Handle unexpected errors
```

## Logging

- Use the standard Python logging module
- Configure appropriate log levels for different environments
- Include context information in log messages
- Avoid logging sensitive information

```python
import logging

logger = logging.getLogger(__name__)

def process_directory(directory_path):
    logger.info(f"Processing directory: {directory_path}")
    files = os.listdir(directory_path)
    logger.debug(f"Found {len(files)} files")
    
    for file in files:
        try:
            process_file(file)
            logger.debug(f"Successfully processed {file}")
        except Exception as e:
            logger.error(f"Failed to process {file}: {e}")
```

## Testing Guidelines

- Write unit tests for all core functionality
- Aim for high test coverage, especially for critical paths
- Use pytest as the primary testing framework
- Mock external dependencies in tests
- Use descriptive test names that indicate what is being tested

```python
def test_process_file_extracts_metadata():
    # Arrange
    test_file = "test_data/sample_module.xml"
    expected_metadata = {"name": "Sample Module", "version": "1.0"}
    
    # Act
    result = process_file(test_file)
    
    # Assert
    assert result["name"] == expected_metadata["name"]
    assert result["version"] == expected_metadata["version"]
```

## Documentation

- Document all public APIs
- Include examples in docstrings
- Update documentation when code changes
- Use type hints to improve code readability and IDE support
- Include request/response examples for API endpoints
- Maintain changelog for API changes

## Version Control

- Write descriptive commit messages
- Refer to the `settings/git_settings.md` file for Git-specific guidelines
- Create feature branches for significant changes
- Use pull requests for code review
- Use semantic versioning (MAJOR.MINOR.PATCH)
- Feature branches for all new development
- Pull request review required before merging
- Atomic commits with descriptive messages

## CLI Guidelines

- Provide clear help messages for all commands
- Use consistent naming for command options
- Implement proper error handling and user feedback
- Support both interactive and non-interactive modes where appropriate

## Performance Considerations

- Profile code for performance bottlenecks
- Consider memory usage for large datasets
- Implement batching for large file operations
- Use appropriate data structures for specific use cases

## Security Best Practices

- Validate and sanitize user inputs
- Use secure defaults for configurable options
- Keep dependencies updated to mitigate vulnerabilities
- Avoid storing sensitive information in code repositories

## Code Reviews

- Review code for compliance with these guidelines
- Check for potential bugs, edge cases, and security issues
- Ensure proper error handling and logging
- Verify that tests cover the functionality 
# Testing and Debugging Guide

This document outlines the testing and debugging procedures for the MODMeta project, including tools, frameworks, and best practices to ensure code quality and reliability.

## Directory Structure

### Test Directories

- `/tests/` - Main directory for all test-related content
  - `/tests/unit/` - Unit tests for individual components and functions
  - `/tests/integration/` - Integration tests for component interactions
  - `/tests/data/` - Test data files and fixtures
  - `/tests/scripts/` - Test scripts and utilities
  - `/tests/output/` - Test output files and generated content
    - `/tests/output/export/` - Test export files 
    - `/tests/output/reconstructed/` - Reconstructed test files

### Debug Directories

- `/debug/` - Main directory for all debugging-related content
  - `/debug/scripts/` - Debugging utilities and scripts
  - `/debug/data/` - Debug data files
  - `/debug/output/` - Debug output files and log analysis
  - `/debug/temp/` - Temporary debug files (excluded from version control)

### Framework Directories

- `/project/frameworks/` - Test frameworks and reusable testing infrastructure
  - `/project/frameworks/api_framework.py` - API testing framework
  - `/project/frameworks/cli_framework.py` - CLI testing framework
  - `/project/frameworks/gui_framework.py` - GUI testing framework

## Testing Framework

MODMeta uses pytest as the primary testing framework, plus our specialized test frameworks for API, CLI, and GUI testing. All tests should follow these guidelines:

### Test Organization

1. **Naming Convention**: Test files should be named `test_*.py` and test functions should start with `test_`
2. **Test Structure**: Each test file should focus on a specific component or functionality
3. **Test Coverage**: Aim for at least 80% test coverage, especially for critical components

### Running Tests

#### Run all tests:
```bash
python -m pytest
```

#### Run specific test file:
```bash
python -m pytest tests/unit/test_file.py
```

#### Run tests with coverage report:
```bash
python -m pytest --cov=modmeta tests/
```

### MODMeta Test Frameworks

MODMeta provides specialized test frameworks for comprehensive testing:

1. **API Test Framework** (`project/frameworks/api_framework.py`):
   - Used for testing the MODMeta API
   - Provides standardized testing capabilities for API functionality
   - Includes performance metrics recording and reporting

2. **CLI Test Framework** (`project/frameworks/cli_framework.py`):
   - Used for testing the CLI interface
   - Provides command execution and validation
   - Includes comparison tools for CLI vs API performance

3. **GUI Test Framework** (`project/frameworks/gui_framework.py`):
   - Used for testing the GUI application
   - Provides event simulation and UI testing
   - Includes screen capture and validation tools

### Running Comprehensive Tests

To run comprehensive tests using the test frameworks:

```bash
# Run API comprehensive test
python project/tests/test_api_full.py

# Run CLI comprehensive test
python project/tests/test_cli_full.py

# Run API vs CLI comparison test
python project/tests/test_api_cli_comparison.py
```

### Test Types

1. **Unit Tests**: Test individual functions and classes in isolation
   - Located in `/tests/unit/`
   - Should be fast and independent
   - Use mocking for external dependencies

2. **Integration Tests**: Test component interactions
   - Located in `/tests/integration/`
   - Test database interactions, file operations, etc.
   - May require more setup and teardown

3. **Functional Tests**: Test complete workflows
   - Located in `/tests/functional/`
   - Test end-to-end scenarios
   - May involve CLI or GUI testing

## Debugging Practices

### Logging

MODMeta uses the Python logging module with different log levels:

```python
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("debug.log"),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# Log levels
logger.debug("Detailed debug information")
logger.info("General information")
logger.warning("Warning message")
logger.error("Error message")
logger.critical("Critical error")
```

### Log File Analysis

Use the log analyzer script to process log files:

```bash
python debug/scripts/log_analyzer.py --file debug.log --level ERROR
```

### Debugging Commands

#### Debug Database Issues:
```bash
python debug/scripts/check_db_integrity.py --db path/to/database.db
```

#### Debug File Processing:
```bash
python debug/scripts/trace_file_processing.py --file path/to/file.xml --verbose
```

## Performance Testing

### Profiling Tools

1. **cProfile**: Standard Python profiler
   ```bash
   python -m cProfile -o profile.stats scripts/run_full_test.py
   python debug/scripts/analyze_profile.py profile.stats
   ```

2. **memory_profiler**: Memory usage profiling
   ```bash
   python -m memory_profiler scripts/run_full_test.py
   ```

3. **Custom Performance Tests**:
   ```bash
   python debug/scripts/performance_test.py --iterations 1000 --component parser
   ```

### Performance Optimization

Based on our performance testing, several key optimization strategies have been identified:

1. **Module Deduplication**: Using content-based hashing to prevent duplicate processing
2. **Content-Aware Compression**: Applying appropriate compression based on content type
3. **Batched Database Operations**: Reducing transaction overhead through batching
4. **Memory Caching**: Preventing redundant processing of the same content

## Continuous Integration

MODMeta implements continuous integration using GitHub Actions:

1. **Automated Testing**: Tests are run automatically on push and pull requests
2. **Code Quality Checks**: Linting and style checks are performed
3. **Coverage Reports**: Test coverage reports are generated

## Troubleshooting Guides

### Common Issues

1. **Database Connection Issues**:
   - Check database file permissions
   - Verify connection string is correct
   - Ensure SQLite version compatibility

2. **File Parsing Errors**:
   - Validate file format against expected schema
   - Check for encoding issues
   - Enable verbose logging for detailed parser output

3. **Performance Problems**:
   - Use profiling tools to identify bottlenecks
   - Check for excessive memory usage
   - Review database query performance

## Test Data Management

1. **Test Fixtures**: Store reusable test data in `/tests/data/`
2. **Data Generation**: Use scripts to generate test data when needed
3. **Data Cleanup**: Ensure all tests clean up temporary data

## Moving Files to Correct Subdirectories

To organize test and debug files into the proper directory structure:

1. Move test files from the root directory to the appropriate `/tests/` subdirectory:
   - Unit tests to `/tests/unit/`
   - Integration tests to `/tests/integration/`
   - Test scripts to `/tests/scripts/`
   - Test data files to `/tests/data/`

2. Move debugging files from the root directory to the appropriate `/debug/` subdirectory:
   - Debugging utilities to `/debug/scripts/`
   - Debug data to `/debug/data/`
   - Profiling scripts to `/debug/scripts/`

3. Update import statements and file paths in moved files to reflect their new locations

4. Remove any duplicate files to avoid confusion

## Debugging Checklist

When encountering issues:

- [ ] Check log files for error messages
- [ ] Verify configuration settings
- [ ] Run specific unit tests for affected components
- [ ] Enable debug logging for more details
- [ ] Use appropriate debugging tools from the `/debug/scripts/` directory
- [ ] Ensure directory structure follows the project standards 
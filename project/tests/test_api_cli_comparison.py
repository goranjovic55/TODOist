#!/usr/bin/env python
"""
MODMeta API vs CLI Comparison Test

This script runs a comparison test between the API and CLI interfaces, verifying that they
produce equivalent results and measuring performance differences. The test uses both 
the API and CLI test frameworks and generates detailed comparison reports.
"""

import os
import sys
import time
import json
import logging
import argparse
import hashlib
import shutil
import difflib
import sqlite3
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple

# Setup logging
logging.basicConfig(
    level=logging.INFO, 
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Add parent directories to path
current_dir = os.path.dirname(os.path.abspath(__file__))
project_dir = os.path.dirname(current_dir)
root_dir = os.path.dirname(project_dir)
if root_dir not in sys.path:
    sys.path.append(root_dir)

# Import test frameworks
try:
    from project.frameworks.api_framework import MODMetaAPITest
    from project.frameworks.cli_framework import MODMetaCLITest, APIvsCLIComparison
except ImportError as e:
    logger.error(f"Failed to import test frameworks: {e}")
    sys.exit(1)

# Default test directory - update as needed
DEFAULT_TEST_DIR = os.path.join(root_dir, "tests", "test_data")
# Output directory for test results
OUTPUT_DIR = os.path.join(project_dir, "test_results", "comparison")
# Detailed report file
DETAILED_REPORT = os.path.join(OUTPUT_DIR, "API_CLI_COMPARISON_REPORT.md")
# Import test scripts to reuse functions
try:
    sys.path.append(os.path.join(project_dir, "tests"))
    from test_api_full import test_database_integrity, verify_files
    from test_cli_full import test_cli_command_syntax
except ImportError as e:
    logger.error(f"Failed to import test functions: {e}")
    # Define fallback functions if imports fail
    def test_database_integrity(db_path):
        """Fallback database integrity test."""
        logger.warning("Using fallback database integrity test")
        return {"success": False, "error": "Failed to import test_database_integrity function"}
    
    def verify_files(source_dir, reconstructed_dir):
        """Fallback file verification."""
        logger.warning("Using fallback file verification")
        return {"success": False, "error": "Failed to import verify_files function"}
    
    def test_cli_command_syntax():
        """Fallback CLI command test."""
        logger.warning("Using fallback CLI command test")
        return {"success": False, "error": "Failed to import test_cli_command_syntax function"}

def compare_databases(api_db_path: str, cli_db_path: str) -> Dict[str, Any]:
    """
    Compare API and CLI databases for structure and content.
    
    Args:
        api_db_path: Path to API database
        cli_db_path: Path to CLI database
        
    Returns:
        Dictionary with comparison results
    """
    results = {
        "success": False,
        "table_comparison": {},
        "size_comparison": {
            "api_db_size": os.path.getsize(api_db_path) if os.path.exists(api_db_path) else 0,
            "cli_db_size": os.path.getsize(cli_db_path) if os.path.exists(cli_db_path) else 0,
        },
        "errors": []
    }
    
    # Calculate size ratio
    api_size = results["size_comparison"]["api_db_size"]
    cli_size = results["size_comparison"]["cli_db_size"]
    
    if api_size > 0 and cli_size > 0:
        if api_size > cli_size:
            results["size_comparison"]["ratio"] = api_size / cli_size
            results["size_comparison"]["larger"] = "API"
        else:
            results["size_comparison"]["ratio"] = cli_size / api_size
            results["size_comparison"]["larger"] = "CLI"
    
    try:
        # Get table structure and counts from API database
        api_conn = sqlite3.connect(api_db_path)
        api_cursor = api_conn.cursor()
        
        api_cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        api_tables = [table[0] for table in api_cursor.fetchall()]
        
        # Get table structure and counts from CLI database
        cli_conn = sqlite3.connect(cli_db_path)
        cli_cursor = cli_conn.cursor()
        
        cli_cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        cli_tables = [table[0] for table in cli_cursor.fetchall()]
        
        # Compare tables
        all_tables = set(api_tables) | set(cli_tables)
        for table in all_tables:
            comparison = {
                "exists_in_api": table in api_tables,
                "exists_in_cli": table in cli_tables,
                "api_count": 0,
                "cli_count": 0,
                "row_count_match": False,
                "schema_match": False
            }
            
            # Get row counts
            if table in api_tables:
                api_cursor.execute(f"SELECT COUNT(*) FROM {table}")
                comparison["api_count"] = api_cursor.fetchone()[0]
                
                # Get schema
                api_cursor.execute(f"PRAGMA table_info({table})")
                api_schema = api_cursor.fetchall()
                comparison["api_schema"] = [col[1] for col in api_schema]  # Column names
            
            if table in cli_tables:
                cli_cursor.execute(f"SELECT COUNT(*) FROM {table}")
                comparison["cli_count"] = cli_cursor.fetchone()[0]
                
                # Get schema
                cli_cursor.execute(f"PRAGMA table_info({table})")
                cli_schema = cli_cursor.fetchall()
                comparison["cli_schema"] = [col[1] for col in cli_schema]  # Column names
            
            # Calculate differences
            if comparison["exists_in_api"] and comparison["exists_in_cli"]:
                comparison["row_count_match"] = comparison["api_count"] == comparison["cli_count"]
                comparison["schema_match"] = comparison.get("api_schema", []) == comparison.get("cli_schema", [])
                
                if not comparison["schema_match"] and 'api_schema' in comparison and 'cli_schema' in comparison:
                    # Find schema differences
                    api_set = set(comparison["api_schema"])
                    cli_set = set(comparison["cli_schema"])
                    comparison["api_only_columns"] = list(api_set - cli_set)
                    comparison["cli_only_columns"] = list(cli_set - api_set)
            
            results["table_comparison"][table] = comparison
        
        # Close connections
        api_conn.close()
        cli_conn.close()
        
        # Overall success criteria
        table_matches = []
        for table, comparison in results["table_comparison"].items():
            if comparison["exists_in_api"] and comparison["exists_in_cli"]:
                table_matches.append(comparison["row_count_match"] and comparison["schema_match"])
        
        results["success"] = all(table_matches) if table_matches else False
        
    except Exception as e:
        results["errors"].append(str(e))
        logger.error(f"Database comparison failed: {e}")
    
    return results

def compare_file_reconstructions(api_recon_dir: str, cli_recon_dir: str) -> Dict[str, Any]:
    """
    Compare file reconstructions between API and CLI.
    
    Args:
        api_recon_dir: API reconstruction directory
        cli_recon_dir: CLI reconstruction directory
        
    Returns:
        Dictionary with comparison results
    """
    results = {
        "success": False,
        "api_files": 0,
        "cli_files": 0,
        "common_files": 0,
        "identical_files": 0,
        "different_files": 0,
        "api_only_files": 0,
        "cli_only_files": 0,
        "file_details": []
    }
    
    try:
        # Get API files
        api_files = {}
        if os.path.exists(api_recon_dir):
            for root, _, files in os.walk(api_recon_dir):
                for file in files:
                    file_path = os.path.join(root, file)
                    rel_path = os.path.relpath(file_path, api_recon_dir)
                    api_files[rel_path] = file_path
        
        # Get CLI files
        cli_files = {}
        if os.path.exists(cli_recon_dir):
            for root, _, files in os.walk(cli_recon_dir):
                for file in files:
                    file_path = os.path.join(root, file)
                    rel_path = os.path.relpath(file_path, cli_recon_dir)
                    cli_files[rel_path] = file_path
        
        # Update counts
        results["api_files"] = len(api_files)
        results["cli_files"] = len(cli_files)
        
        # Find common files
        api_file_names = set(api_files.keys())
        cli_file_names = set(cli_files.keys())
        common_files = api_file_names & cli_file_names
        api_only = api_file_names - cli_file_names
        cli_only = cli_file_names - api_file_names
        
        results["common_files"] = len(common_files)
        results["api_only_files"] = len(api_only)
        results["cli_only_files"] = len(cli_only)
        
        # Calculate file hashes for common files
        for filename in common_files:
            api_path = api_files[filename]
            cli_path = cli_files[filename]
            
            # Calculate hashes
            try:
                api_hash = hashlib.sha256()
                with open(api_path, 'rb') as f:
                    for chunk in iter(lambda: f.read(4096), b''):
                        api_hash.update(chunk)
                api_hash = api_hash.hexdigest()
                
                cli_hash = hashlib.sha256()
                with open(cli_path, 'rb') as f:
                    for chunk in iter(lambda: f.read(4096), b''):
                        cli_hash.update(chunk)
                cli_hash = cli_hash.hexdigest()
                
                # Compare hashes
                identical = api_hash == cli_hash
                if identical:
                    results["identical_files"] += 1
                else:
                    results["different_files"] += 1
                
                results["file_details"].append({
                    "filename": filename,
                    "api_path": api_path,
                    "cli_path": cli_path,
                    "api_hash": api_hash,
                    "cli_hash": cli_hash,
                    "identical": identical
                })
                
            except Exception as e:
                logger.error(f"Error comparing file {filename}: {e}")
                results["file_details"].append({
                    "filename": filename,
                    "api_path": api_path,
                    "cli_path": cli_path,
                    "error": str(e)
                })
        
        # Success criteria: All common files are identical
        if results["common_files"] > 0:
            results["success"] = results["identical_files"] == results["common_files"]
        else:
            results["success"] = False
            results["error"] = "No common files found for comparison"
        
    except Exception as e:
        results["error"] = str(e)
        logger.error(f"File reconstruction comparison failed: {e}")
    
    return results

def compare_performance_metrics(api_metrics: Dict, cli_metrics: Dict) -> Dict[str, Any]:
    """
    Compare performance metrics between API and CLI.
    
    Args:
        api_metrics: API performance metrics
        cli_metrics: CLI performance metrics
        
    Returns:
        Dictionary with comparison results
    """
    results = {
        "overall": {
            "api_total_duration": api_metrics.get("total_duration", 0),
            "cli_total_duration": cli_metrics.get("total_duration", 0),
        },
        "operations": {}
    }
    
    # Calculate overall speed ratio
    api_duration = results["overall"]["api_total_duration"]
    cli_duration = results["overall"]["cli_total_duration"]
    
    if api_duration > 0 and cli_duration > 0:
        if api_duration > cli_duration:
            results["overall"]["ratio"] = api_duration / cli_duration
            results["overall"]["faster"] = "CLI"
        else:
            results["overall"]["ratio"] = cli_duration / api_duration
            results["overall"]["faster"] = "API"
    
    # Compare common operations
    api_ops = api_metrics.get("operations", {})
    cli_ops = cli_metrics.get("operations", {})
    
    all_ops = set(api_ops.keys()) | set(cli_ops.keys())
    for op in all_ops:
        op_result = {
            "exists_in_api": op in api_ops,
            "exists_in_cli": op in cli_ops,
        }
        
        if op in api_ops:
            op_result["api_duration"] = api_ops[op].get("total_duration", 0)
            op_result["api_count"] = api_ops[op].get("count", 0)
            op_result["api_avg_duration"] = api_ops[op].get("avg_duration", 0)
        
        if op in cli_ops:
            op_result["cli_duration"] = cli_ops[op].get("total_duration", 0)
            op_result["cli_count"] = cli_ops[op].get("count", 0)
            op_result["cli_avg_duration"] = cli_ops[op].get("avg_duration", 0)
        
        # Calculate speed ratio for common operations
        if op in api_ops and op in cli_ops:
            api_dur = op_result["api_duration"]
            cli_dur = op_result["cli_duration"]
            
            if api_dur > 0 and cli_dur > 0:
                if api_dur > cli_dur:
                    op_result["ratio"] = api_dur / cli_dur
                    op_result["faster"] = "CLI"
                else:
                    op_result["ratio"] = cli_dur / api_dur
                    op_result["faster"] = "API"
        
        results["operations"][op] = op_result
    
    return results

def generate_detailed_comparison_report(comparison_results: Dict[str, Any], output_file: str) -> None:
    """
    Generate a detailed Markdown report of comparison test results.
    
    Args:
        comparison_results: Results from comparison tests
        output_file: Output file path
    """
    try:
        with open(output_file, 'w') as f:
            f.write("# API vs CLI Comparison Test Report\n\n")
            f.write(f"Test performed on: {datetime.now().strftime('%Y-%m-%d')}\n\n")
            
            # Test directory
            f.write(f"Test directory: {comparison_results.get('input_dir', 'Unknown')}\n\n")
            
            # Executive Summary
            f.write("## Executive Summary\n\n")
            
            if 'overall_success' in comparison_results:
                success = comparison_results['overall_success']
                f.write(f"Overall comparison result: **{'Success' if success else 'Failure'}**\n\n")
            
            if 'performance_comparison' in comparison_results and 'overall' in comparison_results['performance_comparison']:
                perf = comparison_results['performance_comparison']['overall']
                f.write("### Performance Summary\n\n")
                f.write(f"- API total duration: {perf.get('api_total_duration', 0):.2f} seconds\n")
                f.write(f"- CLI total duration: {perf.get('cli_total_duration', 0):.2f} seconds\n")
                
                if 'faster' in perf and 'ratio' in perf:
                    f.write(f"- {perf['faster']} was {perf['ratio']:.2f}x faster overall\n\n")
            
            if 'database_comparison' in comparison_results and 'size_comparison' in comparison_results['database_comparison']:
                size = comparison_results['database_comparison']['size_comparison']
                f.write("### Database Size Comparison\n\n")
                f.write(f"- API database size: {size.get('api_db_size', 0):,} bytes\n")
                f.write(f"- CLI database size: {size.get('cli_db_size', 0):,} bytes\n")
                
                if 'larger' in size and 'ratio' in size:
                    f.write(f"- {size['larger']} database is {size['ratio']:.2f}x larger\n\n")
            
            if 'file_comparison' in comparison_results:
                file = comparison_results['file_comparison']
                f.write("### File Reconstruction Summary\n\n")
                f.write(f"- API reconstructed files: {file.get('api_files', 0)}\n")
                f.write(f"- CLI reconstructed files: {file.get('cli_files', 0)}\n")
                f.write(f"- Common files: {file.get('common_files', 0)}\n")
                f.write(f"- Identical files: {file.get('identical_files', 0)}\n")
                f.write(f"- Different files: {file.get('different_files', 0)}\n\n")
            
            # Key findings and issues
            if comparison_results.get('findings', []):
                f.write("### Key Findings\n\n")
                for finding in comparison_results['findings']:
                    f.write(f"- {finding}\n")
                f.write("\n")
            
            if comparison_results.get('issues', []):
                f.write("### Issues Identified\n\n")
                for issue in comparison_results['issues']:
                    f.write(f"- {issue}\n")
                f.write("\n")
            
            # Database comparison
            f.write("## Database Comparison\n\n")
            db_comp = comparison_results.get('database_comparison', {})
            table_comp = db_comp.get('table_comparison', {})
            
            if table_comp:
                f.write("### Table Structure Comparison\n\n")
                f.write("| Table | In API | In CLI | API Rows | CLI Rows | Schema Match | Row Count Match |\n")
                f.write("|-------|--------|--------|----------|----------|--------------|----------------|\n")
                
                for table, details in table_comp.items():
                    in_api = "✓" if details.get("exists_in_api", False) else "✗"
                    in_cli = "✓" if details.get("exists_in_cli", False) else "✗"
                    api_count = details.get("api_count", "N/A")
                    cli_count = details.get("cli_count", "N/A")
                    schema_match = "✓" if details.get("schema_match", False) else "✗"
                    count_match = "✓" if details.get("row_count_match", False) else "✗"
                    
                    f.write(f"| {table} | {in_api} | {in_cli} | {api_count} | {cli_count} | {schema_match} | {count_match} |\n")
                
                f.write("\n")
                
                # Schema differences
                schema_diffs = False
                for table, details in table_comp.items():
                    if details.get("exists_in_api", False) and details.get("exists_in_cli", False) and not details.get("schema_match", True):
                        if not schema_diffs:
                            f.write("### Schema Differences\n\n")
                            schema_diffs = True
                        
                        f.write(f"**Table: {table}**\n\n")
                        
                        api_only = details.get("api_only_columns", [])
                        cli_only = details.get("cli_only_columns", [])
                        
                        if api_only:
                            f.write("API-only columns:\n")
                            for col in api_only:
                                f.write(f"- {col}\n")
                            f.write("\n")
                        
                        if cli_only:
                            f.write("CLI-only columns:\n")
                            for col in cli_only:
                                f.write(f"- {col}\n")
                            f.write("\n")
            
            # Performance comparison
            f.write("## Performance Comparison\n\n")
            perf_comp = comparison_results.get('performance_comparison', {})
            op_comp = perf_comp.get('operations', {})
            
            if op_comp:
                f.write("### Operation Performance\n\n")
                f.write("| Operation | API Duration (s) | CLI Duration (s) | API Count | CLI Count | Faster | Ratio |\n")
                f.write("|-----------|-----------------|------------------|-----------|-----------|--------|-------|\n")
                
                for op, details in op_comp.items():
                    api_dur = details.get("api_duration", "N/A")
                    cli_dur = details.get("cli_duration", "N/A")
                    
                    if api_dur != "N/A":
                        api_dur = f"{api_dur:.2f}"
                    
                    if cli_dur != "N/A":
                        cli_dur = f"{cli_dur:.2f}"
                    
                    api_count = details.get("api_count", "N/A")
                    cli_count = details.get("cli_count", "N/A")
                    faster = details.get("faster", "N/A")
                    ratio = details.get("ratio", "N/A")
                    
                    if ratio != "N/A":
                        ratio = f"{ratio:.2f}x"
                    
                    f.write(f"| {op} | {api_dur} | {cli_dur} | {api_count} | {cli_count} | {faster} | {ratio} |\n")
                
                f.write("\n")
            
            # File reconstruction comparison
            file_comp = comparison_results.get('file_comparison', {})
            file_details = file_comp.get('file_details', [])
            
            if file_details:
                # First, list any different files
                diff_files = [file for file in file_details if file.get('identical', True) == False]
                if diff_files:
                    f.write("## Different Files\n\n")
                    f.write("| Filename | API Hash | CLI Hash |\n")
                    f.write("|----------|---------|----------|\n")
                    
                    for file in diff_files:
                        filename = file.get('filename', 'Unknown')
                        api_hash = file.get('api_hash', 'N/A')
                        cli_hash = file.get('cli_hash', 'N/A')
                        
                        f.write(f"| {filename} | {api_hash} | {cli_hash} |\n")
                    
                    f.write("\n")
            
            # Errors section
            all_errors = []
            for section_name, section_data in comparison_results.items():
                if isinstance(section_data, dict) and 'errors' in section_data:
                    for error in section_data['errors']:
                        all_errors.append(f"{section_name}: {error}")
                elif isinstance(section_data, dict) and 'error' in section_data:
                    all_errors.append(f"{section_name}: {section_data['error']}")
            
            if all_errors:
                f.write("## Errors\n\n")
                for error in all_errors:
                    f.write(f"- {error}\n")
                f.write("\n")
            
            # Recommendations
            if comparison_results.get('recommendations', []):
                f.write("## Recommendations\n\n")
                for i, rec in enumerate(comparison_results['recommendations'], 1):
                    f.write(f"{i}. {rec}\n")
            
            logger.info(f"Detailed comparison report generated at {output_file}")
            
    except Exception as e:
        logger.error(f"Failed to generate detailed comparison report: {e}")

def run_api_cli_comparison(input_dir: str, output_dir: str = OUTPUT_DIR) -> Dict[str, Any]:
    """
    Run a comparison test between API and CLI functionality.
    
    Args:
        input_dir: Directory to scan
        output_dir: Directory for test output
        
    Returns:
        Dictionary with comparison results
    """
    os.makedirs(output_dir, exist_ok=True)
    
    # Create subdirectories
    api_dir = os.path.join(output_dir, "api")
    cli_dir = os.path.join(output_dir, "cli")
    os.makedirs(api_dir, exist_ok=True)
    os.makedirs(cli_dir, exist_ok=True)
    
    logger.info(f"Starting API vs CLI comparison test on {input_dir}")
    comparison_results = {
        "input_dir": input_dir,
        "output_dir": output_dir,
        "api_output_dir": api_dir,
        "cli_output_dir": cli_dir,
        "start_time": datetime.now().isoformat(),
        "overall_success": False,
        "findings": [],
        "issues": [],
        "recommendations": []
    }
    
    try:
        # Option 1: Use the APIvsCLIComparison class from the CLI framework
        use_comparison_class = True
        
        if use_comparison_class:
            logger.info("Using APIvsCLIComparison class for comparison testing")
            
            # Initialize comparison framework
            comparison = APIvsCLIComparison(output_dir=output_dir)
            
            # Run the comparison
            results = comparison.run_comparison(input_dir)
            
            # Generate markdown report
            report_file = os.path.join(output_dir, "api_cli_comparison_report.md")
            comparison.generate_markdown_report(results, report_file)
            
            # Store main results
            comparison_results["comparison_class_results"] = results
            comparison_results["comparison_report_file"] = report_file
            
            # Extract key metrics from the results
            if 'api_results' in results and 'cli_results' in results:
                api_results = results['api_results']
                cli_results = results['cli_results']
                
                # Extract performance metrics
                if 'performance' in api_results and 'metrics' in api_results['performance']:
                    api_metrics = api_results['performance']['metrics']
                else:
                    api_metrics = {}
                
                if 'performance' in cli_results and 'metrics' in cli_results['performance']:
                    cli_metrics = cli_results['performance']['metrics']
                else:
                    cli_metrics = {}
                
                # Compare performance metrics
                comparison_results["performance_comparison"] = compare_performance_metrics(api_metrics, cli_metrics)
                
                # Get database paths
                api_db_path = os.path.join(api_dir, "api_test.sqlite")
                cli_db_path = os.path.join(cli_dir, "cli_test.sqlite")
                
                # Compare databases
                if os.path.exists(api_db_path) and os.path.exists(cli_db_path):
                    comparison_results["database_comparison"] = compare_databases(api_db_path, cli_db_path)
                
                # Get reconstruction directories
                api_recon_dir = os.path.join(api_dir, "reconstructed")
                cli_recon_dir = os.path.join(cli_dir, "reconstructed")
                
                # Compare file reconstructions
                if os.path.exists(api_recon_dir) and os.path.exists(cli_recon_dir):
                    comparison_results["file_comparison"] = compare_file_reconstructions(api_recon_dir, cli_recon_dir)
        
        else:
            # Option 2: Manual comparison using both frameworks
            logger.info("Running manual API vs CLI comparison testing")
            
            # Initialize API test framework
            api_test = MODMetaAPITest(output_dir=api_dir)
            api_test.setup()
            
            # Initialize CLI test framework
            cli_test = MODMetaCLITest(output_dir=cli_dir)
            
            # Step 1: Run API scan
            logger.info("Step 1: Running API scan")
            api_module_count, api_scan_duration = api_test.scan_directory(input_dir, recursive=True)
            
            # Step 2: Run CLI scan
            logger.info("Step 2: Running CLI scan")
            cli_module_count, cli_scan_duration = cli_test.scan_directory(input_dir, recursive=True)
            
            # Compare scan results
            comparison_results["scan_comparison"] = {
                "api_module_count": api_module_count,
                "cli_module_count": cli_module_count,
                "api_scan_duration": api_scan_duration,
                "cli_scan_duration": cli_scan_duration,
                "module_count_match": api_module_count == cli_module_count,
                "scan_speed_ratio": api_scan_duration / cli_scan_duration if cli_scan_duration > 0 else 0,
                "faster_scan": "API" if api_scan_duration < cli_scan_duration else "CLI"
            }
            
            # Step 3: Test database integrity for both
            logger.info("Step 3: Testing database integrity")
            api_db_integrity = test_database_integrity(api_test.db_path)
            cli_db_integrity = test_database_integrity(cli_test.db_path)
            
            # Step 4: Compare databases
            logger.info("Step 4: Comparing databases")
            comparison_results["database_comparison"] = compare_databases(api_test.db_path, cli_test.db_path)
            
            # Step 5: Run file reconstruction for both
            logger.info("Step 5: Reconstructing files")
            api_recon_dir = os.path.join(api_dir, "reconstructed")
            api_success_count, api_failure_count, api_recon_duration = api_test.reconstruct_files(api_recon_dir)
            
            cli_recon_dir = os.path.join(cli_dir, "reconstructed")
            cli_file_count, cli_recon_duration = cli_test.reconstruct_files(cli_recon_dir)
            
            # Step 6: Compare reconstructed files
            logger.info("Step 6: Comparing reconstructed files")
            comparison_results["file_comparison"] = compare_file_reconstructions(api_recon_dir, cli_recon_dir)
            
            # Step 7: Compare performance metrics
            logger.info("Step 7: Comparing performance metrics")
            comparison_results["performance_comparison"] = compare_performance_metrics(
                api_test.performance.metrics, 
                cli_test.performance.metrics
            )
        
        # Generate detailed report
        generate_detailed_comparison_report(comparison_results, DETAILED_REPORT)
        
        # Process findings and recommendations based on results
        
        # Database size findings
        db_comp = comparison_results.get('database_comparison', {})
        size_comp = db_comp.get('size_comparison', {})
        if 'larger' in size_comp and 'ratio' in size_comp:
            larger = size_comp['larger']
            ratio = size_comp['ratio']
            if ratio > 1.5:  # Significant difference
                comparison_results["findings"].append(
                    f"The {larger} database is {ratio:.2f}x larger than the other interface's database"
                )
                if larger == "CLI":
                    comparison_results["recommendations"].append(
                        "Investigate CLI database storage efficiency; consider adopting API storage optimizations"
                    )
                else:
                    comparison_results["recommendations"].append(
                        "Investigate API database storage efficiency; consider adopting CLI storage optimizations"
                    )
        
        # Performance findings
        perf_comp = comparison_results.get('performance_comparison', {})
        overall_perf = perf_comp.get('overall', {})
        if 'faster' in overall_perf and 'ratio' in overall_perf:
            faster = overall_perf['faster']
            ratio = overall_perf['ratio']
            if ratio > 1.5:  # Significant difference
                comparison_results["findings"].append(
                    f"The {faster} interface is {ratio:.2f}x faster overall than the other interface"
                )
                slower = "API" if faster == "CLI" else "CLI"
                comparison_results["recommendations"].append(
                    f"Optimize {slower} performance; investigate bottlenecks compared to {faster} implementation"
                )
        
        # Check if any operations have significant performance differences
        for op, details in perf_comp.get('operations', {}).items():
            if 'faster' in details and 'ratio' in details and details['ratio'] > 2.0:
                comparison_results["findings"].append(
                    f"Operation '{op}' is {details['ratio']:.2f}x faster in {details['faster']} than in {'API' if details['faster'] == 'CLI' else 'CLI'}"
                )
        
        # File reconstruction findings
        file_comp = comparison_results.get('file_comparison', {})
        if file_comp.get('success', True) == False and file_comp.get('different_files', 0) > 0:
            comparison_results["issues"].append(
                f"Found {file_comp.get('different_files', 0)} files with differences between API and CLI reconstruction"
            )
            comparison_results["recommendations"].append(
                "Investigate file reconstruction differences between API and CLI implementations to ensure consistency"
            )
        
        # Database structure findings
        table_comp = db_comp.get('table_comparison', {})
        schema_diff_tables = []
        for table, details in table_comp.items():
            if details.get("exists_in_api", False) and details.get("exists_in_cli", False) and not details.get("schema_match", True):
                schema_diff_tables.append(table)
        
        if schema_diff_tables:
            comparison_results["issues"].append(
                f"Schema differences found in tables: {', '.join(schema_diff_tables)}"
            )
            comparison_results["recommendations"].append(
                "Standardize database schema between API and CLI implementations"
            )
        
        # Overall Success Determination
        # Criteria: Database schema matches, file reconstructions are identical, no major issues
        db_success = db_comp.get('success', False)
        file_success = file_comp.get('success', False) 
        comparison_results["overall_success"] = db_success and file_success and len(comparison_results["issues"]) == 0
        
        comparison_results["end_time"] = datetime.now().isoformat()
        comparison_results["duration"] = (
            datetime.fromisoformat(comparison_results["end_time"]) - 
            datetime.fromisoformat(comparison_results["start_time"])
        ).total_seconds()
        
        # Save full results
        results_file = os.path.join(output_dir, "api_cli_comparison_results.json")
        with open(results_file, 'w') as f:
            # Convert any objects that aren't JSON serializable (like datetime.timedelta)
            json_results = {k: (str(v) if not isinstance(v, (dict, list, str, int, float, bool, type(None))) else v) 
                          for k, v in comparison_results.items()}
            json.dump(json_results, f, indent=2)
        
        logger.info(f"API vs CLI comparison test completed in {comparison_results['duration']:.2f} seconds")
        logger.info(f"Results saved to {results_file}")
        logger.info(f"Detailed report available at {DETAILED_REPORT}")
        
    except Exception as e:
        logger.error(f"API vs CLI comparison test failed: {e}")
        comparison_results["error"] = str(e)
        comparison_results["overall_success"] = False
    
    return comparison_results

def main():
    """Main entry point for the script."""
    parser = argparse.ArgumentParser(description="Run API vs CLI comparison test")
    parser.add_argument("input_dir", nargs="?", default=DEFAULT_TEST_DIR,
                        help=f"Directory to scan (default: {DEFAULT_TEST_DIR})")
    parser.add_argument("--output-dir", default=OUTPUT_DIR,
                        help=f"Output directory for test results (default: {OUTPUT_DIR})")
    args = parser.parse_args()
    
    run_api_cli_comparison(args.input_dir, args.output_dir)

if __name__ == "__main__":
    main() 
#!/usr/bin/env python
"""
MODMeta CLI Full Functionality Test

This script runs a comprehensive test of the MODMeta CLI functionality using the CLI test framework.
It tests all aspects of the CLI including scanning, querying, and file reconstruction.
"""

import os
import sys
import time
import json
import logging
import argparse
import hashlib
import subprocess
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

# Import CLI test framework
try:
    from project.frameworks.cli_framework import MODMetaCLITest
except ImportError as e:
    logger.error(f"Failed to import CLI test framework: {e}")
    sys.exit(1)

# Default test directory - update as needed
DEFAULT_TEST_DIR = os.path.join(root_dir, "tests", "test_data")
# Output directory for test results
OUTPUT_DIR = os.path.join(project_dir, "test_results", "cli")
# Detailed report file
DETAILED_REPORT = os.path.join(OUTPUT_DIR, "CLI_DETAILED_TEST_REPORT.md")

def calculate_file_hash(file_path: str) -> Optional[str]:
    """Calculate SHA-256 hash of a file."""
    try:
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()
    except Exception as e:
        logger.error(f"Error calculating hash for {file_path}: {e}")
        return None

def verify_files(source_dir: str, reconstructed_dir: str) -> Dict[str, Any]:
    """
    Verify reconstructed files match the originals.
    
    Args:
        source_dir: Original source directory
        reconstructed_dir: Directory with reconstructed files
        
    Returns:
        Dictionary with verification results
    """
    logger.info(f"Verifying reconstructed files against originals in {source_dir}")
    results = {
        "total_files": 0,
        "verified_files": 0,
        "failed_files": 0,
        "missing_files": 0,
        "file_details": []
    }
    
    # Get original files
    original_files = {}
    for root, _, files in os.walk(source_dir):
        for file in files:
            file_path = os.path.join(root, file)
            rel_path = os.path.relpath(file_path, source_dir)
            original_files[rel_path] = file_path
    
    results["total_files"] = len(original_files)
    
    # Check reconstructed files
    for rel_path, orig_path in original_files.items():
        recon_path = os.path.join(reconstructed_dir, os.path.basename(orig_path))
        
        file_result = {
            "original_path": orig_path,
            "reconstructed_path": recon_path,
            "status": "missing"
        }
        
        if os.path.exists(recon_path):
            orig_hash = calculate_file_hash(orig_path)
            recon_hash = calculate_file_hash(recon_path)
            
            if orig_hash and recon_hash and orig_hash == recon_hash:
                file_result["status"] = "verified"
                results["verified_files"] += 1
            else:
                file_result["status"] = "failed"
                file_result["original_hash"] = orig_hash
                file_result["reconstructed_hash"] = recon_hash
                results["failed_files"] += 1
        else:
            results["missing_files"] += 1
        
        results["file_details"].append(file_result)
    
    logger.info(f"File verification: {results['verified_files']} verified, "
                f"{results['failed_files']} failed, {results['missing_files']} missing")
    return results

def test_database_integrity(db_path: str) -> Dict[str, Any]:
    """
    Test database integrity and structure.
    
    Args:
        db_path: Path to the database file
        
    Returns:
        Dictionary with test results
    """
    results = {
        "success": False,
        "tables": {},
        "foreign_keys": True,
        "errors": []
    }
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check foreign key integrity
        cursor.execute("PRAGMA foreign_key_check")
        fk_violations = cursor.fetchall()
        if fk_violations:
            results["foreign_keys"] = False
            results["errors"].append(f"Foreign key violations found: {fk_violations}")
        
        # Get all tables and their row counts
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()
        
        for table in tables:
            table_name = table[0]
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            count = cursor.fetchone()[0]
            results["tables"][table_name] = count
        
        conn.close()
        results["success"] = True
        logger.info(f"Database integrity check completed successfully")
        
    except Exception as e:
        results["errors"].append(str(e))
        logger.error(f"Database integrity check failed: {e}")
    
    return results

def test_cli_command_syntax() -> Dict[str, Any]:
    """
    Test various CLI command syntax combinations to ensure robustness.
    
    Returns:
        Dictionary with test results
    """
    results = {
        "commands_tested": 0,
        "commands_succeeded": 0,
        "commands_failed": 0,
        "details": []
    }
    
    # Test command variants
    command_tests = [
        {
            "name": "help command",
            "cmd": [sys.executable, "-m", "modmeta.cli", "--help"],
            "expected_return_code": 0,
            "expected_output_contains": ["usage", "commands"],
        },
        {
            "name": "scan help",
            "cmd": [sys.executable, "-m", "modmeta.cli", "scan", "--help"],
            "expected_return_code": 0,
            "expected_output_contains": ["--recursive", "--with-raw"],
        },
        {
            "name": "list help",
            "cmd": [sys.executable, "-m", "modmeta.cli", "list", "--help"],
            "expected_return_code": 0,
            "expected_output_contains": ["--db", "--json"],
        },
        {
            "name": "invalid command",
            "cmd": [sys.executable, "-m", "modmeta.cli", "invalid_command"],
            "expected_return_code": 2,
            "expected_output_contains": ["error", "usage"],
        },
        {
            "name": "invalid arguments",
            "cmd": [sys.executable, "-m", "modmeta.cli", "scan", "--invalid-arg"],
            "expected_return_code": 2,
            "expected_output_contains": ["error", "scan"],
        }
    ]
    
    for test in command_tests:
        results["commands_tested"] += 1
        
        logger.info(f"Testing CLI command: {test['name']}")
        try:
            process = subprocess.run(
                test["cmd"],
                capture_output=True,
                text=True,
                check=False
            )
            
            # Combine stdout and stderr for easier checking
            output = process.stdout + process.stderr
            
            # Check return code
            return_code_match = process.returncode == test["expected_return_code"]
            
            # Check for expected output
            output_match = all(text.lower() in output.lower() for text in test["expected_output_contains"])
            
            test_result = {
                "name": test["name"],
                "command": " ".join(test["cmd"]),
                "return_code": process.returncode,
                "return_code_match": return_code_match,
                "output_match": output_match,
                "success": return_code_match and output_match
            }
            
            if test_result["success"]:
                results["commands_succeeded"] += 1
            else:
                results["commands_failed"] += 1
            
            results["details"].append(test_result)
            
        except Exception as e:
            logger.error(f"Error testing command {test['name']}: {e}")
            results["commands_failed"] += 1
            results["details"].append({
                "name": test["name"],
                "command": " ".join(test["cmd"]),
                "error": str(e),
                "success": False
            })
    
    logger.info(f"Command syntax tests: {results['commands_succeeded']} succeeded, "
                f"{results['commands_failed']} failed")
    return results

def test_cli_xml_and_lk_modules(cli_test: MODMetaCLITest) -> Dict[str, Any]:
    """
    Test handling of XML and LK modules specifically using CLI commands.
    
    Args:
        cli_test: Initialized CLI test framework instance
        
    Returns:
        Dictionary with test results
    """
    results = {
        "success": False,
        "xml_modules": 0,
        "lk_modules": 0,
        "total_found": 0
    }
    
    try:
        # Use CLI framework to run the list command with extensions filter
        cmd = [
            sys.executable,
            "-m", "modmeta.cli",
            "list",
            "--db", cli_test.db_path,
            "--extensions", ".xml", ".lk"
        ]
        
        returncode, stdout, stderr, _ = cli_test._run_command(cmd, "list_xml_lk")
        
        if returncode != 0:
            results["error"] = f"Command failed with return code {returncode}: {stderr}"
            return results
        
        # Count XML and LK files from output
        for line in stdout.splitlines():
            if ".xml" in line.lower():
                results["xml_modules"] += 1
            elif ".lk" in line.lower():
                results["lk_modules"] += 1
        
        results["total_found"] = results["xml_modules"] + results["lk_modules"]
        results["success"] = True
        logger.info(f"Found {results['xml_modules']} XML modules and {results['lk_modules']} LK modules")
        
    except Exception as e:
        results["error"] = str(e)
        logger.error(f"XML and LK module test failed: {e}")
    
    return results

def test_cli_filtering_commands(cli_test: MODMetaCLITest) -> Dict[str, Any]:
    """
    Test CLI filtering and query commands.
    
    Args:
        cli_test: Initialized CLI test framework instance
        
    Returns:
        Dictionary with test results
    """
    results = {
        "success": False,
        "filter_tests": []
    }
    
    filter_tests = [
        {
            "name": "filter by extension",
            "cmd": [
                sys.executable, "-m", "modmeta.cli", "list",
                "--db", cli_test.db_path,
                "--extensions", ".xml"
            ],
        },
        {
            "name": "count only",
            "cmd": [
                sys.executable, "-m", "modmeta.cli", "list",
                "--db", cli_test.db_path,
                "--count-only"
            ],
        },
        {
            "name": "limit results",
            "cmd": [
                sys.executable, "-m", "modmeta.cli", "list",
                "--db", cli_test.db_path,
                "--limit", "5"
            ],
        }
    ]
    
    for test in filter_tests:
        try:
            returncode, stdout, stderr, duration = cli_test._run_command(test["cmd"], f"filter_{test['name']}")
            
            test_result = {
                "name": test["name"],
                "command": " ".join(test["cmd"]),
                "return_code": returncode,
                "duration": duration,
                "success": returncode == 0,
                "output_lines": len(stdout.splitlines())
            }
            
            if test["name"] == "limit results" and test_result["success"]:
                # Check that results are limited
                test_result["limit_respected"] = test_result["output_lines"] <= 7  # Header + 5 results + maybe footer
            
            results["filter_tests"].append(test_result)
            
        except Exception as e:
            logger.error(f"Error in filter test {test['name']}: {e}")
            results["filter_tests"].append({
                "name": test["name"],
                "command": " ".join(test["cmd"]),
                "error": str(e),
                "success": False
            })
    
    # Check if all tests succeeded
    results["success"] = all(test["success"] for test in results["filter_tests"])
    
    logger.info(f"Filter command tests completed: {sum(1 for t in results['filter_tests'] if t['success'])} succeeded, "
                f"{sum(1 for t in results['filter_tests'] if not t['success'])} failed")
    return results

def generate_detailed_report(all_results: Dict[str, Any], output_file: str) -> None:
    """
    Generate a detailed Markdown report of all test results.
    
    Args:
        all_results: Results from all tests
        output_file: Output file path
    """
    try:
        with open(output_file, 'w') as f:
            f.write("# Detailed CLI Test Report\n\n")
            f.write(f"Test performed on: {datetime.now().strftime('%Y-%m-%d')}\n\n")
            
            # Test directory
            f.write(f"Test directory: {all_results.get('input_dir', 'Unknown')}\n\n")
            
            # Command Execution Details
            f.write("## Command Execution Details\n\n")
            for step_name, step_data in all_results.items():
                if step_name.startswith("step_") and isinstance(step_data, dict) and "command" in step_data:
                    cmd = step_data.get("command", "")
                    status = "Completed successfully" if step_data.get("success", False) else "Failed"
                    returncode = step_data.get("returncode", "Unknown")
                    
                    f.write(f"### {step_data.get('description', step_name)}\n\n")
                    f.write("```\n")
                    f.write(cmd + "\n")
                    f.write("```\n\n")
                    
                    f.write(f"**Status**: {status} (returncode: {returncode})\n\n")
                    
                    if "stdout" in step_data and step_data["stdout"]:
                        f.write("**Stdout**:\n")
                        f.write("```\n")
                        f.write(step_data["stdout"][:1000])  # Limit to first 1000 chars
                        if len(step_data["stdout"]) > 1000:
                            f.write("\n... (output truncated) ...")
                        f.write("\n```\n\n")
                    
                    if "stderr" in step_data and step_data["stderr"]:
                        f.write("**Stderr**:\n")
                        f.write("```\n")
                        f.write(step_data["stderr"][:1000])  # Limit to first 1000 chars
                        if len(step_data["stderr"]) > 1000:
                            f.write("\n... (output truncated) ...")
                        f.write("\n```\n\n")
            
            # Performance Summary
            f.write("## Performance Summary\n\n")
            perf = all_results.get('performance', {}).get('metrics', {})
            if perf:
                f.write(f"Total test duration: {perf.get('total_duration', 0):.2f} seconds\n\n")
                
                f.write("| Operation | Count | Duration (s) | Rate |\n")
                f.write("|-----------|-------|-------------|------|\n")
                
                for op_name, op_metrics in perf.get('operations', {}).items():
                    count = op_metrics.get('count', 0)
                    duration = op_metrics.get('total_duration', 0)
                    rate = ""
                    if 'data_rate' in op_metrics and op_metrics['data_rate'] > 0:
                        rate = f"{op_metrics['data_rate']:.2f} bytes/sec"
                    
                    f.write(f"| {op_name} | {count} | {duration:.2f} | {rate} |\n")
                
                f.write("\n")
            
            # Database details
            f.write("## Database Statistics\n\n")
            db_stats = all_results.get('database_integrity', {}).get('tables', {})
            if db_stats:
                f.write("| Table Name | Count |\n")
                f.write("|------------|-------|\n")
                
                for table, count in db_stats.items():
                    f.write(f"| {table} | {count} |\n")
                
                f.write("\n")
            
            # File verification results
            f.write("## File Reconstruction Results\n\n")
            file_results = all_results.get('file_verification', {})
            if file_results:
                f.write(f"Total files: {file_results.get('total_files', 0)}\n")
                f.write(f"Verified files: {file_results.get('verified_files', 0)}\n")
                f.write(f"Failed files: {file_results.get('failed_files', 0)}\n")
                f.write(f"Missing files: {file_results.get('missing_files', 0)}\n\n")
                
                if file_results.get('failed_files', 0) > 0:
                    f.write("### Failed Files\n\n")
                    for file_detail in file_results.get('file_details', []):
                        if file_detail.get('status') == 'failed':
                            f.write(f"- {file_detail.get('original_path')}\n")
                            f.write(f"  - Original hash: {file_detail.get('original_hash')}\n")
                            f.write(f"  - Reconstructed hash: {file_detail.get('reconstructed_hash')}\n\n")
            
            # Command syntax test results
            f.write("## Command Syntax Test Results\n\n")
            cmd_syntax = all_results.get('command_syntax', {})
            if cmd_syntax:
                f.write(f"Commands tested: {cmd_syntax.get('commands_tested', 0)}\n")
                f.write(f"Commands succeeded: {cmd_syntax.get('commands_succeeded', 0)}\n")
                f.write(f"Commands failed: {cmd_syntax.get('commands_failed', 0)}\n\n")
                
                if 'details' in cmd_syntax and cmd_syntax['details']:
                    f.write("| Command | Return Code | Success |\n")
                    f.write("|---------|-------------|--------|\n")
                    
                    for detail in cmd_syntax['details']:
                        cmd = detail.get('command', '')
                        if len(cmd) > 50:
                            cmd = cmd[:47] + "..."
                        
                        f.write(f"| {cmd} | {detail.get('return_code', 'N/A')} | {detail.get('success', False)} |\n")
                
                f.write("\n")
            
            # XML and LK module results
            f.write("## XML and LK Module Results\n\n")
            xml_lk_results = all_results.get('xml_lk_test', {})
            if xml_lk_results:
                f.write(f"XML modules found: {xml_lk_results.get('xml_modules', 0)}\n")
                f.write(f"LK modules found: {xml_lk_results.get('lk_modules', 0)}\n")
                f.write(f"Total special modules: {xml_lk_results.get('total_found', 0)}\n\n")
            
            # Filter command test results
            f.write("## Filter Command Test Results\n\n")
            filter_results = all_results.get('filter_commands', {})
            if filter_results and 'filter_tests' in filter_results:
                f.write("| Filter Test | Success | Duration (s) | Output Lines |\n")
                f.write("|------------|---------|--------------|-------------|\n")
                
                for test in filter_results['filter_tests']:
                    name = test.get('name', 'Unknown')
                    success = test.get('success', False)
                    duration = test.get('duration', 0)
                    output_lines = test.get('output_lines', 0)
                    
                    f.write(f"| {name} | {success} | {duration:.2f} | {output_lines} |\n")
                
                f.write("\n")
            
            # Error Analysis section
            errors = []
            for test_name, test_results in all_results.items():
                if isinstance(test_results, dict):
                    if 'error' in test_results:
                        errors.append(f"{test_name}: {test_results['error']}")
                    elif 'errors' in test_results and isinstance(test_results['errors'], list):
                        for error in test_results['errors']:
                            errors.append(f"{test_name}: {error}")
            
            if errors:
                f.write("## Error Analysis\n\n")
                for i, error in enumerate(errors, 1):
                    f.write(f"{i}. **{error.split(':', 1)[0]}**:\n")
                    error_details = error.split(':', 1)[1] if ':' in error else error
                    f.write(f"   - {error_details.strip()}\n\n")
            
            logger.info(f"Detailed report generated at {output_file}")
            
    except Exception as e:
        logger.error(f"Failed to generate detailed report: {e}")

def run_full_cli_test(input_dir: str, output_dir: str = OUTPUT_DIR) -> Dict[str, Any]:
    """
    Run a full test of the CLI functionality.
    
    Args:
        input_dir: Directory to scan
        output_dir: Directory for test output
        
    Returns:
        Dictionary with all test results
    """
    os.makedirs(output_dir, exist_ok=True)
    
    logger.info(f"Starting full CLI test on {input_dir}")
    all_results = {
        "input_dir": input_dir,
        "output_dir": output_dir,
        "start_time": datetime.now().isoformat(),
        "success": False
    }
    
    try:
        # Initialize CLI test framework
        cli_test = MODMetaCLITest(output_dir=os.path.join(output_dir, "cli_output"))
        
        # Step 1: Test CLI command syntax
        logger.info("Step 1: Testing CLI command syntax")
        all_results["command_syntax"] = test_cli_command_syntax()
        
        # Step 2: Scan directory
        logger.info("Step 2: Scanning directory")
        module_count, scan_duration = cli_test.scan_directory(input_dir, recursive=True)
        all_results["scan"] = {
            "module_count": module_count,
            "duration": scan_duration
        }
        
        # Record the scan command details
        cmd = [
            sys.executable,
            "-m", "modmeta.cli",
            "scan",
            input_dir,
            "--output", cli_test.db_path,
            "--with-raw",
            "--verbose",
            "--recursive"
        ]
        process = subprocess.run(cmd, capture_output=True, text=True)
        all_results["step_scan"] = {
            "description": "Scan Module Directory",
            "command": " ".join(cmd),
            "returncode": process.returncode,
            "stdout": process.stdout,
            "stderr": process.stderr,
            "success": process.returncode == 0
        }
        
        # Step 3: Database integrity test
        logger.info("Step 3: Testing database integrity")
        all_results["database_integrity"] = test_database_integrity(cli_test.db_path)
        
        # Step 4: Test listing modules
        logger.info("Step 4: Testing module listing")
        modules, list_duration = cli_test.list_modules()
        all_results["list_modules"] = {
            "module_count": len(modules),
            "duration": list_duration
        }
        
        # Record the list command details
        cmd = [
            sys.executable,
            "-m", "modmeta.cli",
            "list",
            "--db", cli_test.db_path
        ]
        process = subprocess.run(cmd, capture_output=True, text=True)
        all_results["step_list"] = {
            "description": "List Modules",
            "command": " ".join(cmd),
            "returncode": process.returncode,
            "stdout": process.stdout,
            "stderr": process.stderr,
            "success": process.returncode == 0
        }
        
        # Step 5: Reconstruct files
        logger.info("Step 5: Reconstructing files")
        reconstruct_dir = os.path.join(output_dir, "reconstructed")
        file_count, recon_duration = cli_test.reconstruct_files(reconstruct_dir)
        all_results["reconstruction"] = {
            "file_count": file_count,
            "duration": recon_duration
        }
        
        # Record the reconstruct command details
        cmd = [
            sys.executable,
            "-m", "modmeta.cli",
            "reconstruct",
            "--db", cli_test.db_path,
            "--output-dir", reconstruct_dir,
            "--all"
        ]
        process = subprocess.run(cmd, capture_output=True, text=True)
        all_results["step_reconstruct"] = {
            "description": "Reconstruct Files",
            "command": " ".join(cmd),
            "returncode": process.returncode,
            "stdout": process.stdout,
            "stderr": process.stderr,
            "success": process.returncode == 0
        }
        
        # Step 6: Verify file reconstruction
        logger.info("Step 6: Verifying reconstructed files")
        all_results["file_verification"] = verify_files(input_dir, reconstruct_dir)
        
        # Step 7: Test XML and LK modules specifically
        logger.info("Step 7: Testing XML and LK modules")
        all_results["xml_lk_test"] = test_cli_xml_and_lk_modules(cli_test)
        
        # Step 8: Test filtering commands
        logger.info("Step 8: Testing filtering commands")
        all_results["filter_commands"] = test_cli_filtering_commands(cli_test)
        
        # Save performance metrics
        metrics_file = os.path.join(output_dir, "cli_performance_metrics.json")
        cli_test.performance.save_metrics(metrics_file)
        all_results["performance"] = {
            "metrics_file": metrics_file,
            "metrics": cli_test.performance.metrics
        }
        
        # Generate CLI report
        report_file = os.path.join(output_dir, "cli_test_report.md")
        cli_test.generate_report(report_file)
        all_results["cli_report_file"] = report_file
        
        # Generate detailed report
        generate_detailed_report(all_results, DETAILED_REPORT)
        
        all_results["success"] = True
        all_results["end_time"] = datetime.now().isoformat()
        
        # Save full results
        results_file = os.path.join(output_dir, "full_cli_test_results.json")
        with open(results_file, 'w') as f:
            json.dump(all_results, f, indent=2)
        
        logger.info(f"Full CLI test completed successfully, results saved to {results_file}")
        logger.info(f"Detailed report available at {DETAILED_REPORT}")
        
    except Exception as e:
        logger.error(f"Full CLI test failed: {e}")
        all_results["error"] = str(e)
        all_results["success"] = False
    
    return all_results

def main():
    """Main entry point for the script."""
    parser = argparse.ArgumentParser(description="Run a full CLI functionality test")
    parser.add_argument("input_dir", nargs="?", default=DEFAULT_TEST_DIR,
                        help=f"Directory to scan (default: {DEFAULT_TEST_DIR})")
    parser.add_argument("--output-dir", default=OUTPUT_DIR,
                        help=f"Output directory for test results (default: {OUTPUT_DIR})")
    args = parser.parse_args()
    
    run_full_cli_test(args.input_dir, args.output_dir)

if __name__ == "__main__":
    main() 
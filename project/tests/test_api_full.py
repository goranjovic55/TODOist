#!/usr/bin/env python
"""
MODMeta API Full Functionality Test

This script runs a comprehensive test of the MODMeta API functionality using the API test framework.
It tests all aspects of the API including scanning, querying, and file reconstruction.
"""

import os
import sys
import time
import json
import logging
import argparse
import hashlib
import sqlite3
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any, Optional

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

# Import API test framework
try:
    from project.frameworks.api_framework import MODMetaAPITest
except ImportError as e:
    logger.error(f"Failed to import API test framework: {e}")
    sys.exit(1)

# Default test directory - update as needed
DEFAULT_TEST_DIR = os.path.join(root_dir, "tests", "test_data")
# Output directory for test results
OUTPUT_DIR = os.path.join(project_dir, "test_results", "api")
# Detailed report file
DETAILED_REPORT = os.path.join(OUTPUT_DIR, "API_DETAILED_TEST_REPORT.md")

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

def test_xml_and_lk_modules(api_test: MODMetaAPITest) -> Dict[str, Any]:
    """
    Test handling of XML and LK modules specifically.
    
    Args:
        api_test: Initialized API test framework instance
        
    Returns:
        Dictionary with test results
    """
    results = {
        "success": False,
        "xml_modules": 0,
        "lk_modules": 0,
        "xml_with_content": 0,
        "lk_with_content": 0
    }
    
    try:
        # Get all modules
        modules, _ = api_test.get_all_modules()
        
        # Filter for XML and LK modules
        for module in modules:
            if module.source_file:
                ext = os.path.splitext(module.source_file)[1].lower()
                if ext == '.xml':
                    results["xml_modules"] += 1
                    if hasattr(module, 'raw_content') and module.raw_content:
                        results["xml_with_content"] += 1
                elif ext == '.lk':
                    results["lk_modules"] += 1
                    if hasattr(module, 'raw_content') and module.raw_content:
                        results["lk_with_content"] += 1
        
        results["success"] = True
        logger.info(f"Found {results['xml_modules']} XML modules and {results['lk_modules']} LK modules")
        
    except Exception as e:
        results["error"] = str(e)
        logger.error(f"XML and LK module test failed: {e}")
    
    return results

def test_block_parsing(api_test: MODMetaAPITest) -> Dict[str, Any]:
    """
    Test block parsing functionality.
    
    Args:
        api_test: Initialized API test framework instance
        
    Returns:
        Dictionary with test results
    """
    results = {
        "success": False,
        "total_modules": 0,
        "modules_with_metadata": 0,
        "modules_with_parameters": 0,
        "total_metadata": 0,
        "total_parameters": 0
    }
    
    try:
        # Get all modules
        modules, _ = api_test.get_all_modules()
        results["total_modules"] = len(modules)
        
        # Check for metadata and parameters
        for module in modules:
            has_metadata = hasattr(module, 'metadata') and module.metadata
            has_parameters = hasattr(module, 'parameters') and module.parameters
            
            if has_metadata:
                results["modules_with_metadata"] += 1
                results["total_metadata"] += len(module.metadata)
            
            if has_parameters:
                results["modules_with_parameters"] += 1
                results["total_parameters"] += len(module.parameters)
        
        results["success"] = True
        logger.info(f"Block parsing test completed: {results['modules_with_metadata']} modules with metadata, "
                    f"{results['modules_with_parameters']} with parameters")
        
    except Exception as e:
        results["error"] = str(e)
        logger.error(f"Block parsing test failed: {e}")
    
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
            f.write("# Detailed API Test Report\n\n")
            f.write(f"Test performed on: {datetime.now().strftime('%Y-%m-%d')}\n\n")
            
            # Test directory
            f.write(f"Test directory: {all_results.get('input_dir', 'Unknown')}\n\n")
            
            # Summary of performance
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
            
            # Block parsing results
            f.write("## Block Parsing Results\n\n")
            block_results = all_results.get('block_parsing', {})
            if block_results:
                f.write(f"Total modules: {block_results.get('total_modules', 0)}\n")
                f.write(f"Modules with metadata: {block_results.get('modules_with_metadata', 0)}\n")
                f.write(f"Modules with parameters: {block_results.get('modules_with_parameters', 0)}\n")
                f.write(f"Total metadata entries: {block_results.get('total_metadata', 0)}\n")
                f.write(f"Total parameters: {block_results.get('total_parameters', 0)}\n\n")
            
            # XML and LK module results
            f.write("## XML and LK Module Results\n\n")
            xml_lk_results = all_results.get('xml_lk_test', {})
            if xml_lk_results:
                f.write(f"XML modules found: {xml_lk_results.get('xml_modules', 0)}\n")
                f.write(f"XML modules with content: {xml_lk_results.get('xml_with_content', 0)}\n")
                f.write(f"LK modules found: {xml_lk_results.get('lk_modules', 0)}\n")
                f.write(f"LK modules with content: {xml_lk_results.get('lk_with_content', 0)}\n\n")
            
            # Errors and warnings
            all_errors = []
            for test_name, test_results in all_results.items():
                if isinstance(test_results, dict) and 'errors' in test_results:
                    for error in test_results['errors']:
                        all_errors.append(f"{test_name}: {error}")
            
            if all_errors:
                f.write("## Errors and Warnings\n\n")
                for error in all_errors:
                    f.write(f"- {error}\n")
            
            logger.info(f"Detailed report generated at {output_file}")
            
    except Exception as e:
        logger.error(f"Failed to generate detailed report: {e}")

def run_full_api_test(input_dir: str, output_dir: str = OUTPUT_DIR) -> Dict[str, Any]:
    """
    Run a full test of the API functionality.
    
    Args:
        input_dir: Directory to scan
        output_dir: Directory for test output
        
    Returns:
        Dictionary with all test results
    """
    os.makedirs(output_dir, exist_ok=True)
    
    logger.info(f"Starting full API test on {input_dir}")
    all_results = {
        "input_dir": input_dir,
        "output_dir": output_dir,
        "start_time": datetime.now().isoformat(),
        "success": False
    }
    
    try:
        # Initialize API test framework
        api_test = MODMetaAPITest(output_dir=os.path.join(output_dir, "api_output"))
        api_test.setup()
        
        # Step 1: Scan directory
        logger.info("Step 1: Scanning directory")
        module_count, scan_duration = api_test.scan_directory(input_dir, recursive=True)
        all_results["scan"] = {
            "module_count": module_count,
            "duration": scan_duration
        }
        
        # Step 2: Database integrity test
        logger.info("Step 2: Testing database integrity")
        all_results["database_integrity"] = test_database_integrity(api_test.db_path)
        
        # Step 3: Reconstruct files
        logger.info("Step 3: Reconstructing files")
        reconstruct_dir = os.path.join(output_dir, "reconstructed")
        success_count, failure_count, recon_duration = api_test.reconstruct_files(reconstruct_dir)
        all_results["reconstruction"] = {
            "success_count": success_count,
            "failure_count": failure_count,
            "duration": recon_duration
        }
        
        # Step 4: Verify file reconstruction
        logger.info("Step 4: Verifying reconstructed files")
        all_results["file_verification"] = verify_files(input_dir, reconstruct_dir)
        
        # Step 5: Test block parsing
        logger.info("Step 5: Testing block parsing")
        all_results["block_parsing"] = test_block_parsing(api_test)
        
        # Step 6: Test XML and LK modules specifically
        logger.info("Step 6: Testing XML and LK modules")
        all_results["xml_lk_test"] = test_xml_and_lk_modules(api_test)
        
        # Save performance metrics
        metrics_file = os.path.join(output_dir, "api_performance_metrics.json")
        api_test.performance.save_metrics(metrics_file)
        all_results["performance"] = {
            "metrics_file": metrics_file,
            "metrics": api_test.performance.metrics
        }
        
        # Generate API report
        report_file = os.path.join(output_dir, "api_test_report.md")
        api_test.generate_report(report_file)
        all_results["api_report_file"] = report_file
        
        # Generate detailed report
        generate_detailed_report(all_results, DETAILED_REPORT)
        
        all_results["success"] = True
        all_results["end_time"] = datetime.now().isoformat()
        
        # Save full results
        results_file = os.path.join(output_dir, "full_api_test_results.json")
        with open(results_file, 'w') as f:
            json.dump(all_results, f, indent=2)
        
        logger.info(f"Full API test completed successfully, results saved to {results_file}")
        logger.info(f"Detailed report available at {DETAILED_REPORT}")
        
    except Exception as e:
        logger.error(f"Full API test failed: {e}")
        all_results["error"] = str(e)
        all_results["success"] = False
    
    return all_results

def main():
    """Main entry point for the script."""
    parser = argparse.ArgumentParser(description="Run a full API functionality test")
    parser.add_argument("input_dir", nargs="?", default=DEFAULT_TEST_DIR,
                        help=f"Directory to scan (default: {DEFAULT_TEST_DIR})")
    parser.add_argument("--output-dir", default=OUTPUT_DIR,
                        help=f"Output directory for test results (default: {OUTPUT_DIR})")
    args = parser.parse_args()
    
    run_full_api_test(args.input_dir, args.output_dir)

if __name__ == "__main__":
    main() 
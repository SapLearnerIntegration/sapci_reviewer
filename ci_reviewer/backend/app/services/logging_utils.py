#!/usr/bin/env python
"""
Logging utilities for SAP Integration Reviewer.

This module provides functions and classes to set up logging and capture
all stdout/stderr output to log files.
"""

import sys
import os
import logging
from datetime import datetime
import contextlib

# Configure logging setup
def setup_logging(log_directory="./logs"):
    """
    Set up logging to capture all console output to both console and a log file.
    
    Args:
        log_directory: Directory where log files will be stored
    
    Returns:
        log_file_path: Path to the created log file
    """
    # Create logs directory if it doesn't exist
    if not os.path.exists(log_directory):
        os.makedirs(log_directory)
    
    # Create timestamped log filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_filename = f"sap_integration_review_{timestamp}.log"
    log_file_path = os.path.join(log_directory, log_filename)
    
    # Configure the root logger
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file_path),
            logging.StreamHandler(sys.stdout)  # Also output to console
        ]
    )
    
    # Create a logger
    logger = logging.getLogger()
    
    # Log startup information
    logger.info(f"Starting SAP Integration Reviewer")
    logger.info(f"Log file created at: {log_file_path}")
    
    # Return the path for reference
    return log_file_path

# Custom stream to capture stdout/stderr and log it
class LoggerWriter:
    def __init__(self, level):
        self.level = level
        self.logger = logging.getLogger()
        self.buf = ""

    def write(self, message):
        if message and not message.isspace():
            # If there's a newline in the message, log the complete line
            if '\n' in message:
                self.buf += message
                self.flush()
            else:
                self.buf += message
        
        # Make sure we still print to the original stdout for interactive use
        if hasattr(self, 'original_stream'):
            self.original_stream.write(message)
    
    def flush(self):
        if self.buf:
            self.logger.log(self.level, self.buf.rstrip())
            self.buf = ""
            
        # Flush the original stream too
        if hasattr(self, 'original_stream'):
            self.original_stream.flush()

# Context manager to capture all output to log
@contextlib.contextmanager
def capture_all_output(log_file_path):
    """
    Context manager to capture all stdout and stderr to the log file.
    
    Args:
        log_file_path: Path to the log file
    """
    # Save original stdout/stderr
    old_stdout = sys.stdout
    old_stderr = sys.stderr
    
    # Create logger writers
    stdout_logger = LoggerWriter(logging.INFO)
    stderr_logger = LoggerWriter(logging.ERROR)
    
    # Store original streams for pass-through
    stdout_logger.original_stream = old_stdout
    stderr_logger.original_stream = old_stderr
    
    try:
        # Redirect stdout/stderr to our loggers
        sys.stdout = stdout_logger
        sys.stderr = stderr_logger
        
        print(f"All output now being captured to: {log_file_path}")
        
        # Return control to the calling code
        yield
    finally:
        # Restore original stdout/stderr
        sys.stdout = old_stdout
        sys.stderr = old_stderr
        
        print(f"Output capture completed. Log saved to: {log_file_path}")

# Function to log a section header for better log organization
def log_section(title, level=logging.INFO):
    """
    Log a section header to make the log file more readable.
    
    Args:
        title: The section title
        level: Logging level to use
    """
    logger = logging.getLogger()
    separator = "=" * 80
    logger.log(level, separator)
    logger.log(level, f" {title.upper()} ")
    logger.log(level, separator)

# Function to log a subsection header
def log_subsection(title, level=logging.INFO):
    """
    Log a subsection header to make the log file more readable.
    
    Args:
        title: The subsection title
        level: Logging level to use
    """
    logger = logging.getLogger()
    separator = "-" * 60
    logger.log(level, separator)
    logger.log(level, f" {title} ")
    logger.log(level, separator)

# Create a function to dump dictionary/object content to the log
def log_object(obj, name="Object", level=logging.DEBUG):
    """
    Log the contents of an object in a readable format.
    
    Args:
        obj: The object to log
        name: Name to identify the object in the log
        level: Logging level to use
    """
    logger = logging.getLogger()
    
    try:
        if isinstance(obj, (dict, list, tuple, set)):
            # Convert to formatted JSON
            formatted_obj = json.dumps(obj, indent=2, default=str)
            logger.log(level, f"{name}:\n{formatted_obj}")
        else:
            # For other objects, try to convert to string
            logger.log(level, f"{name}: {str(obj)}")
    except Exception as e:
        logger.log(level, f"Error logging {name}: {str(e)}")

# Example usage
if __name__ == "__main__":
    # Test the logging utilities
    log_file = setup_logging()
    
    with capture_all_output(log_file):
        log_section("Test Section")
        print("This is a test message that will be logged")
        
        log_subsection("Test Subsection")
        print("This is a test subsection message")
        
        # Test error logging
        try:
            1/0
        except Exception as e:
            logging.error(f"Test error: {str(e)}")
        
        # Test object logging
        test_obj = {
            "name": "Test Object",
            "properties": {
                "prop1": "value1",
                "prop2": 123
            },
            "list": [1, 2, 3]
        }
        log_object(test_obj, "Test Object")
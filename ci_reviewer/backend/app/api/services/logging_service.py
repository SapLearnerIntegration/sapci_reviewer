"""
Logging Service for SAP Integration API
"""

import os
import sys
import logging
from logging.handlers import RotatingFileHandler
from datetime import datetime


class LoggingService:
    """Service for managing application logging"""
    
    def __init__(self, logs_dir: str = "logs"):
        self.logs_dir = logs_dir
        self.log_file = None
    
    def setup_logging(self, level: int = logging.DEBUG) -> str:
        """
        Set up logging configuration
        
        Args:
            level: Logging level
            
        Returns:
            Path to the log file
        """
        # Create logs directory if needed
        if not os.path.exists(self.logs_dir):
            os.makedirs(self.logs_dir)

        # Set up file logger
        log_file = os.path.join(self.logs_dir, "sap_integration.log")
        file_handler = RotatingFileHandler(
            log_file, 
            maxBytes=10*1024*1024, 
            backupCount=5
        )
        file_handler.setFormatter(
            logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
        )

        # Configure console logging
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(
            logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
        )

        # Root logger config
        logging.basicConfig(
            level=level,
            handlers=[file_handler, console_handler],
            force=True
        )
        
        self.log_file = log_file
        logging.info("Logging service initialized")
        return log_file
    
    def get_log_file_path(self) -> str:
        """Get the current log file path"""
        return self.log_file or "No log file configured"
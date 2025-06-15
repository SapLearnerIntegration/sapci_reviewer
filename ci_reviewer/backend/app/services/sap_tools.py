"""
Enhanced SAPConnection class with additional debugging and diagnostics
for troubleshooting package and IFlow extraction issues.
"""

import os
import json
import base64
import logging
import requests
import tempfile
import shutil
import zipfile
import tarfile
from datetime import datetime
import traceback
import xml.etree.ElementTree as ET
import re
import uuid
from typing import Dict, List, Set, Tuple
from dotenv import load_dotenv

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

def ensure_dir(path: str):
    """
    Ensure that a directory exists, creating it if necessary.
    Logs the operation for debugging purposes.
    
    Args:
        path (str): The directory path to ensure exists
        
    Returns:
        bool: True if directory exists or was created, False otherwise
    """
    try:
        if not os.path.exists(path):
            logging.debug(f"Creating missing directory: {path}")
            os.makedirs(path, exist_ok=True)
            
        # Verify the directory was actually created
        if not os.path.exists(path):
            logging.error(f"Failed to create directory: {path}")
            return False
            
        # Verify write permissions by creating a test file
        test_file_path = os.path.join(path, ".test_write_permission")
        try:
            with open(test_file_path, 'w') as f:
                f.write("test")
            os.remove(test_file_path)
        except Exception as e:
            logging.error(f"Directory exists but is not writable: {path} - {str(e)}")
            return False
            
        logging.debug(f"Directory exists and is writable: {path}")
        return True
    except Exception as e:
        logging.error(f"Error ensuring directory exists: {path} - {str(e)}")
        return False

# Default path for storing extracted packages - using absolute path
DEFAULT_LOCAL_STORAGE_PATH = os.path.abspath(os.path.join(".", "housekeeping", "extracted_packages"))
IFLOWS_RESPONSE_PATH = os.path.abspath(os.path.join(".", "housekeeping", "iflows_response" ))
iflows_response_file = os.path.join(IFLOWS_RESPONSE_PATH, "iflows_response.json")

# Ensure the default storage path exists at module load time
print(f"Creating local storage path: {DEFAULT_LOCAL_STORAGE_PATH}")
try:
    ensure_dir(DEFAULT_LOCAL_STORAGE_PATH)
    logging.info(f"Default storage path created/verified: {DEFAULT_LOCAL_STORAGE_PATH}")
except Exception as e:
    logging.error(f"Failed to create default storage path: {str(e)}")
    
logging.info(f"Creating local storage path: {IFLOWS_RESPONSE_PATH}")
try:
    ensure_dir(IFLOWS_RESPONSE_PATH)
    logging.info(f"Iflow response storage path created/verified: {IFLOWS_RESPONSE_PATH}")
except Exception as e:
    logging.error(f"Failed to create Iflow response storage path: {str(e)}")

# Global variable to store the current query
_CURRENT_QUERY = None

def programmatically_set_query(query):
    """
    Programmatically set the current query for SAP integration package search.
    This function is used by external modules to set the query without creating a SAPConnection instance.
    
    Args:
        query (str): The search query for integration packages
        
    Returns:
        str: The set query
    """
    global _CURRENT_QUERY
    _CURRENT_QUERY = query
    logging.info(f"Query programmatically set to: '{query}'")
    return query

# Get the specialized download logger
download_logger = logging.getLogger("package_download")

class SAPConnection:
    """
    Enhanced SAPConnection class for SAP Integration Suite operations
    with additional debugging capabilities.
    """
    
    def __init__(self, base_url=None, auth_url=None, client_id=None, client_secret=None, local_storage_path=None):
        """
        Initialize a new SAP connection with the provided credentials.
        
        Args:
            base_url (str): The base URL for SAP Integration Suite
            auth_url (str): The authentication URL (defaults to base_url if not provided)
            client_id (str): The client ID for authentication
            client_secret (str): The client secret for authentication
            local_storage_path (str): Path for storing extracted packages
        """
        # Connection parameters
        self.base_url = base_url or os.getenv("SAP_INTEGRATION_URL")
        self.auth_url = auth_url or os.getenv("SAP_AUTH_URL", self.base_url)
        self.client_id = client_id or os.getenv("SAP_CLIENT_ID")
        self.client_secret = client_secret or os.getenv("SAP_CLIENT_SECRET")
        self.token = None
        
        # Storage path - use absolute path
        self.default_storage_path = os.path.abspath(os.path.join(".", "housekeeping", "extracted_packages"))
        self.local_storage_path = os.path.abspath(local_storage_path or self.default_storage_path)
        
        
        # Ensure the storage path exists
        self.ensure_dir(self.local_storage_path)
        
        # State variables for package and IFlow context
        self.current_query = None
        self.current_package_id = None
        self.current_iflow_id = None
        self.current_iflow_name = None
        self.current_iflow_path = None
        
        # Print connection info
        download_logger.info(f"SAPConnection initialized with:")
        download_logger.info(f"- SAP URL: {'(not set)' if not self.base_url else self.base_url}")
        download_logger.info(f"- SAP Auth URL: {'(not set)' if not self.auth_url else self.auth_url}")
        download_logger.info(f"- Client ID: {'(not set)' if not self.client_id else '(set)'}")
        download_logger.info(f"- Client Secret: {'(not set)' if not self.client_secret else '(set)'}")
        download_logger.info(f"- Local storage path: {self.local_storage_path}")
    
    def ensure_dir(self, path):
        """
        Ensure that a directory exists, creating it if necessary.
        Logs the operation for debugging purposes.
        
        Args:
            path (str): The directory path to ensure exists
            
        Returns:
            bool: True if directory exists or was created, False otherwise
        """
        try:
            if not os.path.exists(path):
                download_logger.debug(f"Creating missing directory: {path}")
                os.makedirs(path, exist_ok=True)
                
            # Verify the directory was actually created
            if not os.path.exists(path):
                download_logger.error(f"Failed to create directory: {path}")
                return False
                
            # Verify write permissions by creating a test file
            test_file_path = os.path.join(path, ".test_write_permission")
            try:
                with open(test_file_path, 'w') as f:
                    f.write("test")
                os.remove(test_file_path)
            except Exception as e:
                download_logger.error(f"Directory exists but is not writable: {path} - {str(e)}")
                return False
                
            download_logger.debug(f"Directory exists and is writable: {path}")
            return True
        except Exception as e:
            download_logger.error(f"Error ensuring directory exists: {path} - {str(e)}")
            return False
    
    def get_token(self):
        """Get OAuth token for SAP API access with better error handling and logging."""
        # Return cached token if available
        if self.token:
            download_logger.debug("Using cached token")
            return self.token
            
        # Environment check with more detailed messages
        missing_params = []
        if not self.auth_url:
            missing_params.append("SAP authentication URL")
        if not self.client_id:
            missing_params.append("SAP client ID")
        if not self.client_secret:
            missing_params.append("SAP client secret")
        if not self.base_url:
            missing_params.append("SAP base URL")
            
        if missing_params:
            error_msg = f"Missing required parameters: {', '.join(missing_params)}"
            download_logger.error(error_msg)
            raise Exception(error_msg)
            
        # Construct token URL
        token_url = f"{self.auth_url}/oauth/token"
        download_logger.info(f"Getting token from {token_url}")
        
        # Create basic auth header
        auth_str = f"{self.client_id}:{self.client_secret}"
        auth_b64 = base64.b64encode(auth_str.encode()).decode()
        
        headers = {
            "Authorization": f"Basic {auth_b64}",
            "Content-Type": "application/x-www-form-urlencoded"
        }
        
        data = {
            "grant_type": "client_credentials"
        }
        
        try:
            download_logger.debug(f"Making token request to {token_url}")
            response = requests.post(token_url, headers=headers, data=data, timeout=30)
            
            if response.status_code == 200:
                try:
                    token_data = response.json()
                    download_logger.debug(f"Token response: {json.dumps(token_data, indent=2)}")
                    
                    if "access_token" not in token_data:
                        error_msg = f"Token response missing access_token: {token_data}"
                        download_logger.error(error_msg)
                        raise Exception(error_msg)
                        
                    self.token = token_data["access_token"]
                    download_logger.info("Successfully obtained authentication token")
                    download_logger.debug(f"Token (first 10 chars): {self.token[:10]}...")
                    return self.token
                except ValueError as json_error:
                    error_msg = f"Failed to parse token response as JSON: {str(json_error)}"
                    download_logger.error(error_msg)
                    download_logger.error(f"Response text: {response.text}")
                    raise Exception(error_msg)
            elif response.status_code == 401:
                error_msg = "Authentication failed: Invalid client credentials"
                download_logger.error(error_msg)
                download_logger.error(f"Response: {response.text}")
                raise Exception(error_msg)
            elif response.status_code == 403:
                error_msg = "Authorization failed: Insufficient permissions"
                download_logger.error(error_msg)
                download_logger.error(f"Response: {response.text}")
                raise Exception(error_msg)
            else:
                error_msg = f"Failed to get token: HTTP {response.status_code} - {response.text}"
                download_logger.error(error_msg)
                raise Exception(error_msg)
        except requests.exceptions.ConnectionError:
            error_msg = f"Connection error: Could not connect to {token_url}"
            download_logger.error(error_msg)
            raise Exception(error_msg)
        except requests.exceptions.Timeout:
            error_msg = f"Request timed out: {token_url}"
            download_logger.error(error_msg)
            raise Exception(error_msg)
        except requests.exceptions.RequestException as e:
            error_msg = f"Request error: {str(e)}"
            download_logger.error(error_msg)
            raise Exception(error_msg)

    def set_query(self, query):
        """
        Set the current query for SAP integration package search.
        
        Args:
            query (str): The search query for integration packages
            
        Returns:
            str: The set query
        """
        self.current_query = query
        download_logger.info(f"Query set to: '{query}'")
        return query
    
    def search_integration_packages(self):
        """Search for SAP integration packages matching the current query."""
        # if not self.current_query:
        #     error_msg = "No query set for search. Use set_query first."
        #     download_logger.error(error_msg)
        #     return json.dumps({"error": error_msg})
            
        # download_logger.info(f"Searching for integration packages matching query: '{self.current_query}'")
        
        
        package_json_file= os.path.join(DEFAULT_LOCAL_STORAGE_PATH, "package_search_response.json")
         
        try:
            token = self.get_token()
            
            # Construct search URL
            search_url = f"{self.base_url}/api/v1/IntegrationPackages"
            download_logger.info(f"Searching packages at: {search_url}")
            
            # Prepare headers
            headers = {
                "Authorization": f"Bearer {token}",
                "Accept": "application/json"
            }
            
            # Make the request
            download_logger.debug(f"Making request to: {search_url}")
            response = requests.get(search_url, headers=headers)
            
            if response.status_code != 200:
                error_msg = f"Failed to search packages: {response.status_code} - {response.text}"
                download_logger.error(error_msg)
                return json.dumps({"error": error_msg})
            
            # Parse the response
            try:
                response_data = response.json()
                
                # Save the full response for debugging
                with open(package_json_file, "w") as f:
                    json.dump(response_data, f, indent=2)
                download_logger.debug(f"Saved full search response to package_search_response.json")
                
                if "d" not in response_data or "results" not in response_data["d"]:
                    error_msg = f"Invalid response format: {json.dumps(response_data)[:200]}..."
                    download_logger.error(error_msg)
                    return json.dumps({"error": error_msg})
                
                # Filter packages based on the query if not "*"
                packages = response_data["d"]["results"]
                
                # Filter packages by query if query is not wildcard
                filtered_packages = []
                if self.current_query != "*" and self.current_query != "":
                    for pkg in packages:
                        # Check if query matches package ID or name
                        if (self.current_query.lower() in pkg.get("Id", "").lower() or 
                            self.current_query.lower() in pkg.get("Name", "").lower()):
                            filtered_packages.append(pkg)
                else:
                    filtered_packages = packages
                    
                download_logger.info(f"Found {len(filtered_packages)} matching packages out of {len(packages)} total")
                
                # Return the filtered packages
                return json.dumps({
                    "d": {
                        "results": filtered_packages
                    },
                    "total": len(filtered_packages)
                })
            except ValueError as json_error:
                error_msg = f"Failed to parse search results as JSON: {str(json_error)}"
                download_logger.error(error_msg)
                return json.dumps({"error": error_msg})
        except Exception as e:
            error_msg = f"Error searching packages: {str(e)}"
            download_logger.error(error_msg)
            traceback.print_exc()
            return json.dumps({"error": error_msg})
    
    def get_package_details(self, package_id=None):
        """
        Get detailed information about a specific integration package.
        
        Args:
            package_id (str, optional): The ID of the package to get details for.
                                      If not provided, uses current_package_id.
        
        Returns:
            JSON string with package details
        """
        # Use provided package_id or current_package_id
        pkg_id = package_id or self.current_package_id
        
        if not pkg_id:
            error_msg = "No package ID provided or set with current_package_id"
            download_logger.error(error_msg)
            return json.dumps({"error": error_msg})
        
        download_logger.info(f"Getting details for package: {pkg_id}")
        
        try:
            token = self.get_token()
            
            # Construct URL for package details
            url = f"{self.base_url}/api/v1/IntegrationPackages('{pkg_id}')"
            download_logger.info(f"Getting package details from: {url}")
            
            # Prepare headers
            headers = {
                "Authorization": f"Bearer {token}",
                "Accept": "application/json"
            }
            
            # Make the request
            download_logger.debug(f"Making request to: {url}")
            response = requests.get(url, headers=headers)
            
            if response.status_code != 200:
                error_msg = f"Failed to get package details: {response.status_code} - {response.text}"
                download_logger.error(error_msg)
                
                # Try alternative URL format if this one failed
                alt_url = f"{self.base_url}/api/v1/IntegrationPackages?$filter=Id eq '{pkg_id}'"
                download_logger.info(f"Trying alternative URL: {alt_url}")
                alt_response = requests.get(alt_url, headers=headers)
                
                if alt_response.status_code != 200:
                    error_msg = f"Failed to get package details with alternative URL: {alt_response.status_code} - {alt_response.text}"
                    download_logger.error(error_msg)
                    return json.dumps({"error": error_msg})
                
                # Parse alternative response
                alt_data = alt_response.json()
                if "d" not in alt_data or "results" not in alt_data["d"]:
                    error_msg = f"Invalid response format from alternative URL: {json.dumps(alt_data)[:200]}..."
                    download_logger.error(error_msg)
                    return json.dumps({"error": error_msg})
                
                # Find the matching package
                results = alt_data["d"]["results"]
                if not results:
                    error_msg = f"Package {pkg_id} not found"
                    download_logger.error(error_msg)
                    return json.dumps({"error": error_msg})
                
                # Use the first result
                package_data = results[0]
                download_logger.info(f"Found package details via alternative URL")
            else:
                # Parse the standard response
                package_data = response.json().get("d", {})
                download_logger.info(f"Found package details via standard URL")
            
            # Now get the IFlows for this package
            iflows_url = f"{self.base_url}/api/v1/IntegrationPackages('{pkg_id}')/IntegrationDesigntimeArtifacts"
            download_logger.info(f"Getting IFlows from: {iflows_url}")
            
            iflows_response = requests.get(iflows_url, headers=headers)
            
            if iflows_response.status_code != 200:
                error_msg = f"Failed to get IFlows: {iflows_response.status_code} - {iflows_response.text}"
                download_logger.error(error_msg)
                
                # Continue with package details but no IFlows
                package_data["IFlows"] = []
            else:
                # Parse the IFlows response
                iflows_data = iflows_response.json()
                
                # Save the full IFlows response for debugging
                with open(iflows_response_file, "w") as f:
                    json.dump(iflows_data, f, indent=2)
                download_logger.debug(f"Saved full IFlows response to iflows_response.json")
                
                if "d" not in iflows_data or "results" not in iflows_data["d"]:
                    error_msg = f"Invalid IFlows response format: {json.dumps(iflows_data)[:200]}..."
                    download_logger.error(error_msg)
                    package_data["IFlows"] = []
                else:
                    package_data["IFlows"] = iflows_data["d"]["results"]
                    download_logger.info(f"Found {len(package_data['IFlows'])} IFlows in package {pkg_id}")
            
            # Set the current package ID if not already set
            if not self.current_package_id:
                self.current_package_id = pkg_id
                download_logger.info(f"Set current_package_id to: {pkg_id}")
            
            return json.dumps(package_data, indent=2)
            
        except Exception as e:
            error_msg = f"Error getting package details: {str(e)}"
            download_logger.error(error_msg)
            traceback.print_exc()
            return json.dumps({"error": error_msg})
    
    
    def extract_all_iflows_from_package(self):
        """Extract all IFlows from the current package with enhanced error handling."""
        
        try:
            package_id = self.current_package_id
            
            if not package_id:
                print("Error: No package ID available. Please run search first.")
                return json.dumps({"error": "No package ID available"})
            
            print(f"Extracting all IFlows from package: {package_id}")
            
            # Get token
            try:
                token = self.get_token()
                print("Successfully obtained token for extraction")
            except Exception as auth_error:
                print(f"Authentication error: {str(auth_error)}")
                return json.dumps({"error": str(auth_error)})
            
            # Try direct URL format for getting IFlows
            url = f"{self.base_url}/api/v1/IntegrationPackages('{package_id}')/IntegrationDesigntimeArtifacts"
            
            headers = {
                "Authorization": f"Bearer {token}",
                "Accept": "application/json"
            }
            
            print(f"Getting IFlows from: {url}")
            
            # Create directory for extracted files
            package_dir = os.path.join(self.local_storage_path, package_id)
            if not os.path.exists(package_dir):
                os.makedirs(package_dir, exist_ok=True)
                
            # Make the request
            response = requests.get(url, headers=headers)
            print(f"Response status: {response.status_code}")
            
            # Save response for debugging
            with open(iflows_response_file, "w") as f:
                f.write(response.text)
            
            if response.status_code != 200:
                error_msg = f"Failed to get IFlows list: {response.status_code} - {response.text}"
                print(error_msg)
                return json.dumps({"error": error_msg})
            
            # Parse the response
            try:
                response_data = response.json()
                
                if "d" not in response_data or "results" not in response_data["d"]:
                    error_msg = f"Invalid response format for IFlows list"
                    print(error_msg)
                    return json.dumps({"error": error_msg})
                    
                iflows = response_data["d"]["results"]
                print(f"Found {len(iflows)} IFlows in package {package_id}")
                
                # Extract each IFlow
                extracted_paths = []
                
                for i, iflow in enumerate(iflows):
                    iflow_id = iflow.get("Id", "")
                    iflow_name = iflow.get("Name", iflow_id)
                    
                    print(f"Extracting IFlow {i+1}/{len(iflows)}: {iflow_name}")
                    
                    # Set current IFlow context
                    self.current_iflow_id = iflow_id
                    self.current_iflow_name = iflow_name
                    
                    # Download URL
                    download_url = f"{self.base_url}/api/v1/IntegrationDesigntimeArtifacts(Id='{iflow_id}',Version='active')/$value"
                    
                    print(f"Downloading from: {download_url}")
                    
                    download_response = requests.get(download_url, headers={
                        "Authorization": f"Bearer {token}",
                        "Accept": "application/octet-stream"
                    })
                    
                    if download_response.status_code != 200:
                        print(f"Failed to download IFlow {iflow_name}: {download_response.status_code}")
                        continue
                    
                    # Save the file
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    file_path = os.path.join(package_dir, f"{iflow_name}____{timestamp}.zip")
                    
                    with open(file_path, "wb") as f:
                        f.write(download_response.content)
                    
                    print(f"Saved IFlow to: {file_path}")
                    extracted_paths.append({
                        "id": iflow_id,
                        "name": iflow_name,
                        "path": file_path
                    })
                    
                    # Set as current IFlow path if it's the first one
                    if i == 0:
                        self.current_iflow_path = file_path
                
                # Return the results
                result = {
                    "extracted_iflows": extracted_paths,
                    "total_extracted": len(extracted_paths),
                    "total_iflows": len(iflows)
                }
                
                return json.dumps(result, indent=2)
                
            except Exception as parse_error:
                error_msg = f"Error parsing IFlows response: {str(parse_error)}"
                print(error_msg)
                return json.dumps({"error": error_msg})
        
        except Exception as e:
            error_msg = f"Error extracting IFlows: {str(e)}"
            print(error_msg)
            return json.dumps({"error": error_msg})

    def get_iflow_content(self, iflow_path=None):
        """
        Cross-platform - Parse an IFlow and extract extensive implementation details.
        Enhanced version with improved error handling and format support.
        
        Args:
            iflow_path (str, optional): Path to the IFlow ZIP file. If not provided, uses current_iflow_path.
        
        Returns:
            JSON string with structured information about the IFlow implementation
        """
        try:
            # Use provided path or fall back to instance variable
            file_path = iflow_path if iflow_path else self.current_iflow_path
            
            if not file_path:
                error_msg = "No IFlow path available. Run extract_iflow first."
                download_logger.error(error_msg)
                return json.dumps({"error": error_msg})
                
            print(f"Analyzing IFlow content from: {file_path}")
            
            if not os.path.exists(file_path):
                error_msg = f"File does not exist: {file_path}"
                download_logger.error(error_msg)
                return json.dumps({"error": error_msg})
            
            # Initialize results
            result = self._initialize_result_structure(file_path)
            
            # Try to extract IFlow name from filename
            filename = os.path.basename(file_path)
            if "____" in filename:
                result["iflow_name"] = filename.split("____")[0]
            
            # Process file based on extension
            try:
                if file_path.endswith('.zip'):
                    self._process_zip_file(file_path, result)
                elif file_path.endswith('.xml') or file_path.endswith('.iflw'):
                    self._process_xml_file(file_path, result)
                else:
                    # Try to determine file type from content
                    self._process_unknown_file(file_path, result)
            except Exception as processing_error:
                error_msg = f"Error processing IFlow file: {str(processing_error)}"
                download_logger.error(error_msg)
                traceback.print_exc()
                result["processing_error"] = error_msg
            
            # Display summary
            self._display_result_summary(result)
            
            # Force garbage collection
            import gc
            gc.collect()
            
            return json.dumps(result, indent=2)
                
        except zipfile.BadZipFile:
            error_msg = f"The file is not a valid ZIP file: {file_path}"
            download_logger.error(error_msg)
            return json.dumps({"error": error_msg, "file_path": file_path})
        except Exception as e:
            error_msg = f"Exception while parsing IFlow content: {str(e)}"
            download_logger.error(error_msg)
            traceback.print_exc()
            return json.dumps({"error": error_msg, "file_path": file_path})

    def _initialize_result_structure(self, file_path):
        """Initialize the result structure with default values."""
        return {
            "file_path": file_path,
            "iflow_id": self.current_iflow_id or "unknown",
            "iflow_name": self.current_iflow_name or "Unknown IFlow",
            "purpose": "",
            "workflow": [],
            "key_steps": [],
            "adapters_used": [],
            "senders": [],
            "receivers": [],
            "mapping_entities": [],
            "parameters": [],
            "error_handling": [],
            "security": [],
            "security_compliant": False,
            "security_issues": [],
            "security_details": [],
            "connection_details": [],
            "project_files": [],
            "folder_structure": {},
            "meta_info": {},
            "manifest": {},
            "has_proper_error_handling": False,
            "processing_errors": []
        }

    def _process_zip_file(self, file_path, result):
        """Process ZIP file containing IFlow definitions."""
        # Create a unique unzip directory
        unique_id = str(uuid.uuid4())
        parent_dir = os.path.dirname(file_path)
        unzip_dir = os.path.join(parent_dir, f"extracted_{unique_id}")
        
        print(f"Creating unique extraction directory: {unzip_dir}")
        
        try:
            # Create extraction directory
            os.makedirs(unzip_dir, exist_ok=True)
            
            # Extract using zipfile
            with zipfile.ZipFile(file_path, 'r') as zip_ref:
                print(f"Extracting ZIP file to: {unzip_dir}")
                
                # Get file list
                all_files = zip_ref.namelist()
                result["folder_structure"]["file_count"] = len(all_files)
                
                # Log file list for debugging
                download_logger.debug(f"ZIP contains {len(all_files)} files")
                download_logger.debug(f"First 10 files: {all_files[:10]}")
                
                # Track main directories
                main_dirs = set()
                files_to_extract = []
                
                # Collect known file patterns
                known_patterns = [
                    '.xml', '.iflw', '.project', 'metainfo.prop', 
                    'MANIFEST.MF', '.prop', 'parameters.prop',
                    'IntegrationFlow', 'META-INF'
                ]
                
                for file in all_files:
                    parts = file.split('/')
                    if len(parts) > 1:
                        main_dirs.add(parts[0])
                    
                    # Include any files that match our patterns
                    should_extract = any(pattern in file for pattern in known_patterns)
                    if should_extract:
                        files_to_extract.append(file)
                
                result["folder_structure"]["main_directories"] = list(main_dirs)
                
                print(f"Extracting {len(files_to_extract)} essential files out of {len(all_files)} total files")
                for file in files_to_extract:
                    try:
                        zip_ref.extract(file, unzip_dir)
                    except Exception as extract_err:
                        error_msg = f"Error extracting {file}: {str(extract_err)}"
                        download_logger.error(error_msg)
                        result["processing_errors"].append(error_msg)
            
            # Process essential files
            self._process_project_file(unzip_dir, result)
            self._process_metainfo_file(unzip_dir, result)
            self._process_manifest_file(unzip_dir, result)
            
            # Process IFlow definition files
            iflow_files = self._find_iflow_definition_files(unzip_dir)
            
            print(f"Found {len(iflow_files)} potential IFlow definition files")
            
            for iflow_file in iflow_files:
                self._process_iflow_definition(iflow_file, unzip_dir, result)
        
        except Exception as extract_error:
            error_msg = f"Error during extraction: {str(extract_error)}"
            print(error_msg)
            traceback.print_exc()
            result["error"] = f"Extraction error: {str(extract_error)}"
        
        finally:
            try:
                if os.path.exists(unzip_dir):
                    print(f"Cleaning up extraction directory: {unzip_dir}")
                    shutil.rmtree(unzip_dir)
            except Exception as cleanup_error:
                print(f"Cleanup error (non-fatal): {str(cleanup_error)}")

    def _process_xml_file(self, file_path, result):
        """Process a single XML file containing IFlow definition."""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            result["project_files"].append(os.path.basename(file_path))
            
            # Use multiple namespace dictionaries to handle different formats
            namespace_sets = [
                {
                    'bpmn2': 'http://www.omg.org/spec/BPMN/20100524/MODEL',
                    'ifl': 'http:///com.sap.ifl.model/Ifl.xsd',
                    'bpmndi': 'http://www.omg.org/spec/BPMN/20100524/DI'
                },
                {
                    'bpmn': 'http://www.omg.org/spec/BPMN/20100524/MODEL',
                    'ifl': 'http:///com.sap.ifl.model/Ifl.xsd'
                },
                {} # Empty dict for no namespace
            ]
            
            # Try parsing with different namespace sets
            success = False
            for namespaces in namespace_sets:
                try:
                    root = ET.fromstring(content)
                    
                    # Extract Purpose
                    collaboration = None
                    for collab_tag in ['bpmn2:collaboration', 'bpmn:collaboration', 'collaboration']:
                        try:
                            collaboration = root.find(collab_tag, namespaces)
                            if collaboration is not None:
                                break
                        except Exception:
                            continue
                    
                    if collaboration is not None:
                        result["purpose"] = collaboration.get('name', 'Not specified')
                        processes = []
                        for process_tag in ['bpmn2:process', 'bpmn:process', 'process']:
                            try:
                                processes.extend(root.findall(process_tag, namespaces))
                            except Exception:
                                continue
                        
                        process_names = [p.get('name', '') for p in processes if p is not None]
                        result["purpose"] += f" involving processes: {', '.join(process_names)}"
                    
                    # Extract Workflow and other elements
                    self._extract_workflow(root, namespaces, result)
                    self._extract_key_steps(root, namespaces, result)
                    self._extract_adapters(root, namespaces, result)
                    self._extract_participants(root, namespaces, result)
                    self._extract_mappings(root, namespaces, result)
                    self._extract_parameters(root, namespaces, result)
                    self._extract_error_handling(root, namespaces, result)
                    self._extract_connection_details(root, namespaces, result)
                    
                    # Run Security Check
                    result = self.integrate_security_check(content, file_path, result)
                    
                    success = True
                    break  # Exit the namespace loop if successful
                    
                except ET.ParseError:
                    continue  # Try next namespace set
                except Exception as ns_error:
                    download_logger.warning(f"Error with namespace set {namespaces}: {str(ns_error)}")
                    continue
            
            # If all namespace attempts failed, fall back to regex
            if not success:
                download_logger.warning(f"All XML parsing attempts failed, falling back to regex")
                self._extract_with_regex(content, result)
                
                # Still run security check
                result = self.integrate_security_check(content, file_path, result)
        
        except Exception as e:
            error_msg = f"Error processing XML file {file_path}: {str(e)}"
            print(error_msg)
            result["processing_errors"].append(error_msg)

    def _process_unknown_file(self, file_path, result):
        """Process a file of unknown type by examining its content."""
        try:
            # Try to read the first 1000 bytes to determine content type
            with open(file_path, 'rb') as f:
                header = f.read(1000)
            
            # Check for ZIP signature (PK..)
            if header.startswith(b'PK'):
                download_logger.info(f"File appears to be ZIP despite extension, processing as ZIP")
                self._process_zip_file(file_path, result)
                return
            
            # Check for XML signature
            if b'<?xml' in header or b'<bpmn' in header or b'<ifl:' in header:
                download_logger.info(f"File appears to be XML despite extension, processing as XML")
                self._process_xml_file(file_path, result)
                return
            
            # If we can't determine type, try to read as text
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                
                # If content looks like XML, process as XML
                if content.strip().startswith('<') and ('<?xml' in content or '<bpmn' in content):
                    download_logger.info(f"File content appears to be XML, processing as XML")
                    self._process_xml_file(file_path, result)
                    return
                
                # Otherwise extract what we can with regex
                download_logger.info(f"Processing unknown file with regex extraction")
                self._extract_with_regex(content, result)
            except Exception as read_error:
                error_msg = f"Could not process unknown file: {str(read_error)}"
                download_logger.error(error_msg)
                result["processing_errors"].append(error_msg)
        
        except Exception as e:
            error_msg = f"Error processing unknown file {file_path}: {str(e)}"
            download_logger.error(error_msg)
            result["processing_errors"].append(error_msg)

    def _extract_with_regex(self, content, result):
        """Extract information from content using regular expressions."""
        # Extract IFlow name
        iflow_name_match = re.search(r'<[^>]+name="([^"]+)"', content)
        if iflow_name_match:
            result["iflow_name"] = iflow_name_match.group(1)
        
        # Extract connections (senders/receivers)
        connection_matches = re.findall(r'<(sender|receiver).*?type="([^"]+)"', content, re.DOTALL)
        for conn_type, adapter_type in connection_matches:
            conn_info = {"type": conn_type, "adapter": adapter_type}
            if conn_type.lower() == 'sender':
                result["senders"].append(conn_info)
            else:
                result["receivers"].append(conn_info)
        
        # Extract adapters
        adapter_matches = re.findall(r'<adapter-specific.*?type="([^"]+)"', content, re.DOTALL)
        result["adapters_used"] = list(set(adapter_matches))
        
        # Extract mappings
        mapping_matches = re.findall(r'<mapping.*?type="([^"]+)"', content, re.DOTALL)
        result["mapping_entities"] = [{"name": m, "uri": "Not specified"} for m in set(mapping_matches)]
        
        # Extract error handling
        if "<error-handling" in content:
            result["error_handling"].append({"details": "Basic error handling configured"})
        if "<dead-letter-queue" in content:
            result["error_handling"].append({"details": "Dead letter queue configured"})
        if re.search(r'<[^>]*subProcess[^>]*>.*?<[^>]*errorEvent', content, re.DOTALL):
            result["error_handling"].append({"details": "Error handling subprocess detected"})
            result["has_proper_error_handling"] = True
            
    def _process_project_file(self, unzip_dir, result):
        """Process .project file to extract project information."""
        project_file = os.path.join(unzip_dir, '.project')
        if os.path.exists(project_file):
            try:
                with open(project_file, 'r', encoding='utf-8', errors='ignore') as f:
                    project_content = f.read()
                    result["project_files"].append(".project")
                    
                    # Try multiple parsing approaches
                    try:
                        # First try XML parsing
                        project_xml = ET.fromstring(project_content)
                        name_elem = project_xml.find("./name")
                        if name_elem is not None:
                            result["project_name"] = name_elem.text
                            result["iflow_name"] = name_elem.text
                            print(f"Found project name: {result['project_name']}")
                    except ET.ParseError:
                        # Fall back to regex
                        name_match = re.search(r'<name>([^<]+)</name>', project_content)
                        if name_match:
                            result["project_name"] = name_match.group(1)
                            result["iflow_name"] = name_match.group(1)
                            print(f"Found project name (regex): {result['project_name']}")
                        else:
                            print("Could not parse .project file")
            except Exception as e:
                error_msg = f"Error reading .project file: {str(e)}"
                print(error_msg)
                result["processing_errors"].append(error_msg)

    def _process_metainfo_file(self, unzip_dir, result):
        """Process metainfo.prop file to extract metadata."""
        metainfo_file = os.path.join(unzip_dir, 'metainfo.prop')
        if os.path.exists(metainfo_file):
            try:
                with open(metainfo_file, 'r', encoding='utf-8', errors='ignore') as f:
                    lines = f.readlines()
                    result["project_files"].append("metainfo.prop")
                    
                    for line in lines:
                        if '=' in line:
                            key, value = line.strip().split('=', 1)
                            result["meta_info"][key] = value
                            if key in ["artifactDisplayName", "iflowName", "name"]:
                                result["iflow_name"] = value
                    
                    print(f"Found {len(result['meta_info'])} properties in metainfo.prop")
            except Exception as e:
                error_msg = f"Error reading metainfo.prop file: {str(e)}"
                print(error_msg)
                result["processing_errors"].append(error_msg)

    def _process_manifest_file(self, unzip_dir, result):
        """Process MANIFEST.MF file to extract manifest information."""
        # Try multiple potential locations for manifest
        manifest_paths = [
            os.path.join(unzip_dir, 'META-INF', 'MANIFEST.MF'),
            os.path.join(unzip_dir, 'MANIFEST.MF'),
            # Search for any manifest file
            *[os.path.join(root, file) 
              for root, _, files in os.walk(unzip_dir) 
              for file in files if file == 'MANIFEST.MF']
        ]
        
        for manifest_file in manifest_paths:
            if os.path.exists(manifest_file):
                try:
                    with open(manifest_file, 'r', encoding='utf-8', errors='ignore') as f:
                        manifest_content = f.read()
                        result["project_files"].append(os.path.relpath(manifest_file, unzip_dir))
                        
                        manifest_entries = {}
                        current_key = None
                        for line in manifest_content.split('\n'):
                            if not line.strip():
                                continue
                            if line.startswith(' '):
                                if current_key:
                                    manifest_entries[current_key] += line.strip()
                            else:
                                if ':' in line:
                                    parts = line.split(':', 1)
                                    current_key = parts[0].strip()
                                    manifest_entries[current_key] = parts[1].strip()
                        
                        result["manifest"] = manifest_entries
                        print(f"Found {len(manifest_entries)} entries in MANIFEST.MF")
                        
                        # Once we find one manifest, we stop looking
                        break
                except Exception as e:
                    error_msg = f"Error reading MANIFEST.MF file at {manifest_file}: {str(e)}"
                    print(error_msg)
                    result["processing_errors"].append(error_msg)

    def _find_iflow_definition_files(self, unzip_dir):
        """Find IFlow definition files in the extracted directory."""
        iflow_files = []
        max_files_to_scan = 50  # Increased from 20
        files_scanned = 0
        
        # First pass: look for .iflw files and typical XML files
        for root, dirs, files in os.walk(unzip_dir):
            for file in files:
                if files_scanned >= max_files_to_scan:
                    break
                
                # First prioritize .iflw files
                if file.endswith('.iflw'):
                    files_scanned += 1
                    iflow_files.append(os.path.join(root, file))
                # Then look for XML files with IntegrationFlow content
                elif file.endswith('.xml'):
                    files_scanned += 1
                    file_path = os.path.join(root, file)
                    try:
                        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                            sample = f.read(1000)
                            if ('<IntegrationFlow' in sample or 
                                '<ifl:' in sample or 
                                '<bpmn2:' in sample or
                                '<bpmn:' in sample):
                                iflow_files.append(file_path)
                    except Exception as read_err:
                        print(f"Error sampling file {file}: {str(read_err)}")
            
            if files_scanned >= max_files_to_scan:
                break
        
        # If no IFlow files found in first pass, do a second pass for any XML file
        if len(iflow_files) == 0:
            files_scanned = 0
            for root, dirs, files in os.walk(unzip_dir):
                for file in files:
                    if files_scanned >= max_files_to_scan:
                        break
                    if file.endswith('.xml'):
                        files_scanned += 1
                        iflow_files.append(os.path.join(root, file))
                if files_scanned >= max_files_to_scan:
                    break
            print(f"No specific IFlow files found, added {len(iflow_files)} XML files")
        
        # If still no files found, look for any file that might contain IFlow information
        if len(iflow_files) == 0:
            files_scanned = 0
            for root, dirs, files in os.walk(unzip_dir):
                for file in files:
                    if files_scanned >= max_files_to_scan:
                        break
                    if not file.endswith('.class') and not file.endswith('.jar'):
                        file_path = os.path.join(root, file)
                        try:
                            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                                sample = f.read(100)
                                if '<' in sample and '>' in sample:  # Simple check for XML-like content
                                    files_scanned += 1
                                    iflow_files.append(file_path)
                        except:
                            # Silently skip files that can't be read as text
                            pass
                if files_scanned >= max_files_to_scan:
                    break
            if len(iflow_files) > 0:
                print(f"No XML files found, added {len(iflow_files)} potentially relevant files")
        
        return iflow_files

    def _process_iflow_definition(self, iflow_file, unzip_dir, result):
        """Process an IFlow definition file."""
        try:
            with open(iflow_file, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                result["project_files"].append(os.path.relpath(iflow_file, unzip_dir))
            
            # Try multiple namespace dictionaries to handle different formats
            namespace_sets = [
                {
                    'bpmn2': 'http://www.omg.org/spec/BPMN/20100524/MODEL',
                    'ifl': 'http:///com.sap.ifl.model/Ifl.xsd',
                    'bpmndi': 'http://www.omg.org/spec/BPMN/20100524/DI'
                },
                {
                    'bpmn': 'http://www.omg.org/spec/BPMN/20100524/MODEL',
                    'ifl': 'http:///com.sap.ifl.model/Ifl.xsd'
                },
                {} # Empty dict for no namespace
            ]
            
            # Try parsing with different namespace sets
            success = False
            for namespaces in namespace_sets:
                try:
                    root = ET.fromstring(content)
                    
                    # Extract Purpose
                    collaboration = None
                    for collab_tag in ['bpmn2:collaboration', 'bpmn:collaboration', 'collaboration']:
                        try:
                            collaboration = root.find(collab_tag, namespaces)
                            if collaboration is not None:
                                break
                        except Exception:
                            continue
                    
                    if collaboration is not None:
                        result["purpose"] = collaboration.get('name', 'Not specified')
                        processes = []
                        for process_tag in ['bpmn2:process', 'bpmn:process', 'process']:
                            try:
                                processes.extend(root.findall(process_tag, namespaces))
                            except Exception:
                                continue
                        
                        process_names = [p.get('name', '') for p in processes if p is not None]
                        result["purpose"] += f" involving processes: {', '.join(process_names)}"
                    
                    # Extract Workflow and other elements
                    self._extract_workflow(root, namespaces, result)
                    self._extract_key_steps(root, namespaces, result)
                    self._extract_adapters(root, namespaces, result)
                    self._extract_participants(root, namespaces, result)
                    self._extract_mappings(root, namespaces, result)
                    self._extract_parameters(root, namespaces, result)
                    self._extract_error_handling(root, namespaces, result)
                    self._extract_connection_details(root, namespaces, result)
                    
                    # Run Security Check
                    result = self.integrate_security_check(content, iflow_file, result)
                    
                    success = True
                    break  # Exit the namespace loop if successful
                    
                except ET.ParseError:
                    continue  # Try next namespace set
                except Exception as ns_error:
                    download_logger.warning(f"Error with namespace set {namespaces}: {str(ns_error)}")
                    continue
            
            # If all namespace attempts failed, fall back to regex
            if not success:
                download_logger.warning(f"All XML parsing attempts failed for {iflow_file}, falling back to regex")
                self._extract_with_regex(content, result)
                
                # Still run security check
                result = self.integrate_security_check(content, iflow_file, result)
        
        except Exception as e:
            error_msg = f"Error processing file {iflow_file}: {str(e)}"
            print(error_msg)
            traceback.print_exc()
            result["processing_errors"].append(error_msg)
            

    def _extract_properties(self, element, namespaces):
        """
        Extract key-value properties from an element with support for different formats.
        
        Args:
            element: XML element to extract properties from
            namespaces: Namespace dictionary to use
        
        Returns:
            List of (key, value) tuples
        """
        props = []
        
        # Try multiple property path patterns
        property_paths = [
            './/ifl:property', 
            './property',
            './/property',
            './/*[local-name()="property"]'
        ]
        
        for path in property_paths:
            try:
                for prop in element.findall(path, namespaces):
                    # Try different key-value patterns
                    key_paths = ['key', 'ifl:key', '*[local-name()="key"]']
                    value_paths = ['value', 'ifl:value', '*[local-name()="value"]']
                    
                    key_text = None
                    value_text = None
                    
                    # Try to find key
                    for key_path in key_paths:
                        try:
                            key_elem = prop.find(key_path, namespaces)
                            if key_elem is not None and key_elem.text:
                                key_text = key_elem.text
                                break
                        except Exception:
                            continue
                    
                    # Try to find value
                    for value_path in value_paths:
                        try:
                            value_elem = prop.find(value_path, namespaces)
                            if value_elem is not None:
                                value_text = value_elem.text
                                break
                        except Exception:
                            continue
                    
                    # If both key and value found, add to properties
                    if key_text is not None and value_text is not None:
                        props.append((key_text, value_text))
            except Exception:
                # Continue to next pattern on error
                continue
        
        # If no properties found with hierarchical structure, try attribute-based properties
        if not props:
            try:
                # Look for key/value attributes directly on element
                if 'key' in element.attrib and 'value' in element.attrib:
                    props.append((element.attrib['key'], element.attrib['value']))
                
                # Look for name/value pattern
                if 'name' in element.attrib and 'value' in element.attrib:
                    props.append((element.attrib['name'], element.attrib['value']))
            except Exception:
                pass
        
        return props

    def _extract_workflow(self, root, namespaces, result):
        """Extract workflow information from XML."""
        for process_tags in [['bpmn2:process'], ['bpmn:process'], ['process']]:
            processes = []
            for tag in process_tags:
                try:
                    processes.extend(root.findall(tag, namespaces))
                except Exception:
                    continue
            
            if processes:
                for process in processes:
                    process_name = process.get('name', 'Unnamed Process')
                    steps = []
                    
                    # Try multiple element patterns
                    flow_element_patterns = [
                        ['bpmn2:startEvent', 'bpmn2:serviceTask', 'bpmn2:callActivity', 
                         'bpmn2:endEvent', 'bpmn2:subProcess'],
                        ['bpmn:startEvent', 'bpmn:serviceTask', 'bpmn:callActivity', 
                         'bpmn:endEvent', 'bpmn:subProcess'],
                        ['startEvent', 'serviceTask', 'callActivity', 'endEvent', 'subProcess']
                    ]
                    
                    for pattern_set in flow_element_patterns:
                        for tag in pattern_set:
                            try:
                                for element in process.findall(f'.//{tag}', namespaces):
                                    step_name = element.get('name', tag.split(':')[-1])
                                    steps.append(step_name)
                            except Exception:
                                continue
                    
                    if steps:
                        result["workflow"].append({'process': process_name, 'steps': steps})
                        break  # Exit once we find steps
                
                if result["workflow"]:
                    break  # Exit once we find processes with steps
                    
    def _extract_key_steps(self, root, namespaces, result):
        """Extract key steps from XML."""
        task_patterns = [
            ['.//bpmn2:serviceTask', './/bpmn2:callActivity'],
            ['.//bpmn:serviceTask', './/bpmn:callActivity'],
            ['.//serviceTask', './/callActivity'],
            ['.//*[local-name()="serviceTask"]', './/*[local-name()="callActivity"]']
        ]
        
        for pattern_set in task_patterns:
            tasks_found = False
            for pattern in pattern_set:
                try:
                    for task in root.findall(pattern, namespaces):
                        task_name = task.get('name', 'Unnamed Task')
                        props = self._extract_properties(task, namespaces)
                        
                        # Try different ways to get activity type
                        activity_type = 'Unknown'
                        for key, value in props:
                            if key.lower() in ['activitytype', 'activity_type', 'type']:
                                activity_type = value
                                break
                        
                        # If no specific type found, use tag name as fallback
                        if activity_type == 'Unknown':
                            activity_type = pattern.split(':')[-1].split('/')[-1]
                        
                        result["key_steps"].append({
                            'name': task_name, 
                            'type': activity_type, 
                            'properties': props
                        })
                        tasks_found = True
                except Exception:
                    continue
            
            if tasks_found:
                break  # Exit once we find tasks

    def _extract_adapters(self, root, namespaces, result):
        """Extract adapter information from XML."""
        message_flow_patterns = [
            './/bpmn2:messageFlow', 
            './/bpmn:messageFlow', 
            './/messageFlow',
            './/*[local-name()="messageFlow"]'
        ]
        
        for pattern in message_flow_patterns:
            try:
                for message_flow in root.findall(pattern, namespaces):
                    props = self._extract_properties(message_flow, namespaces)
                    
                    # Look for component type in properties
                    component_type = None
                    for key, value in props:
                        if key in ['ComponentType', 'adapterType', 'adapter', 'type']:
                            component_type = value
                            break
                    
                    # If no component type in properties, try attributes
                    if component_type is None and 'type' in message_flow.attrib:
                        component_type = message_flow.attrib['type']
                    
                    # Add component type if found and not already in list
                    if component_type and component_type not in result["adapters_used"]:
                        result["adapters_used"].append(component_type)
            except Exception:
                continue

    def _extract_participants(self, root, namespaces, result):
        """Extract participant information (senders/receivers) from XML."""
        participant_patterns = [
            './/bpmn2:participant', 
            './/bpmn:participant', 
            './/participant',
            './/*[local-name()="participant"]'
        ]
        
        for pattern in participant_patterns:
            try:
                for participant in root.findall(pattern, namespaces):
                    # Check participant type - try different attribute patterns
                    participant_type = None
                    for attr in ['ifl:type', 'type']:
                        if attr in participant.attrib:
                            participant_type = participant.attrib[attr]
                            break
                    
                    name = participant.get('name', 'Unnamed')
                    props = self._extract_properties(participant, namespaces)
                    
                    # If type not in attributes, check properties
                    if participant_type is None:
                        for key, value in props:
                            if key.lower() in ['type', 'participanttype', 'role']:
                                participant_type = value
                                break
                    
                    # Determine if sender or receiver
                    if participant_type:
                        if 'sender' in participant_type.lower():
                            result["senders"].append({'name': name, 'properties': props})
                        elif 'receiver' in participant_type.lower() or 'recevier' in participant_type.lower():
                            result["receivers"].append({'name': name, 'properties': props})
                    
                    # If no type found but has attributes that suggest endpoint
                    elif 'address' in dict(props) or any('url' in k.lower() for k, _ in props):
                        # Use name to guess if it's a sender or receiver
                        if any(s in name.lower() for s in ['sender', 'source', 'from']):
                            result["senders"].append({'name': name, 'properties': props})
                        elif any(s in name.lower() for s in ['receiver', 'target', 'to', 'destination']):
                            result["receivers"].append({'name': name, 'properties': props})
            except Exception:
                continue

    def _extract_mappings(self, root, namespaces, result):
        """Extract mapping information from XML."""
        call_activity_patterns = [
            './/bpmn2:callActivity', 
            './/bpmn:callActivity', 
            './/callActivity',
            './/*[local-name()="callActivity"]'
        ]
        
        for pattern in call_activity_patterns:
            try:
                for call_activity in root.findall(pattern, namespaces):
                    props = self._extract_properties(call_activity, namespaces)
                    
                    # Look for mapping information
                    mapping_name = None
                    mapping_uri = 'Not specified'
                    
                    for key, value in props:
                        if key.lower() in ['mappingname', 'mapping_name', 'name']:
                            mapping_name = value
                        elif key.lower() in ['mappinguri', 'mapping_uri', 'uri']:
                            mapping_uri = value
                    
                    # If no mapping name found but has a name attribute, use that
                    if mapping_name is None and call_activity.get('name'):
                        activity_name = call_activity.get('name', '')
                        if 'map' in activity_name.lower():
                            mapping_name = activity_name
                    
                    if mapping_name:
                        result["mapping_entities"].append({
                            'name': mapping_name, 
                            'uri': mapping_uri, 
                            'properties': props
                        })
            except Exception:
                continue
        
        # Also look for direct mapping elements
        mapping_patterns = [
            './/ifl:mapping', 
            './/mapping',
            './/*[local-name()="mapping"]'
        ]
        
        for pattern in mapping_patterns:
            try:
                for mapping in root.findall(pattern, namespaces):
                    props = self._extract_properties(mapping, namespaces)
                    
                    mapping_name = mapping.get('name', 'Unnamed Mapping')
                    mapping_uri = mapping.get('uri', 'Not specified')
                    
                    # Check properties for name/uri
                    for key, value in props:
                        if key.lower() in ['name']:
                            mapping_name = value
                        elif key.lower() in ['uri']:
                            mapping_uri = value
                    
                    result["mapping_entities"].append({
                        'name': mapping_name, 
                        'uri': mapping_uri, 
                        'properties': props
                    })
            except Exception:
                continue

    def _extract_parameters(self, root, namespaces, result):
        """Extract parameter information from XML."""
        property_patterns = [
            './/ifl:property', 
            './/property',
            './/*[local-name()="property"]'
        ]
        
        for pattern in property_patterns:
            try:
                for prop in root.findall(pattern, namespaces):
                    # Try to extract key-value pair
                    key_elem = None
                    value_elem = None
                    
                    # Try different key/value element patterns
                    for key_pattern in ['key', 'ifl:key', '*[local-name()="key"]']:
                        try:
                            key_elem = prop.find(key_pattern, namespaces)
                            if key_elem is not None:
                                break
                        except Exception:
                            continue
                    
                    for value_pattern in ['value', 'ifl:value', '*[local-name()="value"]']:
                        try:
                            value_elem = prop.find(value_pattern, namespaces)
                            if value_elem is not None:
                                break
                        except Exception:
                            continue
                    
                    if key_elem is not None and value_elem is not None:
                        result["parameters"].append({
                            'key': key_elem.text, 
                            'value': value_elem.text
                        })
                    
                    # If not found, try attribute pattern
                    elif 'key' in prop.attrib and 'value' in prop.attrib:
                        result["parameters"].append({
                            'key': prop.attrib['key'], 
                            'value': prop.attrib['value']
                        })
                    
                    # Try name/value pattern
                    elif 'name' in prop.attrib and 'value' in prop.attrib:
                        result["parameters"].append({
                            'key': prop.attrib['name'], 
                            'value': prop.attrib['value']
                        })
            except Exception:
                continue

    def _extract_error_handling(self, root, namespaces, result):
        """Extract error handling information from XML."""
        has_error_handling = False
        
        # Look for error subprocesses
        subprocess_patterns = [
            './/bpmn2:subProcess', 
            './/bpmn:subProcess', 
            './/subProcess',
            './/*[local-name()="subProcess"]'
        ]
        
        error_event_patterns = [
            './/bpmn2:errorEventDefinition', 
            './/bpmn:errorEventDefinition', 
            './/errorEventDefinition',
            './/*[local-name()="errorEventDefinition"]'
        ]
        
        for subprocess_pattern in subprocess_patterns:
            try:
                for subprocess in root.findall(subprocess_pattern, namespaces):
                    # Check if this subprocess has error event definitions
                    has_error_event = False
                    for error_pattern in error_event_patterns:
                        try:
                            if subprocess.find(error_pattern, namespaces) is not None:
                                has_error_event = True
                                break
                        except Exception:
                            continue
                    
                    if has_error_event:
                        subprocess_name = subprocess.get('name', 'Unnamed Subprocess')
                        result["error_handling"].append({
                            'subprocess': subprocess_name, 
                            'details': 'Handles errors with error start and end events'
                        })
                        has_error_handling = True
                        
                    # Check properties for error handling indicators
                    props = self._extract_properties(subprocess, namespaces)
                    for key, value in props:
                        if (key.lower() == 'activitytype' and 
                            'error' in value.lower()):
                            subprocess_name = subprocess.get('name', 'Unnamed Subprocess')
                            result["error_handling"].append({
                                'subprocess': subprocess_name, 
                                'details': f'Error handling subprocess: {value}'
                            })
                            has_error_handling = True
                            break
            except Exception:
                continue
        
        # Look for error handlers and dead letter queues
        error_handler_patterns = [
            './/errorHandler', 
            './/*[local-name()="errorHandler"]',
            './/deadLetterQueue',
            './/*[local-name()="deadLetterQueue"]'
        ]
        
        for pattern in error_handler_patterns:
            try:
                for handler in root.findall(pattern, namespaces):
                    handler_type = pattern.split(':')[-1].split('/')[-1]
                    result["error_handling"].append({
                        'details': f'{handler_type} configured'
                    })
                    has_error_handling = True
            except Exception:
                continue
        
        # Update error handling summary
        result["has_proper_error_handling"] = has_error_handling
        
        if has_error_handling and not result["error_handling"]:
            result["error_handling"].append({
                'details': 'Error handling properly configured with error subprocesses'
            })
        elif result["error_handling"]:
            if not has_error_handling:
                result["error_handling"].append({
                    'details': 'Basic error handling elements found but no proper error subprocesses'
                })
        else:
            result["error_handling"].append({
                'details': 'No error handling detected'
            })

    def _extract_connection_details(self, root, namespaces, result):
        """Extract connection details from XML."""
        message_flow_patterns = [
            './/bpmn2:messageFlow', 
            './/bpmn:messageFlow', 
            './/messageFlow',
            './/*[local-name()="messageFlow"]'
        ]
        
        for pattern in message_flow_patterns:
            try:
                for message_flow in root.findall(pattern, namespaces):
                    props = self._extract_properties(message_flow, namespaces)
                    
                    # Initialize connection info with defaults
                    connection_info = {
                        'name': message_flow.get('name', 'Unnamed Flow'),
                        'address': None,
                        'protocol': None,
                        'message_protocol': None,
                        'details': props
                    }
                    
                    # Extract standard properties
                    for key, value in props:
                        if key.lower() in ['address', 'url', 'uri', 'endpoint']:
                            connection_info['address'] = value
                        elif key.lower() in ['transportprotocol', 'transport_protocol', 'protocol']:
                            connection_info['protocol'] = value
                        elif key.lower() in ['messageprotocol', 'message_protocol', 'format']:
                            connection_info['message_protocol'] = value
                    
                    result["connection_details"].append(connection_info)
            except Exception:
                continue

    def _display_result_summary(self, result):
        """Display a summary of the extraction results."""
        print(f"\n=== IFlow Analysis Summary ===")
        print(f"IFlow Name: {result.get('iflow_name', 'Unknown')}")
        print(f"IFlow ID: {result.get('iflow_id', 'Unknown')}")
        if "project_name" in result:
            print(f"Project name: {result['project_name']}")
        print(f"Purpose: {result['purpose']}")
        print(f"Processes: {len(result['workflow'])}")
        print(f"Key Steps: {len(result['key_steps'])}")
        print(f"Adapters: {', '.join(result['adapters_used'])}")
        print(f"Senders: {len(result['senders'])}")
        print(f"Receivers: {len(result['receivers'])}")
        print(f"Mappings: {len(result['mapping_entities'])}")
        print(f"Parameters: {len(result['parameters'])}")
        
        # Format error handling display
        if result["error_handling"]:
            error_details = []
            for eh in result["error_handling"]:
                if isinstance(eh, dict):
                    error_details.append(eh.get('details', str(eh)))
                else:
                    error_details.append(str(eh))
            print(f"Error Handling: {', '.join(error_details)}")
        else:
            print("Error Handling: None detected")
        
        print(f"Has Proper Error Handling: {result['has_proper_error_handling']}")
        print(f"Security: {', '.join(result['security'])}")
        print(f"Security Compliant: {result['security_compliant']}")
        print(f"Connections: {len(result['connection_details'])}")
        print(f"Key Files: {len(result['project_files'])}")
        
        # Display any processing errors
        if "processing_errors" in result and result["processing_errors"]:
            print(f"\n=== Processing Errors ({len(result['processing_errors'])}) ===")
            for i, error in enumerate(result["processing_errors"][:5], 1):
                print(f"{i}. {error}")
            if len(result["processing_errors"]) > 5:
                print(f"... and {len(result['processing_errors']) - 5} more errors")


    def extract_iflow(self, artifact_id=None):
        """
        Download and extract an IFlow with improved error handling and debugging.
        
        Args:
            artifact_id (str, optional): The specific IFlow ID to extract. 
                                      If not provided, will extract the current IFlow.
        
        Returns:
            Path to the extracted IFlow file
        """
        try:
            # Use provided ID or fall back to instance variables
            package_id = self.current_package_id
            iflow_id = artifact_id if artifact_id else self.current_iflow_id
            
            download_logger.info(f"Starting extraction with package_id={package_id}, iflow_id={iflow_id}")
            
            if not package_id:
                error_msg = "Error: No package ID available. Please run search first."
                download_logger.error(error_msg)
                return error_msg
                
            if not iflow_id:
                error_msg = "Error: No IFlow ID available. Please get package details first."
                download_logger.error(error_msg)
                return error_msg
            
            download_logger.info(f"Extracting IFlow: {iflow_id} from package {package_id}")
            
            try:
                token = self.get_token()
                download_logger.debug(f"Successfully obtained token for IFlow extraction: {token[:10]}...")
            except Exception as auth_error:
                error_msg = f"Authentication error: {str(auth_error)}"
                download_logger.error(error_msg)
                traceback.print_exc()
                return error_msg
            
            # Try different URL formats with detailed logging
            urls_to_try = [
                f"{self.base_url}/api/v1/IntegrationDesigntimeArtifacts(Id='{iflow_id}',Version='active')/$value",
                f"{self.base_url}/api/v1/IntegrationPackages('{package_id}')/IntegrationDesigntimeArtifacts('{iflow_id}')/$value",
                f"{self.base_url}/api/v1/IntegrationDesigntimeArtifacts('{iflow_id}')/$value",
                # Add newer API format
                f"{self.base_url}/api/v1/IntegrationDesigntimeArtifacts('{iflow_id}')/EntitySpecificAttributes/content/$value"
            ]
            
            headers = {
                "Authorization": f"Bearer {token}",
                "Accept": "application/octet-stream"
            }
            
            response = None
            url_used = None
            
            # Try each URL format with detailed debugging
            for url in urls_to_try:
                download_logger.info(f"Trying to download IFlow from: {url}")
                try:
                    download_logger.debug(f"Headers: {headers}")
                    response = requests.get(url, headers=headers)
                    
                    download_logger.info(f"Response status: {response.status_code}")
                    download_logger.debug(f"Response headers: {response.headers}")
                    
                    if response.status_code == 200:
                        download_logger.info(f"Successfully downloaded IFlow from: {url}")
                        url_used = url
                        break
                    else:
                        download_logger.warning(f"Failed to download from {url} with status {response.status_code}")
                        download_logger.debug(f"Response text: {response.text[:500]}")
                except Exception as req_error:
                    download_logger.warning(f"Error trying URL {url}: {str(req_error)}")
            
            if not response or response.status_code != 200:
                # Try to get more detailed error information
                error_details = "Unknown error"
                if response:
                    try:
                        if 'application/json' in response.headers.get('Content-Type', ''):
                            error_details = response.json()
                        else:
                            error_details = response.text[:200]
                    except:
                        error_details = response.text[:200]
                
                error_msg = f"Failed to download IFlow from any URL: {error_details}"
                download_logger.error(error_msg)
                return error_msg
            
            # Check if we received any content
            content_length = len(response.content)
            if content_length == 0:
                error_msg = "API returned empty content for IFlow download"
                download_logger.error(error_msg)
                return error_msg
            
            download_logger.info(f"Successfully downloaded IFlow content: {content_length} bytes")
            
            # Create package directory path with normalization to avoid path issues
            package_dir = os.path.normpath(os.path.join(self.local_storage_path, package_id))
            download_logger.info(f"Creating package directory: {package_dir}")
            
            # Ensure the extraction directory exists
            if not self.ensure_dir(package_dir):
                error_msg = f"Failed to create or access package directory: {package_dir}"
                download_logger.error(error_msg)
                return error_msg
            
            # Determine a good name for the IFlow
            iflow_name = self.current_iflow_name or iflow_id
            
            # Create unique path for the IFlow (adding a timestamp to avoid overwriting)
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            artifact_filename = f"{iflow_name}____{timestamp}.zip"
            artifact_path = os.path.normpath(os.path.join(package_dir, artifact_filename))
            download_logger.info(f"Writing to file: {artifact_path}")
            
            # First write to a temporary file, then move to final location
            try:
                with tempfile.NamedTemporaryFile(delete=False) as temp_file:
                    temp_file.write(response.content)
                    temp_path = temp_file.name
                
                # Verify the file was written correctly
                if not os.path.exists(temp_path) or os.path.getsize(temp_path) == 0:
                    error_msg = f"Failed to write temporary file: {temp_path}"
                    download_logger.error(error_msg)
                    return error_msg
                
                # Move the temporary file to the final location
                shutil.move(temp_path, artifact_path)
                
                # Verify the file was moved correctly
                if not os.path.exists(artifact_path) or os.path.getsize(artifact_path) == 0:
                    error_msg = f"Failed to move temporary file to final location: {artifact_path}"
                    download_logger.error(error_msg)
                    return error_msg
                
                download_logger.info(f"IFlow successfully downloaded to: {artifact_path} ({os.path.getsize(artifact_path)} bytes)")
                
                # Test if the file is a valid ZIP
                try:
                    with zipfile.ZipFile(artifact_path, 'r') as zip_test:
                        file_list = zip_test.namelist()
                        download_logger.info(f"ZIP file is valid with {len(file_list)} files")
                        
                        if len(file_list) > 0:
                            download_logger.debug(f"First few files: {file_list[:5]}")
                            
                            # Check for expected file patterns
                            has_iflow_file = any(f for f in file_list if f.endswith('.iflw'))
                            has_xml_file = any(f for f in file_list if f.endswith('.xml'))
                            has_manifest = any(f for f in file_list if 'MANIFEST.MF' in f)
                            
                            download_logger.debug(f"Has IFLOW file: {has_iflow_file}")
                            download_logger.debug(f"Has XML file: {has_xml_file}")
                            download_logger.debug(f"Has manifest: {has_manifest}")
                            
                            if not (has_iflow_file or has_xml_file):
                                download_logger.warning(f"ZIP file does not contain expected IFlow files")
                except zipfile.BadZipFile:
                    download_logger.warning(f"File is not a valid ZIP, but saving anyway: {artifact_path}")
                    # Try to determine file type
                    try:
                        with open(artifact_path, 'rb') as f:
                            header = f.read(8)
                        download_logger.debug(f"File header bytes: {header.hex()}")
                        
                        # Check if it might be another format
                        if header.startswith(b'PK'):
                            download_logger.info("File has PK header but could not be opened as ZIP - might be corrupted")
                        elif b'<?xml' in response.content[:100]:
                            download_logger.info("File appears to be XML content - saving as .xml instead")
                            # If it's XML, save with XML extension
                            xml_path = artifact_path.replace('.zip', '.xml')
                            shutil.move(artifact_path, xml_path)
                            artifact_path = xml_path
                    except Exception as type_check_error:
                        download_logger.error(f"Error checking file type: {str(type_check_error)}")
            except IOError as file_error:
                error_msg = f"File writing error: {str(file_error)}"
                download_logger.error(error_msg)
                traceback.print_exc()
                return error_msg
            
            # Update the current IFlow path
            self.current_iflow_path = artifact_path
            
            return artifact_path
        except Exception as e:
            error_msg = f"Error extracting IFlow: {str(e)}"
            download_logger.error(error_msg)
            traceback.print_exc()
            return error_msg
            
    def check_security_compliance(self, content, properties=None):
        """
        Enhanced security compliance check for IFlow XML content.
        
        Args:
            content (str): The XML content of the IFlow file
            properties (dict, optional): Dictionary of properties from properties.prop file
            
        Returns:
            dict: Security compliance information including:
                - detected_methods: List of authentication methods detected
                - is_compliant: Boolean indicating if the authentication is secure
                - issues: List of security issues found
                - details: Additional details about the security configuration
        """
        result = {
            "detected_methods": [],
            "is_compliant": True,
            "issues": [],
            "details": []
        }
        
        if properties is None:
            properties = {}
        
        try:
            # Find direct authentication methods - try multiple patterns
            auth_patterns = [
                r'<key>authenticationMethod</key>\s*<value>([^<]+)</value>',
                r'<key>authentication[mM]ethod</key>\s*<value>([^<]+)</value>',
                r'<key>auth[mM]ethod</key>\s*<value>([^<]+)</value>',
                r'<property[^>]*>\s*<key>authenticationMethod</key>\s*<value>([^<]+)</value>',
                r'authentication[mM]ethod="([^"]+)"',
                r'auth[mM]ethod="([^"]+)"'
            ]
            
            # Check for direct authentication methods
            for pattern in auth_patterns:
                auth_method_matches = re.findall(pattern, content)
                for method in auth_method_matches:
                    method = method.strip()
                    if method:
                        if method not in result["detected_methods"]:
                            result["detected_methods"].append(method)
                        
                        if method.lower() in ["basic", "basic authentication"]:
                            result["is_compliant"] = False
                            result["issues"].append(f"Direct Basic Authentication detected: '{method}'")
            
            # Check for parameterized authentication methods
            param_auth_patterns = [
                r'<key>authenticationMethod</key>\s*<value>\{\{([^}]+)\}\}</value>',
                r'<key>authentication[mM]ethod</key>\s*<value>\{\{([^}]+)\}\}</value>',
                r'<key>auth[mM]ethod</key>\s*<value>\{\{([^}]+)\}\}</value>',
                r'authentication[mM]ethod="\{\{([^}]+)\}\}"',
                r'auth[mM]ethod="\{\{([^}]+)\}\}"'
            ]
            
            for pattern in param_auth_patterns:
                param_auth_matches = re.findall(pattern, content)
                for param_name in param_auth_matches:
                    param_name = param_name.strip()
                    result["details"].append(f"Found parameterized authentication: {{{param_name}}}")
                    
                    # Try to resolve parameter from properties
                    resolved_value = None
                    for prop_key, prop_value in properties.items():
                        if (prop_key == param_name or 
                            prop_key.endswith(f"_{param_name}") or
                            prop_key.lower() == param_name.lower()):
                            resolved_value = prop_value
                            break
                    
                    if resolved_value:
                        if resolved_value not in result["detected_methods"]:
                            result["detected_methods"].append(f"{resolved_value} (from {param_name})")
                        
                        if resolved_value.lower() in ["basic", "basic authentication"]:
                            result["is_compliant"] = False
                            result["issues"].append(f"Basic Authentication detected via parameter: '{param_name}' = '{resolved_value}'")
                    else:
                        result["details"].append(f"Could not resolve parameter: '{param_name}'")
            
            # XML parsing for message flows - with improved error handling
            try:
                root = ET.fromstring(content)
                
                # Try multiple namespace dictionaries
                namespace_sets = [
                    {
                        'bpmn2': 'http://www.omg.org/spec/BPMN/20100524/MODEL',
                        'ifl': 'http:///com.sap.ifl.model/Ifl.xsd'
                    },
                    {
                        'bpmn': 'http://www.omg.org/spec/BPMN/20100524/MODEL',
                        'ifl': 'http:///com.sap.ifl.model/Ifl.xsd'
                    },
                    {} # Empty dict for no namespace
                ]
                
                # Try message flow patterns with each namespace set
                for namespaces in namespace_sets:
                    message_flow_patterns = [
                        './/bpmn2:messageFlow',
                        './/bpmn:messageFlow',
                        './/messageFlow',
                        './/*[local-name()="messageFlow"]'
                    ]
                    
                    message_flows_found = False
                    for pattern in message_flow_patterns:
                        try:
                            message_flows = root.findall(pattern, namespaces)
                            if message_flows:
                                message_flows_found = True
                                
                                for flow in message_flows:
                                    # Try to extract properties with flexible approach
                                    props = self._extract_properties(flow, namespaces)
                                    
                                    # Check for authentication method
                                    for key, value in props:
                                        if key == "authenticationMethod":
                                            if not (value.startswith("{{") and value.endswith("}}")):
                                                # Direct authentication method
                                                if value not in result["detected_methods"]:
                                                    result["detected_methods"].append(value)
                                                
                                                if value.lower() in ["basic", "basic authentication"]:
                                                    result["is_compliant"] = False
                                                    result["issues"].append(f"Direct Basic Authentication detected in message flow: '{value}'")
                                            else:
                                                # Parameterized authentication
                                                param_name = value[2:-2].strip()
                                                result["details"].append(f"Found parameterized authentication in message flow: {value}")
                                                
                                                # Try to resolve parameter
                                                resolved_value = None
                                                for prop_key, prop_value in properties.items():
                                                    if (prop_key == param_name or 
                                                        prop_key.endswith(f"_{param_name}") or
                                                        prop_key.lower() == param_name.lower()):
                                                        resolved_value = prop_value
                                                        break
                                                
                                                if resolved_value:
                                                    if resolved_value not in result["detected_methods"]:
                                                        result["detected_methods"].append(f"{resolved_value} (from {param_name})")
                                                    
                                                    if resolved_value.lower() in ["basic", "basic authentication"]:
                                                        result["is_compliant"] = False
                                                        result["issues"].append(f"Basic Authentication detected via parameter in message flow: '{param_name}' = '{resolved_value}'")
                                                else:
                                                    result["details"].append(f"Could not resolve parameter in message flow: '{param_name}'")
                        except Exception:
                            continue
                    
                    # If we found message flows with this namespace set, we're done
                    if message_flows_found:
                        break
                
            except ET.ParseError as xml_err:
                result["details"].append(f"XML parsing error during security check: {str(xml_err)}")
            
            # Fallback pattern-based checks if no authentication methods found
            if not result["detected_methods"]:
                # Check for basic authentication patterns
                basic_auth_patterns = [
                    r'basicAuthentication',
                    r'Basic Authentication',
                    r'BasicAuth',
                    r'basic_auth',
                    r'"authentication"\s*:\s*"basic"',
                    r'"auth_type"\s*:\s*"basic"'
                ]
                
                for pattern in basic_auth_patterns:
                    if re.search(pattern, content, re.IGNORECASE):
                        result["detected_methods"].append("Basic Authentication (pattern match)")
                        result["is_compliant"] = False
                        result["issues"].append("Basic Authentication detected via string pattern")
                        break
                
                # Check for OAuth patterns
                oauth_patterns = [
                    r'oauth',
                    r'OAuth',
                    r'Authorization Code',
                    r'Client Credentials',
                    r'Bearer',
                    r'JWT'
                ]
                
                for pattern in oauth_patterns:
                    if re.search(pattern, content, re.IGNORECASE):
                        result["detected_methods"].append("OAuth (pattern match)")
                        break
                
                # Check for certificate patterns
                cert_patterns = [
                    r'certificate',
                    r'Certificate',
                    r'x509',
                    r'X509',
                    r'client cert',
                    r'mutual auth'
                ]
                
                for pattern in cert_patterns:
                    if re.search(pattern, content, re.IGNORECASE):
                        result["detected_methods"].append("Certificate (pattern match)")
                        break
            
            # Check properties for client certificates
            for key, value in properties.items():
                # Look for client certificate properties
                if "authenticationMethod" in key.lower() and "certificate" in value.lower():
                    result["detected_methods"].append("Certificate (from property)")
                
                # Look for OAuth properties
                if ("authenticationMethod" in key.lower() or "auth_type" in key.lower()) and "oauth" in value.lower():
                    result["detected_methods"].append("OAuth (from property)")
            
            # Deduplicate results
            result["detected_methods"] = list(set(result["detected_methods"]))
            result["issues"] = list(set(result["issues"]))
            result["details"] = list(set(result["details"]))
            
            # Make final compliance determination
            # If no authentication methods detected but API call patterns found, flag as warning
            if not result["detected_methods"] and re.search(r'(http[s]?://|endpoint|url|uri)', content, re.IGNORECASE):
                result["details"].append("External API calls detected but no authentication method identified")
                result["issues"].append("Possible missing authentication for external services")
                result["is_compliant"] = False
            
        except Exception as e:
            result["details"].append(f"Error during security compliance check: {str(e)}")
        
        return result
        
    def _extract_properties(self, element, namespaces):
        """
        Extract properties from an XML element with support for multiple formats.
        
        Args:
            element: The XML element to extract properties from
            namespaces: Namespace dictionary
            
        Returns:
            List of (key, value) tuples
        """
        props = []
        
        # Try various property patterns
        property_paths = [
            './/ifl:property', 
            './property',
            './/property',
            './/*[local-name()="property"]'
        ]
        
        for path in property_paths:
            try:
                for prop in element.findall(path, namespaces):
                    # Try different key-value patterns
                    key_paths = ['key', 'ifl:key', '*[local-name()="key"]']
                    value_paths = ['value', 'ifl:value', '*[local-name()="value"]']
                    
                    key_text = None
                    value_text = None
                    
                    # Try to find key
                    for key_path in key_paths:
                        try:
                            key_elem = prop.find(key_path, namespaces)
                            if key_elem is not None and key_elem.text:
                                key_text = key_elem.text
                                break
                        except Exception:
                            continue
                    
                    # Try to find value
                    for value_path in value_paths:
                        try:
                            value_elem = prop.find(value_path, namespaces)
                            if value_elem is not None:
                                value_text = value_elem.text
                                break
                        except Exception:
                            continue
                    
                    # If both key and value found, add to properties
                    if key_text is not None and value_text is not None:
                        props.append((key_text, value_text))
            except Exception:
                # Continue to next pattern on error
                continue
        
        # If no properties found with hierarchical structure, try attribute-based properties
        if not props:
            try:
                # Look for key/value attributes directly on element
                if 'key' in element.attrib and 'value' in element.attrib:
                    props.append((element.attrib['key'], element.attrib['value']))
                
                # Look for name/value pattern
                if 'name' in element.attrib and 'value' in element.attrib:
                    props.append((element.attrib['name'], element.attrib['value']))
            except Exception:
                pass
        
        return props

    def get_iflow_details(self, package_id=None):
        """
        Get detailed information about the IFlows in a package.
        
        Args:
            package_id (str, optional): Package ID to get IFlows for.
                                      If not provided, will use current_package_id.
        
        Returns:
            JSON string with package IFlow details
        """
        # Use provided package_id or current_package_id
        pkg_id = package_id or self.current_package_id
        
        if not pkg_id:
            error_msg = "No package ID provided or set with current_package_id"
            download_logger.error(error_msg)
            return json.dumps({"error": error_msg})
        
        download_logger.info(f"Getting IFlow details for package: {pkg_id}")
        
        try:
            token = self.get_token()
            
            # Construct URL for IFlows in the package
            url = f"{self.base_url}/api/v1/IntegrationPackages('{pkg_id}')/IntegrationDesigntimeArtifacts"
            download_logger.info(f"Getting IFlows from: {url}")
            
            # Prepare headers
            headers = {
                "Authorization": f"Bearer {token}",
                "Accept": "application/json"
            }
            
            # Make the request
            download_logger.debug(f"Making request to: {url} with headers: {headers}")
            response = requests.get(url, headers=headers)
            
            if response.status_code != 200:
                error_msg = f"Failed to get IFlows: {response.status_code} - {response.text}"
                download_logger.error(error_msg)
                return json.dumps({"error": error_msg})
            
            # Parse the response
            try:
                iflows_data = response.json()
                
                # Save the full response for debugging
                with open(iflows_response_file, "w") as f:
                    json.dump(iflows_data, f, indent=2)
                download_logger.debug(f"Saved full IFlows response to iflows_response.json")
                
                if "d" not in iflows_data or "results" not in iflows_data["d"]:
                    error_msg = f"Invalid IFlows response format: {json.dumps(iflows_data)[:200]}..."
                    download_logger.error(error_msg)
                    return json.dumps({"error": error_msg})
                
                result = {
                    "results": iflows_data["d"]["results"]
                }
                
                download_logger.info(f"Found {len(result['results'])} IFlows in package {pkg_id}")
                return json.dumps(result)
                
            except ValueError as json_error:
                error_msg = f"Failed to parse IFlows response as JSON: {str(json_error)}"
                download_logger.error(error_msg)
                return json.dumps({"error": error_msg})
        except Exception as e:
            error_msg = f"Error getting IFlows: {str(e)}"
            download_logger.error(error_msg)
            traceback.print_exc()
            return json.dumps({"error": error_msg})


    def integrate_security_check(self, content, iflow_path, result):
        """
        Integrate the enhanced security check into the get_iflow_content function
        
        Args:
            content (str): The XML content of the IFlow file
            iflow_path (str): Path to the IFlow file
            result (dict): The result dictionary to update
            
        Returns:
            dict: Updated result dictionary
        """
        print(f"\n=== Running enhanced security check for: {iflow_path} ===")
        
        properties = {}
        if iflow_path.endswith('.zip') and os.path.exists(iflow_path):
            try:
                print(f"Checking for properties in ZIP file: {iflow_path}")
                with zipfile.ZipFile(iflow_path, 'r') as zip_ref:
                    property_files = [f for f in zip_ref.namelist() 
                                    if f.endswith('.prop') and ('parameter' in f.lower() or 'propert' in f.lower())]
                    if property_files:
                        print(f"Found property files in ZIP: {property_files}")
                        for prop_file in property_files:
                            try:
                                with zip_ref.open(prop_file) as f:
                                    prop_content = f.read().decode('utf-8', errors='ignore')
                                    print(f"Extracted properties from: {prop_file}")
                                    file_properties = self.extract_properties(prop_content)
                                    properties.update(file_properties)
                                    auth_props = {k: v for k, v in file_properties.items() 
                                                if 'auth' in k.lower() or 'certificate' in k.lower()}
                                    if auth_props:
                                        print(f"Authentication-related properties: {auth_props}")
                            except Exception as e:
                                print(f"Error reading property file {prop_file} from ZIP: {str(e)}")
            except Exception as e:
                print(f"Error checking ZIP for properties: {str(e)}")
        
        if not properties:
            try:
                params_path = os.path.join(os.path.dirname(iflow_path), "parameters.prop")
                if os.path.exists(params_path):
                    print(f"Found parameters.prop file: {params_path}")
                    with open(params_path, 'r', encoding='utf-8', errors='ignore') as f:
                        param_content = f.read()
                        param_properties = self.extract_properties(param_content)
                        properties.update(param_properties)
                        result["project_files"].append("parameters.prop")
                        auth_props = {k: v for k, v in param_properties.items() 
                                    if 'auth' in k.lower() or 'certificate' in k.lower()}
                        if auth_props:
                            print(f"Authentication-related properties: {auth_props}")
            except Exception as e:
                print(f"Error reading properties files from directory: {str(e)}")
        
        print(f"Total properties found: {len(properties)}")
        
        security_check = self.check_security_compliance(content, properties)
        
        print(f"Security check results:")
        print(f"- Detected methods: {security_check['detected_methods']}")
        print(f"- Is compliant: {security_check['is_compliant']}")
        print(f"- Issues: {security_check['issues']}")
        if security_check['details']:
            print(f"- Details: {security_check['details']}")
        
        result["security"] = security_check["detected_methods"]
        result["security_compliant"] = security_check["is_compliant"]
        result["security_issues"] = security_check["issues"]
        result["security_details"] = security_check["details"]
        
        return result

    def debug_package_id(self, package_id):
        """
        Debug a package ID to check for formatting issues.
        
        Args:
            package_id (str): Package ID to debug
            
        Returns:
            dict: Debug information about the package ID
        """
        return {
            "original": package_id,
            "stripped": package_id.strip() if isinstance(package_id, str) else package_id,
            "type": type(package_id).__name__,
            "url_formatted": f"'{package_id}'" if isinstance(package_id, str) else str(package_id),
            "length": len(package_id) if isinstance(package_id, str) else 0,
            "whitespace": [i for i, c in enumerate(package_id) if c.isspace()] if isinstance(package_id, str) else []
        }
#!/usr/bin/env python
"""
Improved Security Authentication Validator for SAP Integration Flows

This script validates authentication methods in SAP Integration Flows, with a focus on identifying
Basic Authentication in message flows. It automatically extracts and uses the parameters.prop
file from within the IFlow ZIP file.

Usage:
    python improved_auth_validator.py <path_to_iflow_zip>

"""

import os
import sys
import re
import zipfile
import tempfile
import xml.etree.ElementTree as ET
from io import StringIO


def extract_properties(properties_content):
    """Extract properties from a properties file content into a dictionary"""
    properties = {}
    
    try:
        for line in properties_content.splitlines():
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                properties[key.strip()] = value.strip()
        
        print(f"Loaded {len(properties)} properties")
        
        # Print the properties related to authentication for debugging
        for key, value in properties.items():
            if 'auth' in key.lower():
                print(f"Authentication-related property: {key} = {value}")
                
    except Exception as e:
        print(f"Error parsing properties: {str(e)}")
    
    return properties


def check_authentication_security(iflow_file):
    """
    Check authentication methods in an IFlow file against security requirements.
    
    Args:
        iflow_file: Path to the .iflw or .zip file containing the IFlow
        
    Returns:
        dict: Results of the security check
    """
    results = {
        "is_compliant": True,
        "auth_methods": [],
        "issues": [],
        "details": []
    }
    
    print(f"\nChecking authentication security in {iflow_file}")
    
    # Properties container - will be populated from files inside the ZIP
    properties = {}
    
    # Check if we have a zip file or direct XML
    if iflow_file.endswith('.zip'):
        # Create a temporary directory for extraction
        temp_dir = tempfile.mkdtemp()
        try:
            print(f"Extracting {iflow_file} to {temp_dir}")
            
            # First, scan the ZIP for properties files without extracting everything
            property_files_content = {}
            with zipfile.ZipFile(iflow_file, 'r') as zip_ref:
                # Look for property files
                for item in zip_ref.namelist():
                    lower_name = item.lower()
                    if lower_name.endswith('.prop') or lower_name.endswith('properties'):
                        if 'parameter' in lower_name or 'propert' in lower_name:
                            print(f"Found property file: {item}")
                            try:
                                with zip_ref.open(item) as prop_file:
                                    content = prop_file.read().decode('utf-8', errors='ignore')
                                    property_files_content[item] = content
                            except Exception as e:
                                print(f"Error reading property file {item}: {str(e)}")
                
                # Process properties files
                for file_name, content in property_files_content.items():
                    print(f"Processing properties from {file_name}")
                    file_properties = extract_properties(content)
                    # Add to global properties
                    properties.update(file_properties)
                
                # Now extract only XML and IFLW files
                for item in zip_ref.namelist():
                    if item.endswith('.xml') or item.endswith('.iflw'):
                        zip_ref.extract(item, temp_dir)
                        print(f"Extracted: {item}")
            
            # Find and process iflw files
            for root, dirs, files in os.walk(temp_dir):
                for file in files:
                    if file.endswith('.iflw') or file.endswith('.xml'):
                        file_path = os.path.join(root, file)
                        print(f"Processing file: {file_path}")
                        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                            content = f.read()
                            check_single_file(content, properties, results)
        finally:
            # Clean up
            import shutil
            shutil.rmtree(temp_dir)
    else:
        # Direct XML/IFLW file - check for a parameter file in the same directory
        base_dir = os.path.dirname(iflow_file)
        param_candidates = [
            os.path.join(base_dir, 'parameters.prop'),
            os.path.join(base_dir, 'properties.prop')
        ]
        
        # Try to load properties from files in the same directory
        for param_file in param_candidates:
            if os.path.exists(param_file):
                print(f"Found properties file: {param_file}")
                try:
                    with open(param_file, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                        file_properties = extract_properties(content)
                        properties.update(file_properties)
                except Exception as e:
                    print(f"Error reading properties file {param_file}: {str(e)}")
        
        # Process the IFLW/XML file
        with open(iflow_file, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            check_single_file(content, properties, results)
    
    # Final compliance check
    if not results["is_compliant"]:
        print("\n⚠️ SECURITY ISSUE: Basic Authentication detected!")
    else:
        print("\n✅ Authentication methods are compliant")
    
    print(f"\nDetected authentication methods: {results['auth_methods']}")
    if results["issues"]:
        print(f"\nSecurity issues: {results['issues']}")
    
    return results


def check_single_file(content, properties, results):
    """Check a single file content for authentication methods"""
    
    # Method 1: Simple regex pattern matching for direct authentication methods
    direct_auth_pattern = r'<key>authenticationMethod</key>\s*<value>([^<{]+)</value>'
    direct_matches = re.findall(direct_auth_pattern, content)
    
    for match in direct_matches:
        auth_method = match.strip()
        if auth_method and auth_method not in results["auth_methods"]:
            results["auth_methods"].append(auth_method)
            print(f"Found direct authentication method: {auth_method}")
            
            # Check if it's Basic Authentication
            if auth_method.lower() == "basic" or auth_method.lower() == "basic authentication":
                results["is_compliant"] = False
                results["issues"].append(f"Direct Basic Authentication detected: '{auth_method}'")
                print(f"  ⚠️ Non-compliant: Direct Basic Authentication detected")
    
    # Method 2: Find parameterized authentication methods
    param_auth_pattern = r'<key>authenticationMethod</key>\s*<value>{{([^}]+)}}</value>'
    param_matches = re.findall(param_auth_pattern, content)
    
    for match in param_matches:
        param_name = match.strip()
        print(f"Found parameterized authentication: {{{param_name}}}")
        results["details"].append(f"Found parameterized authentication: {{{param_name}}}")
        
        # Try to resolve the parameter
        resolved_value = None
        
        # Check if the parameter exists in the properties dictionary
        for prop_key, prop_value in properties.items():
            if prop_key == param_name or prop_key.endswith(f"_{param_name}"):
                resolved_value = prop_value
                print(f"  Resolved parameter {param_name} to {resolved_value} from key {prop_key}")
                break
        
        if resolved_value:
            auth_method = f"{resolved_value} (from {param_name})"
            if auth_method not in results["auth_methods"]:
                results["auth_methods"].append(auth_method)
            
            # Check if it's Basic Authentication
            if resolved_value.lower() == "basic" or resolved_value.lower() == "basic authentication":
                results["is_compliant"] = False
                results["issues"].append(f"Basic Authentication detected via parameter: '{param_name}' = '{resolved_value}'")
                print(f"  ⚠️ Non-compliant: Basic Authentication detected via parameter")
        else:
            results["details"].append(f"Could not resolve parameter: '{param_name}'")
            print(f"  Could not resolve parameter: '{param_name}'")
    
    # Method 3: Try to parse with XML and check message flow nodes
    try:
        root = ET.fromstring(content)
        
        # Find all message flows
        try:
            namespaces = {
                'bpmn2': 'http://www.omg.org/spec/BPMN/20100524/MODEL',
                'ifl': 'http:///com.sap.ifl.model/Ifl.xsd'
            }
            
            # Try with namespace
            message_flows = root.findall(".//bpmn2:messageFlow", namespaces)
            print(f"Found {len(message_flows)} message flows using namespace")
            
            # Also try without namespace as fallback
            if not message_flows:
                message_flows = root.findall(".//messageFlow")
                print(f"Found {len(message_flows)} message flows without namespace")
            
            # Process each message flow
            for flow in message_flows:
                # Extract flow ID and name for better reporting
                flow_id = flow.get("id", "unknown")
                flow_name = flow.get("name", "unknown")
                
                print(f"Checking message flow: {flow_id} - {flow_name}")
                
                # First try to find properties with namespace
                auth_value = None
                
                # Look for ifl:property elements
                try:
                    properties_elements = flow.findall(".//ifl:property", namespaces)
                    for prop in properties_elements:
                        key = prop.find("./key", namespaces)
                        value = prop.find("./value", namespaces)
                        
                        if key is not None and key.text == "authenticationMethod" and value is not None:
                            auth_value = value.text
                            print(f"  Found authentication method in property: {auth_value}")
                            break
                except Exception as e:
                    print(f"  Error searching with namespace: {str(e)}")
                
                # If not found, try without namespace
                if not auth_value:
                    try:
                        props = flow.findall(".//property")
                        for prop in props:
                            key = prop.find("./key")
                            value = prop.find("./value")
                            
                            if key is not None and key.text == "authenticationMethod" and value is not None:
                                auth_value = value.text
                                print(f"  Found authentication method without namespace: {auth_value}")
                                break
                    except Exception as e:
                        print(f"  Error searching without namespace: {str(e)}")
                
                # Process found authentication value
                if auth_value:
                    # Check if parameterized
                    if auth_value.startswith("{{") and auth_value.endswith("}}"):
                        param_name = auth_value[2:-2].strip()
                        print(f"  Found parameterized authentication in message flow: {{{param_name}}}")
                        
                        # Try to resolve parameter
                        resolved_value = None
                        for prop_key, prop_value in properties.items():
                            if prop_key == param_name or prop_key.endswith(f"_{param_name}"):
                                resolved_value = prop_value
                                print(f"  Resolved message flow parameter {param_name} to {resolved_value} from key {prop_key}")
                                break
                        
                        if resolved_value:
                            auth_method = f"{resolved_value} (from {param_name} in message flow)"
                            if auth_method not in results["auth_methods"]:
                                results["auth_methods"].append(auth_method)
                            
                            # Check if Basic Authentication
                            if resolved_value.lower() == "basic" or resolved_value.lower() == "basic authentication":
                                results["is_compliant"] = False
                                results["issues"].append(f"Basic Authentication detected in message flow via parameter: '{param_name}' = '{resolved_value}'")
                                print(f"  ⚠️ Non-compliant: Basic Authentication in message flow via parameter")
                        else:
                            results["details"].append(f"Could not resolve parameter in message flow: '{param_name}'")
                            print(f"  Could not resolve message flow parameter: '{param_name}'")
                    else:
                        # Direct value
                        if auth_value not in results["auth_methods"]:
                            results["auth_methods"].append(auth_value)
                        
                        # Check if Basic Authentication
                        if auth_value.lower() == "basic" or auth_value.lower() == "basic authentication":
                            results["is_compliant"] = False
                            results["issues"].append(f"Direct Basic Authentication found in message flow: '{auth_value}'")
                            print(f"  ⚠️ Non-compliant: Direct Basic Authentication in message flow")
        
        except Exception as e:
            print(f"Error analyzing message flows: {str(e)}")
            import traceback
            traceback.print_exc()
    
    except ET.ParseError as e:
        print(f"Could not parse XML content: {str(e)}")
    except Exception as e:
        print(f"Error during XML processing: {str(e)}")
        import traceback
        traceback.print_exc()
    
    # Final safety check - look for any basic authentication references in the content
    if not any(method.lower().startswith("basic") for method in results["auth_methods"]) and "basic authentication" in content.lower():
        results["details"].append("Found references to Basic Authentication in content")
        print("Found references to Basic Authentication in content")
        
        # Only mark as non-compliant if we detect actual Basic Auth usage, not just references
        if not results["is_compliant"] or re.search(r'<value>\s*basic\s*</value>', content.lower()):
            results["is_compliant"] = False
            results["issues"].append("Basic Authentication detected via pattern match")
            print(f"  ⚠️ Non-compliant: Basic Authentication detected via pattern match")


def main():
    """Main function when run as script"""
    if len(sys.argv) < 2:
        print(f"Usage: {sys.argv[0]} <path_to_iflow_file>")
        sys.exit(1)
    
    iflow_file = sys.argv[1]
    
    if not os.path.exists(iflow_file):
        print(f"Error: IFlow file not found: {iflow_file}")
        sys.exit(1)
    
    # Run the check
    results = check_authentication_security(iflow_file)
    
    # Print summary
    print("\nSecurity Check Summary")
    print("=====================")
    print(f"IFlow file: {iflow_file}")
    print(f"Authentication methods found: {', '.join(results['auth_methods']) or 'None'}")
    print(f"Compliant: {'Yes' if results['is_compliant'] else 'No'}")
    
    if results["issues"]:
        print("\nSecurity Issues:")
        for issue in results["issues"]:
            print(f"- {issue}")


# Test case for direct demonstration
def test_with_sample_data():
    """Run a test with sample data"""
    print("Running test with sample data...")
    
    # Create temporary directory
    temp_dir = tempfile.mkdtemp()
    
    try:
        # Create test ZIP file with IFlow and properties
        with zipfile.ZipFile(os.path.join(temp_dir, "test_iflow.zip"), 'w') as zipf:
            # Add IFlow content
            iflow_content = """<?xml version="1.0" encoding="UTF-8"?>
<bpmn2:definitions xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:ifl="http:///com.sap.ifl.model/Ifl.xsd">
  <bpmn2:collaboration id="Collaboration_1">
    <bpmn2:messageFlow id="MessageFlow_3" name="" sourceRef="ServiceTask_6" targetRef="Participant_8">
      <bpmn2:extensionElements>
        <ifl:property>
          <key>authenticationMethod</key>
          <value>{{S4HANA_authenticationMethod_16}}</value>
        </ifl:property>
      </bpmn2:extensionElements>
    </bpmn2:messageFlow>
  </bpmn2:collaboration>
</bpmn2:definitions>"""
            
            # Add properties content
            properties_content = """#Tue Apr 15 22:01:00 UTC 2025
S4HANA_authenticationMethod_16=Client Certificate
AUTH_METHOD=Basic
"""
            
            # Write files to ZIP
            zipf.writestr("src/main/resources/test.iflw", iflow_content)
            zipf.writestr("parameters.prop", properties_content)
        
        # Run the check
        iflow_zip = os.path.join(temp_dir, "test_iflow.zip")
        print(f"\nTesting IFlow ZIP with embedded parameters.prop: {iflow_zip}")
        check_authentication_security(iflow_zip)
        
        # Create test ZIP file with Basic Auth
        with zipfile.ZipFile(os.path.join(temp_dir, "test_basic_iflow.zip"), 'w') as zipf:
            # Add IFlow content with Basic Auth
            iflow_basic_content = """<?xml version="1.0" encoding="UTF-8"?>
<bpmn2:definitions xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:ifl="http:///com.sap.ifl.model/Ifl.xsd">
  <bpmn2:collaboration id="Collaboration_1">
    <bpmn2:messageFlow id="MessageFlow_3" name="" sourceRef="ServiceTask_6" targetRef="Participant_8">
      <bpmn2:extensionElements>
        <ifl:property>
          <key>authenticationMethod</key>
          <value>{{AUTH_METHOD}}</value>
        </ifl:property>
      </bpmn2:extensionElements>
    </bpmn2:messageFlow>
  </bpmn2:collaboration>
</bpmn2:definitions>"""
            
            # Add properties content
            basic_properties_content = """#Tue Apr 15 22:01:00 UTC 2025
AUTH_METHOD=Basic
S4HANA_authenticationMethod_16=Client Certificate
"""
            
            # Write files to ZIP
            zipf.writestr("src/main/resources/test.iflw", iflow_basic_content)
            zipf.writestr("parameters.prop", basic_properties_content)
        
        # Run the check on Basic Auth ZIP
        basic_iflow_zip = os.path.join(temp_dir, "test_basic_iflow.zip")
        print(f"\nTesting IFlow ZIP with Basic Authentication: {basic_iflow_zip}")
        check_authentication_security(basic_iflow_zip)
        
    finally:
        # Clean up
        import shutil
        shutil.rmtree(temp_dir)


if __name__ == "__main__":
    if len(sys.argv) == 1:
        # No arguments, run the test
        test_with_sample_data()
    else:
        # Arguments provided, run normally
        main()
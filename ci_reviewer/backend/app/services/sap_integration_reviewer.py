#!/usr/bin/env python
"""
Enhanced SAP Integration Package Review Agent with CrewAI and Parallel Processing

This tool uses CrewAI to create an agentic application that:
1. Extracts integration packages from SAP Integration Suite based on user queries
2. Reviews IFlow implementations against design guidelines
3. Supports reviewing specific IFlows within packages or entire packages
4. Processes multiple IFlow reviews in parallel
5. Generates comprehensive compliance reports

Usage:
    # Original query-based mode:
    python refactored_sap_integration_reviewer.py --query "Your query" --guidelines path/to/guidelines.md 
        [--llm provider] [--model model_name]
        
    # Direct package review mode (no query needed):
    python refactored_sap_integration_reviewer.py --packages "pkg1,pkg2" --guidelines path/to/guidelines.md
        [--iflows "pkg1:iflow1,iflow2;pkg2:iflow3"] [--llm provider] [--model model_name]
        
    # Direct iFlow file review mode:
    python refactored_sap_integration_reviewer.py --iflow-path "path/to/iflow.zip" --guidelines path/to/guidelines.md
        [--llm provider] [--model model_name]
"""

import os,codecs
import sys
import json
import re
import concurrent.futures
import time
from datetime import datetime
from typing import Dict, List, Any, Optional
import traceback
import json
# Import the refactored SAPConnection class
from app.services.sap_tools import SAPConnection, programmatically_set_query

# CrewAI imports
from crewai import Agent, Task, Crew, Process
from crewai.tools import tool
# Import custom logging utilities
from app.services.logging_utils import setup_logging, capture_all_output
import logging
import contextlib
import argparse

handler = logging.StreamHandler(sys.stdout)
handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))
handler.stream = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)
logger = logging.getLogger()
logger.addHandler(handler)

from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class SAPAgentCreator:
    """Creates the agents for SAP integration review."""
    
    def __init__(self, guidelines, llm=None, model=None, temperature=0.7, sap_connection=None):
        self.guidelines = guidelines
        self.llm = llm
        self.model = model
        self.temperature = temperature
        self.sap_connection = sap_connection or SAPConnection()
    
    def create_agents(self):
        """Create the specialized agents for the workflow."""
        # Configure LLM based on provider and model
        agent_config = {}
        if self.llm and self.llm != "default":
            llm_config = {
                "provider": self.llm,
                "temperature": self.temperature,
                "config": {}  
            }
            
            if self.model:
                llm_config["config"]["model"] = self.model
                
            # Add debug print to verify LLM configuration
            print(f"Creating agents with LLM config: {llm_config}")                    
            agent_config["llm_config"] = llm_config
        else:
            print("Using default LLM configuration")
        
        # Create wrapper functions that use the SAPConnection instance
        def set_query_wrapper(query=None):
            return self.sap_connection.set_query(query)
            
        def search_integration_packages_wrapper():
            return self.sap_connection.search_integration_packages()
            
        def get_package_details_wrapper():
            return self.sap_connection.get_package_details()
            
        def extract_iflow_wrapper(artifact_id=None):
            return self.sap_connection.extract_iflow(artifact_id)
            
        def extract_all_iflows_from_package_wrapper():
            return self.sap_connection.extract_all_iflows_from_package()
            
        def extract_current_iflow_wrapper():
            return self.sap_connection.extract_current_iflow()
            
        def get_iflow_content_wrapper(iflow_path=None):
            return self.sap_connection.get_iflow_content(iflow_path)
        
        # Import the tool decorator - for CrewAI 0.108.0
        from crewai.tools import tool
        
        # Create standalone tool functions by decorating them directly
        # This avoids the need for the 'name' parameter
        @tool
        def set_query(query=None):
            """Sets the search query for finding integration packages."""
            return self.sap_connection.set_query(query)
        
        @tool
        def search_integration_packages():
            """Searches for integration packages matching the current query."""
            return self.sap_connection.search_integration_packages()
        
        @tool
        def get_package_details():
            """Gets detailed information about the current integration package."""
            return self.sap_connection.get_package_details()
        
        @tool
        def extract_iflow(artifact_id=None):
            """Extracts a specific IFlow from a package by artifact ID."""
            return self.sap_connection.extract_iflow(artifact_id)
        
        @tool
        def extract_all_iflows_from_package():
            """Extracts all IFlows from the current package."""
            return self.sap_connection.extract_all_iflows_from_package()
        
        @tool
        def extract_current_iflow():
            """Extracts the currently selected IFlow."""
            return self.sap_connection.extract_current_iflow()
        
        @tool
        def get_iflow_content(iflow_path=None):
            """Retrieves and analyzes the content of an IFlow from its file path."""
            return self.sap_connection.get_iflow_content(iflow_path)
        
        # Create the extraction tools list
        extraction_tools = [
            set_query,
            search_integration_packages,
            get_package_details,
            extract_iflow,
            extract_all_iflows_from_package,
            extract_current_iflow
        ]
        
        # Create the review tools list
        review_tools = [
            get_iflow_content
        ]
        
        # 1. Extraction agent for retrieving packages and IFlows
        extraction_agent = Agent(
            role="SAP Integration Extraction Specialist",
            goal="Extract SAP integration packages and their IFlows based on user queries",
            backstory="""You are an expert in SAP Cloud Integration Suite with 25 years of 
            experience working with integration packages. You know how to efficiently search for,
            identify, and extract integration artifacts for analysis.""",
            verbose=True,
            tools=extraction_tools,
            allow_delegation=False,  # Disable delegation for this agent
            **agent_config
        )
        
        # 2. Review agent for analyzing IFlows against guidelines
        review_agent = Agent(
            role="SAP Integration Design Reviewer",
            goal="Review IFlow implementations against design guidelines and identify violations or improvements",
            backstory="""You are a senior integration architect with deep knowledge of SAP 
            integration best practices. Your expertise lies in analyzing integration designs 
            and identifying areas of improvement or non-compliance with established guidelines.
            You have reviewed hundreds of integrations and can quickly spot patterns and anti-patterns.""",
            verbose=True,
            tools=review_tools,
            allow_delegation=False,  # Disable delegation for this agent
            **agent_config
        )
        
        # 3. Reporting agent for creating final reports
        reporting_agent = Agent(
            role="Integration Compliance Report Generator",
            goal="Create comprehensive yet concise reports on integration compliance status",
            backstory="""You are skilled at synthesizing technical information into clear, 
            actionable reports. Your expertise is in creating executive summaries that highlight 
            key findings, risks, and recommended actions while supporting details with evidence.
            Your reports are known for their clarity and ability to bridge technical and business understanding.""",
            verbose=True,
            tools=[],  # No tools needed for reporting
            allow_delegation=False,  # Disable delegation for this agent
            **agent_config
        )
        
        return extraction_agent, review_agent, reporting_agent    
    def create_tasks(self, extraction_agent, review_agent, reporting_agent, user_query, specific_packages=None, specific_iflows=None):
        """Create the tasks for the workflow, with support for specific packages or IFlows."""
        
        search_task = Task(
            description=f"""
            First, set the search query using the set_query tool with the query: "{user_query}".
            
            Then, search for integration packages that match this query.
            Identify the most relevant package(s) and provide a list with their IDs and descriptions.
            
            Use the search_integration_packages tool to find packages matching the query.
            The search_integration_packages tool will return a JSON string with matching packages.
            Each package has an id, name, description, and version.
            
            {f'IMPORTANT: Focus only on these specific packages: {", ".join(specific_packages)}' if specific_packages else ''}
            """,
            agent=extraction_agent,
            expected_output="A list of relevant integration packages with their IDs and basic information."
        )
        
        extract_task = Task(
            description=f"""
            For each package identified, extract all IFlow artifacts.
            The IFlows should be downloaded and saved locally for detailed analysis.
            
            Steps:
            1. Use get_package_details to get details of each package including its IFlows
            2. Use extract_all_iflows_from_package to extract all IFlows at once
            
            {f'IMPORTANT: Focus only on these specific packages: {", ".join(specific_packages)}' if specific_packages else ''}
            {f'IMPORTANT: If specific IFlows are requested, extract only these IFlows: {specific_iflows}' if specific_iflows else ''}
            
            Provide a complete list of all extracted IFlow artifacts with their file paths.
            """,
            agent=extraction_agent,
            expected_output="A complete list of extracted IFlow artifacts with their local file paths."
        )
        
        review_task = Task(
            description=f"""
            Review each extracted IFlow against these design guidelines:
            
            {self.guidelines}
            
            Steps:
            1. For each IFlow file path, use get_iflow_content to analyze it
            2. Compare the results against each guideline section
            3. Identify compliance status, violations, and improvement areas
            4. Create a SEPARATE review report for EACH IFlow
            
            The get_iflow_content tool will return a JSON string with detailed IFlow structure.
            
            IMPORTANT:
            - You must create a SEPARATE analysis for EACH IFlow
            - Each IFlow analysis should be clearly separated with the IFlow name and version
            - For each IFlow, provide:
              * Package IFlow name and version
              * Senders
              * Receivers
              * Integration Type
              * Description
              * Compliance level (High/Medium/Low)
              * Specific violations found
              * Concrete recommendations
            
            Create a structured analysis that clearly separates each IFlow's review.
            """,
            agent=review_agent,
            expected_output="Detailed review results for each IFlow, with separate analyses for each IFlow including compliance status, violations, and recommendations."
        )
        
        report_task = Task(
            description="""
            Generate comprehensive review reports based on the findings.
            
            You should create:
            1. A main summary report that provides an overview of all IFlows
            2. Individual detailed reports for each IFlow
            
            The main summary report should include:
            - Executive summary with the list of names of Pacakges and iflows reviewed
            - Overall compliance status with percentages
            - Key findings categorized by severity
            - Top recommendations
            - Summary comparison of all IFlows
            
            Each individual IFlow report should include:
            - IFlow name, version , and description
            - Senders
            - Receivers
            - Integration Type
            - Description
            - Detailed compliance analysis
            - All violations with explanation
            - Specific recommendations for improvement
            - Risk assessment
            
            IMPORTANT:
            - Format all reports in Markdown for readability with clear sections and bullet points
            - Use headings (## and ###) to organize the reports hierarchically
            - For the individual reports, create a separate section for each IFlow
            - Ensure each IFlow's report is comprehensive and self-contained
            
            Return BOTH the main summary report AND the individual IFlow reports.
            """,
            agent=reporting_agent,
            expected_output="A complete set of reports including a main summary and individual reports for each IFlow."
        )
        
        return [search_task, extract_task, review_task, report_task]

class IFlowReviewer:
    """Class to handle reviewing a single IFlow with improved ZIP extraction and analysis."""
    
    def __init__(self, iflow_path, guidelines, llm_provider=None, model_name=None, temperature=0.3, sap_connection=None):
        self.iflow_path = iflow_path
        self.guidelines = guidelines
        self.llm_provider = llm_provider
        self.model_name = model_name
        self.temperature = temperature
        self.sap_connection = sap_connection or SAPConnection()
        self.extract_dir = None
        

    def cleanup(self):
        """Clean up extracted files."""
        if self.extract_dir and os.path.exists(self.extract_dir):
            try:
                import shutil
                shutil.rmtree(self.extract_dir)
                print(f"Cleaned up temporary directory: {self.extract_dir}")
            except Exception as e:
                print(f"Warning: Failed to clean up directory {self.extract_dir}: {str(e)}")
    
    def review(self):
        """Review a single IFlow and return the review results."""
        try:
            # Extract filename and name from path
            import os
            filename = os.path.basename(self.iflow_path)
            iflow_name = filename.split('____')[0] if '____' in filename else filename.split('.')[0]
            
            print(f"\n=== Starting review for IFlow: {iflow_name} ===")
            print(f"Path: {self.iflow_path}")
            print(f"LLM Provider: {self.llm_provider}")
            print(f"Model: {self.model_name}")
            print(f"Temperature: {self.temperature}")
            
            print("Using SAPConnection.get_iflow_content for detailed analysis...")
            iflow_content_json = self.sap_connection.get_iflow_content(self.iflow_path)
            
            # Parse the JSON response
            
            try:
                iflow_structure = iflow_content_json
                print(f"Successfully obtained IFlow structure")
            except Exception as json_error:
                print(f"Error parsing IFlow content: {str(json_error)}")
                iflow_structure = json.dumps({
                    "name": iflow_name,
                    "error": "Failed to parse IFlow content"
                })
            
            # Create a review agent
            creator = SAPAgentCreator(
                self.guidelines, 
                self.llm_provider, 
                self.model_name, 
                self.temperature,
                self.sap_connection
            )
            _, review_agent, _ = creator.create_agents()
            
            # Verify the LLM configuration was properly set for the review agent
            if hasattr(review_agent, 'llm_config'):
                print(f"Review agent LLM config: {review_agent.llm_config}")
            else:
                print("Review agent using default LLM config")
            
            # Create a task to review this specific IFlow
            review_task = Task(
                description=f"""
                Review the IFlow "{iflow_name}" against these design guidelines:
                
                {self.guidelines}
                
                Below is the iFlow structure extracted from the ZIP file:
                
                {iflow_structure}
                
                Important points about reviewing this iFlow:
                1. Analyze the iFlow architecture shown above
                2. Check if it follows design guidelines
                3. Identify any violations or security issues
                4. Evaluate error handling mechanisms
                5. Check message processing and routing logic
                6. Review any scripts for best practices
                
                Your review must include:
                - Package/IFlow name and version
                - Senders and receivers
                - Integration type 
                - Description
                - Compliance level (High/Medium/Low)
                - Specific guideline violations (if any)
                - Security concerns (if any)
                - Error handling assessment
                - Concrete recommendations
                
                Format your review in clear sections with markdown headings.
                """,
                agent=review_agent,
                expected_output="Detailed review results for the IFlow including compliance status, violations, and recommendations."
            )
            
            # Create a specialized crew for just this review
            review_crew = Crew(
                agents=[review_agent],
                tasks=[review_task],
                verbose=True,
                process=Process.sequential
            )
            
            print(f"Starting review for IFlow: {iflow_name}")
            result = review_crew.kickoff()
            
            # Extract the result content
            if hasattr(result, 'raw'):
                content = result.raw
            elif hasattr(result, 'last_task_output'):
                content = result.last_task_output
            elif hasattr(result, 'outputs') and len(result.outputs) > 0:
                content = result.outputs[-1]
            elif hasattr(result, '__str__'):
                content = str(result)
            else:
                content = f"# IFlow Review: {iflow_name}\n\nUnable to retrieve review results."
            
            return {
                "iflow_name": iflow_name,
                "path": self.iflow_path,
                "review": content
            }
        except Exception as e:
            error_msg = f"Error reviewing IFlow {self.iflow_path}: {str(e)}"
            traceback.print_exc()
            return {
                "iflow_name": iflow_name if 'iflow_name' in locals() else "unknown",
                "path": self.iflow_path,
                "review": f"# Error in Review\n\n{error_msg}",
                "error": str(e)
            }
        finally:
            # Clean up extracted files
            self.cleanup()
def direct_review_packages(
    packages,
    specific_iflows,
    guidelines,
    llm_provider=None,
    model_name=None,
    temperature=0.3,
    parallel=True,
    max_workers=4,
    progress_callback=None,
    sap_connection=None
):
    # Validate inputs with better error messages
    if not packages:
        print("Error: No packages specified for review")
        return generate_error_report("No packages specified for review")
    
    print(f"Starting direct review of {len(packages)} packages")
    print(f"Specific IFlows configuration: {json.dumps(specific_iflows, indent=2)}")
    
    # Create a SAPConnection instance if not provided
    sap_conn = sap_connection or SAPConnection()
    
    # Step 1: Create agents to use the tools
    creator = SAPAgentCreator(guidelines, llm_provider, model_name, temperature, sap_conn)
    extraction_agent, review_agent, reporting_agent = creator.create_agents()
    
    # Step 2: Extract all specified iFlows from each package
    iflow_paths = []
    extraction_errors = []
    
    for package_id in packages:
        print(f"\nExtracting iFlows from package: {package_id}")
        
        # Set current package ID in the SAPConnection
        print(f"Setting current_package_id to: '{package_id}'")
        sap_conn.current_package_id = package_id.strip()  # Strip any whitespace
        
        # Ensure the package ID is properly formatted
        # Debug the package ID to check for formatting issues
        debug_info = sap_conn.debug_package_id(package_id)
        print(f"Package ID debug info: {debug_info}")
        
        # Set query to match package ID
        programmatically_set_query(package_id)
        
        try:
            # Get details for this package including its IFlows
            print(f"Getting details for package: {package_id}")
            package_details = sap_conn.get_iflow_details(package_id)
            print(f"Package details sample: {package_details[:200]}...")
            
            # Parse the package details to get IFlow IDs
            try:
                details_data = json.loads(package_details)
                iflows = []
                
                # Handle different response formats
                if "d" in details_data and "results" in details_data["d"]:
                    iflows = details_data["d"]["results"]
                elif "results" in details_data:
                    iflows = details_data["results"]
                
                if not iflows:
                    error_msg = f"No IFlows found in package {package_id}"
                    print(error_msg)
                    extraction_errors.append(error_msg)
                    continue
                
                print(f"Found {len(iflows)} IFlows in package {package_id}")
                
                # Filter IFlows based on user specifications
                iflows_to_extract = []
                
                if specific_iflows and package_id in specific_iflows:
                    selection = specific_iflows[package_id]
                    
                    # Handle 'all' selection
                    if selection == "all" or selection == ["all"]:
                        print(f"Selecting all IFlows in package {package_id}")
                        iflows_to_extract = iflows
                    # Handle list of IFlow IDs
                    elif isinstance(selection, list):
                        print(f"Filtering IFlows to match selections: {selection}")
                        for iflow in iflows:
                            iflow_id = iflow.get("Id", "")
                            iflow_name = iflow.get("Name", "")
                            
                            if iflow_id in selection or iflow_name in selection:
                                print(f"Selected IFlow: {iflow_name} ({iflow_id})")
                                iflows_to_extract.append(iflow)
                    # Handle string (single IFlow ID)
                    elif isinstance(selection, str):
                        print(f"Looking for single IFlow selection: {selection}")
                        for iflow in iflows:
                            iflow_id = iflow.get("Id", "")
                            iflow_name = iflow.get("Name", "")
                            
                            if iflow_id == selection or iflow_name == selection:
                                print(f"Selected IFlow: {iflow_name} ({iflow_id})")
                                iflows_to_extract.append(iflow)
                else:
                    print(f"No specific IFlow selections for package {package_id}, using all")
                    iflows_to_extract = iflows
                
                if not iflows_to_extract:
                    error_msg = f"No matching IFlows found for selection in package {package_id}"
                    print(error_msg)
                    extraction_errors.append(error_msg)
                    continue
                
                print(f"Extracting {len(iflows_to_extract)} IFlows from package {package_id}")
                
                # Extract each IFlow
                for iflow in iflows_to_extract:
                    iflow_id = iflow.get("Id", "")
                    iflow_name = iflow.get("Name", "")
                    
                    print(f"Extracting IFlow: {iflow_name} ({iflow_id})")
                    
                    # Set current IFlow ID
                    sap_conn.current_iflow_id = iflow_id
                    sap_conn.current_iflow_name = iflow_name
                    
                    # Extract the IFlow
                    try:
                        iflow_path = sap_conn.extract_iflow(iflow_id)
                        
                        if iflow_path.startswith("Error:"):
                            error_msg = f"Failed to extract IFlow {iflow_name}: {iflow_path}"
                            print(error_msg)
                            extraction_errors.append(error_msg)
                            continue
                        
                        print(f"Successfully extracted IFlow to: {iflow_path}")
                        iflow_paths.append(iflow_path)
                    except Exception as extract_error:
                        error_msg = f"Error extracting IFlow {iflow_name}: {str(extract_error)}"
                        print(error_msg)
                        extraction_errors.append(error_msg)
                
            except json.JSONDecodeError as json_error:
                error_msg = f"Failed to parse package details: {str(json_error)}"
                print(error_msg)
                extraction_errors.append(error_msg)
                
        except Exception as e:
            error_msg = f"Error processing package {package_id}: {str(e)}"
            print(error_msg)
            traceback.print_exc()
            extraction_errors.append(error_msg)
    
    # Step 3: Review extracted IFlows
    if not iflow_paths:
        error_report_filename = generate_error_report(
            "No IFlows were successfully extracted for review",
            extraction_errors
        )
        return error_report_filename
    
    print(f"\nReviewing {len(iflow_paths)} extracted IFlows")
    
    # Track progress
    total_iflows = len(iflow_paths)
    if progress_callback:
        progress_callback({
            'progress': 20,
            'totalIFlows': total_iflows,
            'completedIFlows': 0
        })
    
    # Review IFlows (in parallel or sequentially)
    iflow_reviews = []
    
    if parallel and len(iflow_paths) > 1:
        print(f"Using parallel processing with {min(max_workers, len(iflow_paths))} workers")
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=min(max_workers, len(iflow_paths))) as executor:
            # Create review tasks
            future_to_path = {
                executor.submit(
                    IFlowReviewer(
                        path,
                        guidelines,
                        llm_provider,
                        model_name,
                        temperature,
                        sap_conn
                    ).review
                ): path for path in iflow_paths
            }
            
            # Process completed reviews as they finish
            completed_iflows = 0
            for future in concurrent.futures.as_completed(future_to_path):
                path = future_to_path[future]
                
                try:
                    review_result = future.result()
                    iflow_reviews.append(review_result)
                    completed_iflows += 1
                    print(f"Completed review {completed_iflows}/{len(iflow_paths)}: {review_result.get('iflow_name', 'unknown')}")
                    
                    # Update progress
                    if progress_callback:
                        progress = 20 + int((completed_iflows / total_iflows) * 60)
                        progress_callback({
                            'progress': progress,
                            'completedIFlows': completed_iflows,
                            'totalIFlows': total_iflows
                        })
                except Exception as e:
                    print(f"Error in review for {path}: {str(e)}")
                    traceback.print_exc()
                    iflow_reviews.append({
                        "iflow_name": "error",
                        "path": path,
                        "review": f"# Error in Review\n\n{str(e)}",
                        "error": str(e)
                    })
                    completed_iflows += 1
                    
                    # Update progress for errors too
                    if progress_callback:
                        progress = 20 + int((completed_iflows / total_iflows) * 60)
                        progress_callback({
                            'progress': progress,
                            'completedIFlows': completed_iflows,
                            'totalIFlows': total_iflows
                        })
    else:
        # Sequential processing
        print("Using sequential processing")
        for i, path in enumerate(iflow_paths):
            print(f"Reviewing IFlow {i+1}/{len(iflow_paths)}: {path}")
            reviewer = IFlowReviewer(
                path, 
                guidelines, 
                llm_provider, 
                model_name, 
                temperature,
                sap_conn
            )
            
            try:
                review_result = reviewer.review()
                iflow_reviews.append(review_result)
                
                # Update progress
                if progress_callback:
                    completed_iflows = i + 1
                    progress = 20 + int((completed_iflows / total_iflows) * 60)
                    progress_callback({
                        'progress': progress,
                        'completedIFlows': completed_iflows,
                        'totalIFlows': total_iflows
                    })
            except Exception as e:
                print(f"Error reviewing {path}: {str(e)}")
                traceback.print_exc()
                iflow_reviews.append({
                    "iflow_name": "error",
                    "path": path,
                    "review": f"# Error in Review\n\n{str(e)}",
                    "error": str(e)
                })
    
    # Step 4: Generate reports
    print("\nGenerating review reports")
    if progress_callback:
        progress_callback({
            'progress': 80,
            'completedIFlows': total_iflows,
            'totalIFlows': total_iflows
        })
    
    # Generate timestamp for report files
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    provider_str = f"_{llm_provider}" if llm_provider and llm_provider != "default" else ""
    model_str = f"_{model_name.replace('-', '_')}" if model_name else ""

    # Create reports directory if it doesn't exist
    reports_dir = os.path.join("housekeeping", "reports")
    if not os.path.exists(reports_dir):
        os.makedirs(reports_dir)

    # Create main summary report filename
    main_report_filename = os.path.join(reports_dir, f"direct_review_summary{provider_str}{model_str}_{timestamp}.md")
    
    # Create the final report
    try:
        # Prepare a combined report
        report_input = "# SAP Integration Direct Review Summary\n\n"
        report_input += f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
        report_input += f"## Review Coverage\n\n"
        report_input += f"- Total packages: {len(packages)}\n"
        report_input += f"- Packages reviewed: {', '.join(packages)}\n"
        report_input += f"- Total IFlows reviewed: {len(iflow_reviews)}\n"
        
        if extraction_errors:
            report_input += f"\n## Extraction Errors\n\n"
            for error in extraction_errors:
                report_input += f"- {error}\n"
        
        # Add individual review sections
        report_input += "\n## Individual IFlow Reviews\n\n"
        for review in iflow_reviews:
            report_input += f"### IFlow: {review.get('iflow_name', 'Unknown')}\n\n"
            report_input += review.get('review', 'No review data available') + "\n\n"
            report_input += "---\n\n"
        
        # Use an LLM to generate a better summary report
        final_report_task = Task(
            description=f"""
            Analyze and summarize the following reviews to create a comprehensive report:
            
            {report_input}
            
            Your task is to:
            1. Create an executive summary of all reviews
            2. Identify common patterns, violations, and recommendations
            3. Calculate overall compliance statistics
            4. Present the most critical findings
            5. Organize the individual reports into a cohesive whole
            
            Format your response in Markdown with clear sections and organization.
            """,
            agent=reporting_agent,
            expected_output="A comprehensive integration review report"
        )
        
        # Run the final report task
        reporting_crew = Crew(
            agents=[reporting_agent],
            tasks=[final_report_task],
            verbose=True,
            process=Process.sequential
        )
        
        report_result = reporting_crew.kickoff()
        
        # Extract the final report content
        if hasattr(report_result, 'raw'):
            final_report = report_result.raw
        elif hasattr(report_result, 'last_task_output'):
            final_report = report_result.last_task_output
        elif hasattr(report_result, 'outputs') and len(report_result.outputs) > 0:
            final_report = report_result.outputs[-1]
        elif hasattr(report_result, '__str__'):
            final_report = str(report_result)
        else:
            final_report = report_input  # Fallback to the input if we can't get the result
        
        # Save the main report
        with open(main_report_filename, "w") as f:
            f.write(final_report)
        
        # Save individual IFlow reports
        saved_reports = []
        for review in iflow_reviews:
            iflow_name = review.get('iflow_name', 'unknown')
            clean_id = re.sub(r'[^\w\-\.]', '_', iflow_name)
            iflow_report_filename = os.path.join(reports_dir, f"iflow_{clean_id}_{timestamp}.md")
            
            with open(iflow_report_filename, "w") as f:
                f.write(f"# IFlow Report: {iflow_name}\n\n")
                f.write(review.get('review', 'No review data available'))
            
            saved_reports.append(iflow_report_filename)
            print(f"Saved report for IFlow '{iflow_name}' to {iflow_report_filename}")
        
        # Update progress to final phase
        if progress_callback:
            progress_callback({
                'progress': 100,
                'completedIFlows': total_iflows,
                'totalIFlows': total_iflows
            })
            
        print(f"\nDirect review complete! Main report saved to {main_report_filename}")
        print(f"Plus {len(saved_reports)} individual IFlow reports saved to the same directory.")
        
        return main_report_filename
        
    except Exception as e:
        error_msg = f"Error generating reports: {str(e)}"
        print(error_msg)
        traceback.print_exc()
        
        # Create an error report
        error_report_filename = generate_error_report(
            f"Error generating reports: {str(e)}",
            extraction_errors
        )
        
        return error_report_filename

def direct_review_iflow_file(
    iflow_path,
    guidelines,
    llm_provider=None,
    model_name=None,
    temperature=0.3,
    progress_callback=None,
    sap_connection=None):
    """
    Directly review a single iFlow file without using SAP APIs.
    
    Args:
        iflow_path (str): Path to the iFlow ZIP file
        guidelines (str): Design guidelines content
        llm_provider (str, optional): LLM provider
        model_name (str, optional): Model name
        temperature (float, optional): Temperature for LLM
        progress_callback (callable, optional): Callback for progress updates
        sap_connection (SAPConnection, optional): SAPConnection instance to use
        
    Returns:
        str: Path to the generated report file
    """
    # Validate inputs
    if not iflow_path or not os.path.exists(iflow_path):
        error_report_filename = generate_error_report(
            f"iFlow file not found: {iflow_path}",
            []
        )
        return error_report_filename
    
    print(f"Starting direct review of iFlow file: {iflow_path}")
    
    # Update progress to start
    if progress_callback:
        progress_callback({
            'progress': 10,
            'message': 'Starting iFlow review'
        })
    
    # Create a SAPConnection instance if not provided
    sap_conn = sap_connection or SAPConnection()
    
    try:
        # Create reviewer and run review
        reviewer = IFlowReviewer(
            iflow_path,
            guidelines,
            llm_provider,
            model_name,
            temperature,
            sap_conn
        )
        
        # Update progress to reviewing
        if progress_callback:
            progress_callback({
                'progress': 30,
                'message': 'Analyzing iFlow content'
            })
        
        review_result = reviewer.review()
        
        # Update progress to generating report
        if progress_callback:
            progress_callback({
                'progress': 80,
                'message': 'Generating report'
            })
        
        # Create reports directory
        reports_dir = os.path.join("housekeeping", "reports")
        if not os.path.exists(reports_dir):
            os.makedirs(reports_dir)
        
        # Generate timestamp for filenames
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Get iFlow name from review result or filename
        iflow_name = review_result.get('iflow_name', os.path.basename(iflow_path))
        clean_name = "".join(c if c.isalnum() or c in "._- " else "_" for c in iflow_name)
        
        # Generate report filename
        report_filename = os.path.join(
            reports_dir, 
            f"iflow_{clean_name}_{timestamp}.md"
        )
        
        # Save the report
        with open(report_filename, "w") as f:
            f.write(f"# iFlow Direct Review: {iflow_name}\n\n")
            f.write(review_result.get('review', 'No review data available'))
        
        # Update progress to complete
        if progress_callback:
            progress_callback({
                'progress': 100,
                'message': 'Review complete'
            })
        
        print(f"\nDirect review complete! Report saved to {report_filename}")
        
        return report_filename
        
    except Exception as e:
        error_msg = f"Error reviewing iFlow file: {str(e)}"
        print(error_msg)
        traceback.print_exc()
        
        # Create an error report
        error_report_filename = generate_error_report(
            f"Error reviewing iFlow file: {str(e)}",
            []
        )
        
        return error_report_filename

def generate_error_report(main_error_message, additional_errors=None):
    """
    Generate an error report file.
    
    Args:
        main_error_message (str): The main error message
        additional_errors (list, optional): List of additional error messages
        
    Returns:
        str: Path to the error report file
    """
    # Create reports directory
    reports_dir = os.path.join("housekeeping", "reports")
    if not os.path.exists(reports_dir):
        os.makedirs(reports_dir)
    
    # Generate timestamp for filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Create error report filename
    error_report_filename = os.path.join(reports_dir, f"review_error_{timestamp}.md")
    
    # Generate the error report content
    report_content = "# SAP Integration Review Error Report\n\n"
    report_content += f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
    report_content += f"## Error Details\n\n"
    report_content += f"{main_error_message}\n\n"
    
    if additional_errors:
        report_content += f"## Additional Errors\n\n"
        for error in additional_errors:
            report_content += f"- {error}\n"
    
    # Save the error report
    with open(error_report_filename, "w") as f:
        f.write(report_content)
    
    print(f"Error report saved to: {error_report_filename}")
    return error_report_filename

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
    
    # Remove any existing handlers to avoid duplicates
    logger = logging.getLogger()
    for handler in logger.handlers[:]:
        logger.removeHandler(handler)
    
    # Configure the root logger with both file and console handlers
    file_handler = logging.FileHandler(log_file_path, mode='w', encoding='utf-8')
    file_handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))
    
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))
    
    logger.setLevel(logging.INFO)
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    
    # Log startup information
    logger.info(f"Starting SAP Integration Reviewer")
    logger.info(f"Log file created at: {log_file_path}")
    
    return log_file_path

# Fix 2: Improved LoggerWriter class - replace the entire class
class LoggerWriter:
    def __init__(self, level):
        self.level = level
        self.logger = logging.getLogger()
        self.buf = ""

    def write(self, message):
        if message:
            if '\n' in message:
                # Handle case with newlines - split and log complete lines
                parts = message.split('\n')
                for i, part in enumerate(parts):
                    if i < len(parts) - 1:
                        # Complete line (has newline)
                        self.buf += part
                        self.flush()
                    else:
                        # Last part (might be incomplete)
                        self.buf += part
            else:
                # No newline, accumulate in buffer
                self.buf += message

    def flush(self):
        if self.buf:
            self.logger.log(self.level, self.buf.rstrip())
            self.buf = ""

# Context manager to capture all output to log
@contextlib.contextmanager
def capture_all_output(log_file_path):
    # Save original stdout/stderr
    old_stdout = sys.stdout
    old_stderr = sys.stderr
    
    # Create logger writers
    stdout_logger = LoggerWriter(logging.INFO)
    stderr_logger = LoggerWriter(logging.ERROR)
    
    logging.info(f"Redirecting output to log file: {log_file_path}")
    
    try:
        # Redirect stdout/stderr to our loggers
        sys.stdout = stdout_logger
        sys.stderr = stderr_logger
        
        logging.info(f"Output capture started")
        
        # Return control to the calling code
        yield
    finally:
        # Flush any remaining content
        stdout_logger.flush()
        stderr_logger.flush()
        
        # Restore original stdout/stderr
        sys.stdout = old_stdout
        sys.stderr = old_stderr
        
        logging.info(f"Output capture completed")


# Feedback handling functionality
def collect_feedback(report_file, sections=None):
    """
    Collect user feedback on a report with enhanced error handling.
    
    Args:
        report_file (str): Path to the report file
        sections (list, optional): List of section names to specifically collect feedback on.
                                  If None, use default sections.
    
    Returns:
        dict: Feedback collected from user
    """
    if not os.path.exists(report_file):
        print(f"Error: Report file {report_file} not found.")
        return None
    
    # Read the report content
    try:
        with open(report_file, "r") as f:
            report_content = f.read()
    except Exception as e:
        print(f"Error reading report file: {str(e)}")
        return None
    
    # Set a flag to track network-related errors
    network_issues = False
    
    # Disable network telemetry during feedback collection to avoid timeouts
    try:
        # Try to disable OpenTelemetry temporarily if it's causing issues
        import opentelemetry
        from opentelemetry.sdk.trace import TracerProvider
        from opentelemetry.sdk.trace.export import SimpleSpanProcessor, ConsoleSpanExporter
        
        # Save original configuration to restore later
        original_provider = opentelemetry.trace._TRACER_PROVIDER
        
        # Create a local non-exporting provider
        local_provider = TracerProvider()
        local_provider.add_span_processor(SimpleSpanProcessor(ConsoleSpanExporter()))
        opentelemetry.trace._TRACER_PROVIDER = local_provider
        
        print("Temporarily disabled network telemetry for feedback collection")
    except (ImportError, AttributeError) as e:
        # OpenTelemetry might not be available or configured differently
        print(f"Note: Could not modify telemetry settings: {str(e)}")
    
    print("\n" + "="*80)
    print("FEEDBACK COLLECTION")
    print("="*80)
    print(f"Please provide feedback on the review report: {os.path.basename(report_file)}")
    print("Your feedback will be saved and used to improve future reviews.")
    
    # Define default sections if none provided
    if sections is None:
        sections = [
            "Overall Report Quality",
            "Compliance Analysis Accuracy",
            "Error Handling Evaluation",
            "Security Assessment",
            "Recommendations Relevance",
            "Missing Aspects"
        ]
    
    feedback = {
        "report_file": report_file,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "sections": {}
    }
    
    # Collect feedback for each section with timeout handling
    for section in sections:
        print(f"\n{section}:")
        print("-" * len(section))
        
        # Set a timeout for user input to prevent hanging
        try:
            # In a real implementation, you might need a platform-specific
            # solution for input timeouts as the standard Python input() 
            # doesn't support timeouts directly
            user_input = input(f"Please rate (1-5) and provide comments: ")
        except Exception as e:
            print(f"Error collecting input: {str(e)}")
            user_input = ""
        
        # Parse rating if provided (expecting format like "4 - Good analysis but...")
        rating = None
        comments = user_input
        
        if user_input and user_input[0].isdigit():
            parts = user_input.split(" ", 1)
            try:
                rating = int(parts[0])
                if len(parts) > 1:
                    comments = parts[1].lstrip("- ") 
                else:
                    comments = ""
            except ValueError:
                rating = None
        
        feedback["sections"][section] = {
            "rating": rating,
            "comments": comments
        }
    
    # Allow for general additional comments
    print("\nAdditional Comments:")
    print("-" * 20)
    
    try:
        additional_comments = input("Any other feedback or suggestions: ")
    except Exception as e:
        print(f"Error collecting additional comments: {str(e)}")
        additional_comments = ""
    
    feedback["additional_comments"] = additional_comments
    
    # Save the feedback with error handling
    try:
        save_feedback(feedback)
    except Exception as save_error:
        print(f"Error saving feedback: {str(save_error)}")
        print("Attempting to save feedback locally as backup...")
        
        try:
            # Backup save in case the main save fails
            backup_file = os.path.join(
                os.path.dirname(report_file),
                f"feedback_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            )
            with open(backup_file, "w") as f:
                json.dump(feedback, f, indent=2)
            print(f"Backup feedback saved to: {backup_file}")
        except Exception as backup_error:
            print(f"Error saving backup feedback: {str(backup_error)}")
    
    # Restore original telemetry provider if we modified it
    try:
        if 'original_provider' in locals():
            opentelemetry.trace._TRACER_PROVIDER = original_provider
            print("Restored original telemetry configuration")
    except Exception as e:
        print(f"Note: Could not restore telemetry settings: {str(e)}")
    
    print("\nThank you for your feedback! It has been saved and will be used to improve future reviews.")
    return feedback


def save_feedback(feedback):
    """
    Save collected feedback to a JSON file with enhanced error handling.
    
    Args:
        feedback (dict): Feedback data to save
    """
    # Create feedback directory if it doesn't exist
    feedback_dir = os.path.join("housekeeping", "feedback")
    try:
        if not os.path.exists(feedback_dir):
            os.makedirs(feedback_dir)
    except Exception as e:
        print(f"Warning: Could not create feedback directory: {str(e)}")
        # Fall back to saving in the current directory
        feedback_dir = "."
    
    # Create a filename based on the original report
    try:
        report_basename = os.path.basename(feedback["report_file"])
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        feedback_filename = os.path.join(
            feedback_dir, 
            f"feedback_{report_basename.replace('.md', '')}_{timestamp}.json"
        )
    except Exception as e:
        print(f"Warning: Error creating filename: {str(e)}")
        # Use a generic filename as fallback
        feedback_filename = os.path.join(feedback_dir, f"feedback_backup_{timestamp}.json")
    
    # Save as JSON with multiple attempts
    max_attempts = 3
    for attempt in range(max_attempts):
        try:
            with open(feedback_filename, "w") as f:
                json.dump(feedback, f, indent=2)
            print(f"Feedback saved to: {feedback_filename}")
            return
        except Exception as e:
            if attempt < max_attempts - 1:
                print(f"Warning: Save attempt {attempt+1} failed: {str(e)}. Retrying...")
                time.sleep(1)  # Brief pause before retry
            else:
                print(f"Error: Failed to save feedback after {max_attempts} attempts: {str(e)}")
                raise  # Re-raise to handle at higher level


def disable_telemetry_during_feedback():
    """
    Configure the application to avoid network calls during feedback collection.
    This can be called at application startup to prevent network timeouts.
    """
    try:
        # Set environment variable to disable or limit telemetry
        os.environ["OTEL_SDK_DISABLED"] = "true"
        
        # Alternatively, set to use a local exporter only
        os.environ["OTEL_EXPORTER_OTLP_ENDPOINT"] = ""
        os.environ["OTEL_TRACES_EXPORTER"] = "console"
        
        print("Configured telemetry settings for offline operation")
        return True
    except Exception as e:
        print(f"Warning: Could not configure offline telemetry: {str(e)}")
        return False

def get_previous_feedback(package_id=None, iflow_id=None):
    """
    Retrieve previous feedback that might be relevant to the current review.
    
    Args:
        package_id (str, optional): ID of the package being reviewed
        iflow_id (str, optional): ID of the IFlow being reviewed
        
    Returns:
        list: Previous feedback entries that might be relevant
    """
    feedback_dir = os.path.join("housekeeping", "feedback")
    if not os.path.exists(feedback_dir):
        return []
    
    relevant_feedback = []
    
    # Loop through all feedback files
    for filename in os.listdir(feedback_dir):
        if filename.endswith('.json'):
            try:
                with open(os.path.join(feedback_dir, filename), 'r') as f:
                    feedback_data = json.load(f)
                
                # Check if this feedback is relevant (basic implementation)
                # In a real system, you would use more sophisticated matching
                if (package_id and package_id in feedback_data.get('report_file', '')) or \
                   (iflow_id and iflow_id in feedback_data.get('report_file', '')):
                    relevant_feedback.append(feedback_data)
                elif not package_id and not iflow_id:
                    # If no specific IDs provided, include all feedback
                    relevant_feedback.append(feedback_data)
            except Exception as e:
                print(f"Error reading feedback file {filename}: {str(e)}")
    
    return relevant_feedback

def incorporate_feedback_into_prompt(design_guidelines, previous_feedback):
    """
    Incorporate previous feedback into the design guidelines prompt.
    
    Args:
        design_guidelines (str): Original design guidelines
        previous_feedback (list): List of previous feedback entries
        
    Returns:
        str: Enhanced design guidelines with feedback incorporated
    """
    if not previous_feedback:
        return design_guidelines
    
    # Extract useful information from previous feedback
    enhancement_notes = []
    
    for feedback in previous_feedback:
        for section_name, section_data in feedback.get('sections', {}).items():
            # Only include feedback with useful comments and lower ratings
            rating = section_data.get('rating')
            comments = section_data.get('comments', '').strip()
            
            if comments and (not rating or rating < 4):
                enhancement_notes.append(f"- For {section_name}: {comments}")
        
        # Include additional comments if they exist
        additional = feedback.get('additional_comments', '').strip()
        if additional:
            enhancement_notes.append(f"- Additional feedback: {additional}")
    
    # If we found useful feedback, add it to the guidelines
    if enhancement_notes:
        enhanced_guidelines = design_guidelines + "\n\n"
        enhanced_guidelines += "## Previous Feedback To Address\n\n"
        enhanced_guidelines += "Please address these specific points from previous reviews:\n\n"
        enhanced_guidelines += "\n".join(enhancement_notes)
        return enhanced_guidelines
    
    return design_guidelines

def main(
    user_query=None, 
    design_guidelines=None, 
    llm_provider=None, 
    model_name=None, 
    temperature=0.3,
    specific_packages=None,
    specific_iflows=None,
    parallel=True,
    max_workers=4,
    skip_feedback=False,
    ignore_previous_feedback=False,
    progress_callback=None,
    iflow_path=None,  # New parameter for direct iFlow file review
    sap_connection=None  # New parameter for SAPConnection instance
):
    """
    Main function to run the SAP integration review process with support for multiple review modes.
    
    Args:
        user_query (str, optional): The query to search for integration packages
        design_guidelines (str): The design guidelines to use for the review
        llm_provider (str, optional): LLM provider to use (e.g., "openai", "groq", "anthropic")
        model_name (str, optional): Specific model to use
        temperature (float, optional): Temperature setting for LLM (0.0-1.0)
        specific_packages (list, optional): List of specific package IDs to review
        specific_iflows (dict, optional): Dict mapping package IDs to IFlow names
        parallel (bool, optional): Whether to process IFlows in parallel
        max_workers (int, optional): Maximum number of parallel workers
        skip_feedback (bool, optional): Whether to skip collecting feedback
        ignore_previous_feedback (bool, optional): Whether to ignore previous feedback
        progress_callback (callable, optional): Callback for progress updates
        iflow_path (str, optional): Direct path to an iFlow ZIP file for review
        sap_connection (SAPConnection, optional): SAPConnection instance to use
        
    Returns:
        str: Path to the generated main report file
    """
    # Print which Python interpreter is being used
    print("Starting main function")
    print(sys.executable)
    
    # Create a SAPConnection instance if not provided
    sap_conn = sap_connection or SAPConnection()
    
    # Determine the review mode based on parameters
    if iflow_path:
        print(f"Running in DIRECT IFLOW FILE review mode")
        print(f"iFlow file: {iflow_path}")
        
        if design_guidelines is None:
            print("Error: design_guidelines must be provided for iFlow file review")
            return generate_error_report("No design guidelines provided for iFlow file review")
        
        return direct_review_iflow_file(
            iflow_path,
            design_guidelines,
            llm_provider,
            model_name,
            temperature,
            progress_callback,
            sap_conn
        )
    
    elif specific_packages and not user_query:
        print(f"Running in DIRECT PACKAGE review mode (no search)")
        packages_str = ', '.join(specific_packages) if specific_packages else 'All packages'
        iflows_str = str(specific_iflows) if specific_iflows else 'All IFlows'
        
        print(f"Review configuration:")
        print(f"- Packages: {packages_str}")
        print(f"- IFlows: {iflows_str}")
        print(f"- Parallel execution: {parallel} (max workers: {max_workers})")
        
        if design_guidelines is None:
            print("Error: design_guidelines must be provided for direct package review")
            return generate_error_report("No design guidelines provided for direct package review")
        
        return direct_review_packages(
            specific_packages,
            specific_iflows,
            design_guidelines,
            llm_provider,
            model_name,
            temperature,
            parallel,
            max_workers,
            progress_callback,
            sap_conn
        )
    
    else:
        # Traditional query-based mode
        print(f"Running in QUERY-BASED review mode")
        print(f"Using query: {user_query}")
        
        if not user_query:
            print("Error: user_query must be provided for query-based review")
            return generate_error_report("No query provided for query-based review")
            
        # Set the query in the SAPConnection
        sap_conn.set_query(user_query)
        # Also set it programmatically for compatibility
        programmatically_set_query(user_query)
        
        # Format specific_packages and specific_iflows for output
        packages_str = ', '.join(specific_packages) if specific_packages else 'All packages'
        iflows_str = str(specific_iflows) if specific_iflows else 'All IFlows'
        
        print(f"Review configuration:")
        print(f"- Packages: {packages_str}")
        print(f"- IFlows: {iflows_str}")
        print(f"- Parallel execution: {parallel} (max workers: {max_workers})")
        print(f"- Skip feedback collection: {skip_feedback}")
        print(f"- Ignore previous feedback: {ignore_previous_feedback}")
        
        # Print LLM configuration
        if llm_provider and llm_provider != "default":
            print(f"Using {llm_provider} LLM" + (f" with model {model_name}" if model_name else ""))
        else:
            print("Using default LLM configuration (OpenAI)")
            
        # Print detailed LLM and model info
        print(f"LLM Provider: {llm_provider or 'default'}")
        print(f"Model Name: {model_name or 'default'}")
        print(f"Temperature: {temperature}")
        
        if llm_provider == 'groq' and 'GROQ_API_KEY' not in os.environ:
            print("WARNING: Using Groq but GROQ_API_KEY is not set in environment variables")
            print("LLM will likely fall back to default provider")
        
        # If we're not ignoring previous feedback, check for and incorporate it
        if not ignore_previous_feedback and specific_packages:
            print("Checking for previous feedback...")
            previous_feedback = get_previous_feedback(specific_packages[0])
            if previous_feedback:
                print(f"Found {len(previous_feedback)} relevant previous feedback entries")
                design_guidelines = incorporate_feedback_into_prompt(design_guidelines, previous_feedback)
                print("Enhanced design guidelines with previous feedback")
        
        # Create agents and tasks for the initial extraction
        creator = SAPAgentCreator(design_guidelines, llm_provider, model_name, temperature, sap_conn)
        extraction_agent, review_agent, reporting_agent = creator.create_agents()
        
        # Verify the LLM configuration was properly set
        if hasattr(extraction_agent, 'llm_config'):
            print(f"Extraction agent LLM config: {extraction_agent.llm_config}")
        else:
            print("Extraction agent using default LLM config")
        
        # Create tasks with support for specific packages and IFlows
        tasks = creator.create_tasks(
            extraction_agent, 
            review_agent, 
            reporting_agent, 
            user_query,
            specific_packages,
            specific_iflows
        )
        
        # Generate timestamp for report files
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        provider_str = f"_{llm_provider}" if llm_provider and llm_provider != "default" else ""
        model_str = f"_{model_name.replace('-', '_')}" if model_name else ""

        # Create reports directory if it doesn't exist
        reports_dir = os.path.join("housekeeping", "reports")
        if not os.path.exists(reports_dir):
            os.makedirs(reports_dir)

        # Create main summary report filename
        main_report_filename = os.path.join(reports_dir, f"integration_review_summary{provider_str}{model_str}_{timestamp}.md")
        
        # Phase 1: Extract packages and IFlows
        print("\n=== Phase 1: Extracting Packages and IFlows ===")
        extraction_crew = Crew(
            agents=[extraction_agent],
            tasks=tasks[:2],  # Only the search and extract tasks
            verbose=True,
            process=Process.sequential
        )
        
        extraction_result = extraction_crew.kickoff()
        
        # Get the extracted IFlow paths
        if hasattr(extraction_result, 'outputs') and len(extraction_result.outputs) > 1:
            extract_output = extraction_result.outputs[1]  # Second task output (extract task)
        elif hasattr(extraction_result, 'last_task_output'):
            extract_output = extraction_result.last_task_output
        else:
            extract_output = str(extraction_result)
        
        # Parse extracted IFlow paths
        try:
            print("\nExtracting IFlow paths from output...")
            # First, try to parse as JSON
            try:
                extracted_data = json.loads(extract_output)
                if isinstance(extracted_data, dict) and 'extracted_iflows' in extracted_data:
                    iflow_paths = [iflow['path'] for iflow in extracted_data['extracted_iflows']]
                else:
                    # Search for file paths in the output
                    iflow_paths = re.findall(r'[\w\/\.-]+\.zip', extract_output)
            except json.JSONDecodeError:
                # Search for file paths in the output
                iflow_paths = re.findall(r'[\w\/\.-]+\.zip', extract_output)
            
            print(f"Found {len(iflow_paths)} IFlow paths for review")
            
            # Filter IFlow paths based on specific_iflows if provided
            if specific_iflows and isinstance(specific_iflows, dict):
                filtered_paths = []
                for path in iflow_paths:
                    # Extract package_id and iflow_name from path
                    package_id = os.path.basename(os.path.dirname(path))
                    filename = os.path.basename(path)
                    iflow_name = filename.split('_')[0] if '_' in filename else filename
                    
                    # Check if this IFlow should be included
                    if package_id in specific_iflows:
                        if specific_iflows[package_id] == 'all' or iflow_name in specific_iflows[package_id]:
                            filtered_paths.append(path)
                
                if filtered_paths:
                    print(f"Filtered down to {len(filtered_paths)} IFlows based on selection")
                    iflow_paths = filtered_paths
            
            # Phase 2: Review IFlows (parallel or sequential)
            print("\n=== Phase 2: Reviewing IFlows ===")
            iflow_reviews = []
            
            # Track total IFlows to process
            total_iflows = len(iflow_paths)
            if progress_callback and total_iflows > 0:
                progress_callback({
                    'progress': 40,
                    'totalIFlows': total_iflows,
                    'completedIFlows': 0
                })
            
            if parallel and len(iflow_paths) > 1:
                print(f"Using parallel processing with {min(max_workers, len(iflow_paths))} workers")
                
                # Use ThreadPoolExecutor for parallel processing
                with concurrent.futures.ThreadPoolExecutor(max_workers=min(max_workers, len(iflow_paths))) as executor:
                    # Create review tasks
                    future_to_path = {
                        executor.submit(
                            IFlowReviewer(
                                path, 
                                design_guidelines, 
                                llm_provider, 
                                model_name, 
                                temperature,
                                sap_conn
                            ).review
                        ): path for path in iflow_paths
                    }
                    
                    # Process completed reviews as they finish
                    completed_iflows = 0
                    for i, future in enumerate(concurrent.futures.as_completed(future_to_path)):
                        path = future_to_path[future]
                        try:
                            review_result = future.result()
                            iflow_reviews.append(review_result)
                            completed_iflows += 1
                            print(f"Completed review {completed_iflows}/{len(iflow_paths)}: {review_result.get('iflow_name', 'unknown')}")
                            
                            # Update progress through callback
                            if progress_callback:
                                # Calculate progress between 40-80% based on completion
                                progress = 40 + int((completed_iflows / total_iflows) * 40)
                                progress_callback({
                                    'progress': progress,
                                    'completedIFlows': completed_iflows,
                                    'totalIFlows': total_iflows
                                })
                        except Exception as e:
                            print(f"Error in review for {path}: {str(e)}")
                            traceback.print_exc()
                            iflow_reviews.append({
                                "iflow_name": "error",
                                "path": path,
                                "review": f"# Error in Review\n\n{str(e)}",
                                "error": str(e)
                            })
                            completed_iflows += 1
                            
                            # Update progress for errors too
                            if progress_callback:
                                progress = 40 + int((completed_iflows / total_iflows) * 40)
                                progress_callback({
                                    'progress': progress,
                                    'completedIFlows': completed_iflows,
                                    'totalIFlows': total_iflows
                                })
            else:
                # Sequential processing
                print("Using sequential processing")
                for i, path in enumerate(iflow_paths):
                    print(f"Reviewing IFlow {i+1}/{len(iflow_paths)}: {path}")
                    reviewer = IFlowReviewer(
                        path, 
                        design_guidelines, 
                        llm_provider, 
                        model_name, 
                        temperature,
                        sap_conn
                    )
                    review_result = reviewer.review()
                    iflow_reviews.append(review_result)
                    
                    # Update progress through callback
                    if progress_callback:
                        # Calculate progress between 40-80% based on completion
                        completed_iflows = i + 1
                        progress = 40 + int((completed_iflows / total_iflows) * 40)
                        progress_callback({
                            'progress': progress,
                            'completedIFlows': completed_iflows,
                            'totalIFlows': total_iflows
                        })
            
            # Phase 3: Generate combined report
            print("\n=== Phase 3: Generating Report ===")
            
            # Update progress to report generation phase
            if progress_callback:
                progress_callback({
                    'progress': 80,
                    'completedIFlows': total_iflows,
                    'totalIFlows': total_iflows
                })
            
            # Prepare a combined report
            report_input = "# SAP Integration Review Summary\n\n"
            report_input += f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
            report_input += f"## Review Coverage\n\n"
            report_input += f"- Total IFlows reviewed: {len(iflow_reviews)}\n"
            report_input += f"- Query: '{user_query}'\n"
            
            # Add individual review sections
            report_input += "\n## Individual IFlow Reviews\n\n"
            for review in iflow_reviews:
                report_input += f"### IFlow: {review.get('iflow_name', 'Unknown')}\n\n"
                report_input += review.get('review', 'No review data available') + "\n\n"
                report_input += "---\n\n"
            
            # Create the final report task
            final_report_task = Task(
                description=f"""
                Analyze and summarize the following reviews to create a comprehensive report:
                
                {report_input}
                
                Your task is to:
                1. Create an executive summary of all reviews
                2. Identify common patterns, violations, and recommendations
                3. Calculate overall compliance statistics
                4. Present the most critical findings
                5. Organize the individual reports into a cohesive whole
                
                Format your response in Markdown with clear sections and organization.
                """,
                agent=reporting_agent,
                expected_output="A comprehensive integration review report"
            )
            
            # Run the final report task
            reporting_crew = Crew(
                agents=[reporting_agent],
                tasks=[final_report_task],
                verbose=True,
                process=Process.sequential
            )
            
            report_result = reporting_crew.kickoff()
            
            # Extract the final report content
            if hasattr(report_result, 'raw'):
                final_report = report_result.raw
            elif hasattr(report_result, 'last_task_output'):
                final_report = report_result.last_task_output
            elif hasattr(report_result, 'outputs') and len(report_result.outputs) > 0:
                final_report = report_result.outputs[-1]
            elif hasattr(report_result, '__str__'):
                final_report = str(report_result)
            else:
                final_report = report_input  # Fallback to the input if we can't get the result
            
            # Update progress to final phase
            if progress_callback:
                progress_callback({
                    'progress': 90,
                    'completedIFlows': total_iflows,
                    'totalIFlows': total_iflows
                })
                
            # Save the main report
            with open(main_report_filename, "w") as f:
                f.write(final_report)
            
            # Save individual IFlow reports
            saved_reports = []
            for review in iflow_reviews:
                iflow_name = review.get('iflow_name', 'unknown')
                clean_id = re.sub(r'[^\w\-\.]', '_', iflow_name)
                iflow_report_filename = os.path.join(reports_dir, f"iflow_{clean_id}_{timestamp}.md")
                
                with open(iflow_report_filename, "w") as f:
                    f.write(f"# IFlow Report: {iflow_name}\n\n")
                    f.write(review.get('review', 'No review data available'))
                
                saved_reports.append(iflow_report_filename)
                print(f"Saved report for IFlow '{iflow_name}' to {iflow_report_filename}")
            
            print(f"\nReview complete! Main report saved to {main_report_filename}")
            print(f"Plus {len(saved_reports)} individual IFlow reports saved to the same directory.")
            
            # Final progress update to complete the job
            if progress_callback:
                progress_callback({
                    'progress': 100,
                    'completedIFlows': total_iflows,
                    'totalIFlows': total_iflows
                })
            
            # Add feedback collection after report is generated
            if not skip_feedback:
                try:
                    print("\n=== Phase 4: Collecting Feedback ===")
                    sections = [
                        "Overall Report Structure",
                        "Analysis Accuracy",
                        "Design Guidelines Compliance", 
                        "Error Handling Assessment",
                        "Security Evaluation",
                        "Recommendations Quality",
                        "Missing Important Aspects"
                    ]
                    collect_feedback(main_report_filename, sections)
                except Exception as feedback_error:
                    print(f"Error collecting feedback: {str(feedback_error)}")
                    print("Continuing without feedback collection.")
                
            return main_report_filename
            
        except Exception as e:
            error_msg = f"Error processing extracted IFlows: {str(e)}"
            print(error_msg)
            traceback.print_exc()
            
            # Create an error report
            error_report_filename = generate_error_report(
                error_msg,
                []
            )
            
            return error_report_filename

def parse_args():
    """Parse command line arguments with improved logic for direct review modes."""
    parser = argparse.ArgumentParser(description="Enhanced SAP Integration Package Review Tool")
    
    # Create mutually exclusive group for review mode
    mode_group = parser.add_mutually_exclusive_group(required=True)
    mode_group.add_argument("--query", type=str, help="Search query for integration packages")
    mode_group.add_argument("--packages", type=str, help="Comma-separated list of specific package IDs to review")
    mode_group.add_argument("--iflow-path", type=str, help="Direct path to a specific iFlow ZIP file to review")
    
    # Other arguments
    parser.add_argument("--guidelines", type=str, required=True, help="Path to design guidelines file")
    parser.add_argument("--iflows", type=str, default=None,
                      help="Package-to-IFlows mapping in format: pkg1:iflow1,iflow2;pkg2:iflow3,iflow4")
    parser.add_argument("--llm", type=str, default="default", 
                      help="LLM provider to use (openai, groq, anthropic, default)")
    parser.add_argument("--model", type=str, default=None,
                      help="Specific model to use (provider-dependent)")
    parser.add_argument("--temperature", type=float, default=0.3,
                      help="Temperature setting for the LLM (0.0-1.0)")
    parser.add_argument("--parallel", action="store_true", default=True,
                      help="Enable parallel processing for IFlow reviews")
    parser.add_argument("--no-parallel", action="store_false", dest="parallel",
                      help="Disable parallel processing for IFlow reviews")
    parser.add_argument("--max-workers", type=int, default=4,
                      help="Maximum number of parallel workers (default: 4)")
    parser.add_argument("--log-level", type=str, default="INFO", 
                      choices=["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"],
                      help="Logging level")
    parser.add_argument("--offline-mode", action="store_true", default=False,
                      help="Run in offline mode with minimal network connections")
    parser.add_argument("--skip-feedback", action="store_true", default=False,
                      help="Skip collecting feedback after review")
    parser.add_argument("--ignore-previous-feedback", action="store_true", default=False,
                      help="Ignore previous feedback during review")
    
    # SAP connection parameters
    parser.add_argument("--sap-url", type=str, default=None,
                      help="SAP Integration Suite base URL")
    parser.add_argument("--sap-auth-url", type=str, default=None,
                      help="SAP authentication URL")
    parser.add_argument("--sap-client-id", type=str, default=None,
                      help="SAP client ID")
    parser.add_argument("--sap-client-secret", type=str, default=None,
                      help="SAP client secret")
    
    args = parser.parse_args()
    
    # Validate iflows parameter when packages is provided
    if args.iflows and not args.packages:
        parser.error("--iflows requires --packages to be specified")
    
    return args

def generate_enhanced_report(iflow_reviews, packages, timestamp, llm_provider=None, model_name=None):
    """
    Generate a comprehensive, professionally formatted report.
    
    Args:
        iflow_reviews (list): List of iFlow review results
        packages (list): List of package IDs that were reviewed
        timestamp (str): Timestamp for the report
        llm_provider (str, optional): LLM provider used
        model_name (str, optional): Model name used
        
    Returns:
        str: Path to the generated report file
    """
    try:
        # Create reports directory
        reports_dir = os.path.join("housekeeping", "reports")
        if not os.path.exists(reports_dir):
            os.makedirs(reports_dir)
        
        # Generate report filename
        provider_str = f"_{llm_provider}" if llm_provider else ""
        model_str = f"_{model_name.replace('-', '_')}" if model_name else ""
        report_filename = os.path.join(reports_dir, f"sap_review_report{provider_str}{model_str}_{timestamp}.md")
        
        # Calculate statistics
        total_iflows = len(iflow_reviews)
        compliance_levels = {"High": 0, "Medium": 0, "Low": 0, "Unknown": 0}
        
        for review in iflow_reviews:
            review_text = review.get("review", "").lower()
            
            if "high compliance" in review_text or "compliance: high" in review_text:
                compliance_levels["High"] += 1
            elif "medium compliance" in review_text or "compliance: medium" in review_text:
                compliance_levels["Medium"] += 1
            elif "low compliance" in review_text or "compliance: low" in review_text:
                compliance_levels["Low"] += 1
            else:
                compliance_levels["Unknown"] += 1
        
        # Calculate overall compliance percentage
        if total_iflows > 0:
            weighted_score = (
                compliance_levels["High"] * 100 + 
                compliance_levels["Medium"] * 50 + 
                compliance_levels["Low"] * 0
            ) / total_iflows
            overall_compliance = f"{int(weighted_score)}%"
        else:
            overall_compliance = "N/A"
        
        # Start building the report content
        report_content = f"""# SAP Integration Review Report

## Executive Summary

**Review Date:** {datetime.now().strftime('%Y-%m-%d')}  
**Packages Reviewed:** {', '.join(packages)}  
**Total IFlows Reviewed:** {total_iflows}  
**Overall Compliance:** {overall_compliance}

### Compliance Distribution
- **High Compliance:** {compliance_levels["High"]} IFlows ({int(compliance_levels["High"]/total_iflows*100) if total_iflows > 0 else 0}%)
- **Medium Compliance:** {compliance_levels["Medium"]} IFlows ({int(compliance_levels["Medium"]/total_iflows*100) if total_iflows > 0 else 0}%)
- **Low Compliance:** {compliance_levels["Low"]} IFlows ({int(compliance_levels["Low"]/total_iflows*100) if total_iflows > 0 else 0}%)
- **Undetermined:** {compliance_levels["Unknown"]} IFlows ({int(compliance_levels["Unknown"]/total_iflows*100) if total_iflows > 0 else 0}%)

## Review Parameters
- **Review Model:** {llm_provider or "Default"} / {model_name or "Default"}
- **Timestamp:** {timestamp}

## Key Findings

"""
        # Add key findings based on compliance levels
        if compliance_levels["High"] >= total_iflows * 0.75:
            report_content += "- Most IFlows demonstrate high compliance with design guidelines\n"
        elif compliance_levels["Low"] >= total_iflows * 0.5:
            report_content += "- Significant number of IFlows show low compliance with design guidelines\n"
        elif compliance_levels["Medium"] >= total_iflows * 0.5:
            report_content += "- Most IFlows demonstrate medium compliance, with room for improvement\n"
        
        # Add common issues observed
        common_issues = {}
        for review in iflow_reviews:
            review_text = review.get("review", "")
            
            # Look for issue patterns
            issue_patterns = [
                ("Error Handling", ["error handling", "exception handling", "fault handling"]),
                ("Security", ["security", "authentication", "authorization", "encryption"]),
                ("Performance", ["performance", "optimization", "throughput", "latency"]),
                ("Logging", ["logging", "monitoring", "traceability"]),
                ("Maintainability", ["maintainability", "complexity", "documentation"])
            ]
            
            for issue_type, keywords in issue_patterns:
                for keyword in keywords:
                    if keyword in review_text.lower():
                        if issue_type not in common_issues:
                            common_issues[issue_type] = 0
                        common_issues[issue_type] += 1
                        break
        
        # Add common issues section
        if common_issues:
            report_content += "\n### Common Issues Identified\n\n"
            for issue_type, count in sorted(common_issues.items(), key=lambda x: x[1], reverse=True):
                percentage = (count / total_iflows) * 100
                report_content += f"- **{issue_type}:** Found in {count} IFlows ({percentage:.1f}%)\n"
        
        # Add recommendations section
        report_content += """
## Recommendations

Based on the review findings, the following recommendations are provided to improve integration design compliance:

1. **Standardize Error Handling**: Implement consistent error handling across all integrations, including proper logging and notification mechanisms.

2. **Enhance Security Measures**: Ensure all integrations follow security best practices, including proper authentication, data encryption, and secure credential management.

3. **Optimize Performance**: Review and optimize high-volume or performance-critical integrations to ensure efficient processing.

4. **Improve Documentation**: Ensure all integrations have clear documentation, both inline comments and external documentation.

5. **Refactor Complex Integrations**: Identify and refactor overly complex integrations to improve maintainability and reduce risk.

## Integration Type Analysis

"""
        # Add integration type analysis
        integration_types = {}
        for review in iflow_reviews:
            review_text = review.get("review", "")
            
            # Extract integration type - look for "Integration Type:" line
            integration_type = "Unknown"
            for line in review_text.splitlines():
                if "integration type:" in line.lower():
                    parts = line.split(":", 1)
                    if len(parts) > 1:
                        integration_type = parts[1].strip()
                        break
            
            if integration_type not in integration_types:
                integration_types[integration_type] = 0
            integration_types[integration_type] += 1
        
        # Add integration type distribution
        report_content += "### Integration Type Distribution\n\n"
        report_content += "| Integration Type | Count | Percentage |\n"
        report_content += "|-----------------|-------|------------|\n"
        
        for int_type, count in sorted(integration_types.items(), key=lambda x: x[1], reverse=True):
            percentage = (count / total_iflows) * 100
            report_content += f"| {int_type} | {count} | {percentage:.1f}% |\n"
        
        # Add detailed reviews
        report_content += "\n## Individual IFlow Reviews\n\n"
        
        # Group reviews by compliance level
        high_compliance = []
        medium_compliance = []
        low_compliance = []
        unknown_compliance = []
        
        for review in iflow_reviews:
            iflow_name = review.get("iflow_name", "Unknown")
            review_text = review.get("review", "").lower()
            
            if "high compliance" in review_text or "compliance: high" in review_text:
                high_compliance.append(review)
            elif "medium compliance" in review_text or "compliance: medium" in review_text:
                medium_compliance.append(review)
            elif "low compliance" in review_text or "compliance: low" in review_text:
                low_compliance.append(review)
            else:
                unknown_compliance.append(review)
        
        # Add reviews by compliance level
        for level, reviews, emoji in [
            ("Low Compliance", low_compliance, "⚠️"),
            ("Medium Compliance", medium_compliance, "⚙️"),
            ("High Compliance", high_compliance, "✅"),
            ("Undetermined Compliance", unknown_compliance, "❓")
        ]:
            if reviews:
                report_content += f"### {emoji} {level} IFlows ({len(reviews)})\n\n"
                for review in reviews:
                    iflow_name = review.get("iflow_name", "Unknown")
                    report_content += f"#### {iflow_name}\n\n"
                    report_content += review.get("review", "No review data available") + "\n\n"
                    report_content += "---\n\n"
        
        # Add conclusion
        report_content += """
## Conclusion

This automated review provides an assessment of integration designs against established guidelines. The findings should be used as a starting point for further discussion and improvement initiatives. Regular reviews of integration designs are recommended to maintain high quality and compliance with best practices.

---

*Report generated automatically by SAP Integration Reviewer*
"""
        
        # Write report to file
        with open(report_filename, "w") as f:
            f.write(report_content)
        
        print(f"Enhanced report generated: {report_filename}")
        return report_filename
        
    except Exception as e:
        error_msg = f"Error generating enhanced report: {str(e)}"
        print(error_msg)
        traceback.print_exc()
        
        # Generate a simple error report
        error_report_filename = os.path.join(reports_dir, f"error_report_{timestamp}.md")
        
        with open(error_report_filename, "w") as f:
            f.write(f"# Error Generating Report\n\n{error_msg}\n\n")
            
            # Still include basic information
            f.write(f"## Basic Information\n\n")
            f.write(f"- Packages: {', '.join(packages)}\n")
            f.write(f"- IFlows: {len(iflow_reviews)}\n")
            
            # Include raw reviews
            f.write(f"## Raw Review Data\n\n")
            for review in iflow_reviews:
                iflow_name = review.get("iflow_name", "Unknown")
                f.write(f"### {iflow_name}\n\n")
                f.write(review.get("review", "No review data available") + "\n\n")
                f.write("---\n\n")
        
        return error_report_filename


if __name__ == "__main__":
    # Set up logging first
    log_file_path = setup_logging()
    
    # Start capturing all output
    with capture_all_output(log_file_path):
        try:
            # Parse command line arguments
            args = parse_args()
            
            # Set logging level based on argument
            logging.getLogger().setLevel(getattr(logging, args.log_level))
            
            # Log version and configuration
            logging.info(f"SAP Integration Reviewer starting")
            logging.info(f"Python version: {sys.version}")
            logging.info(f"Command line: {' '.join(sys.argv)}")
            
            # Create SAPConnection with command line parameters
            sap_conn = SAPConnection(
                base_url=args.sap_url,
                auth_url=args.sap_auth_url,
                client_id=args.sap_client_id,
                client_secret=args.sap_client_secret
            )
            
            # Parse specific packages argument
            specific_packages = args.packages.split(',') if args.packages else None
            
            # Parse specific IFlows argument
            specific_iflows = None
            if args.iflows:
                specific_iflows = {}
                package_mappings = args.iflows.split(';')
                for mapping in package_mappings:
                    if ':' in mapping:
                        pkg_id, iflows_str = mapping.split(':', 1)
                        if iflows_str.lower() == 'all':
                            specific_iflows[pkg_id] = 'all'
                        else:
                            specific_iflows[pkg_id] = iflows_str.split(',')
            
            # Read guidelines from file
            with open(args.guidelines, "r") as f:
                design_guidelines = f.read()
            
            # Run the main function with the parsed arguments
            main_result = main(
                user_query=args.query, 
                design_guidelines=design_guidelines, 
                llm_provider=args.llm, 
                model_name=args.model, 
                temperature=args.temperature,
                specific_packages=specific_packages,
                specific_iflows=specific_iflows,
                parallel=args.parallel,
                max_workers=args.max_workers,
                skip_feedback=args.skip_feedback,
                ignore_previous_feedback=args.ignore_previous_feedback,
                iflow_path=args.iflow_path,
                sap_connection=sap_conn
            )
            
            # Log completion
            logging.info(f"SAP Integration Reviewer completed successfully")
            logging.info(f"Report saved to: {main_result}")
            
        except Exception as e:
            # Log any unhandled exceptions
            logging.error(f"Unhandled exception: {str(e)}")
            logging.error(traceback.format_exc())
            print(f"Error: {str(e)}")
            print(f"See log file for details: {log_file_path}")
            sys.exit(1)

import { apiClient } from './apiClient';

/**
 * Interface to the Python backend system
 * This module provides direct integration with the Python backend script
 * for SAP Integration Suite operations
 */

/**
 * Execute the SAP Integration extraction functionality
 * @param {Object} params - Extraction parameters
 * @returns {Promise} Promise with the extraction result
 */
export const executePythonExtraction = async (params) => {
  try {
    // Format command for Python backend
    const command = formatExtractionCommand(params);
    
    // Send command to backend executor
    const response = await apiClient.post('/python/execute', {
      command: command,
      timeout: params.timeout || 300 // 5 minutes default timeout
    });
    
    return response.data;
  } catch (error) {
    console.error('Error executing Python extraction:', error);
    throw error;
  }
};

/**
 * Execute the SAP Integration review functionality
 * @param {Object} params - Review parameters
 * @returns {Promise} Promise with the review job details
 */
export const executePythonReview = async (params) => {
  try {
    // Format command for Python backend
    const command = formatReviewCommand(params);
    
    // Send command to backend executor
    const response = await apiClient.post('/python/execute', {
      command: command,
      async: true, // Run asynchronously
      timeout: params.timeout || 600 // 10 minutes default timeout
    });
    
    return {
      jobId: response.data.jobId,
      command: command,
      status: 'running',
      startTime: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error executing Python review:', error);
    throw error;
  }
};

/**
 * Check the status of a Python job
 * @param {string} jobId - ID of the job
 * @returns {Promise} Promise with the job status
 */
export const checkPythonJobStatus = async (jobId) => {
  try {
    const response = await apiClient.get(`/python/jobs/${jobId}`);
    return response.data;
  } catch (error) {
    console.error('Error checking Python job status:', error);
    throw error;
  }
};

/**
 * Get the result of a completed Python job
 * @param {string} jobId - ID of the job
 * @returns {Promise} Promise with the job result
 */
export const getPythonJobResult = async (jobId) => {
  try {
    const response = await apiClient.get(`/python/jobs/${jobId}/result`);
    return response.data;
  } catch (error) {
    console.error('Error getting Python job result:', error);
    throw error;
  }
};

/**
 * Format command for SAP Integration extraction
 * @param {Object} params - Extraction parameters
 * @returns {string} Formatted command string
 */
const formatExtractionCommand = (params) => {
  // Build the extraction command
  let command = 'python3 sap_tools.py';
  
  if (params.action === 'search_packages') {
    command += ` search_integration_packages`;
    if (params.query) {
      command += ` --query "${params.query}"`;
    }
  } else if (params.action === 'get_package_details') {
    command += ` get_package_details --package_id "${params.packageId}"`;
  } else if (params.action === 'extract_iflows') {
    command += ` extract_all_iflows_from_package --package_id "${params.packageId}"`;
  } else if (params.action === 'extract_iflow') {
    command += ` extract_iflow --iflow_id "${params.iflowId}"`;
  }
  
  // Add tenant information if provided
  if (params.tenant) {
    command += ` --tenant "${params.tenant}"`;
  }
  
  return command;
};

/**
 * Format command for SAP Integration review
 * @param {Object} params - Review parameters
 * @returns {string} Formatted command string
 */
const formatReviewCommand = (params) => {
  // Build the review command
  let command = 'python3 sap_integration_reviewer.py';
  
  // Add query parameter for tenant
  command += ` --query "${params.tenant}"`;
  
  // Add guidelines parameter
  command += ` --guidelines guidelines/${params.guideline}.md`;
  
  // Add LLM model parameter
  if (params.model) {
    const [provider, model] = params.model.split('-');
    command += ` --llm ${provider}`;
    if (model) {
      command += ` --model ${model}`;
    }
  }
  
  // Add package filter if specific packages are selected
  if (params.packages && params.packages.length > 0) {
    command += ` --packages "${params.packages.join(',')}"`;
  }
  
  // Add IFlow filter if specific IFlows are selected
  if (params.iflowSelections) {
    const iflowFilters = [];
    for (const [packageId, iflows] of Object.entries(params.iflowSelections)) {
      if (iflows !== 'all') {
        iflowFilters.push(`${packageId}:${iflows.join(',')}`);
      }
    }
    
    if (iflowFilters.length > 0) {
      command += ` --iflows "${iflowFilters.join(';')}"`;
    }
  }
  
  return command;
};

/**
 * Download a file from the Python backend
 * @param {string} filePath - Path to the file on the backend
 * @returns {Promise} Promise with the file blob
 */
export const downloadFile = async (filePath) => {
  try {
    const response = await apiClient.get(`/python/download`, {
      params: { path: filePath },
      responseType: 'blob'
    });
    
    return response.data;
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
};
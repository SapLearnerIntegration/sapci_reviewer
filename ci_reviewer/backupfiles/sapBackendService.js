// services/sapBackendService.js
import axios from 'axios';

// Base URL for backend - make sure this matches your Python server
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

// Create axios instance
const apiClient = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000 // 30 seconds timeout
});

// Service functions for SAP Integration
export const sapBackendService = {
  /**
   * Submit a review job
   * @param {Object} reviewParams - Parameters for the review
   * @returns {Promise} Job submission result
   */
  submitReview: async (reviewParams) => {
    try {
      const response = await apiClient.post('/sap/review', reviewParams);
      return response.data;
    } catch (error) {
      console.error('Error submitting review:', error);
      throw error;
    }
  },

  /**
   * Get job status
   * @param {string} jobId - ID of the job
   * @returns {Promise} Job status
   */
  getJobStatus: async (jobId) => {
    try {
      const response = await apiClient.get(`/sap/review/${jobId}/status`);
      return response.data;
    } catch (error) {
      console.error('Error checking job status:', error);
      throw error;
    }
  },

  /**
   * Get job report
   * @param {string} jobId - ID of the job
   * @returns {Promise} Job report
   */
  getJobReport: async (jobId) => {
    try {
      const response = await apiClient.get(`/sap/review/${jobId}/report`);
      return response.data;
    } catch (error) {
      console.error('Error getting job report:', error);
      throw error;
    }
  },

  /**
   * Search integration packages
   * @param {Object} tenant - Tenant data
   * @param {string} query - Search query
   * @returns {Promise} Matching packages
   */
  searchPackages: async (tenant, query = '*') => {
    try {
      const response = await apiClient.post('/sap/extraction/search_packages', {
        tenant: tenant.name,
        tenant_data: {
          id: tenant.id,
          name: tenant.name,
          authUrl: tenant.authUrl,
          apiUrl: tenant.apiUrl,
          clientId: tenant.clientId,
          clientSecret: tenant.clientSecret
        },
        query
      });
      return response.data;
    } catch (error) {
      console.error('Error searching packages:', error);
      throw error;
    }
  },

  /**
   * Extract IFlows for a package
   * @param {Object} tenant - Tenant data
   * @param {string} packageId - Package ID to extract IFlows for
   * @returns {Promise} IFlow data
   */
  extractIFlows: async (tenant, packageId) => {
    try {
      const response = await apiClient.post('/sap/extraction/extract_iflows', {
        tenant: tenant.name,
        package: packageId,
        tenant_data: {
          id: tenant.id,
          name: tenant.name,
          authUrl: tenant.authUrl,
          apiUrl: tenant.apiUrl,
          clientId: tenant.clientId,
          clientSecret: tenant.clientSecret
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error extracting IFlows:', error);
      throw error;
    }
  },

  /**
   * Download job report
   * @param {string} jobId - ID of the job
   * @param {string} format - Report format (md, pdf, html)
   * @returns {Promise} Promise that resolves when download is complete
   */
  downloadReport: async (jobId, format = 'md') => {
    try {
      const response = await apiClient.get(`/sap/review/${jobId}/download`, {
        params: { format },
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sap_review_${jobId}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return { success: true };
    } catch (error) {
      console.error('Error downloading report:', error);
      throw error;
    }
  }
};

export default sapBackendService;
// src/services/sapIntegrationService.js
import { sapIntegrationApi, apiHelpers } from './apiClient';

// Centralized configuration for endpoints
const ENDPOINTS = {
  SEARCH_PACKAGES: process.env.REACT_APP_SAP_EXTRACTION_SEARCH_PACKAGES,
  EXTRACT_IFLOWS: process.env.REACT_APP_SAP_EXTRACTION_EXTRACT_IFLOWS,
  SUBMIT_REVIEW: process.env.REACT_APP_SAP_REVIEW_SUBMIT,
  REVIEW_STATUS: process.env.REACT_APP_SAP_REVIEW_STATUS,
  REVIEW_REPORT: process.env.REACT_APP_SAP_REVIEW_REPORT,
  REVIEW_DOWNLOAD: process.env.REACT_APP_SAP_REVIEW_DOWNLOAD
};

// Enhanced mock data generator
const mockDataGenerator = {
  /**
   * Generate mock packages with search filtering
   * @param {Object} tenant - Tenant details
   * @param {string} query - Search query
   * @returns {Array} Mock packages
   */
  generateMockPackages: (tenant, query = '*') => {
    const baseMockPackages = [
      { 
        id: `pkg_${tenant.id}_1`, 
        name: `${tenant.name} - Sivanathan Customer Integration`, 
        description: 'Customer data integration flows for Sivanathan enterprises'
      },
      { 
        id: `pkg_${tenant.id}_2`, 
        name: `${tenant.name} - Sivakumar Vendor Integration`, 
        description: 'Vendor integration scenarios for Sivakumar group'
      },
      { 
        id: `pkg_${tenant.id}_3`, 
        name: `${tenant.name} - Finance Integration`, 
        description: 'Financial data processing flows'
      },
      { 
        id: `pkg_${tenant.id}_4`, 
        name: `${tenant.name} - Logistics Integration`, 
        description: 'Supply chain integration processes'
      },
      { 
        id: `pkg_${tenant.id}_5`, 
        name: `${tenant.name} - HR Integration`, 
        description: 'Employee data synchronization'
      }
    ];

    // If query is '*', return all packages
    if (query === '*') return baseMockPackages;

    // Perform case-insensitive search
    const lowercaseQuery = query.toLowerCase();
    return baseMockPackages.filter(pkg => 
      pkg.name.toLowerCase().includes(lowercaseQuery) || 
      pkg.description.toLowerCase().includes(lowercaseQuery)
    );
  },

  /**
   * Generate mock IFlows for a package
   * @param {Object} tenant - Tenant details
   * @param {string} packageId - Package ID
   * @returns {Array} Mock IFlows
   */
  generateMockIFlows: (tenant, packageId) => [
    { 
      id: `iflow_${packageId}_1`, 
      name: `${tenant.name} - Data Sync IFlow`, 
      description: 'Synchronization of data across systems'
    },
    { 
      id: `iflow_${packageId}_2`, 
      name: `${tenant.name} - Validation IFlow`, 
      description: 'Data validation and integrity checks'
    },
    { 
      id: `iflow_${packageId}_3`, 
      name: `${tenant.name} - Processing IFlow`, 
      description: 'Advanced data processing pipeline'
    }
  ]
};

export const sapIntegrationService = {
  /**
   * Search for integration packages
   * @param {Object} tenant - Tenant details
   * @param {string} query - Search query
   * @returns {Promise} Packages matching the search
   */
  searchPackages: async (tenant, query = '*') => {
    const requestParams = {
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
    };

    // Sanitize log to hide sensitive data
    console.log('Search Packages Request:', JSON.stringify({
      ...requestParams,
      tenant_data: { ...requestParams.tenant_data, clientSecret: '***' }
    }));

    return apiHelpers.safeApiCall(
      () => sapIntegrationApi.post(ENDPOINTS.SEARCH_PACKAGES, requestParams),
      { 
        packages: mockDataGenerator.generateMockPackages(tenant, query) 
      }
    );
  },

  /**
   * Extract IFlows for a package
   * @param {Object} tenant - Tenant details
   * @param {string} packageId - Package ID to extract IFlows from
   * @returns {Promise} List of IFlows
   */
  extractIFlows: async (tenant, packageId) => {
    const requestParams = {
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
    };

    console.log('Extract IFlows Request:', JSON.stringify({
      ...requestParams,
      tenant_data: { ...requestParams.tenant_data, clientSecret: '***' }
    }));

    return apiHelpers.safeApiCall(
      () => sapIntegrationApi.post(ENDPOINTS.EXTRACT_IFLOWS, requestParams),
      mockDataGenerator.generateMockIFlows(tenant, packageId)
    );
  },

  // ... rest of the existing methods remain the same
};

export default sapIntegrationService;
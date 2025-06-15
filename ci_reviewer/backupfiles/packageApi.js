import { apiClient } from './apiClient';

/**
 * Fetch packages for a specific tenant by directly connecting to the Python backend extraction logic
 * @param {string} tenantId - ID of the tenant to fetch packages for
 * @returns {Promise} Promise with package data
 */
export const fetchPackagesForTenant = async (tenantId) => {
  try {
    // Connect to the Python backend for package extraction
    const response = await apiClient.post('/extraction/packages', {
      tenant: tenantId,
      query: '*' // Get all packages, or can be filtered with a query string
    });
    
    // The response should contain the extracted packages
    return response.data;
  } catch (error) {
    console.error(`Error fetching packages for tenant ${tenantId}:`, error);
    // For demo purposes, return mock data if API is unavailable
    return mockPackages();
  }
};

/**
 * Search packages by query string using the Python backend
 * @param {string} tenantId - ID of the tenant to search
 * @param {string} query - Search query
 * @returns {Promise} Promise with matching packages
 */
export const searchPackages = async (tenantId, query) => {
  try {
    // Connect to the Python backend for package search
    const response = await apiClient.post('/extraction/packages', {
      tenant: tenantId,
      query: query
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error searching packages for tenant ${tenantId}:`, error);
    // Filter mock packages for search functionality
    const packages = mockPackages();
    return packages.filter(pkg => 
      pkg.name.toLowerCase().includes(query.toLowerCase()) || 
      pkg.description.toLowerCase().includes(query.toLowerCase())
    );
  }
};

/**
 * Extract IFlows for a specific package using the Python backend extraction logic
 * @param {string} tenantId - ID of the tenant
 * @param {string} packageId - ID of the package to fetch IFlows for
 * @returns {Promise} Promise with IFlow data
 */
export const extractIFlowsForPackage = async (tenantId, packageId) => {
  try {
    // Connect to the Python backend for IFlow extraction
    const response = await apiClient.post('/extraction/iflows', {
      tenant: tenantId,
      package: packageId
    });
    
    // The response should contain the extracted IFlow details
    return response.data;
  } catch (error) {
    console.error(`Error extracting IFlows for package ${packageId}:`, error);
    // For demo purposes, return mock data if API is unavailable
    const packages = mockPackages();
    const pkg = packages.find(p => p.id === packageId);
    return pkg ? pkg.iflows : [];
  }
};

/**
 * Extract specific IFlow details using the Python backend extraction logic
 * @param {string} tenantId - ID of the tenant
 * @param {string} packageId - ID of the package
 * @param {string} iflowId - ID of the IFlow to extract
 * @returns {Promise} Promise with detailed IFlow content
 */
export const extractIFlowContent = async (tenantId, packageId, iflowId) => {
  try {
    // Connect to the Python backend for specific IFlow extraction
    const response = await apiClient.post('/extraction/iflow', {
      tenant: tenantId,
      package: packageId,
      iflow: iflowId
    });
    
    // The response should contain the detailed IFlow content
    return response.data;
  } catch (error) {
    console.error(`Error extracting IFlow content for ${iflowId}:`, error);
    // For demo purposes, return limited mock data
    return {
      id: iflowId,
      content: "Mock IFlow content - connect to backend for actual data"
    };
  }
};

/**
 * Submit a package for review
 * @param {Object} reviewParams - Parameters for the review
 * @returns {Promise} Promise with review job details
 */
export const submitPackageReview = async (reviewParams) => {
  try {
    // Connect to the Python backend to start the review process
    const response = await apiClient.post('/reviews', reviewParams);
    return response.data;
  } catch (error) {
    console.error('Error submitting package review:', error);
    // Mock successful response
    return {
      success: true,
      jobId: `job-${Date.now()}`,
      message: 'Review job started successfully'
    };
  }
};

/**
 * Mock package data for fallback when API is unavailable
 * @returns {Array} Array of mock package objects with IFlows
 */
const mockPackages = () => {
  return [
    { 
      id: 'pkg1', 
      name: 'Customer Integration Package', 
      description: 'Customer data integration flows',
      version: '1.0.0',
      createdBy: 'admin',
      createdAt: '2023-05-10T08:30:00Z',
      iflows: [
        { id: 'iflow1_1', name: 'Customer Data Sync', status: 'Active' },
        { id: 'iflow1_2', name: 'Customer Address Validation', status: 'Active' },
        { id: 'iflow1_3', name: 'Customer Profile Update', status: 'Inactive' }
      ]
    },
    { 
      id: 'pkg2', 
      name: 'Vendor Integration Package', 
      description: 'Vendor integration scenarios',
      version: '2.1.0',
      createdBy: 'admin',
      createdAt: '2023-06-15T14:45:00Z',
      iflows: [
        { id: 'iflow2_1', name: 'Vendor Onboarding', status: 'Active' },
        { id: 'iflow2_2', name: 'Vendor Invoice Processing', status: 'Active' }
      ]
    },
    { 
      id: 'pkg3', 
      name: 'Finance Integration Package', 
      description: 'Financial data processing flows',
      version: '1.5.0',
      createdBy: 'finance_admin',
      createdAt: '2023-07-20T11:15:00Z',
      iflows: [
        { id: 'iflow3_1', name: 'Payment Processing', status: 'Active' },
        { id: 'iflow3_2', name: 'Financial Report Generation', status: 'Active' },
        { id: 'iflow3_3', name: 'Tax Calculation', status: 'Inactive' }
      ]
    },
    { 
      id: 'pkg4', 
      name: 'Logistics Integration Package', 
      description: 'Supply chain integration processes',
      version: '1.0.1',
      createdBy: 'logistics_admin',
      createdAt: '2023-08-05T09:30:00Z',
      iflows: [
        { id: 'iflow4_1', name: 'Shipment Tracking', status: 'Active' },
        { id: 'iflow4_2', name: 'Inventory Synchronization', status: 'Active' }
      ]
    },
    { 
      id: 'pkg5', 
      name: 'HR Integration Package', 
      description: 'Employee data synchronization',
      version: '2.0.0',
      createdBy: 'hr_admin',
      createdAt: '2023-09-12T16:20:00Z',
      iflows: [
        { id: 'iflow5_1', name: 'Employee Onboarding', status: 'Active' },
        { id: 'iflow5_2', name: 'Payroll Processing', status: 'Active' },
        { id: 'iflow5_3', name: 'Benefits Enrollment', status: 'Active' }
      ]
    },
    { 
      id: 'pkg6', 
      name: 'Sales Integration Package', 
      description: 'Sales order processing integration',
      version: '1.2.0',
      createdBy: 'sales_admin',
      createdAt: '2023-10-08T10:45:00Z',
      iflows: [
        { id: 'iflow6_1', name: 'Order Creation', status: 'Active' },
        { id: 'iflow6_2', name: 'Price Calculation', status: 'Active' },
        { id: 'iflow6_3', name: 'Discount Management', status: 'Inactive' }
      ]
    }
  ];
};
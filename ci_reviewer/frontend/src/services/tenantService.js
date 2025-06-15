// src/services/tenantService.js
import { v4 as uuidv4 } from 'uuid';

// Local storage key for tenants
const TENANTS_STORAGE_KEY = 'sap_integration_tenants';

// Load tenants from local storage with proper error handling
const loadTenants = () => {
  try {
    const storedTenants = localStorage.getItem(TENANTS_STORAGE_KEY);
    if (storedTenants) {
      const parsedTenants = JSON.parse(storedTenants);
      console.log(`Loaded ${parsedTenants.length} tenants from storage`);
      return parsedTenants;
    }
  } catch (error) {
    console.error('Error loading tenants from storage:', error);
  }

  // Return empty array if no tenants found or error occurred
  return [];
};

// Save tenants to local storage with proper error handling
const saveTenants = (tenants) => {
  try {
    localStorage.setItem(TENANTS_STORAGE_KEY, JSON.stringify(tenants));
    console.log(`Saved ${tenants.length} tenants to storage`);
  } catch (error) {
    console.error('Error saving tenants to storage:', error);
  }
};

// Initialize with some demo data if empty
const initializeDefaultTenants = () => {
  const existingTenants = loadTenants();
  
  if (existingTenants.length === 0) {
    console.log('No tenants found in storage, initializing with defaults');
    const defaultTenants = [
      {
        id: uuidv4(),
        name: 'Development Tenant',
        description: 'Used for development and testing',
        authUrl: 'https://dev-api.example.com/oauth/token',
        apiUrl: 'https://dev-api.example.com',
        clientId: 'dev_client_id',
        clientSecret: 'dev_client_secret',
        status: 'Active',
        createdAt: new Date().toISOString(),
        lastTestedAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        name: 'QA Tenant',
        description: 'Used for quality assurance testing',
        authUrl: 'https://qa-api.example.com/oauth/token',
        apiUrl: 'https://qa-api.example.com',
        clientId: 'qa_client_id',
        clientSecret: 'qa_client_secret',
        status: 'Active',
        createdAt: new Date().toISOString(),
        lastTestedAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        name: 'Production Tenant',
        description: 'Production environment tenant',
        authUrl: 'https://api.example.com/oauth/token',
        apiUrl: 'https://api.example.com',
        clientId: 'prod_client_id',
        clientSecret: 'prod_client_secret',
        status: 'Active',
        createdAt: new Date().toISOString(),
        lastTestedAt: new Date().toISOString()
      }
    ];
    
    saveTenants(defaultTenants);
    return defaultTenants;
  }
  
  return existingTenants;
};

// Initialize data
const initializedTenants = initializeDefaultTenants();
console.log(`Tenant service initialized with ${initializedTenants.length} tenants`);

// Helper for simulating async operations
const asyncResponse = (data, delay = 300) => {
  return new Promise((resolve) => setTimeout(() => resolve(data), delay));
};

/**
 * Get all tenants
 * @returns {Promise<Array>} Promise that resolves to array of tenants
 */
export const getAllTenants = async () => {
  // Always load from storage for most up-to-date data
  const tenants = loadTenants();
  console.log(`Fetching all tenants, found: ${tenants.length}`);
  return asyncResponse(tenants);
};

/**
 * Get tenant by ID
 * @param {string} id - Tenant ID
 * @returns {Promise<Object|null>} Promise that resolves to tenant object or null
 */
export const getTenantById = async (id) => {
  const tenants = loadTenants();
  const tenant = tenants.find(t => t.id === id);
  console.log(`Fetching tenant by ID: ${id}, found: ${tenant ? 'yes' : 'no'}`);
  return asyncResponse(tenant || null);
};

/**
 * Add new tenant
 * @param {Object} tenantData - Tenant data
 * @returns {Promise<Object>} Promise that resolves to new tenant object
 */
export const createTenant = async (tenantData) => {
  const tenants = loadTenants();
  
  // Create new tenant with ID and timestamps
  const newTenant = {
    ...tenantData,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    lastTestedAt: tenantData.status === 'Active' ? new Date().toISOString() : null
  };
  
  // Add to list and save
  tenants.push(newTenant);
  saveTenants(tenants);
  console.log(`Created new tenant: ${newTenant.name} (${newTenant.id})`);
  
  return asyncResponse(newTenant);
};

/**
 * Update tenant
 * @param {string} id - Tenant ID
 * @param {Object} tenantData - Updated tenant data
 * @returns {Promise<Object|null>} Promise that resolves to updated tenant object or null
 */
export const updateTenant = async (id, tenantData) => {
  const tenants = loadTenants();
  
  // Find index of tenant
  const index = tenants.findIndex(t => t.id === id);
  if (index === -1) {
    console.log(`Tenant not found for update: ${id}`);
    return asyncResponse(null);
  }
  
  // Update tenant with new data but preserve ID and creation date
  const updatedTenant = {
    ...tenants[index],
    ...tenantData,
    id, // Ensure ID doesn't change
    createdAt: tenants[index].createdAt, // Keep original creation date
    updatedAt: new Date().toISOString() // Add update timestamp
  };
  
  // Special handling for client secret
  if (!tenantData.clientSecret) {
    updatedTenant.clientSecret = tenants[index].clientSecret;
  }
  
  tenants[index] = updatedTenant;
  saveTenants(tenants);
  console.log(`Updated tenant: ${updatedTenant.name} (${id})`);
  
  return asyncResponse(updatedTenant);
};

/**
 * Delete tenant
 * @param {string} id - Tenant ID
 * @returns {Promise<boolean>} Promise that resolves to true if successful
 */
export const deleteTenant = async (id) => {
  const tenants = loadTenants();
  
  // Find index of tenant
  const index = tenants.findIndex(t => t.id === id);
  if (index === -1) {
    console.log(`Tenant not found for deletion: ${id}`);
    return asyncResponse(false);
  }
  
  const deletedTenant = tenants[index];
  // Remove tenant and save
  tenants.splice(index, 1);
  saveTenants(tenants);
  console.log(`Deleted tenant: ${deletedTenant.name} (${id})`);
  
  return asyncResponse(true);
};

/**
 * Test tenant connection
 * @param {string|Object} tenantIdOrData - Tenant ID or tenant data object
 * @returns {Promise<Object>} Promise that resolves to connection test result
 */
export const testTenantConnection = async (tenantIdOrData) => {
  let tenantData;
  
  if (typeof tenantIdOrData === 'string') {
    // If ID provided, load tenant
    const tenants = loadTenants();
    tenantData = tenants.find(t => t.id === tenantIdOrData);
    if (!tenantData) {
      console.log(`Tenant not found for connection test: ${tenantIdOrData}`);
      return asyncResponse({
        success: false,
        message: 'Tenant not found'
      });
    }
  } else {
    // Use provided tenant data
    tenantData = tenantIdOrData;
  }
  
  // Validate required fields
  if (!tenantData.authUrl || !tenantData.clientId || !tenantData.clientSecret) {
    console.log('Missing required authentication parameters for connection test');
    return asyncResponse({
      success: false,
      message: 'Missing required authentication parameters'
    });
  }
  
  console.log(`Testing connection for tenant: ${tenantData.name || 'Unknown'}`);
  
  try {
    // Simulate OAuth token request
    await asyncResponse(null, 1000); // Wait for 1 second
    
    // Simulate success/failure based on URL format
    const urlValid = tenantData.authUrl.startsWith('https://') && 
                     tenantData.authUrl.includes('.com') &&
                     tenantData.apiUrl.startsWith('https://');
    
    // Add some randomness to simulate real-world failures (10% chance)
    const randomFailure = Math.random() < 0.1;
    
    if (urlValid && !randomFailure) {
      // Success - update tenant status if it's a saved tenant
      if (tenantData.id) {
        const tenants = loadTenants();
        const index = tenants.findIndex(t => t.id === tenantData.id);
        if (index !== -1) {
          tenants[index].status = 'Active';
          tenants[index].lastTestedAt = new Date().toISOString();
          saveTenants(tenants);
        }
      }
      
      console.log(`Connection test successful for tenant: ${tenantData.name || 'Unknown'}`);
      return asyncResponse({
        success: true,
        message: 'Connection successful! OAuth token generated.',
        token: {
          access_token: `mock_token_${Math.random().toString(36).substring(2, 15)}`,
          expires_in: 3600,
          token_type: 'Bearer'
        }
      });
    } else {
      // Failure reasons
      let reason = randomFailure 
        ? 'Random connection failure (simulated)' 
        : 'Invalid URL format. URLs must start with https:// and include a valid domain';
      
      console.log(`Connection test failed for tenant: ${tenantData.name || 'Unknown'} - ${reason}`);
      return asyncResponse({
        success: false,
        message: `Connection failed: ${reason}`,
        error: {
          code: 'auth_error',
          details: reason
        }
      });
    }
  } catch (error) {
    console.log(`Connection test error for tenant: ${tenantData.name || 'Unknown'} - ${error.message}`);
    return asyncResponse({
      success: false,
      message: `Connection error: ${error.message || 'Unknown error'}`,
      error: {
        code: 'connection_error',
        details: error.message
      }
    });
  }
};

export default {
  getAllTenants,
  getTenantById,
  createTenant,
  updateTenant,
  deleteTenant,
  testTenantConnection
};
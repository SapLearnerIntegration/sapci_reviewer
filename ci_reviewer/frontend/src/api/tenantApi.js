// src/api/tenantApi.js
import tenantService from '../services/tenantService';

/**
 * Fetch all tenants
 * @returns {Promise} Promise with tenant data
 */
export const fetchTenants = async () => {
  try {
    // In a real app, this would make an HTTP request
    // For now, use the local service
    return await tenantService.getAllTenants();
  } catch (error) {
    console.error('Error fetching tenants:', error);
    throw error;
  }
};

/**
 * Add a new tenant
 * @param {Object} tenantData - Data for the new tenant
 * @returns {Promise} Promise with the newly created tenant
 */
export const addTenant = async (tenantData) => {
  try {
    // Validate required fields
    if (!tenantData.name || !tenantData.authUrl || !tenantData.clientId || !tenantData.clientSecret || !tenantData.apiUrl) {
      throw new Error('Missing required tenant fields');
    }
    
    // Create tenant using service
    return await tenantService.createTenant(tenantData);
  } catch (error) {
    console.error('Error adding tenant:', error);
    throw error;
  }
};

/**
 * Update a tenant
 * @param {string} tenantId - ID of the tenant to update
 * @param {Object} tenantData - Updated tenant data
 * @returns {Promise} Promise with the updated tenant
 */
export const updateTenant = async (tenantId, tenantData) => {
  try {
    // Validate ID
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    
    // Update tenant using service
    const result = await tenantService.updateTenant(tenantId, tenantData);
    
    if (!result) {
      throw new Error(`Tenant with ID ${tenantId} not found`);
    }
    
    return result;
  } catch (error) {
    console.error('Error updating tenant:', error);
    throw error;
  }
};

/**
 * Delete a tenant
 * @param {string} tenantId - ID of the tenant to delete
 * @returns {Promise} Promise with success status
 */
export const deleteTenant = async (tenantId) => {
  try {
    // Validate ID
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    
    // Delete tenant using service
    const success = await tenantService.deleteTenant(tenantId);
    
    if (!success) {
      throw new Error(`Tenant with ID ${tenantId} not found`);
    }
    
    return { success: true, message: 'Tenant deleted successfully' };
  } catch (error) {
    console.error('Error deleting tenant:', error);
    throw error;
  }
};

/**
 * Test the connection to a tenant
 * @param {string|Object} tenantIdOrData - ID of the tenant or tenant data object to test
 * @returns {Promise} Promise with the connection test results
 */
export const testTenantConnection = async (tenantIdOrData) => {
  try {
    // Test connection using service
    return await tenantService.testTenantConnection(tenantIdOrData);
  } catch (error) {
    console.error('Error testing tenant connection:', error);
    throw error;
  }
};

export default {
  fetchTenants,
  addTenant,
  updateTenant,
  deleteTenant,
  testTenantConnection
};
// src/api/index.js
// This file exports all API functions to make them easier to import elsewhere

// Import all API modules
import * as tenantApi from './tenantApi';
import * as guidelinesApi from './guidelinesApi';

// Re-export everything
export {
  tenantApi,
  guidelinesApi
};

// Default export as an object with all API functions
export default {
  ...tenantApi,
  ...guidelinesApi
};
// src/services/apiClient.js
import axios from 'axios';

// Create base configuration
const createApiClient = (baseURL = process.env.REACT_APP_API_BASE_URL) => {
  const client = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json'
    },
    timeout: 30000 // 30 seconds timeout
  });

  // Request interceptor for logging and potential token injection
  client.interceptors.request.use(
    (config) => {
      // Optional: Add authentication token if available
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Log request details (can be removed in production)
      console.log('API Request:', {
        url: config.url,
        method: config.method,
        data: config.data
      });
      
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor for global error handling
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      // Centralized error handling
      console.error('API Error:', error.response ? error.response.data : error.message);
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        switch (error.response.status) {
          case 400:
            console.error('Bad Request');
            break;
          case 401:
            console.error('Unauthorized');
            // Optionally redirect to login or refresh token
            break;
          case 403:
            console.error('Forbidden');
            break;
          case 404:
            console.error('Not Found');
            break;
          case 500:
            console.error('Internal Server Error');
            break;
          default:
            console.error('Unexpected Error');
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received');
      } else {
        // Something happened in setting up the request
        console.error('Error setting up request');
      }
      
      return Promise.reject(error);
    }
  );

  return client;
};

// Create specific service clients
export const sapIntegrationApi = createApiClient();

// Helper function to handle common API patterns
export const apiHelpers = {
  /**
   * Safely execute an API call with error handling
   * @param {Function} apiCall - The API call function
   * @param {Object} fallbackData - Fallback data if API call fails
   * @returns {Promise} Resolved with data or fallback
   */
  safeApiCall: async (apiCall, fallbackData = null) => {
    try {
      const response = await apiCall();
      return response.data;
    } catch (error) {
      console.error('Safe API Call Error:', error);
      
      // If fallback data is provided, return it
      if (fallbackData) {
        console.warn('Using fallback data');
        return fallbackData;
      }
      
      // Rethrow if no fallback
      throw error;
    }
  },

  /**
   * Generate a mock response for development/testing
   * @param {Object} mockData - Mock data to return
   * @param {number} delay - Delay in milliseconds
   * @returns {Promise} Promise resolving to mock data
   */
  mockResponse: (mockData, delay = 500) => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockData), delay);
    });
  }
};

export default createApiClient;
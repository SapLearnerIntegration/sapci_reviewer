import axios from 'axios';

// Base URL for the API
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://api.cognit.example.com';

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for authentication
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common errors
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const status = error.response.status;
      
      if (status === 401) {
        // Unauthorized - redirect to login
        console.error('Authentication required');
        // localStorage.removeItem('auth_token');
        // window.location.href = '/login';
      } else if (status === 403) {
        // Forbidden - user doesn't have required permissions
        console.error('Insufficient permissions to access this resource');
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from server');
    } else {
      // Something happened in setting up the request
      console.error('Error setting up request:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
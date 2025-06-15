// src/services/feedbackService.js
import { sapIntegrationApi, apiHelpers } from './apiClient';

/**
 * Functions for handling review feedback 
 */
export const feedbackService = {
  /**
   * Submit feedback for a review job
   * @param {string} jobId - ID of the review job
   * @param {Object} feedbackData - Feedback data containing ratings and comments
   * @returns {Promise} Promise that resolves with the feedback submission result
   */
  submitFeedback: async (jobId, feedbackData) => {
    try {
      // This would connect to the backend feedback endpoint in sap_integration_reviewer.py
      const response = await fetch(`http://localhost:3001/sap/review/${jobId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jobId,
          feedback: feedbackData,
          submittedAt: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Failed to submit feedback: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      
      // If we're in development mode, just simulate a successful response
      if (process.env.NODE_ENV === 'development') {
        console.log('Using mock feedback response for development');
        return {
          success: true,
          message: 'Feedback submitted successfully (MOCK)',
          feedbackId: `feedback-${Date.now()}`
        };
      }
      
      throw error;
    }
  },
  
  /**
   * Get previous feedback for a job
   * @param {string} jobId - ID of the job
   * @returns {Promise} Promise that resolves with previous feedback data
   */
  getPreviousFeedback: async (jobId) => {
    try {
      const response = await fetch(`http://localhost:3001/sap/review/${jobId}/feedback`);
      
      if (!response.ok) {
        throw new Error(`Failed to get feedback: ${response.status}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error getting previous feedback:', error);
      
      // Return empty array for development
      return [];
    }
  }
};

export default feedbackService;
// src/api/guidelinesApi.js
import guidelinesService from '../services/guidelinesService';

/**
 * Fetch all guidelines
 * @returns {Promise} Promise with guidelines data
 */
export const fetchGuidelines = async () => {
  try {
    // In a real app, this would make an HTTP request
    // For now, use the local service
    return await guidelinesService.getAllGuidelines();
  } catch (error) {
    console.error('Error fetching guidelines:', error);
    throw error;
  }
};

/**
 * Fetch guideline by ID
 * @param {string} id - Guideline ID
 * @returns {Promise} Promise with guideline data
 */
export const fetchGuidelineById = async (id) => {
  try {
    return await guidelinesService.getGuidelineById(id);
  } catch (error) {
    console.error('Error fetching guideline:', error);
    throw error;
  }
};

/**
 * Add a new guideline
 * @param {Object} guidelineData - Data for the new guideline
 * @returns {Promise} Promise with the newly created guideline
 */
export const addGuideline = async (guidelineData) => {
  try {
    // Validate required fields
    if (!guidelineData.name || !guidelineData.content) {
      throw new Error('Missing required guideline fields');
    }
    
    // Create guideline using service
    return await guidelinesService.createGuideline(guidelineData);
  } catch (error) {
    console.error('Error adding guideline:', error);
    throw error;
  }
};

/**
 * Update a guideline
 * @param {string} guidelineId - ID of the guideline to update
 * @param {Object} guidelineData - Updated guideline data
 * @returns {Promise} Promise with the updated guideline
 */
export const updateGuideline = async (guidelineId, guidelineData) => {
  try {
    // Validate ID
    if (!guidelineId) {
      throw new Error('Guideline ID is required');
    }
    
    // Update guideline using service
    const result = await guidelinesService.updateGuideline(guidelineId, guidelineData);
    
    if (!result) {
      throw new Error(`Guideline with ID ${guidelineId} not found`);
    }
    
    return result;
  } catch (error) {
    console.error('Error updating guideline:', error);
    throw error;
  }
};

/**
 * Delete a guideline
 * @param {string} guidelineId - ID of the guideline to delete
 * @returns {Promise} Promise with success status
 */
export const deleteGuideline = async (guidelineId) => {
  try {
    // Validate ID
    if (!guidelineId) {
      throw new Error('Guideline ID is required');
    }
    
    // Delete guideline using service
    const result = await guidelinesService.deleteGuideline(guidelineId);
    
    if (!result.success) {
      throw new Error(result.message || `Failed to delete guideline ${guidelineId}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error deleting guideline:', error);
    throw error;
  }
};

export default {
  fetchGuidelines,
  fetchGuidelineById,
  addGuideline,
  updateGuideline,
  deleteGuideline
};
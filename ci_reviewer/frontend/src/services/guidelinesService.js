// src/services/guidelinesService.js
import { v4 as uuidv4 } from 'uuid';

// Local storage key for guidelines
const GUIDELINES_STORAGE_KEY = 'sap_integration_guidelines';

// Load guidelines from local storage
const loadGuidelines = () => {
  try {
    const storedGuidelines = localStorage.getItem(GUIDELINES_STORAGE_KEY);
    if (storedGuidelines) {
      return JSON.parse(storedGuidelines);
    }
  } catch (error) {
    console.error('Error loading guidelines from storage:', error);
  }

  // Return empty array if no guidelines found or error occurred
  return [];
};

// Save guidelines to local storage
const saveGuidelines = (guidelines) => {
  try {
    localStorage.setItem(GUIDELINES_STORAGE_KEY, JSON.stringify(guidelines));
  } catch (error) {
    console.error('Error saving guidelines to storage:', error);
  }
};

// Initialize with some demo data if empty
const initializeDefaultGuidelines = () => {
  const existingGuidelines = loadGuidelines();
  
  if (existingGuidelines.length === 0) {
    const defaultGuidelines = [
      {
        id: uuidv4(),
        name: 'Basic Design Guidelines',
        description: 'Standard SAP integration design principles',
        content: `# SAP Integration Design Guidelines

## General Design Principles
1. **Single Responsibility**: Each IFlow should have a single, clearly defined purpose.
2. **Error Handling**: All IFlows must implement proper error handling with appropriate logging.
3. **Naming Convention**: IFlow names should follow the pattern \`[Source]_to_[Target]_[Purpose]\`.
4. **Documentation**: Each IFlow must have documentation of inputs, outputs, and business purpose.

## Security Guidelines
1. **Authentication**: All external connections must use OAuth 2.0 or certificate-based authentication.
2. **Sensitive Data**: No sensitive data (passwords, API keys) should be hardcoded.
3. **Content Modification**: All message content modifications must be traceable (e.g., using message headers).
4. **Logging**: Only non-sensitive data should be logged.

## Performance Guidelines
1. **Message Size**: IFlows should handle messages up to 10MB.
2. **Timeouts**: Connection timeouts should be configured appropriately (30s for synchronous, 5m for asynchronous).
3. **Parallelization**: Use parallel processing for batch operations where appropriate.
4. **Caching**: Use caching for reference data lookups.`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'Admin',
        isDefault: true
      },
      {
        id: uuidv4(),
        name: 'Security-focused Guidelines',
        description: 'Guidelines focusing on security best practices',
        content: `# SAP Integration Security Guidelines

## Authentication & Authorization
1. **OAuth 2.0**: Use OAuth 2.0 for all external API connections.
2. **Certificate-based**: Use X.509 certificates for system-to-system communications.
3. **Least Privilege**: Apply the principle of least privilege for all service accounts.
4. **Token Management**: Implement proper token lifecycle management.

## Data Protection
1. **Encryption**: Encrypt sensitive data both in transit and at rest.
2. **PII Handling**: Handle Personally Identifiable Information according to regulations.
3. **Data Masking**: Implement data masking for sensitive fields in logs.
4. **Key Management**: Use secure key management for all encryption keys.

## Secure Development
1. **Code Review**: All integration flows must undergo security code review.
2. **Input Validation**: Validate all inputs to prevent injection attacks.
3. **Error Handling**: Implement secure error handling that doesn't leak sensitive information.
4. **Vulnerability Scanning**: Regular scanning for security vulnerabilities.`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'Admin',
        isDefault: true
      }
    ];
    
    saveGuidelines(defaultGuidelines);
    return defaultGuidelines;
  }
  
  return existingGuidelines;
};

// Initialize data
initializeDefaultGuidelines();

// Helper for simulating async operations
const asyncResponse = (data, delay = 500) => {
  return new Promise((resolve) => setTimeout(() => resolve(data), delay));
};

/**
 * Get all guidelines
 * @returns {Promise<Array>} Promise that resolves to array of guidelines
 */
export const getAllGuidelines = async () => {
  const guidelines = loadGuidelines();
  return asyncResponse(guidelines);
};

/**
 * Get guideline by ID
 * @param {string} id - Guideline ID
 * @returns {Promise<Object|null>} Promise that resolves to guideline object or null
 */
export const getGuidelineById = async (id) => {
  const guidelines = loadGuidelines();
  const guideline = guidelines.find(g => g.id === id);
  return asyncResponse(guideline || null);
};

/**
 * Add new guideline
 * @param {Object} guidelineData - Guideline data
 * @returns {Promise<Object>} Promise that resolves to new guideline object
 */
export const createGuideline = async (guidelineData) => {
  const guidelines = loadGuidelines();
  
  // Create new guideline with ID and timestamps
  const newGuideline = {
    ...guidelineData,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDefault: false
  };
  
  // Add to list and save
  guidelines.push(newGuideline);
  saveGuidelines(guidelines);
  
  return asyncResponse(newGuideline);
};

/**
 * Update guideline
 * @param {string} id - Guideline ID
 * @param {Object} guidelineData - Updated guideline data
 * @returns {Promise<Object|null>} Promise that resolves to updated guideline object or null
 */
export const updateGuideline = async (id, guidelineData) => {
  const guidelines = loadGuidelines();
  
  // Find index of guideline
  const index = guidelines.findIndex(g => g.id === id);
  if (index === -1) return asyncResponse(null);
  
  // Check if trying to modify a default guideline
  if (guidelines[index].isDefault) {
    // Only allow updating certain fields for default guidelines
    const updatedGuideline = {
      ...guidelines[index],
      name: guidelineData.name || guidelines[index].name,
      description: guidelineData.description || guidelines[index].description,
      updatedAt: new Date().toISOString()
    };
    
    guidelines[index] = updatedGuideline;
    saveGuidelines(guidelines);
    
    return asyncResponse(updatedGuideline);
  }
  
  // Update guideline with new data but preserve ID and creation date
  const updatedGuideline = {
    ...guidelines[index],
    ...guidelineData,
    id, // Ensure ID doesn't change
    createdAt: guidelines[index].createdAt, // Keep original creation date
    createdBy: guidelines[index].createdBy, // Keep original creator
    updatedAt: new Date().toISOString(), // Add update timestamp
    isDefault: guidelines[index].isDefault // Keep default status
  };
  
  guidelines[index] = updatedGuideline;
  saveGuidelines(guidelines);
  
  return asyncResponse(updatedGuideline);
};

/**
 * Delete guideline
 * @param {string} id - Guideline ID
 * @returns {Promise<boolean>} Promise that resolves to true if successful
 */
export const deleteGuideline = async (id) => {
  const guidelines = loadGuidelines();
  
  // Find index of guideline
  const index = guidelines.findIndex(g => g.id === id);
  if (index === -1) return asyncResponse(false);
  
  // Don't allow deleting default guidelines
  if (guidelines[index].isDefault) {
    return asyncResponse({ 
      success: false, 
      message: 'Cannot delete default guidelines' 
    });
  }
  
  // Remove guideline and save
  guidelines.splice(index, 1);
  saveGuidelines(guidelines);
  
  return asyncResponse({ success: true, message: 'Guideline deleted successfully' });
};

export default {
  getAllGuidelines,
  getGuidelineById,
  createGuideline,
  updateGuideline,
  deleteGuideline
};
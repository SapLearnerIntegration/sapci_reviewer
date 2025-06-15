// components/designer/ConfigurationPanel.jsx
import React from 'react';

const ConfigurationPanel = ({
  tenants,
  selectedTenant,
  isTenantsLoading,
  onTenantChange,
  selectedGuideline,
  onGuidelineChange,
  selectedModel,
  onModelChange,
  guidelines,
  models,
  onSubmit,
  onReset,
  isSubmitDisabled
}) => {
  // Styles
  const containerStyle = {
    height: '100%', 
    display: 'flex', 
    flexDirection: 'column'
  };
  
  const headingStyle = {
    fontSize: '1.125rem',
    fontWeight: '500',
    marginBottom: '1rem',
    color: 'white'
  };
  
  const formGroupStyle = {
    marginBottom: '1rem'
  };
  
  const labelStyle = {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '500',
    marginBottom: '0.25rem',
    color: '#d1d5db'
  };
  
  const selectStyle = {
    width: '100%',
    padding: '0.5rem',
    backgroundColor: '#374151',
    border: '1px solid #4B5563',
    borderRadius: '0.25rem',
    color: 'white'
  };
  
  const loadingStyle = {
    padding: '0.5rem',
    textAlign: 'center',
    color: '#9CA3AF',
    backgroundColor: '#374151',
    borderRadius: '0.25rem'
  };
  
  const selectionSummaryStyle = {
    marginBottom: '1rem',
    padding: '0.75rem',
    backgroundColor: '#374151',
    borderRadius: '0.25rem'
  };
  
  const summaryHeadingStyle = {
    fontWeight: '500',
    color: 'white',
    fontSize: '0.875rem',
    marginBottom: '0.5rem'
  };
  
  const summaryListStyle = {
    fontSize: '0.875rem',
    color: '#d1d5db'
  };
  
  const helpTextStyle = {
    fontSize: '0.75rem',
    color: '#9CA3AF',
    marginBottom: '1rem'
  };
  
  const buttonContainerStyle = {
    marginTop: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  };
  
  // Primary button (blue - Submit for Review)
  const primaryButtonStyle = {
    padding: '0.5rem',
    backgroundColor: isSubmitDisabled ? '#4B5563' : '#005A9E',
    color: isSubmitDisabled ? '#9CA3AF' : 'white',
    borderRadius: '0.25rem',
    border: 'none',
    cursor: isSubmitDisabled ? 'not-allowed' : 'pointer',
    opacity: isSubmitDisabled ? '0.5' : '1',
    fontWeight: '500',
    transition: 'background-color 0.2s'
  };
  
  // Secondary button (dark gray - Reset)
  const secondaryButtonStyle = {
    padding: '0.5rem',
    backgroundColor: '#1F2937',
    color: 'white',
    borderRadius: '0.25rem',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'background-color 0.2s'
  };

  return (
    <div style={containerStyle}>
      <h3 style={headingStyle}>Review Configuration</h3>
      
      {/* Tenant Selection */}
      <div style={formGroupStyle}>
        <label style={labelStyle}>
          Select Tenant:
        </label>
        {isTenantsLoading ? (
          <div style={loadingStyle}>
            Loading tenants...
          </div>
        ) : (
          <select 
            value={selectedTenant} 
            onChange={onTenantChange}
            style={selectStyle}
          >
            <option value="">-- Select a Tenant --</option>
            {tenants.map(tenant => (
              <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
            ))}
          </select>
        )}
      </div>
      
      {/* Design Guidelines Selection */}
      {selectedTenant && (
        <div style={formGroupStyle}>
          <label style={labelStyle}>
            Design Guidelines:
          </label>
          <select 
            value={selectedGuideline} 
            onChange={onGuidelineChange}
            style={selectStyle}
          >
            {guidelines.map(guideline => (
              <option key={guideline.id} value={guideline.id}>{guideline.name}</option>
            ))}
          </select>
        </div>
      )}
      
      {/* LLM Model Selection */}
      {selectedTenant && (
        <div style={formGroupStyle}>
          <label style={labelStyle}>
            LLM Model:
          </label>
          <select 
            value={selectedModel} 
            onChange={onModelChange}
            style={selectStyle}
          >
            {models.map(model => (
              <option key={model.id} value={model.id}>{model.name}</option>
            ))}
          </select>
        </div>
      )}
      
      {/* Current Selection Summary */}
      {selectedTenant && (
        <div style={selectionSummaryStyle}>
          <h4 style={summaryHeadingStyle}>Current Selection:</h4>
          <ul style={summaryListStyle}>
            <li>Tenant: {selectedTenant}</li>
            <li>Guidelines: {selectedGuideline}</li>
            <li>Model: {selectedModel}</li>
          </ul>
        </div>
      )}
      
      {/* Help Text */}
      <div style={helpTextStyle}>
        <p>Select packages and IFlows in the left panel to continue.</p>
      </div>
      
      {/* Button Actions - UPDATED WITH CORRECT STYLES */}
      <div style={buttonContainerStyle}>
        <button
          onClick={onSubmit}
          disabled={isSubmitDisabled}
          style={primaryButtonStyle}
          onMouseOver={(e) => {
            if (!isSubmitDisabled) e.currentTarget.style.backgroundColor = '#003F6C';
          }}
          onMouseOut={(e) => {
            if (!isSubmitDisabled) e.currentTarget.style.backgroundColor = '#005A9E';
          }}
        >
          Submit for Review
        </button>
        
        <button
          onClick={onReset}
          style={secondaryButtonStyle}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#374151';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#1F2937';
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default ConfigurationPanel;
// components/designer/ReviewProgress.jsx
import React from 'react';
// Define the review steps/stages
const reviewSteps = [
  {
    id: 'initializing',
    label: 'Initializing Review Process',
    description: 'Setting up review configuration'
  },
  {
    id: 'extracting', 
    label: 'Extracting Package Data',
    description: 'Fetching packages and IFlow information'
  },
  {
    id: 'downloading',
    label: 'Downloading IFlow Artifacts', 
    description: 'Retrieving IFlow designs and configurations'
  },
  {
    id: 'analyzing',
    label: 'Analyzing Against Guidelines',
    description: 'Running compliance checks using AI'
  },
  {
    id: 'reporting',
    label: 'Generating Report',
    description: 'Compiling results into comprehensive report'
  }
];


const ReviewProgress = ({ jobStatus, onCancel }) => {
  if (!jobStatus) return null;
  // Determine current step based on job status and progress
  const getCurrentStep = () => {
    if (jobStatus.status === 'pending') return 'initializing';
    if (jobStatus.status === 'failed') return 'failed';
    if (jobStatus.status === 'completed') return 'completed';
    
    const progress = jobStatus.progress || 0;
    if (progress < 15) return 'initializing';
    if (progress < 30) return 'extracting';
    if (progress < 50) return 'downloading';
    if (progress < 85) return 'analyzing';
    return 'reporting';
  };

  // Get step status (completed, current, pending)
  const getStepStatus = (stepId) => {
    const currentStep = getCurrentStep();
    const currentStepIndex = reviewSteps.findIndex(step => step.id === currentStep);
    const stepIndex = reviewSteps.findIndex(step => step.id === stepId);
    
    if (jobStatus.status === 'completed') return 'completed';
    if (jobStatus.status === 'failed' && stepIndex <= currentStepIndex) return 'failed';
    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex) return 'current';
    return 'pending';
  };
  const containerStyle = {
  padding: '1rem', // Reduced padding for side panel
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  // ... keep other existing styles
  };
  
  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem'
  };
  const statusListStyle = {
    marginTop: '1.5rem',
    marginBottom: '1.5rem'
  };

  const statusItemStyle = {
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: '1rem',
    padding: '0.75rem',
    borderRadius: '6px',
    transition: 'all 0.3s ease'
  };

  const getStatusItemBackground = (status) => {
    switch(status) {
      case 'completed': return 'rgba(34, 197, 94, 0.1)';
      case 'current': return 'rgba(59, 130, 246, 0.1)';
      case 'failed': return 'rgba(239, 68, 68, 0.1)';
      default: return 'rgba(107, 114, 128, 0.1)';
    }
  };

  const checkboxStyle = (status) => ({
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    marginRight: '12px',
    marginTop: '2px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    border: '2px solid',
    borderColor: status === 'completed' ? '#22c55e' : 
                status === 'current' ? '#3b82f6' :
                status === 'failed' ? '#ef4444' : '#6b7280',
    backgroundColor: status === 'completed' ? '#22c55e' : 
                    status === 'current' ? '#3b82f6' : 'transparent',
    transition: 'all 0.3s ease'
  });

  const stepTextStyle = {
    flex: 1
  };

  const stepLabelStyle = (status) => ({
    fontSize: '0.875rem',
    fontWeight: '500',
    color: status === 'completed' ? '#22c55e' :
          status === 'current' ? '#3b82f6' :
          status === 'failed' ? '#ef4444' : '#9ca3af',
    marginBottom: '0.25rem'
  });

  const stepDescriptionStyle = {
    fontSize: '0.75rem',
    color: '#6b7280'
  };
  const headingStyle = {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: 'white',
    margin: 0
  };
  
  const cancelButtonStyle = {
    padding: '0.25rem 0.75rem',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    color: '#ef4444',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.75rem',
    display: jobStatus.status === 'running' || jobStatus.status === 'pending' ? 'block' : 'none'
  };
  
  const progressBarContainerStyle = {
    width: '100%',
    height: '10px',
    backgroundColor: 'rgba(161, 169, 170, 0.1)',
    borderRadius: '9999px',
    overflow: 'hidden',
    marginBottom: '1rem'
  };
  
  const progressBarStyle = {
    height: '100%',
    width: `${jobStatus.progress}%`,
    backgroundColor: getStatusColor(jobStatus.status),
    borderRadius: '9999px',
    transition: 'width 0.3s ease'
  };
  
  const statusTextStyle = {
    color: getStatusColor(jobStatus.status),
    fontSize: '0.875rem',
    marginBottom: '1rem'
  };
  
  const infoContainerStyle = {
    backgroundColor: 'rgba(161, 169, 170, 0.1)',
    borderRadius: '4px',
    padding: '1rem',
    fontSize: '0.875rem',
    color: 'white'
  };
  
  // Helper function to get color based on status
  function getStatusColor(status) {
    switch (status) {
      case 'completed':
        return '#22c55e'; // Green
      case 'failed':
        return '#ef4444'; // Red
      case 'running':
        return '#0ea5e9'; // Blue
      default:
        return '#a1a9aa'; // Gray
    }
  }
  
  // Only show iFlow counter if we have data
  const showIFlowCounter = jobStatus.completedIFlows !== undefined && 
                          jobStatus.totalIFlows !== undefined &&
                          jobStatus.totalIFlows > 0;
  
  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h3 style={headingStyle}>Review in Progress</h3>
        {jobStatus.status === 'running' || jobStatus.status === 'pending' ? (
          <button 
            style={cancelButtonStyle}
            onClick={onCancel}
            aria-label="Cancel review"
          >
            Cancel
          </button>
        ) : null}
      </div>
      
      {/* Progress bar */}
      <div style={progressBarContainerStyle}>
        <div style={progressBarStyle}></div>
      </div>
      {/* Status Steps List */}
      <div style={statusListStyle}>
        <h4 style={{ color: 'white', fontSize: '1rem', marginBottom: '1rem', fontWeight: '500' }}>
          Review Progress
        </h4>
        {reviewSteps.map((step, index) => {
          const status = getStepStatus(step.id);
          return (
            <div 
              key={step.id}
              style={{
                ...statusItemStyle,
                backgroundColor: getStatusItemBackground(status)
              }}
            >
              <div style={checkboxStyle(status)}>
                {status === 'completed' && (
                  <svg 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="white" 
                    strokeWidth="3" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    style={{ width: '12px', height: '12px' }}
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                )}
                {status === 'current' && (
                  <div style={{
                    width: '8px',
                    height: '8px',
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    animation: 'pulse 2s infinite'
                  }} />
                )}
                {status === 'failed' && (
                  <svg 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="white" 
                    strokeWidth="3" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    style={{ width: '12px', height: '12px' }}
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                )}
              </div>
              <div style={stepTextStyle}>
                <div style={stepLabelStyle(status)}>
                  {step.label}
                  {status === 'current' && jobStatus.completedIFlows && jobStatus.totalIFlows && 
                  step.id === 'analyzing' && (
                    <span style={{ marginLeft: '8px', fontSize: '0.75rem' }}>
                      ({jobStatus.completedIFlows}/{jobStatus.totalIFlows})
                    </span>
                  )}
                </div>
                <div style={stepDescriptionStyle}>
                  {step.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {/* Status message */}
      <div style={statusTextStyle}>
        <strong>{jobStatus.status?.toUpperCase()}:</strong> {jobStatus.message}
      </div>
      
      {/* IFlow counter */}
      {showIFlowCounter && (
        <div style={infoContainerStyle}>
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>Processing IFlows:</strong> {jobStatus.completedIFlows} of {jobStatus.totalIFlows} completed
          </div>
          
          {/* Show spinner if still in progress */}
          {(jobStatus.status === 'running' || jobStatus.status === 'pending') && (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ 
                width: '16px', 
                height: '16px', 
                borderRadius: '50%', 
                border: '2px solid rgba(14, 165, 233, 0.3)', 
                borderTopColor: '#0ea5e9',
                marginRight: '0.5rem',
                animation: 'spin 1s linear infinite'
              }}></div>
              Review in progress...
            </div>
          )}
        </div>
      )}
      
      {/* Error message */}
      {jobStatus.error && (
        <div style={{ 
          backgroundColor: 'rgba(239, 68, 68, 0.1)', 
          color: '#ef4444',
          padding: '1rem',
          borderRadius: '4px',
          marginTop: '1rem',
          fontSize: '0.875rem'
        }}>
          <strong>Error:</strong> {jobStatus.error}
        </div>
      )}
      <p style={{ color: '#A1A9AA', fontSize: '0.875rem', textAlign: 'center' }}>
        {jobStatus.message}
        {jobStatus.completedIFlows && jobStatus.totalIFlows && (
          <span style={{ display: 'block', marginTop: '0.5rem', fontSize: '0.75rem' }}>
            Processing: {jobStatus.completedIFlows} of {jobStatus.totalIFlows} IFlows completed
          </span>
        )}
      </p>
      {/* Add keyframes for spinner animation */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
         {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>
    </div>
  );
};

export default ReviewProgress;
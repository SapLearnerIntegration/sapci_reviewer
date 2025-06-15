// components/designer/ReviewTracker.jsx
import React, { useState } from 'react';

const ReviewTracker = ({ iflow, onClose, onReviewComplete }) => {
  const [reviewStatus, setReviewStatus] = useState('pending'); // pending, in-progress, completed
  const [progress, setProgress] = useState(0);
  
  // Simulate review process
  const startReview = () => {
    setReviewStatus('in-progress');
    
    // Simulate progress updates
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 5;
        if (newProgress >= 100) {
          clearInterval(interval);
          setReviewStatus('completed');
          return 100;
        }
        return newProgress;
      });
    }, 500);
  };

  // Styles
  const containerStyle = {
    backgroundColor: '#2A3A3B',
    borderRadius: '8px',
    padding: '1.5rem',
    marginTop: '1.5rem',
    border: '1px solid rgba(161, 169, 170, 0.3)'
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem'
  };

  const titleStyle = {
    color: 'white',
    fontSize: '1.125rem',
    fontWeight: '600',
    margin: 0
  };

  const closeButtonStyle = {
    background: 'none',
    border: 'none',
    color: '#A1A9AA',
    cursor: 'pointer',
    fontSize: '1.25rem'
  };

  const contentStyle = {
    color: 'white',
    fontSize: '0.875rem'
  };

  const infoItemStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '0.5rem'
  };

  const labelStyle = {
    color: '#A1A9AA'
  };

  const valueStyle = {
    color: 'white',
    fontWeight: 'medium'
  };

  const progressContainerStyle = {
    marginTop: '1rem',
    marginBottom: '1rem'
  };

  const progressBarOuterStyle = {
    width: '100%',
    backgroundColor: '#1A2526',
    borderRadius: '4px',
    height: '8px',
    overflow: 'hidden'
  };

  const progressBarInnerStyle = {
    height: '100%',
    backgroundColor: '#0078D4',
    width: `${progress}%`,
    transition: 'width 0.3s ease'
  };

  const buttonContainerStyle = {
    display: 'flex',
    gap: '0.75rem',
    marginTop: '1.5rem'
  };

  const primaryButtonStyle = {
    padding: '0.5rem 1rem',
    backgroundColor: '#0078D4',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.875rem'
  };

  const secondaryButtonStyle = {
    padding: '0.5rem 1rem',
    backgroundColor: 'transparent',
    color: 'white',
    border: '1px solid rgba(161, 169, 170, 0.5)',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.875rem'
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return '#FFC107';
      case 'in-progress': return '#0078D4';
      case 'completed': return '#4CAF50';
      default: return '#A1A9AA';
    }
  };

  const statusStyle = {
    color: getStatusColor(reviewStatus),
    fontWeight: '600'
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h3 style={titleStyle}>Integration Review Tracker</h3>
        <button 
          style={closeButtonStyle} 
          onClick={onClose}
          aria-label="Close review tracker"
        >
          ×
        </button>
      </div>
      
      <div style={contentStyle}>
        <div style={infoItemStyle}>
          <span style={labelStyle}>IFlow Name:</span>
          <span style={valueStyle}>{iflow.Name}</span>
        </div>
        <div style={infoItemStyle}>
          <span style={labelStyle}>Version:</span>
          <span style={valueStyle}>{iflow.Version}</span>
        </div>
        <div style={infoItemStyle}>
          <span style={labelStyle}>Review Status:</span>
          <span style={statusStyle}>
            {reviewStatus === 'pending' && 'Pending'}
            {reviewStatus === 'in-progress' && 'In Progress'}
            {reviewStatus === 'completed' && 'Completed'}
          </span>
        </div>
        
        {reviewStatus !== 'pending' && (
          <div style={progressContainerStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: '#A1A9AA', fontSize: '0.75rem' }}>Progress</span>
              <span style={{ color: 'white', fontSize: '0.75rem' }}>{progress}%</span>
            </div>
            <div style={progressBarOuterStyle}>
              <div style={progressBarInnerStyle}></div>
            </div>
          </div>
        )}
        
        {reviewStatus === 'pending' && (
          <p>
            Click "Start Review" to begin analyzing this IFlow for compliance with integration standards.
            The review will check for security, error handling, and other best practices.
          </p>
        )}
        
        {reviewStatus === 'in-progress' && (
          <p>
            Review in progress. Analyzing integration patterns, security configurations, 
            and error handling mechanisms. Please wait...
          </p>
        )}
        
        {reviewStatus === 'completed' && (
          <p>
            Review completed! Click "View Report" to see the detailed analysis and recommendations
            for improving this integration.
          </p>
        )}
        
        <div style={buttonContainerStyle}>
          {reviewStatus === 'pending' && (
            <button 
              style={primaryButtonStyle} 
              onClick={startReview}
            >
              Start Review
            </button>
          )}
          
          {reviewStatus === 'completed' && (
            <button 
              style={primaryButtonStyle} 
              onClick={() => onReviewComplete(iflow)}
            >
              View Report
            </button>
          )}
          
          <button 
            style={secondaryButtonStyle} 
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewTracker;

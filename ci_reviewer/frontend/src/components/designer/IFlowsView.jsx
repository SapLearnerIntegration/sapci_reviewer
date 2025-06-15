// components/designer/IFlowsView.jsx (Updated with Test Panel Integration)
import React, { useState, useEffect } from 'react';
import IFlowSearchList from './IFlowSearchList';
import ReviewProgress from './ReviewProgress';
import ReviewDisplay from './ReviewDisplay';
import IFlowTestPanel from './IFlowTestPanel'; // New import

/**
 * IFlowsView Component - Displays and manages iFlows within a selected package
 * Updated to include iFlow testing functionality
 */

const IFlowsView = ({
  // Package data and navigation props
  packageData,
  onBack,
  
  // IFlow selection props
  selectedIFlows,
  onIFlowSelect,
  
  // Action menu props
  showActionsMenu,
  actionsMenu,
  
  // Tenant information props
  selectedTenant,
  tenantName,
  
  // Review state props
  isReviewing,
  jobStatus,
  onCancelReview,
  showReport,
  reportData,
  onCloseReport,

  iflowCurrentPage,
  iflowTotalPages, 
  iflowItemsPerPage,
  onIflowPageChange,
  handleAction
}) => {
  // Local state
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIFlow, setSelectedIFlow] = useState(null);
  const [localSelectedIFlows, setLocalSelectedIFlows] = useState(selectedIFlows || []);
  const [error, setError] = useState(null);
  const [isPackageInfoCollapsed, setIsPackageInfoCollapsed] = useState(false);
  
  // New state for test panel
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [testingIFlow, setTestingIFlow] = useState(null);

  // Update local state when props change
  useEffect(() => {
    setLocalSelectedIFlows(selectedIFlows || []);
  }, [selectedIFlows]);

  // Handle iFlow selection from the list
  const handleIFlowClick = (iflow) => {
    setSelectedIFlow(iflow);
    // Close test panel when selecting a different iFlow
    if (showTestPanel && testingIFlow?.Id !== iflow.Id) {
      setShowTestPanel(false);
      setTestingIFlow(null);
    }
  };

  // Handle selection changes from the IFlowSearchList
  const handleSelectionChange = (selectedIds) => {
    setLocalSelectedIFlows(selectedIds);
  };

  // Handle actions button click
  const handleActionsClick = (e) => {
    if (localSelectedIFlows.length > 0) {
      showActionsMenu(e, localSelectedIFlows[0]); // Pass the first selected IFlow ID
    }
  };

  // Enhanced handleAction to support test action
  const handleEnhancedAction = (action, iflowId) => {
    if (action === 'test') {
      // Find the iFlow object
      const iflow = packageData.paginatedIflows?.find(f => f.Id === iflowId) || 
                   packageData.iflows?.find(f => f.Id === iflowId);
      
      if (iflow) {
        setTestingIFlow(iflow);
        setSelectedIFlow(iflow); // Also set as selected
        setShowTestPanel(true);
      } else {
        setError('IFlow not found for testing');
      }
    } else {
      // Use the original handleAction for other actions
      handleAction(action, iflowId);
    }
  };

  // Close test panel
  const handleCloseTestPanel = () => {
    setShowTestPanel(false);
    setTestingIFlow(null);
  };

  // Determine what to show in the right panel
  const getRightPanelContent = () => {
    if (showTestPanel && testingIFlow) {
      return (
        <IFlowTestPanel
          selectedIFlow={testingIFlow}
          onClose={handleCloseTestPanel}
          selectedTenant={selectedTenant}
          tenantName={tenantName}
        />
      );
    }
    
    if (isReviewing && jobStatus) {
      return (
        <ReviewProgress 
          jobStatus={jobStatus}
          onCancel={onCancelReview}
        />
      );
    }
    
    if (showReport && reportData) {
      return (
        <ReviewDisplay
          reportData={reportData}
          onClose={onCloseReport}
        />
      );
    }
    
    if (selectedIFlow && !showTestPanel) {
      return renderIFlowDetails();
    }
    
    return null;
  };

  // Enhanced Actions Menu Component with Test option
  const EnhancedActionsMenu = () => {
    if (!actionsMenu?.props?.actionsMenuPosition?.visible) return null;
    
    const { actionsMenuPosition } = actionsMenu.props;
    
    const menuStyle = {
      position: 'fixed',
      top: `${actionsMenuPosition.y}px`,
      left: `${actionsMenuPosition.x}px`,
      backgroundColor: '#2A3A3B',
      border: '1px solid #3C4B4C',
      borderRadius: '4px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
      zIndex: 1000,
      overflow: 'hidden'
    };
    
    const menuItemStyle = {
      padding: '8px 16px',
      color: 'white',
      cursor: 'pointer',
      fontSize: '0.875rem',
      display: 'block',
      width: '100%',
      textAlign: 'left',
      border: 'none',
      backgroundColor: 'transparent',
      transition: 'background-color 0.2s'
    };

    const isIFlowValid = packageData && 
                        packageData.iflows && 
                        packageData.iflows.some(flow => 
                          String(flow.Id).toLowerCase() === String(actionsMenuPosition.iflowId).toLowerCase() || 
                          String(flow.Name).toLowerCase() === String(actionsMenuPosition.iflowId).toLowerCase()
                        );

    const actions = [
      { id: 'review', label: 'Review', disabled: !isIFlowValid },
      { id: 'test', label: 'Test', disabled: !isIFlowValid }, // New test action
      { id: 'fix', label: 'Fix', disabled: !isIFlowValid },
      { id: 'deploy', label: 'Deploy', disabled: !isIFlowValid },
      { id: 'download', label: 'Download', disabled: !isIFlowValid },
      { id: 'version', label: 'Version', disabled: !isIFlowValid }
    ];

    return (
      <div style={menuStyle}>
        {actions.map((action) => (
          <button
            key={action.id}
            style={{
              ...menuItemStyle,
              opacity: action.disabled ? 0.5 : 1,
              cursor: action.disabled ? 'not-allowed' : 'pointer'
            }}
            onClick={() => !action.disabled && handleEnhancedAction(action.id, actionsMenuPosition.iflowId)}
            onMouseOver={(e) => { !action.disabled && (e.currentTarget.style.backgroundColor = '#3C4B4C'); }}
            onMouseOut={(e) => { !action.disabled && (e.currentTarget.style.backgroundColor = 'transparent'); }}
            disabled={action.disabled}
          >
            {action.label}
          </button>
        ))}
      </div>
    );
  };

  // Render IFlow Details (existing functionality)
  const renderIFlowDetails = () => {
    const iflowDetailsContainerStyle = {
      padding: '1rem',
      height: '100%'
    };

    const iflowDetailsHeaderStyle = {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1.5rem',
      paddingBottom: '1rem',
      borderBottom: '1px solid rgba(161, 169, 170, 0.3)'
    };

    const iflowDetailsSectionStyle = {
      marginBottom: '1.5rem'
    };

    const iflowDetailsItemStyle = {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '0.75rem',
      fontSize: '0.875rem'
    };

    const labelStyle = {
      color: '#A1A9AA'
    };

    const valueStyle = {
      color: 'white',
      fontWeight: 'medium'
    };

    return (
      <div style={iflowDetailsContainerStyle}>
        <div style={iflowDetailsHeaderStyle}>
          <h3 style={{ color: 'white', margin: 0, fontSize: '1.125rem' }}>
            IFlow Details
          </h3>
          <button
            style={{
              background: 'none',
              border: 'none',
              color: '#A1A9AA',
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: '4px',
              transition: 'background-color 0.2s'
            }}
            onClick={() => setSelectedIFlow(null)}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'rgba(161, 169, 170, 0.1)'; }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              style={{ width: '20px', height: '20px' }}
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        {/* Basic Information */}
        <div style={iflowDetailsSectionStyle}>
          <h4 style={{ color: '#A1A9AA', fontSize: '0.875rem', marginBottom: '1rem', fontWeight: '500' }}>
            Basic Information
          </h4>
          <div style={iflowDetailsItemStyle}>
            <span style={labelStyle}>Name:</span>
            <span style={valueStyle}>{selectedIFlow.Name}</span>
          </div>
          <div style={iflowDetailsItemStyle}>
            <span style={labelStyle}>ID:</span>
            <span style={{ ...valueStyle, fontSize: '0.75rem', fontFamily: 'monospace' }}>
              {selectedIFlow.Id}
            </span>
          </div>
          <div style={iflowDetailsItemStyle}>
            <span style={labelStyle}>Type:</span>
            <span style={valueStyle}>{selectedIFlow.Type || 'Integration Flow'}</span>
          </div>
          <div style={iflowDetailsItemStyle}>
            <span style={labelStyle}>Version:</span>
            <span style={valueStyle}>{selectedIFlow.Version || '1.0.0'}</span>
          </div>
        </div>
        
        {/* Description */}
        {selectedIFlow.Description && (
          <div style={iflowDetailsSectionStyle}>
            <h4 style={{ color: '#A1A9AA', fontSize: '0.875rem', marginBottom: '1rem', fontWeight: '500' }}>
              Description
            </h4>
            <p style={{ color: 'white', fontSize: '0.875rem', lineHeight: '1.5', margin: 0 }}>
              {selectedIFlow.Description.replace(/<[^>]*>?/gm, '')}
            </p>
          </div>
        )}
        
        {/* Actions */}
        <div style={iflowDetailsSectionStyle}>
          <h4 style={{ color: '#A1A9AA', fontSize: '0.875rem', marginBottom: '1rem', fontWeight: '500' }}>
            Actions
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <button
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#005A9E',
                color: 'white',
                borderRadius: '4px',
                border: 'none',
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onClick={() => handleEnhancedAction('review', selectedIFlow.Id)}
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#003F6C'; }}
              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#005A9E'; }}
            >
              Review
            </button>
            <button
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#22c55e',
                color: 'white',
                borderRadius: '4px',
                border: 'none',
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onClick={() => handleEnhancedAction('test', selectedIFlow.Id)}
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#16a34a'; }}
              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#22c55e'; }}
            >
              Test
            </button>
            <button
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'transparent',
                color: '#0078D4',
                borderRadius: '4px',
                border: '1px solid #0078D4',
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onClick={() => handleEnhancedAction('download', selectedIFlow.Id)}
              onMouseOver={(e) => { 
                e.currentTarget.style.backgroundColor = 'rgba(0, 120, 212, 0.1)';
              }}
              onMouseOut={(e) => { 
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Download
            </button>
          </div>
        </div>
        
        {/* Additional Metadata */}
        {(selectedIFlow.CreatedBy || selectedIFlow.CreatedAt || selectedIFlow.ModifiedBy || selectedIFlow.ModifiedAt) && (
          <div style={iflowDetailsSectionStyle}>
            <h4 style={{ color: '#A1A9AA', fontSize: '0.875rem', marginBottom: '1rem', fontWeight: '500' }}>
              Metadata
            </h4>
            {selectedIFlow.CreatedBy && (
              <div style={iflowDetailsItemStyle}>
                <span style={labelStyle}>Created By:</span>
                <span style={valueStyle}>{selectedIFlow.CreatedBy}</span>
              </div>
            )}
            {selectedIFlow.CreatedAt && (
              <div style={iflowDetailsItemStyle}>
                <span style={labelStyle}>Created Date:</span>
                <span style={valueStyle}>
                  {new Date(selectedIFlow.CreatedAt).toLocaleDateString()}
                </span>
              </div>
            )}
            {selectedIFlow.ModifiedBy && (
              <div style={iflowDetailsItemStyle}>
                <span style={labelStyle}>Modified By:</span>
                <span style={valueStyle}>{selectedIFlow.ModifiedBy}</span>
              </div>
            )}
            {selectedIFlow.ModifiedAt && (
              <div style={iflowDetailsItemStyle}>
                <span style={labelStyle}>Modified Date:</span>
                <span style={valueStyle}>
                  {new Date(selectedIFlow.ModifiedAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Styles (keeping existing styles)
  const containerStyle = {
    padding: '1rem 1rem 0 1rem',
    display: 'flex', 
    flexDirection: 'column',
    gap: '1rem',
    backgroundColor: '#1A2526',
    height: '100vh',
    overflow: 'hidden',
    boxSizing: 'border-box'
  };

  const headingContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flexShrink: 0,
    marginBottom: '0.5rem'
  };

  const headingStyle = {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: 'white',
    margin: 0
  };

  const backButtonStyle = {
    background: 'none',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    padding: '0.5rem',
    borderRadius: '4px',
    transition: 'background-color 0.2s'
  };

  const mainContentContainerStyle = {
    display: 'flex',
    gap: '1.5rem',
    flex: 1,
    minHeight: 0,
    overflow: 'hidden'
  };

  const leftColumnStyle = {
    flex: isReviewing || showReport || showTestPanel ? '1' : '2',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    overflow: 'hidden',
    height: '100%'
  };

  const rightPanelStyle = {
    flex: '1',
    display: (isReviewing || showReport || selectedIFlow || showTestPanel) ? 'flex' : 'none',
    flexDirection: 'column',
    gap: '1.5rem',
    backgroundColor: '#2A3A3B',
    borderRadius: '8px',
    border: '1px solid rgba(161, 169, 170, 0.3)',
    overflow: 'auto'
  };

  const packageInfoStyle = {
    padding: '1rem',
    backgroundColor: '#2A3A3B',
    borderRadius: '8px',
    border: '1px solid rgba(161, 169, 170, 0.3)',
    flexShrink: 0,
    maxHeight: isPackageInfoCollapsed ? '50px' : '200px',
    overflow: 'hidden',
    transition: 'all 0.3s ease'
  };

  const iflowsListContainerStyle = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    overflow: 'hidden',
    backgroundColor: '#2A3A3B',
    borderRadius: '8px',
    border: '1px solid rgba(161, 169, 170, 0.3)'
  };

  const iflowsHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2A3A3B',
    padding: '0.75rem 1rem',
    borderRadius: '8px 8px 0 0',
    border: '1px solid rgba(161, 169, 170, 0.3)',
    borderBottom: 'none'
  };

  const actionsButtonStyle = {
    padding: '0.5rem 1rem',
    backgroundColor: '#005A9E',
    color: 'white',
    borderRadius: '4px',
    border: 'none',
    fontSize: '0.875rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    cursor: 'pointer',
    opacity: localSelectedIFlows.length > 0 ? 1 : 0.5,
    pointerEvents: localSelectedIFlows.length > 0 ? 'auto' : 'none'
  };

  const errorContainerStyle = {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: '#ef4444',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '1rem',
    display: error ? 'flex' : 'none',
    alignItems: 'center',
    gap: '0.75rem'
  };

  const infoItemStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '0.5rem',
    fontSize: '0.875rem'
  };

  const labelStyle = {
    color: '#A1A9AA'
  };

  const valueStyle = {
    color: 'white',
    fontWeight: 'medium'
  };

  return (
    <div style={containerStyle}>
      {/* Header with back button */}
      <div style={headingContainerStyle}>
        <button 
          style={backButtonStyle}
          onClick={onBack}
          aria-label="Back to packages"
          onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#2A3A3B'; }}
          onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            style={{ width: '20px', height: '20px' }}
          >
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <h2 style={headingStyle}>IFlows in {packageData.Name}</h2>
      </div>

      {/* Error message display */}
      {error && (
        <div style={errorContainerStyle}>
          <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            style={{ width: '20px', height: '20px' }}
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{error}</span>
          <button 
            onClick={() => setError(null)} 
            style={{
              background: 'none',
              border: 'none',
              color: '#ef4444',
              marginLeft: 'auto',
              cursor: 'pointer'
            }}
          >
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              style={{ width: '16px', height: '16px' }}
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      )}
      
      {/* Main Content Container */}
      <div style={mainContentContainerStyle}>
        {/* Left Column - Package Information and IFlows */}
        <div style={leftColumnStyle}>
          {/* Package Information Section */}
          <div style={packageInfoStyle}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: isPackageInfoCollapsed ? '0' : '1rem',
              cursor: 'pointer',
              padding: '0.1rem 0'
            }}
            onClick={() => setIsPackageInfoCollapsed(!isPackageInfoCollapsed)}
            >
              <h3 style={{ color: 'white', margin: 0, fontSize: '1rem' }}>Package Information</h3>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <svg 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  style={{ 
                    width: '8px', 
                    height: '8px',
                    transform: isPackageInfoCollapsed ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease'
                  }}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
            </div>
            
            {/* Collapsible Content */}
            <div style={{
              maxHeight: isPackageInfoCollapsed ? '0' : '300px',
              overflow: 'hidden',
              transition: 'max-height 0.3s ease'
            }}>
              <div style={{ paddingBottom: '0.5rem' }}>
                <div style={infoItemStyle}>
                  <span style={labelStyle}>Name:</span>
                  <span style={valueStyle}>{packageData.Name}</span>
                </div>
                <div style={infoItemStyle}>
                  <span style={labelStyle}>ID:</span>
                  <span style={valueStyle}>{packageData.Id}</span>
                </div>
                <div style={infoItemStyle}>
                  <span style={labelStyle}>Mode:</span>
                  <span style={valueStyle}>{packageData.Mode === 'EDIT_ALLOWED' ? 'Editable' : packageData.Mode}</span>
                </div>
                <div style={infoItemStyle}>
                  <span style={labelStyle}>Version:</span>
                  <span style={valueStyle}>{packageData.Version}</span>
                </div>
                <div style={infoItemStyle}>
                  <span style={labelStyle}>Created By:</span>
                  <span style={valueStyle}>{packageData.CreatedBy}</span>
                </div>
                <div style={infoItemStyle}>
                  <span style={labelStyle}>Created Date:</span>
                  <span style={valueStyle}>
                    {packageData.CreationDate ? new Date(parseInt(packageData.CreationDate)).toLocaleDateString() : "-"}
                  </span>
                </div>
                <div style={infoItemStyle}>
                  <span style={labelStyle}>Description:</span>
                  <span style={valueStyle}>
                    {packageData.Description ? packageData.Description.replace(/<[^>]*>?/gm, '') : ""}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* IFlows List Section */}
          <div style={iflowsListContainerStyle}>
            {/* IFlows Header with Actions Button */}
            <div style={iflowsHeaderStyle}>
              <h3 style={{ color: 'white', margin: 0, fontWeight: '500' }}>
                Available IFlows ({packageData.totalIflows})
              </h3>
              <button 
                style={actionsButtonStyle}
                onClick={handleActionsClick}
                disabled={localSelectedIFlows.length === 0}
                title={localSelectedIFlows.length === 0 ? "Select an iFlow to enable actions" : "Apply actions to selected iFlow"}
              >
                Actions
                <svg 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  style={{ 
                    width: '15px', 
                    height: '15px'
                  }}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
            </div>

            {isLoading ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '5rem 0',
                backgroundColor: '#2A3A3B',
                borderRadius: '0 0 8px 8px',
                border: '1px solid rgba(161, 169, 170, 0.3)',
                borderTop: 'none',
                height: '300px'
              }}>
                <div style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  border: '2px solid #0078D4',
                  borderTopColor: 'transparent',
                  marginBottom: '1rem',
                  animation: 'spin 1s linear infinite'
                }}></div>
                <p style={{ color: '#A1A9AA' }}>Loading IFlows...</p>
              </div>
            ) : (
              <div style={{ 
                flex: 1, 
                overflow: 'auto',
                backgroundColor: '#2A3A3B',
                border: '1px solid rgba(161, 169, 170, 0.3)',
                borderTop: 'none'
              }}>
                {packageData?.paginatedIflows && packageData.paginatedIflows.length > 0 ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ position: 'sticky', top: 0, backgroundColor: '#2A3A3B', zIndex: 1 }}>
                      <tr>
                        <th style={{ 
                          padding: '0.75rem', 
                          textAlign: 'left', 
                          color: '#A1A9AA',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          textTransform: 'uppercase',
                          borderBottom: '1px solid rgba(161, 169, 170, 0.3)',
                          width: '50px'
                        }}>
                          <input
                            type="checkbox"
                            onChange={(e) => {
                              if (e.target.checked) {
                                const allIds = packageData.paginatedIflows.map(iflow => iflow.Id);
                                setLocalSelectedIFlows(allIds);
                                onIFlowSelect('selectAll', allIds);
                              } else {
                                setLocalSelectedIFlows([]);
                                onIFlowSelect('clear');
                              }
                            }}
                            checked={localSelectedIFlows.length > 0 && localSelectedIFlows.length === packageData.paginatedIflows.length}
                            style={{ accentColor: '#0078D4' }}
                          />
                        </th>
                        <th style={{ 
                          padding: '0.75rem', 
                          textAlign: 'left', 
                          color: '#A1A9AA',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          textTransform: 'uppercase',
                          borderBottom: '1px solid rgba(161, 169, 170, 0.3)'
                        }}>
                          NAME
                        </th>
                        <th style={{ 
                          padding: '0.75rem', 
                          textAlign: 'left', 
                          color: '#A1A9AA',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          textTransform: 'uppercase',
                          borderBottom: '1px solid rgba(161, 169, 170, 0.3)',
                          width: '150px'
                        }}>
                          TYPE
                        </th>
                        <th style={{ 
                          padding: '0.75rem', 
                          textAlign: 'left', 
                          color: '#A1A9AA',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          textTransform: 'uppercase',
                          borderBottom: '1px solid rgba(161, 169, 170, 0.3)',
                          width: '100px'
                        }}>
                          VERSION
                        </th>
                        <th style={{ 
                          padding: '0.75rem', 
                          textAlign: 'left', 
                          color: '#A1A9AA',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          textTransform: 'uppercase',
                          borderBottom: '1px solid rgba(161, 169, 170, 0.3)'
                        }}>
                          DESCRIPTION
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {packageData.paginatedIflows.map((iflow, index) => (
                        <tr 
                          key={iflow.Id || index}
                          style={{ 
                            borderBottom: '1px solid rgba(161, 169, 170, 0.1)',
                            cursor: 'pointer',
                            backgroundColor: selectedIFlow?.Id === iflow.Id ? 'rgba(0, 120, 212, 0.1)' : 'transparent',
                            transition: 'background-color 0.2s'
                          }}
                          onClick={() => handleIFlowClick(iflow)}
                          onMouseOver={(e) => {
                            if (selectedIFlow?.Id !== iflow.Id) {
                              e.currentTarget.style.backgroundColor = 'rgba(161, 169, 170, 0.05)';
                            }
                          }}
                          onMouseOut={(e) => {
                            if (selectedIFlow?.Id !== iflow.Id) {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }
                          }}
                        >
                          <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={localSelectedIFlows.includes(iflow.Id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                const isSelected = localSelectedIFlows.includes(iflow.Id);
                                if (isSelected) {
                                  const newSelection = localSelectedIFlows.filter(id => id !== iflow.Id);
                                  setLocalSelectedIFlows(newSelection);
                                } else {
                                  const newSelection = [...localSelectedIFlows, iflow.Id];
                                  setLocalSelectedIFlows(newSelection);
                                }
                                onIFlowSelect(iflow.Id);
                              }}
                              style={{ accentColor: '#0078D4' }}
                            />
                          </td>
                          <td style={{ 
                            padding: '0.75rem', 
                            color: 'white',
                            fontSize: '0.875rem',
                            fontWeight: selectedIFlow?.Id === iflow.Id ? '500' : 'normal'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <svg 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="1.5" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                                style={{ width: '16px', height: '16px', color: '#0078D4', flexShrink: 0 }}
                              >
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14,2 14,8 20,8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                              </svg>
                              {iflow.Name}
                            </div>
                          </td>
                          <td style={{ 
                            padding: '0.75rem', 
                            color: '#A1A9AA',
                            fontSize: '0.875rem'
                          }}>
                            {iflow.Version || '1.0.0'}
                          </td>
                          <td style={{ 
                            padding: '0.75rem', 
                            color: '#A1A9AA',
                            fontSize: '0.875rem',
                            maxWidth: '300px'
                          }}>
                            <div style={{ 
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {iflow.Description ? iflow.Description.replace(/<[^>]*>?/gm, '') : ''}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '3rem',
                    color: '#A1A9AA',
                    textAlign: 'center',
                    height: '300px'
                  }}>
                    <svg 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="1" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      style={{ width: '48px', height: '48px', marginBottom: '1rem', opacity: 0.5 }}
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14,2 14,8 20,8"></polyline>
                    </svg>
                    <h4 style={{ margin: 0, marginBottom: '0.5rem', color: '#A1A9AA' }}>No IFlows Found</h4>
                    <p style={{ margin: 0, fontSize: '0.875rem' }}>
                      This package contains {packageData?.totalIflows || 0} IFlows, but none are loaded on this page.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* IFlow Pagination Controls */}
            {iflowTotalPages > 1 && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '1rem',
                backgroundColor: '#2A3A3B',
                borderTop: '1px solid rgba(161, 169, 170, 0.2)',
                borderLeft: '1px solid rgba(161, 169, 170, 0.3)',
                borderRight: '1px solid rgba(161, 169, 170, 0.3)',
                borderBottom: '1px solid rgba(161, 169, 170, 0.3)',
                borderRadius: '0 0 8px 8px',
                flexShrink: 0
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <button
                    onClick={() => onIflowPageChange(1)}
                    disabled={iflowCurrentPage === 1}
                    style={{
                      padding: '0.5rem 0.75rem',
                      backgroundColor: iflowCurrentPage === 1 ? '#1A2526' : '#005A9E',
                      color: iflowCurrentPage === 1 ? '#666' : 'white',
                      border: '1px solid #3C4B4C',
                      borderRadius: '4px',
                      cursor: iflowCurrentPage === 1 ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    First
                  </button>
                  
                  <button
                    onClick={() => onIflowPageChange(iflowCurrentPage - 1)}
                    disabled={iflowCurrentPage === 1}
                    style={{
                      padding: '0.5rem 0.75rem',
                      backgroundColor: iflowCurrentPage === 1 ? '#1A2526' : '#005A9E',
                      color: iflowCurrentPage === 1 ? '#666' : 'white',
                      border: '1px solid #3C4B4C',
                      borderRadius: '4px',
                      cursor: iflowCurrentPage === 1 ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    Previous
                  </button>
                  
                  {/* Page numbers */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', margin: '0 1rem' }}>
                    {Array.from({ length: Math.min(5, iflowTotalPages) }, (_, i) => {
                      let pageNum;
                      if (iflowTotalPages <= 5) {
                        pageNum = i + 1;
                      } else {
                        if (iflowCurrentPage <= 3) {
                          pageNum = i + 1;
                        } else if (iflowCurrentPage >= iflowTotalPages - 2) {
                          pageNum = iflowTotalPages - 4 + i;
                        } else {
                          pageNum = iflowCurrentPage - 2 + i;
                        }
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => onIflowPageChange(pageNum)}
                          style={{
                            padding: '0.5rem 0.75rem',
                            backgroundColor: iflowCurrentPage === pageNum ? '#0078D4' : '#1A2526',
                            color: 'white',
                            border: '1px solid #3C4B4C',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            minWidth: '40px'
                          }}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => onIflowPageChange(iflowCurrentPage + 1)}
                    disabled={iflowCurrentPage === iflowTotalPages}
                    style={{
                      padding: '0.5rem 0.75rem',
                      backgroundColor: iflowCurrentPage === iflowTotalPages ? '#1A2526' : '#005A9E',
                      color: iflowCurrentPage === iflowTotalPages ? '#666' : 'white',
                      border: '1px solid #3C4B4C',
                      borderRadius: '4px',
                      cursor: iflowCurrentPage === iflowTotalPages ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    Next
                  </button>
                  
                  <button
                    onClick={() => onIflowPageChange(iflowTotalPages)}
                    disabled={iflowCurrentPage === iflowTotalPages}
                    style={{
                      padding: '0.5rem 0.75rem',
                      backgroundColor: iflowCurrentPage === iflowTotalPages ? '#1A2526' : '#005A9E',
                      color: iflowCurrentPage === iflowTotalPages ? '#666' : 'white',
                      border: '1px solid #3C4B4C',
                      borderRadius: '4px',
                      cursor: iflowCurrentPage === iflowTotalPages ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    Last
                  </button>
                </div>
                
                {/* Page info */}
                <div style={{ 
                  color: '#A1A9AA', 
                  fontSize: '0.75rem',
                  textAlign: 'center'
                }}>
                  Showing {((iflowCurrentPage - 1) * iflowItemsPerPage) + 1} to {Math.min(iflowCurrentPage * iflowItemsPerPage, packageData.totalIflows || 0)} of {packageData.totalIflows || 0} iFlows
                </div>
              </div>
            )}
          </div>      
        </div>
      
        {/* Right Side Panel - Review Progress, Results, Test Panel, or IFlow Details */}
        <div style={rightPanelStyle}>
          {getRightPanelContent()}
        </div>
      </div> 
      
      {/* Render the enhanced actions menu */}
      <EnhancedActionsMenu />

      {/* Add keyframes for spinner animation */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes collapseIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `
      }} />
    </div>
  );
};

export default IFlowsView;
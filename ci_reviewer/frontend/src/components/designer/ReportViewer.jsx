// components/designer/ReportViewer.jsx
import React, { useState } from 'react';

const ReportViewer = ({ report, iflow, onClose }) => {
  const [activeTab, setActiveTab] = useState('summary');
  
  // Mock report data based on the markdown file structure
  // In a real implementation, this would come from the backend
  const reportData = {
    title: "Executive Summary of SAP Integration Review",
    iflowName: iflow.Name,
    date: new Date().toLocaleDateString(),
    overallCompliance: "Medium",
    securityScore: 65,
    errorHandlingScore: 45,
    contentModificationScore: 70,
    loggingScore: 50,
    findings: [
      {
        category: "Security",
        title: "Authentication Issues",
        description: "Non-resolved authentication parameters pose security risks.",
        severity: "High"
      },
      {
        category: "Error Handling",
        title: "Error Handling Deficiencies",
        description: "Absence of error handling procedures places the integration at risk of failure.",
        severity: "High"
      },
      {
        category: "Traceability",
        title: "Lack of Content Modification Traceability",
        description: "Without mechanisms for tracking data changes, it's difficult to audit modifications.",
        severity: "Medium"
      },
      {
        category: "Logging",
        title: "Inadequate Logging Practices",
        description: "Unclear logging practices may lead to potential security violations.",
        severity: "Medium"
      }
    ],
    recommendations: [
      {
        title: "Authentication Improvement",
        description: "Resolve parameterized authentication methods and transition to OAuth 2.0 or certificate-based authentication."
      },
      {
        title: "Implement Error Handling",
        description: "Introduce structured error handling including retry protocols, alerts, and error logging."
      },
      {
        title: "Enhance Content Modification Traceability",
        description: "Utilize message headers or dedicated logs to track content changes effectively."
      },
      {
        title: "Strengthen Logging Practices",
        description: "Develop a logging strategy that excludes sensitive information but records operation-critical data."
      },
      {
        title: "Conduct Comprehensive Testing",
        description: "Ensure thorough testing of integration paths to validate changes in authentication and error handling."
      }
    ]
  };

  // Styles
  const containerStyle = {
    backgroundColor: '#1A2526',
    borderRadius: '8px',
    padding: '0',
    marginTop: '1.5rem',
    border: '1px solid rgba(161, 169, 170, 0.3)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    height: '600px'
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 1.5rem',
    backgroundColor: '#2A3A3B',
    borderBottom: '1px solid rgba(161, 169, 170, 0.3)'
  };

  const titleStyle = {
    color: 'white',
    fontSize: '1.25rem',
    fontWeight: '600',
    margin: 0
  };

  const closeButtonStyle = {
    background: 'none',
    border: 'none',
    color: '#A1A9AA',
    cursor: 'pointer',
    fontSize: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '4px'
  };

  const tabsContainerStyle = {
    display: 'flex',
    backgroundColor: '#2A3A3B',
    borderBottom: '1px solid rgba(161, 169, 170, 0.3)',
    padding: '0 1.5rem'
  };

  const tabStyle = (isActive) => ({
    padding: '0.75rem 1rem',
    color: isActive ? 'white' : '#A1A9AA',
    borderBottom: isActive ? '2px solid #0078D4' : 'none',
    cursor: 'pointer',
    fontWeight: isActive ? '600' : 'normal',
    fontSize: '0.875rem'
  });

  const contentContainerStyle = {
    padding: '1.5rem',
    overflowY: 'auto',
    flexGrow: 1
  };

  const sectionStyle = {
    marginBottom: '2rem'
  };

  const sectionTitleStyle = {
    color: 'white',
    fontSize: '1.125rem',
    fontWeight: '600',
    marginTop: 0,
    marginBottom: '1rem'
  };

  const cardStyle = {
    backgroundColor: '#2A3A3B',
    borderRadius: '8px',
    padding: '1.5rem',
    marginBottom: '1rem'
  };

  const infoGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '1rem',
    marginBottom: '1.5rem'
  };

  const infoCardStyle = {
    backgroundColor: '#2A3A3B',
    borderRadius: '8px',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column'
  };

  const infoLabelStyle = {
    color: '#A1A9AA',
    fontSize: '0.75rem',
    marginBottom: '0.5rem'
  };

  const infoValueStyle = {
    color: 'white',
    fontSize: '1.5rem',
    fontWeight: '600'
  };

  const complianceBarContainerStyle = {
    marginTop: '0.5rem'
  };

  const complianceBarStyle = (percentage) => ({
    height: '6px',
    width: `${percentage}%`,
    backgroundColor: getComplianceColor(percentage),
    borderRadius: '3px'
  });

  const complianceBarBackgroundStyle = {
    height: '6px',
    width: '100%',
    backgroundColor: '#1A2526',
    borderRadius: '3px',
    marginTop: '0.5rem'
  };

  const findingCardStyle = (severity) => ({
    backgroundColor: '#2A3A3B',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '1rem',
    borderLeft: `4px solid ${getSeverityColor(severity)}`
  });

  const findingTitleStyle = {
    color: 'white',
    fontSize: '1rem',
    fontWeight: '600',
    marginTop: 0,
    marginBottom: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  };

  const findingDescriptionStyle = {
    color: '#E0E0E0',
    fontSize: '0.875rem',
    margin: 0
  };

  const findingCategoryStyle = {
    display: 'inline-block',
    padding: '0.25rem 0.5rem',
    backgroundColor: '#1A2526',
    borderRadius: '4px',
    color: '#A1A9AA',
    fontSize: '0.75rem',
    marginTop: '0.5rem'
  };

  const recommendationCardStyle = {
    backgroundColor: '#2A3A3B',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '1rem',
    display: 'flex',
    gap: '1rem'
  };

  const recommendationNumberStyle = {
    width: '24px',
    height: '24px',
    borderRadius: '12px',
    backgroundColor: '#0078D4',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.875rem',
    fontWeight: '600',
    flexShrink: 0
  };

  const recommendationContentStyle = {
    flex: 1
  };

  const recommendationTitleStyle = {
    color: 'white',
    fontSize: '1rem',
    fontWeight: '600',
    marginTop: 0,
    marginBottom: '0.5rem'
  };

  const recommendationDescriptionStyle = {
    color: '#E0E0E0',
    fontSize: '0.875rem',
    margin: 0
  };

  const getComplianceColor = (score) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FFC107';
    return '#F44336';
  };

  const getComplianceText = (score) => {
    if (score >= 80) return 'High';
    if (score >= 60) return 'Medium';
    return 'Low';
  };

  const getSeverityColor = (severity) => {
    switch(severity.toLowerCase()) {
      case 'high': return '#F44336';
      case 'medium': return '#FFC107';
      case 'low': return '#4CAF50';
      default: return '#A1A9AA';
    }
  };

  // Render the appropriate tab content
  const renderTabContent = () => {
    switch(activeTab) {
      case 'summary':
        return (
          <div>
            <div style={sectionStyle}>
              <div style={infoGridStyle}>
                <div style={infoCardStyle}>
                  <span style={infoLabelStyle}>Overall Compliance</span>
                  <span style={{...infoValueStyle, color: getComplianceColor(65)}}>{reportData.overallCompliance}</span>
                  <div style={complianceBarBackgroundStyle}>
                    <div style={complianceBarStyle(65)}></div>
                  </div>
                </div>
                <div style={infoCardStyle}>
                  <span style={infoLabelStyle}>IFlow Name</span>
                  <span style={{...infoValueStyle, fontSize: '1rem'}}>{reportData.iflowName}</span>
                </div>
              </div>
              
              <div style={cardStyle}>
                <h4 style={{...sectionTitleStyle, marginTop: 0}}>Compliance Scores</h4>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem'}}>
                  <div>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem'}}>
                      <span style={{color: '#E0E0E0', fontSize: '0.875rem'}}>Security</span>
                      <span style={{color: getComplianceColor(reportData.securityScore), fontWeight: '600'}}>{reportData.securityScore}%</span>
                    </div>
                    <div style={complianceBarBackgroundStyle}>
                      <div style={complianceBarStyle(reportData.securityScore)}></div>
                    </div>
                  </div>
                  <div>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem'}}>
                      <span style={{color: '#E0E0E0', fontSize: '0.875rem'}}>Error Handling</span>
                      <span style={{color: getComplianceColor(reportData.errorHandlingScore), fontWeight: '600'}}>{reportData.errorHandlingScore}%</span>
                    </div>
                    <div style={complianceBarBackgroundStyle}>
                      <div style={complianceBarStyle(reportData.errorHandlingScore)}></div>
                    </div>
                  </div>
                  <div>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem'}}>
                      <span style={{color: '#E0E0E0', fontSize: '0.875rem'}}>Content Modification</span>
                      <span style={{color: getComplianceColor(reportData.contentModificationScore), fontWeight: '600'}}>{reportData.contentModificationScore}%</span>
                    </div>
                    <div style={complianceBarBackgroundStyle}>
                      <div style={complianceBarStyle(reportData.contentModificationScore)}></div>
                    </div>
                  </div>
                  <div>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem'}}>
                      <span style={{color: '#E0E0E0', fontSize: '0.875rem'}}>Logging</span>
                      <span style={{color: getComplianceColor(reportData.loggingScore), fontWeight: '600'}}>{reportData.loggingScore}%</span>
                    </div>
                    <div style={complianceBarBackgroundStyle}>
                      <div style={complianceBarStyle(reportData.loggingScore)}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div style={sectionStyle}>
              <h3 style={sectionTitleStyle}>Critical Findings</h3>
              {reportData.findings.filter(f => f.severity === 'High').map((finding, index) => (
                <div key={index} style={findingCardStyle(finding.severity)}>
                  <h4 style={findingTitleStyle}>
                    <svg viewBox="0 0 24 24" width="18" height="18" fill={getSeverityColor(finding.severity)}>
                      <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z"/>
                    </svg>
                    {finding.title}
                  </h4>
                  <p style={findingDescriptionStyle}>{finding.description}</p>
                  <span style={findingCategoryStyle}>{finding.category}</span>
                </div>
              ))}
            </div>
            
            <div style={sectionStyle}>
              <h3 style={sectionTitleStyle}>Top Recommendations</h3>
              {reportData.recommendations.slice(0, 3).map((recommendation, index) => (
                <div key={index} style={recommendationCardStyle}>
                  <div style={recommendationNumberStyle}>{index + 1}</div>
                  <div style={recommendationContentStyle}>
                    <h4 style={recommendationTitleStyle}>{recommendation.title}</h4>
                    <p style={recommendationDescriptionStyle}>{recommendation.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'findings':
        return (
          <div>
            <div style={sectionStyle}>
              <h3 style={sectionTitleStyle}>All Findings</h3>
              {reportData.findings.map((finding, index) => (
                <div key={index} style={findingCardStyle(finding.severity)}>
                  <h4 style={findingTitleStyle}>
                    <svg viewBox="0 0 24 24" width="18" height="18" fill={getSeverityColor(finding.severity)}>
                      <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z"/>
                    </svg>
                    {finding.title}
                  </h4>
                  <p style={findingDescriptionStyle}>{finding.description}</p>
                  <div style={{display: 'flex', gap: '0.5rem', marginTop: '0.5rem'}}>
                    <span style={findingCategoryStyle}>{finding.category}</span>
                    <span style={{
                      ...findingCategoryStyle, 
                      backgroundColor: getSeverityColor(finding.severity) + '20',
                      color: getSeverityColor(finding.severity)
                    }}>
                      {finding.severity} Severity
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'recommendations':
        return (
          <div>
            <div style={sectionStyle}>
              <h3 style={sectionTitleStyle}>Recommendations</h3>
              {reportData.recommendations.map((recommendation, index) => (
                <div key={index} style={recommendationCardStyle}>
                  <div style={recommendationNumberStyle}>{index + 1}</div>
                  <div style={recommendationContentStyle}>
                    <h4 style={recommendationTitleStyle}>{recommendation.title}</h4>
                    <p style={recommendationDescriptionStyle}>{recommendation.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>{reportData.title}</h2>
        <button 
          style={closeButtonStyle} 
          onClick={onClose}
          aria-label="Close report"
          onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#3A4A4B'; }}
          onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          ×
        </button>
      </div>
      
      <div style={tabsContainerStyle}>
        <div 
          style={tabStyle(activeTab === 'summary')}
          onClick={() => setActiveTab('summary')}
        >
          Summary
        </div>
        <div 
          style={tabStyle(activeTab === 'findings')}
          onClick={() => setActiveTab('findings')}
        >
          Findings
        </div>
        <div 
          style={tabStyle(activeTab === 'recommendations')}
          onClick={() => setActiveTab('recommendations')}
        >
          Recommendations
        </div>
      </div>
      
      <div style={contentContainerStyle}>
        {renderTabContent()}
      </div>
    </div>
  );
};

export default ReportViewer;

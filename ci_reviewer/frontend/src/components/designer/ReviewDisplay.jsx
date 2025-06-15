// components/designer/ReviewDisplay.jsx
import React from 'react';
import ReactMarkdown from 'react-markdown';

const ReviewDisplay = ({ reportData, onClose }) => {
  if (!reportData) return null;
  
  const containerStyle = {
  backgroundColor: 'transparent', // Remove background since parent has it
  borderRadius: '0',
  padding: '1rem',
  marginTop: '0',
  border: 'none',
  color: 'white',
  height: '100%',
  overflow: 'auto'
};;
  
  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    borderBottom: '1px solid rgba(161, 169, 170, 0.3)',
    paddingBottom: '1rem'
  };
  
  const headingStyle = {
    fontSize: '1.25rem',
    fontWeight: '600',
    margin: 0
  };
  
  const closeButtonStyle = {
    background: 'none',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    padding: '0.5rem',
    borderRadius: '4px'
  };
  
  const complianceBadgeStyle = (level) => {
    let backgroundColor;
    
    switch(level.toLowerCase()) {
      case 'high':
        backgroundColor = 'rgba(34, 197, 94, 0.2)';
        break;
      case 'medium':
        backgroundColor = 'rgba(234, 179, 8, 0.2)';
        break;
      case 'low':
        backgroundColor = 'rgba(239, 68, 68, 0.2)';
        break;
      default:
        backgroundColor = 'rgba(107, 114, 128, 0.2)';
    }
    
    return {
      backgroundColor,
      padding: '0.25rem 0.75rem',
      borderRadius: '999px',
      fontSize: '0.75rem',
      fontWeight: '600',
      textTransform: 'uppercase'
    };
  };
  
  const summaryStyle = {
    backgroundColor: 'rgba(161, 169, 170, 0.1)',
    padding: '1rem',
    borderRadius: '4px',
    marginBottom: '1.5rem'
  };
  
  const getSummaryFromContent = (content) => {
    let complianceLevel = 'Unknown';
    
    // Try to determine compliance level from content
    if (content.toLowerCase().includes('high compliance')) {
      complianceLevel = 'High';
    } else if (content.toLowerCase().includes('medium compliance')) {
      complianceLevel = 'Medium';
    } else if (content.toLowerCase().includes('low compliance')) {
      complianceLevel = 'Low';
    }
    
    // Extract first paragraph as summary
    const firstParagraph = content.split('\n\n')[0];
    
    return {
      complianceLevel,
      summary: firstParagraph.replace(/^#.*\n/, '') // Remove any heading
    };
  };
  
  // Get summary information from content
  const { complianceLevel, summary } = getSummaryFromContent(reportData.content || '');
  
  // Custom renderer for Markdown content
  const markdownStyle = {
    h1: { fontSize: '1.5rem', marginTop: '1.5rem', color: '#fff' },
    h2: { fontSize: '1.25rem', marginTop: '1.5rem', color: '#fff' },
    h3: { fontSize: '1.125rem', marginTop: '1.25rem', color: '#fff' },
    p: { marginTop: '1rem', color: '#e5e7eb' },
    ul: { marginTop: '1rem', paddingLeft: '1.5rem', color: '#e5e7eb' },
    li: { marginTop: '0.5rem', color: '#e5e7eb' },
    table: { width: '100%', borderCollapse: 'collapse', marginTop: '1rem' },
    th: { textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid rgba(161, 169, 170, 0.3)', color: '#fff' },
    td: { padding: '0.5rem', borderBottom: '1px solid rgba(161, 169, 170, 0.2)', color: '#e5e7eb' },
    code: { backgroundColor: 'rgba(0, 0, 0, 0.3)', padding: '0.125rem 0.25rem', borderRadius: '4px', fontSize: '0.875rem' },
    pre: { backgroundColor: 'rgba(0, 0, 0, 0.3)', padding: '1rem', borderRadius: '4px', overflowX: 'auto' }
  };
  
  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h3 style={headingStyle}>IFlow Review Results</h3>
        <button 
          style={closeButtonStyle}
          onClick={onClose}
          aria-label="Close review"
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
      
      {/* Summary section */}
      <div style={summaryStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <h4 style={{ margin: 0, fontSize: '1rem' }}>Compliance Level:</h4>
          <span style={complianceBadgeStyle(complianceLevel)}>{complianceLevel}</span>
        </div>
        <p style={{ margin: 0, fontSize: '0.875rem' }}>{summary}</p>
      </div>
      
      {/* Full report content */}
      <div style={{ fontSize: '0.875rem' }}>
        <ReactMarkdown
          components={{
            h1: ({ node, ...props }) => <h1 style={markdownStyle.h1} {...props} />,
            h2: ({ node, ...props }) => <h2 style={markdownStyle.h2} {...props} />,
            h3: ({ node, ...props }) => <h3 style={markdownStyle.h3} {...props} />,
            p: ({ node, ...props }) => <p style={markdownStyle.p} {...props} />,
            ul: ({ node, ...props }) => <ul style={markdownStyle.ul} {...props} />,
            li: ({ node, ...props }) => <li style={markdownStyle.li} {...props} />,
            table: ({ node, ...props }) => <table style={markdownStyle.table} {...props} />,
            th: ({ node, ...props }) => <th style={markdownStyle.th} {...props} />,
            td: ({ node, ...props }) => <td style={markdownStyle.td} {...props} />,
            code: ({ node, inline, ...props }) => 
              inline ? <code style={markdownStyle.code} {...props} /> : <pre style={markdownStyle.pre}><code {...props} /></pre>,
          }}
        >
          {reportData.content || ''}
        </ReactMarkdown>
      </div>
      
      {/* Download button */}
      <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
        <a
          href={`${process.env.REACT_APP_API_BASE_URL}/sap/review/${reportData.jobId}/download?format=md`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#005A9E',
            color: 'white',
            borderRadius: '4px',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem'
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
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Download Report
        </a>
      </div>
    </div>
  );
};

export default ReviewDisplay;
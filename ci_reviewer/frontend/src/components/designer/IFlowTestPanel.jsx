// components/designer/IFlowTestPanel.jsx
import React, { useState, useRef } from 'react';

const IFlowTestPanel = ({
  selectedIFlow,
  onClose,
  selectedTenant,
  tenantName
}) => {
  // State management
  const [method, setMethod] = useState('GET');
  const [targetUrl, setTargetUrl] = useState('');
  const [requestPayload, setRequestPayload] = useState('');
  const [responsePayload, setResponsePayload] = useState('');
  const [connectionConfig, setConnectionConfig] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [error, setError] = useState(null);
  const [isConfigUploaded, setIsConfigUploaded] = useState(false);
  
  const fileInputRef = useRef(null);

  // Handle file upload for connection config
  const handleConfigUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const config = JSON.parse(e.target.result);
          setConnectionConfig(config);
          setIsConfigUploaded(true);
          setError(null);
          
          // Auto-populate target URL if available in config
          if (config.baseUrl && selectedIFlow?.Id) {
            setTargetUrl(`${config.baseUrl}/http/${selectedIFlow.Id}`);
          }
        } catch (err) {
          setError('Invalid JSON file. Please upload a valid configuration file.');
          setIsConfigUploaded(false);
        }
      };
      reader.readAsText(file);
    } else {
      setError('Please upload a JSON file.');
    }
  };

  // Execute the iFlow test
  const handleExecute = async () => {
    if (!connectionConfig) {
      setError('Please upload connection configuration first.');
      return;
    }

    if (!targetUrl) {
      setError('Please provide a target URL.');
      return;
    }

    setIsExecuting(true);
    setError(null);
    
    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL;
      const testEndpoint = '/sap/iflow/test';
      const apiEndpoint = `${baseUrl}${testEndpoint}`;

      const testPayload = {
        tenant: tenantName,
        tenant_data: {
          id: selectedTenant.id,
          name: selectedTenant.name,
          authUrl: selectedTenant.authUrl,
          apiUrl: selectedTenant.apiUrl,
          clientId: selectedTenant.clientId,
          clientSecret: selectedTenant.clientSecret
        },
        iflow_id: selectedIFlow.Id,
        test_config: {
          method: method,
          target_url: targetUrl,
          request_payload: requestPayload || null,
          connection_config: connectionConfig
        }
      };

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testPayload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Test execution failed: ${errorText}`);
      }

      const result = await response.json();
      setTestResult(result);
      setResponsePayload(JSON.stringify(result.response_data, null, 2));
    } catch (err) {
      console.error('Error executing iFlow test:', err);
      setError(`Test execution failed: ${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  // Download test results
  const handleDownload = () => {
    if (!testResult) {
      setError('No test results to download.');
      return;
    }

    const downloadData = {
      iflow_id: selectedIFlow.Id,
      iflow_name: selectedIFlow.Name,
      test_timestamp: new Date().toISOString(),
      request: {
        method: method,
        url: targetUrl,
        payload: requestPayload || null
      },
      response: testResult.response_data,
      status_code: testResult.status_code,
      execution_time: testResult.execution_time
    };

    const blob = new Blob([JSON.stringify(downloadData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `iflow_test_${selectedIFlow.Id}_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Reset form
  const handleCancel = () => {
    setMethod('GET');
    setTargetUrl('');
    setRequestPayload('');
    setResponsePayload('');
    setConnectionConfig(null);
    setIsConfigUploaded(false);
    setTestResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  // Styles 
  const containerStyle = {
    padding: '1rem',
    height: '100%',
    overflow: 'auto',
    backgroundColor: '#2A3A3B'
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid rgba(161, 169, 170, 0.3)'
  };

  const titleStyle = {
    color: 'white',
    fontSize: '1.125rem',
    fontWeight: '600',
    margin: 0
  };

  const sectionStyle = {
    marginBottom: '1.5rem'
  };

  const labelStyle = {
    display: 'block',
    color: '#A1A9AA',
    fontSize: '0.875rem',
    fontWeight: '500',
    marginBottom: '0.5rem'
  };

  const inputStyle = {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: '#1A2526',
    border: '1px solid #3C4B4C',
    borderRadius: '4px',
    color: 'white',
    fontSize: '0.875rem'
  };

  const selectStyle = {
    ...inputStyle,
    cursor: 'pointer'
  };

  const textareaStyle = {
    ...inputStyle,
    minHeight: '120px',
    resize: 'vertical',
    fontFamily: 'monospace'
  };

  const buttonStyle = {
    padding: '0.75rem 1rem',
    borderRadius: '4px',
    border: 'none',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    marginRight: '0.5rem'
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#005A9E',
    color: 'white'
  };

  const secondaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: 'transparent',
    color: '#0078D4',
    border: '1px solid #0078D4'
  };

  const dangerButtonStyle = {
    ...buttonStyle,
    backgroundColor: 'transparent',
    color: '#ef4444',
    border: '1px solid #ef4444'
  };

  const configSectionStyle = {
    ...sectionStyle,
    padding: '1rem',
    backgroundColor: isConfigUploaded ? 'rgba(34, 197, 94, 0.1)' : 'rgba(161, 169, 170, 0.1)',
    border: `1px solid ${isConfigUploaded ? '#22c55e' : 'rgba(161, 169, 170, 0.3)'}`,
    borderRadius: '8px'
  };

  const errorStyle = {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: '#ef4444',
    padding: '0.75rem',
    borderRadius: '4px',
    marginBottom: '1rem',
    fontSize: '0.875rem'
  };

  const successStyle = {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    color: '#22c55e',
    padding: '0.75rem',
    borderRadius: '4px',
    marginBottom: '1rem',
    fontSize: '0.875rem'
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h3 style={titleStyle}>Test IFlow: {selectedIFlow.Name}</h3>
        <button
          style={{
            background: 'none',
            border: 'none',
            color: '#A1A9AA',
            cursor: 'pointer',
            padding: '0.5rem',
            borderRadius: '4px'
          }}
          onClick={handleCancel}
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

      {/* Error Display */}
      {error && (
        <div style={errorStyle}>
          {error}
        </div>
      )}

      {/* Success Display */}
      {testResult && !error && (
        <div style={successStyle}>
          Test executed successfully! Status: {testResult.status_code} | 
          Execution time: {testResult.execution_time}ms
        </div>
      )}

      {/* Connection Configuration Section */}
      <div style={configSectionStyle}>
        <label style={labelStyle}>
          Set Connection Config:
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <input
            type="file"
            ref={fileInputRef}
            accept=".json"
            onChange={handleConfigUpload}
            style={{ display: 'none' }}
          />
          <button
            style={secondaryButtonStyle}
            onClick={() => fileInputRef.current?.click()}
          >
            {isConfigUploaded ? 'Change Config' : 'Upload JSON Config'}
          </button>
          {isConfigUploaded && (
            <span style={{ color: '#22c55e', fontSize: '0.875rem' }}>
              ✓ Configuration loaded
            </span>
          )}
        </div>
        {connectionConfig && (
          <div style={{ marginTop: '0.5rem' }}>
            <small style={{ color: '#A1A9AA' }}>
              Loaded: {connectionConfig.name || 'Connection Configuration'}
            </small>
          </div>
        )}
      </div>

      {/* HTTP Method */}
      <div style={sectionStyle}>
        <label style={labelStyle}>Method:</label>
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          style={selectStyle}
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="PATCH">PATCH</option>
          <option value="DELETE">DELETE</option>
        </select>
      </div>

      {/* Target URL */}
      <div style={sectionStyle}>
        <label style={labelStyle}>Target URL:</label>
        <input
          type="text"
          value={targetUrl}
          onChange={(e) => setTargetUrl(e.target.value)}
          placeholder="https://your-integration-endpoint.com/api/endpoint"
          style={inputStyle}
        />
      </div>

      {/* Request Payload */}
      <div style={sectionStyle}>
        <label style={labelStyle}>Request Payload:</label>
        <textarea
          value={requestPayload}
          onChange={(e) => setRequestPayload(e.target.value)}
          placeholder={method === 'GET' ? 'Not required for GET requests' : 'Enter JSON payload...'}
          style={textareaStyle}
          disabled={method === 'GET'}
        />
      </div>

      {/* Response Payload */}
      {responsePayload && (
        <div style={sectionStyle}>
          <label style={labelStyle}>Response Payload:</label>
          <textarea
            value={responsePayload}
            readOnly
            style={{
              ...textareaStyle,
              backgroundColor: '#1A2526',
              color: '#22c55e'
            }}
          />
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
        <div>
          <button
            style={{
              ...primaryButtonStyle,
              opacity: isExecuting || !isConfigUploaded ? 0.5 : 1
            }}
            onClick={handleExecute}
            disabled={isExecuting || !isConfigUploaded}
          >
            {isExecuting ? 'Executing...' : 'Execute'}
          </button>
          
          <button
            style={{
              ...secondaryButtonStyle,
              opacity: !testResult ? 0.5 : 1
            }}
            onClick={handleDownload}
            disabled={!testResult}
          >
            Download
          </button>
        </div>
        
        <button
          style={dangerButtonStyle}
          onClick={handleCancel}
        >
          Cancel
        </button>
      </div>

      {/* Loading Spinner */}
      {isExecuting && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: '2rem'
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            border: '2px solid #0078D4',
            borderTopColor: 'transparent',
            animation: 'spin 1s linear infinite'
          }}></div>
        </div>
      )}
    </div>
  );
};

export default IFlowTestPanel;
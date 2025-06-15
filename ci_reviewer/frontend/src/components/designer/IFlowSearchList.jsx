// components/designer/IFlowSearchList.jsx
import React, { useState, useEffect } from 'react';

const IFlowSearchList = ({ 
  iflows, 
  selectedIFlows, 
  onIFlowSelect, 
  onIFlowClick,
  onSelectionChange // New prop for notifying parent of selection changes
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredIFlows, setFilteredIFlows] = useState(iflows);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredIFlows(iflows);
    } else {
      const filtered = iflows.filter(iflow => 
        iflow.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (iflow.Description && iflow.Description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredIFlows(filtered);
    }
  }, [searchTerm, iflows]);

  // Notify parent component when selection changes
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selectedIFlows);
    }
  }, [selectedIFlows, onSelectionChange]);

  // Handle select all checkbox change
  const handleSelectAllChange = () => {
    if (filteredIFlows.length === 0) return;
    
    if (selectedIFlows.length === filteredIFlows.length) {
      // Deselect all iflows
      onIFlowSelect('clear');
    } else {
      // Select all iflows
      onIFlowSelect('selectAll', filteredIFlows.map(iflow => iflow.Id));
    }
  };

  // Styles
  const containerStyle = {
    border: '1px solid rgba(161, 169, 170, 0.3)',
    borderRadius: '8px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem 1rem',
    backgroundColor: '#2A3A3B'
  };

  const headerTextStyle = {
    color: 'white',
    fontWeight: '500'
  };

  const searchContainerStyle = {
    padding: '0.75rem 1rem',
    backgroundColor: '#2A3A3B',
    borderBottom: '1px solid rgba(161, 169, 170, 0.3)'
  };

  const searchInputStyle = {
    width: '100%',
    padding: '0.5rem',
    backgroundColor: '#1A2526',
    border: '1px solid rgba(161, 169, 170, 0.3)',
    borderRadius: '4px',
    color: 'white',
    fontSize: '0.875rem'
  };

  const tableContainerStyle = {
    overflowY: 'auto',
    flexGrow: 1,
    backgroundColor: '#1A2526'
  };

  const tableHeaderStyle = {
    backgroundColor: '#2A3A3B',
    textAlign: 'left',
    fontSize: '0.75rem',
    color: '#A1A9AA',
    textTransform: 'uppercase',
    position: 'sticky',
    top: 0
  };

  const tableHeaderCellStyle = {
    padding: '0.75rem'
  };

  const tableCellStyle = {
    padding: '0.75rem',
    fontSize: '0.875rem',
    color: 'white',
    borderBottom: '1px solid rgba(161, 169, 170, 0.1)'
  };

  const rowStyle = (iflowId) => ({
    cursor: 'pointer',
    backgroundColor: selectedIFlows.includes(iflowId) ? 'rgba(0, 120, 212, 0.1)' : 'transparent'
  });

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h3 style={headerTextStyle}>
          IFlows ({filteredIFlows.length}/{iflows.length})
        </h3>
      </div>
      
      <div style={searchContainerStyle}>
        <input
          type="text"
          placeholder="Search IFlows..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={searchInputStyle}
        />
      </div>
      
      <div style={tableContainerStyle}>
        {filteredIFlows.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#A1A9AA' }}>
            No IFlows found matching your search.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={tableHeaderStyle}>
                <th style={{ ...tableHeaderCellStyle, width: '40px' }}>
                  <input
                    type="checkbox"
                    onChange={handleSelectAllChange}
                    checked={selectedIFlows.length === filteredIFlows.length && filteredIFlows.length > 0}
                    style={{ accentColor: '#0078D4' }}
                  />
                </th>
                <th style={tableHeaderCellStyle}>Name</th>
                <th style={tableHeaderCellStyle}>Type</th>
                <th style={tableHeaderCellStyle}>Version</th>
                <th style={tableHeaderCellStyle}>Description</th>
                {/* Removed the Actions column */}
              </tr>
            </thead>
            <tbody>
              {filteredIFlows.map((iflow) => (
                <tr 
                  key={iflow.Id} 
                  style={rowStyle(iflow.Id)}
                  onClick={() => onIFlowClick(iflow)}
                >
                  <td style={tableCellStyle} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIFlows.includes(iflow.Id)}
                      onChange={() => onIFlowSelect(iflow.Id)}
                      style={{ accentColor: '#0078D4' }}
                    />
                  </td>
                  <td style={tableCellStyle}>{iflow.Name}</td>
                  <td style={tableCellStyle}>{iflow.Type}</td>
                  <td style={tableCellStyle}>{iflow.Version}</td>
                  <td style={tableCellStyle}>{iflow.Description.replace(/<[^>]*>?/gm, '')}</td>


                  {/* Removed the Actions button cell */}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default IFlowSearchList;

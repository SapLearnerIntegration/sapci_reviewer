// components/guidelines-manager/GuidelinesManagerSection.jsx
import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  Edit2, 
  Save, 
  X, 
  Plus,
  Trash2, 
  ChevronRight,
  Search,
  Download,
  AlertTriangle,
  Copy,
  CheckSquare,
  MoreHorizontal,
  RotateCcw
} from 'lucide-react';

// Enhanced mock data with version history
const mockGuidelines = [
  {
    id: 'basic',
    name: 'Basic Design Guidelines',
    description: 'Standard SAP integration design principles',
    type: 'System',
    version: '1.0.2',
    versionHistory: [
      { version: '1.0.2', date: '2024-04-14T10:37:31Z', user: 'Admin' },
      { version: '1.0.1', date: '2024-03-20T08:22:15Z', user: 'Admin' },
      { version: '1.0.0', date: '2024-02-15T14:05:42Z', user: 'System' }
    ],
    createdAt: '2024-02-15T14:05:42Z',
    updatedAt: '2024-04-14T10:37:31Z',
    createdBy: 'System',
    updatedBy: 'Admin',
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
4. **Logging**: Only non-sensitive data should be logged.`
  },
  {
    id: 'security',
    name: 'Security-focused Guidelines',
    description: 'Guidelines focusing on security best practices',
    type: 'System',
    version: '2.3.1',
    versionHistory: [
      { version: '2.3.1', date: '2024-04-14T10:37:31Z', user: 'Admin' },
      { version: '2.3.0', date: '2024-03-05T15:47:22Z', user: 'Security Team' },
      { version: '2.2.0', date: '2024-01-20T09:12:38Z', user: 'System' }
    ],
    createdAt: '2023-11-22T14:05:42Z',
    updatedAt: '2024-04-14T10:37:31Z',
    createdBy: 'System',
    updatedBy: 'Admin',
    content: `# SAP Integration Security Guidelines

## Authentication & Authorization
1. **OAuth 2.0**: Use OAuth 2.0 for all external API connections.
2. **Certificate-based**: Use X.509 certificates for system-to-system communications.`
  },
  {
    id: 'test',
    name: 'Test Environment Guidelines',
    description: 'Guidelines for test environment integrations',
    type: 'Custom',
    version: 'Draft',
    versionHistory: [
      { version: '1.0.0', date: '2024-04-15T12:57:13Z', user: 'John Smith' }
    ],
    createdAt: '2024-04-15T12:57:13Z',
    updatedAt: '2024-04-15T12:57:13Z',
    createdBy: 'John Smith',
    updatedBy: 'John Smith',
    content: `# Test Environment Guidelines

## General Principles
1. **Isolation**: Test environments must be completely isolated from production.
2. **Data Masking**: Use masked data in test environments.`
  },
  {
    id: 'performance',
    name: 'Performance Guidelines',
    description: 'Optimizing integration performance',
    type: 'Custom',
    version: '1.2.5',
    versionHistory: [
      { version: '1.2.5', date: '2024-04-16T09:33:21Z', user: 'Performance Team' },
      { version: '1.2.4', date: '2024-03-29T14:22:15Z', user: 'John Smith' },
      { version: '1.2.3', date: '2024-03-12T11:05:42Z', user: 'Admin' }
    ],
    createdAt: '2023-12-20T10:15:42Z',
    updatedAt: '2024-04-16T09:33:21Z',
    createdBy: 'Admin',
    updatedBy: 'Performance Team',
    content: `# Performance Guidelines

## Message Processing
1. **Batch Processing**: Use batch processing for large data volumes.
2. **Concurrency**: Configure appropriate concurrency settings.
3. **Timeouts**: Set appropriate timeouts for all connections.

## Monitoring
1. **KPIs**: Define and monitor key performance indicators.
2. **Alerting**: Set up alerts for performance thresholds.`
  }
];

const GuidelinesManagerSection = () => {
  const [view, setView] = useState('list'); // list, detail, edit
  const [selectedGuideline, setSelectedGuideline] = useState(null);
  const [editedGuideline, setEditedGuideline] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [guidelineToDelete, setGuidelineToDelete] = useState(null);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState(null);
  
  // Filtered guidelines based on search
  const filteredGuidelines = mockGuidelines.filter(guideline => 
    guideline.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guideline.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleViewGuideline = (guideline) => {
    setSelectedGuideline(guideline);
    setView('detail');
    setActionMenuOpen(null);
  };
  
  const handleEditGuideline = () => {
    // Clone the guideline and set version to 'Draft'
    const draftGuideline = {
      ...selectedGuideline,
      version: 'Draft'
    };
    setEditedGuideline(draftGuideline);
    setView('edit');
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedGuideline({
      ...editedGuideline,
      [name]: value
    });
  };
  
  const handleSave = () => {
    // In a real app, this would save to backend
    // Generate a new version number (increment from previous)
    const currentVersion = selectedGuideline.version;
    let newVersion;
    
    if (currentVersion === 'Draft' && selectedGuideline.versionHistory.length > 0) {
      // Get the latest non-draft version
      newVersion = selectedGuideline.versionHistory[0].version;
    } else if (currentVersion !== 'Draft') {
      // Simple increment of the last segment for demonstration
      const versionParts = currentVersion.split('.');
      const lastPart = parseInt(versionParts[versionParts.length - 1]) + 1;
      versionParts[versionParts.length - 1] = lastPart.toString();
      newVersion = versionParts.join('.');
    } else {
      newVersion = '1.0.0'; // First version
    }
    
    // Update the guideline with new version and timestamps
    const updatedGuideline = {
      ...editedGuideline,
      version: newVersion,
      updatedAt: new Date().toISOString(),
      updatedBy: 'Current User', // This would come from auth context in a real app
      versionHistory: [
        { version: newVersion, date: new Date().toISOString(), user: 'Current User' },
        ...selectedGuideline.versionHistory
      ]
    };
    
    setSelectedGuideline(updatedGuideline);
    setView('detail');
  };
  
  const handleCancel = () => {
    setEditedGuideline(null);
    setView('detail');
  };
  
  const handleBackToList = () => {
    setSelectedGuideline(null);
    setEditedGuideline(null);
    setView('list');
    setShowVersionHistory(false);
    setActionMenuOpen(null);
  };
  
  const handleRevertVersion = (versionInfo) => {
    // In a real app, this would retrieve the specific version from the backend
    // For demo, we'll just show an alert
    alert(`Reverted to version ${versionInfo.version} from ${new Date(versionInfo.date).toLocaleString()}`);
    setShowVersionHistory(false);
  };
  
  const handleDeleteRequest = (guideline) => {
    setGuidelineToDelete(guideline);
    setShowDeleteConfirm(true);
    setActionMenuOpen(null);
  };
  
  const confirmDelete = () => {
    // In a real app, this would delete from backend
    console.log(`Deleting guideline: ${guidelineToDelete.id}`);
    setShowDeleteConfirm(false);
    setGuidelineToDelete(null);
    
    // If we're in detail view of the deleted guideline, go back to list
    if (view === 'detail' && selectedGuideline.id === guidelineToDelete.id) {
      handleBackToList();
    }
  };
  
  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setGuidelineToDelete(null);
  };
  
  const handleCopyGuideline = (guideline) => {
    // In a real app, this would create a copy with a new ID
    console.log(`Copying guideline: ${guideline.id}`);
    alert(`Copied guideline: ${guideline.name}`);
    setActionMenuOpen(null);
  };
  
  const handleDownloadGuideline = (guideline) => {
    // In a real app, this would trigger a file download
    console.log(`Downloading guideline: ${guideline.id}`);
    
    // Create a simple download simulation
    const element = document.createElement('a');
    const file = new Blob([guideline.content], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    element.download = `${guideline.name.replace(/\s+/g, '_')}-v${guideline.version}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    setActionMenuOpen(null);
  };
  
  const toggleActionMenu = (id) => {
    setActionMenuOpen(actionMenuOpen === id ? null : id);
  };

  // Delete confirmation modal
  const DeleteConfirmationModal = () => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-md border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-medium text-white">Confirm Delete</h3>
            <button 
              onClick={cancelDelete}
              className="p-1.5 rounded-md bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          <p className="text-gray-300 mb-3">
            Are you sure you want to delete the following guideline?
          </p>
          <div className="p-4 bg-gray-700 rounded-md mb-4 border border-gray-600">
            <p className="font-medium text-white mb-1">{guidelineToDelete?.name}</p>
            <p className="text-sm text-blue-300">Version: {guidelineToDelete?.version}</p>
          </div>
          <p className="text-red-400 text-sm mb-6 flex items-center">
            <AlertTriangle size={16} className="mr-2" />
            This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={cancelDelete}
              className="px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Version history component
  const VersionHistoryPanel = () => {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-md p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-blue-300 font-medium">Version History</h3>
          <button 
            onClick={() => setShowVersionHistory(false)}
            className="p-2 rounded-md bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <div className="divide-y divide-gray-700">
          {selectedGuideline.versionHistory.map((version, index) => (
            <div key={version.version} className="py-3 flex justify-between items-center">
              <div>
                <div className="flex items-center">
                  <span className="text-blue-400 font-medium mr-2">v{version.version}</span>
                  {index === 0 && <span className="px-2 py-0.5 rounded-full bg-blue-900 text-blue-300 text-xs">Current</span>}
                </div>
                <div className="text-sm text-gray-300 mt-1">
                  Updated by {version.user} on {new Date(version.date).toLocaleString()}
                </div>
              </div>
              {index > 0 && (
                <button 
                  onClick={() => handleRevertVersion(version)}
                  className="flex items-center px-3 py-1 bg-gray-700 hover:bg-gray-600 text-blue-300 hover:text-blue-200 rounded-md text-sm transition-colors"
                >
                  <RotateCcw size={14} className="mr-1" />
                  Revert
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Action menu component
  const ActionMenu = ({ guideline, isOpen }) => {
    const [isCopyHovered, setIsCopyHovered] = useState(false);
    const [isDownloadHovered, setIsDownloadHovered] = useState(false);
    const [isDeleteHovered, setIsDeleteHovered] = useState(false);

    if (!isOpen) return null;

    const baseButtonStyle = {
      display: 'flex',
      width: '100%',
      alignItems: 'center',
      padding: '0.5rem 1rem', // px-4 py-2
      fontSize: '0.875rem', // text-sm
      color: '#c9d1d9', // text-[#c9d1d9]
      backgroundColor: 'transparent',
      border: 'none',
      cursor: 'pointer',
      textAlign: 'left',
      transition: 'background-color 0.2s ease, color 0.2s ease',
    };

    const hoverButtonStyle = {
      backgroundColor: '#1f6feb', // hover:bg-[#1f6feb]
      color: '#ffffff', // hover:text-white
    };

    const deleteTextStyle = {
      color: '#f87171', // text-red-400
    };

    const iconStyle = {
      marginRight: '0.5rem' // mr-2
    };

    return (
      <div style={{
        position: 'absolute',
        right: 0,
        marginTop: '0.5rem',
        width: '12rem',
        backgroundColor: '#161b22',
        borderRadius: '0.375rem',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        border: '1px solid #30363d',
        paddingTop: '0.25rem',
        paddingBottom: '0.25rem',
        zIndex: 10
      }}>
        {/* Copy Button */}
        <button
          onClick={() => handleCopyGuideline(guideline)}
          style={isCopyHovered ? { ...baseButtonStyle, ...hoverButtonStyle } : baseButtonStyle}
          onMouseEnter={() => setIsCopyHovered(true)}
          onMouseLeave={() => setIsCopyHovered(false)}
        >
          <Copy size={16} style={iconStyle} />
          Copy
        </button>
        {/* Download Button */}
        <button
          onClick={() => handleDownloadGuideline(guideline)}
          style={isDownloadHovered ? { ...baseButtonStyle, ...hoverButtonStyle } : baseButtonStyle}
          onMouseEnter={() => setIsDownloadHovered(true)}
          onMouseLeave={() => setIsDownloadHovered(false)}
        >
          <Download size={16} style={iconStyle} />
          Download
        </button>
        {/* Delete Button */}
        {guideline.type !== 'System' && (
          <button
            onClick={() => handleDeleteRequest(guideline)}
            style={isDeleteHovered ? { ...baseButtonStyle, ...deleteTextStyle, ...hoverButtonStyle } : { ...baseButtonStyle, ...deleteTextStyle }}
            onMouseEnter={() => setIsDeleteHovered(true)}
            onMouseLeave={() => setIsDeleteHovered(false)}
          >
            <Trash2 size={16} style={iconStyle} />
            Delete
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="h-full bg-[#0d1117]">
      {/* Main header section */}
      <div className="flex justify-between items-center p-4">
        <h2 className="text-xl font-medium text-[#e6edf3]">Guidelines Manager</h2>
        
        {view === 'list' && (
          <button 
            className="flex items-center justify-center px-3 py-2 bg-[#1f6feb] text-white rounded-md hover:bg-[#1c63d8]"
          >
            <Plus size={16} />
          </button>
        )}
        
        {view === 'detail' && (
          <div className="flex items-center space-x-3">
            {!showVersionHistory && (
              <button 
                onClick={() => setShowVersionHistory(true)}
                className="px-3 py-2 bg-gray-800 text-gray-300 rounded-md hover:bg-gray-700 hover:text-white flex items-center"
              >
                <RotateCcw size={16} className="mr-2" />
                Version History
              </button>
            )}
            <button 
              onClick={handleEditGuideline}
              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
            >
              <Edit2 size={16} className="mr-2" />
              Edit
            </button>
          </div>
        )}
        
        {view === 'edit' && (
          <div className="flex space-x-3">
            <button 
              onClick={handleCancel}
              className="px-3 py-2 rounded-md bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white flex items-center"
            >
              <X size={16} className="mr-2" />
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 flex items-center"
            >
              <Save size={16} className="mr-2" />
              Save Changes
            </button>
          </div>
        )}
      </div>
      
      {view === 'list' && (
        <div className="px-4">
          {/* Search input */}
          <div className="mb-4" style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: '50%', left: '0.75rem', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
              <Search className="h-5 w-5 text-[#8b949e]" />
            </div>
            <input 
              type="text"
              placeholder="Search guidelines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pr-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-md text-[#e6edf3] placeholder:text-[#8b949e] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              style={{ paddingLeft: '2.5rem' }} // Equivalent to pl-10
            />
          </div>
          
          {/* Table */}
          <div className="rounded-md overflow-hidden border border-[#30363d] bg-[#0d1117]">
            <table className="min-w-full">
              <thead>
                <tr className="bg-[#161b22] text-[#8b949e] uppercase text-xs font-medium">
                  <th className="px-6 py-3 text-left tracking-wider w-1/4 border-b border-[#30363d]">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left tracking-wider w-1/4 border-b border-[#30363d]">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left tracking-wider w-1/12 border-b border-[#30363d]">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left tracking-wider w-1/12 border-b border-[#30363d]">
                    Version
                  </th>
                  <th className="px-6 py-3 text-left tracking-wider w-1/12 border-b border-[#30363d]">
                    User
                  </th>
                  <th className="px-6 py-3 text-left tracking-wider w-1/6 border-b border-[#30363d]">
                    Last Updated
                  </th>
                  <th className="px-6 py-3 text-right tracking-wider w-1/12 border-b border-[#30363d]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredGuidelines.map((guideline, index) => (
                  <tr 
                    key={guideline.id} 
                    className={`transition-colors cursor-pointer border-b border-[#30363d] ${
                      index === filteredGuidelines.length - 1 ? 'border-b-0' : ''
                    }`}
                    onClick={() => handleViewGuideline(guideline)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#e6edf3]">
                      {guideline.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#8b949e]">
                      {guideline.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        guideline.type === 'System' ? 'bg-[#1f6feb] text-white' : 'bg-[#1a7f37] text-white'
                      }`}>
                        {guideline.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`font-medium ${guideline.version === 'Draft' ? 'text-[#d29922]' : 'text-[#e6edf3]'}`}>
                        {guideline.version}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#8b949e]">
                      {guideline.updatedBy}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#8b949e]">
                      {new Date(guideline.updatedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <div className="flex justify-end items-center">
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleActionMenu(guideline.id);
                            }}
                            className="p-2 rounded-md bg-[#21262d] text-[#8b949e] hover:bg-[#30363d] hover:text-[#c9d1d9] transition-colors"
                            aria-label="Actions"
                          >
                            <MoreHorizontal size={16} />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewGuideline(guideline);
                            }}
                            className="p-2 rounded-md bg-[#21262d] text-[#8b949e] hover:bg-[#30363d] hover:text-[#c9d1d9] transition-colors"
                            aria-label="View details"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                        <ActionMenu 
                          guideline={guideline}
                          isOpen={actionMenuOpen === guideline.id}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {view === 'detail' && selectedGuideline && (
        <div className="max-w-5xl mx-auto space-y-6 p-6">
          <div className="flex items-center mb-4">
            <button 
              onClick={handleBackToList}
              className="mr-3 p-2 rounded-md bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
            >
              <ChevronLeft size={18} />
            </button>
            <h2 className="text-xl font-semibold text-white">
              {selectedGuideline.name}
              <span className="ml-3 px-2 py-0.5 text-xs rounded-full bg-blue-900 text-blue-300">
                v{selectedGuideline.version}
              </span>
            </h2>
          </div>
          
          {showVersionHistory && <VersionHistoryPanel />}
          
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gray-800 p-4 rounded-md">
              <h3 className="text-sm uppercase text-gray-400 font-medium mb-2">Description</h3>
              <p className="text-white">{selectedGuideline.description}</p>
            </div>
            
            <div className="bg-gray-800 p-4 rounded-md">
              <h3 className="text-sm uppercase text-gray-400 font-medium mb-2">Metadata</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Type:</span>
                  <span className="text-white">{selectedGuideline.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Version:</span>
                  <span className={`font-medium ${selectedGuideline.version === 'Draft' ? 'text-amber-400' : 'text-blue-400'}`}>
                    {selectedGuideline.version}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Created:</span>
                  <span className="text-white">{new Date(selectedGuideline.createdAt).toLocaleString()} by {selectedGuideline.createdBy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Last updated:</span>
                  <span className="text-white">{new Date(selectedGuideline.updatedAt).toLocaleString()} by {selectedGuideline.updatedBy}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm uppercase text-gray-400 font-medium">Content Preview</h3>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => handleCopyGuideline(selectedGuideline)}
                  className="p-2 rounded-md bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
                  title="Copy guideline"
                >
                  <Copy size={16} />
                </button>
                <button 
                  onClick={() => handleDownloadGuideline(selectedGuideline)}
                  className="p-2 rounded-md bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
                  title="Download guideline"
                >
                  <Download size={16} />
                </button>
                {selectedGuideline.type !== 'System' && (
                  <button 
                    onClick={() => handleDeleteRequest(selectedGuideline)}
                    className="p-2 rounded-md bg-gray-800 text-red-400 hover:bg-gray-700 hover:text-red-300 transition-colors"
                    title="Delete guideline"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
            <div className="bg-gray-800 p-6 rounded-md border border-gray-700">
              <div className="prose prose-invert max-w-none">
                {/* This would use a proper Markdown renderer in a real app */}
                <pre className="whitespace-pre-wrap font-mono text-sm text-gray-300">{selectedGuideline.content}</pre>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-900 bg-opacity-20 border border-blue-800 p-4 rounded-md">
            <div className="flex items-start">
              <div className="text-blue-400 mr-3 mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="text-blue-400 font-medium">Guideline Usage</h4>
                <p className="text-blue-300 mt-1">
                  This guideline is used in the SAP Integration Reviewer to evaluate integration flows against design best practices.
                  Select this guideline when submitting integration packages for review.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {view === 'edit' && editedGuideline && (
        <div className="max-w-5xl mx-auto space-y-6 p-6">
          <div className="flex items-center mb-4">
            <button 
              onClick={handleBackToList}
              className="mr-3 p-2 rounded-md bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
            >
              <ChevronLeft size={18} />
            </button>
            <h2 className="text-xl font-semibold text-white">
              Editing: {selectedGuideline?.name}
            </h2>
          </div>
          
          {editedGuideline.type === 'System' && (
            <div className="mb-6 p-4 bg-amber-900 bg-opacity-20 border border-amber-800 rounded-md">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-amber-400 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-amber-400 font-medium">System Guideline Restrictions</h3>
                  <p className="text-amber-300 text-sm mt-1">
                    This is a system guideline. You can only modify the name and description fields.
                    The content is protected to ensure system integrity.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Guideline Name</label>
              <input
                type="text"
                name="name"
                value={editedGuideline.name}
                onChange={handleInputChange}
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-md text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
              <input
                type="text"
                name="description"
                value={editedGuideline.description}
                onChange={handleInputChange}
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-md text-white"
              />
            </div>
            
            <div className="bg-gray-800 p-4 rounded-md">
              <h3 className="text-sm uppercase text-gray-400 font-medium mb-2">Version Information</h3>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 bg-amber-900 text-amber-300 rounded-md text-sm">
                  {editedGuideline.version}
                </span>
                <span className="text-gray-400 text-sm">
                  Upon saving, a new version will be created
                </span>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-300">Content (Markdown)</label>
                <div className="flex items-center text-xs text-gray-500">
                  <CheckSquare size={14} className="mr-1" />
                  Markdown formatting supported
                </div>
              </div>
              <textarea
                name="content"
                value={editedGuideline.content}
                onChange={handleInputChange}
                rows={16}
                className="w-full p-4 bg-gray-800 border border-gray-700 rounded-md text-white font-mono text-sm"
                disabled={editedGuideline.type === 'System'}
                placeholder="# Guideline Title&#10;&#10;## Section 1&#10;1. First point&#10;2. Second point"
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && <DeleteConfirmationModal />}
    </div>
  );
};

export default GuidelinesManagerSection;
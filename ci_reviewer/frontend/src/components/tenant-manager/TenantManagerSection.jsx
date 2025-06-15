import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Check, 
  RefreshCw, 
  Upload, 
  ChevronRight, 
  AlertCircle, 
  Edit, 
  Trash2,
  Shield,
  ExternalLink,
  CheckCircle
} from 'lucide-react';
import { fetchTenants, addTenant, updateTenant, deleteTenant, testTenantConnection } from '../../api/tenantApi';

// Tenant List Component
const TenantList = ({ 
  tenants, 
  isLoading, 
  onTestConnection, 
  onViewDetails, 
  isTesting,
  onAddTenant 
}) => {
  if (isLoading) {
    return (
      <div className="text-center p-8 text-gray-400">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mx-auto mb-4"></div>
        <p>Loading tenants...</p>
      </div>
    );
  }

  if (tenants.length === 0) {
    return (
      <div className="text-center p-6 border border-gray-700 rounded-md">
        <Shield className="h-16 w-16 mx-auto mb-4 text-gray-600" />
        <p className="text-gray-400 mb-4">No tenants registered yet.</p>
        <button 
          onClick={onAddTenant}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center mx-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Register Your First Tenant
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden border border-gray-700 rounded-md">
      <table className="min-w-full divide-y divide-gray-700">
        <thead className="bg-gray-800">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Name
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Description
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              API URL
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-gray-900 divide-y divide-gray-700">
          {tenants.map((tenant) => (
            <tr key={tenant.id} className="hover:bg-gray-800">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                {tenant.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                {tenant.description}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                {tenant.apiUrl || "https://api.example.com"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 text-xs rounded-full ${tenant.status === 'Active' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                  {tenant.status || 'Active'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3 flex">
                <button 
                  className="text-blue-400 hover:text-blue-300 flex items-center"
                  onClick={() => onTestConnection(tenant.id)}
                  disabled={isTesting[tenant.id]}
                >
                  {isTesting[tenant.id] ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  <span className="ml-1">Test</span>
                </button>
                <button 
                  className="text-gray-400 hover:text-white"
                  onClick={() => onViewDetails(tenant)}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Add Tenant Form Component
const AddTenantForm = ({ 
  onCancel, 
  onSubmit, 
  entryMode, 
  setEntryMode, 
  manualEntry, 
  handleInputChange, 
  fileUpload, 
  handleFileChange,
  isSubmitting
}) => {
  return (
    <div className="bg-gray-900 rounded-lg shadow p-6 border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-white">Add New Tenant</h3>
        
      </div>
      
      <div className="mb-4">
        <div className="flex space-x-4 mb-4">
          <button
            className={`px-4 py-2 rounded-md ${entryMode === 'manual' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
            onClick={() => setEntryMode('manual')}
          >
            Manual Entry
          </button>
          <button
            className={`px-4 py-2 rounded-md ${entryMode === 'file' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
            onClick={() => setEntryMode('file')}
          >
            Upload JSON File
          </button>
        </div>
        
        {/* Common fields for both modes */}
        <div className="space-y-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300">Tenant Name</label>
            <input 
              type="text" 
              name="name"
              value={manualEntry.name}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-700 rounded-md bg-gray-800 text-white"
              placeholder="Enter tenant name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300">Description</label>
            <input 
              type="text" 
              name="description"
              value={manualEntry.description}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-700 rounded-md bg-gray-800 text-white"
              placeholder="Enter description"
            />
          </div>
        </div>
        
        {entryMode === 'manual' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-300">Authentication URL</label>
              <input 
                type="text" 
                name="authUrl"
                value={manualEntry.authUrl}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-700 rounded-md bg-gray-800 text-white"
                placeholder="https://example.com/auth"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-300">API URL</label>
              <input 
                type="text" 
                name="apiUrl"
                value={manualEntry.apiUrl}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-700 rounded-md bg-gray-800 text-white"
                placeholder="https://example.com/api"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-300">Client ID</label>
              <input 
                type="text" 
                name="clientId"
                value={manualEntry.clientId}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-700 rounded-md bg-gray-800 text-white"
                placeholder="Enter client ID"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-300">Client Secret</label>
              <input 
                type="password" 
                name="clientSecret"
                value={manualEntry.clientSecret}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-700 rounded-md bg-gray-800 text-white"
                placeholder="Enter client secret"
              />
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center">
            <div className="mb-4 text-gray-300">
              <p className="mb-2">Upload a JSON file with tenant details</p>
              <p className="text-xs text-gray-500">
                File should include: authUrl, clientId, clientSecret, apiUrl
              </p>
            </div>
            
            <input
              type="file"
              id="tenant-file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            
            {fileUpload ? (
              <div className="text-left bg-gray-800 p-3 rounded-md border border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-white">{fileUpload.name}</span>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleFileChange(null);
                    }}
                    className="text-gray-400 hover:text-white"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <label 
                htmlFor="tenant-file"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer flex items-center justify-center mx-auto"
              >
                <Upload className="h-4 w-4 mr-2" />
                Select JSON File
              </label>
            )}
          </div>
        )}
      </div>
      
      <div className="flex justify-end space-x-3 mt-6">
        <button 
          onClick={onCancel}
          className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
        >
          Cancel
        </button>
        <button 
          onClick={onSubmit}
          disabled={
            isSubmitting ||
            (entryMode === 'file' && !fileUpload) || 
            (entryMode === 'manual' && (!manualEntry.name || !manualEntry.authUrl || !manualEntry.clientId || !manualEntry.clientSecret || !manualEntry.apiUrl))
          }
          className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-green-700 flex items-center ${
            (entryMode === 'file' && !fileUpload) || 
            (entryMode === 'manual' && (!manualEntry.name || !manualEntry.authUrl || !manualEntry.clientId || !manualEntry.clientSecret || !manualEntry.apiUrl)) 
            ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// Tenant Detail Component
const TenantDetailView = ({ tenant, onBack, onEdit, onDelete, onTest, isTesting, connectionStatus }) => {
  return (
    <div className="bg-gray-900 rounded-lg shadow p-6 border border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-white mr-3"
          >
            <X size={20} />
          </button>
          <h3 className="text-lg font-medium text-white">{tenant.name}</h3>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={onEdit}
            className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Edit size={16} />
          </button>
          <button 
            onClick={onDelete}
            className="p-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-400">Description</label>
          <p className="text-white bg-gray-800 p-2 rounded">{tenant.description}</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-400">Authentication URL</label>
          <div className="flex items-center">
            <p className="text-white bg-gray-800 p-2 rounded flex-1">{tenant.authUrl}</p>
            <a 
              href={tenant.authUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="ml-2 text-blue-400 hover:text-blue-300"
            >
              <ExternalLink size={16} />
            </a>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-400">API URL</label>
          <div className="flex items-center">
            <p className="text-white bg-gray-800 p-2 rounded flex-1">{tenant.apiUrl}</p>
            <a 
              href={tenant.apiUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="ml-2 text-blue-400 hover:text-blue-300"
            >
              <ExternalLink size={16} />
            </a>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-400">Client ID</label>
          <p className="text-white bg-gray-800 p-2 rounded">{tenant.clientId}</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-400">Client Secret</label>
          <p className="text-white bg-gray-800 p-2 rounded">••••••••••••••••</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-400">Status</label>
          <div className="flex items-center">
            <span className={`px-2 py-1 text-xs rounded-full ${tenant.status === 'Active' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
              {tenant.status || 'Active'}
            </span>
            <button 
              onClick={onTest}
              disabled={isTesting}
              className="ml-3 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center"
            >
              {isTesting ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Test Connection
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {connectionStatus && (
        <div className={`p-3 mb-4 rounded ${connectionStatus.success ? 'bg-green-900 bg-opacity-30 text-green-300' : 'bg-red-900 bg-opacity-30 text-red-300'}`}>
          <div className="flex items-start">
            {connectionStatus.success ? (
              <Check className="h-5 w-5 mr-2 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            )}
            <p>{connectionStatus.message}</p>
          </div>
        </div>
      )}
      
      <div className="border-t border-gray-700 pt-4 mt-4">
        <p className="text-xs text-gray-500">
          Created: {tenant.createdAt ? new Date(tenant.createdAt).toLocaleString() : 'Unknown'}
        </p>
        {tenant.lastTestedAt && (
          <p className="text-xs text-gray-500 mt-1">
            Last tested: {new Date(tenant.lastTestedAt).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
};

// Edit Tenant Form Component
const EditTenantForm = ({ 
  tenant, 
  onCancel, 
  onSave, 
  formData, 
  handleInputChange,
  isSubmitting
}) => {
  return (
    <div className="bg-gray-900 rounded-lg shadow p-6 border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white mr-3"
          >
            <X size={20} />
          </button>
          <h3 className="text-lg font-medium text-white">Edit Tenant</h3>
        </div>
      </div>
      
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-300">Tenant Name</label>
          <input 
            type="text" 
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-700 rounded-md bg-gray-800 text-white"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-300">Description</label>
          <input 
            type="text" 
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-700 rounded-md bg-gray-800 text-white"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-300">Authentication URL</label>
          <input 
            type="text" 
            name="authUrl"
            value={formData.authUrl}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-700 rounded-md bg-gray-800 text-white"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-300">API URL</label>
          <input 
            type="text" 
            name="apiUrl"
            value={formData.apiUrl}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-700 rounded-md bg-gray-800 text-white"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-300">Client ID</label>
          <input 
            type="text" 
            name="clientId"
            value={formData.clientId}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-700 rounded-md bg-gray-800 text-white"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-300">Client Secret</label>
          <input 
            type="password" 
            name="clientSecret"
            value={formData.clientSecret}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-700 rounded-md bg-gray-800 text-white"
            placeholder="Leave blank to keep current secret"
          />
          <p className="text-xs text-gray-500 mt-1">Leave blank to keep the current client secret</p>
        </div>
      </div>
      
      <div className="flex justify-end space-x-3 mt-6">
        <button 
          onClick={onCancel}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Cancel
        </button>
        <button 
          onClick={onSave}
          disabled={
            isSubmitting ||
            !formData.name || !formData.authUrl || !formData.clientId || !formData.apiUrl
          }
          className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center ${
            !formData.name || !formData.authUrl || !formData.clientId || !formData.apiUrl 
            ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// Main Tenant Manager Component
const TenantManagerSection = () => {
  // State variables
  const [tenants, setTenants] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddTenant, setShowAddTenant] = useState(false);
  const [showDetailView, setShowDetailView] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [fileUpload, setFileUpload] = useState(null);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [manualEntry, setManualEntry] = useState({
    name: '',
    description: '',
    authUrl: '',
    clientId: '',
    clientSecret: '',
    apiUrl: ''
  });
  const [entryMode, setEntryMode] = useState('manual'); // 'manual' or 'file'
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [isTesting, setIsTesting] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Load tenants on component mount
  useEffect(() => {
    loadTenants();
  }, []);
  
  // Load tenants from API
  const loadTenants = async () => {
    try {
      setIsLoading(true);
      const tenantsData = await fetchTenants();
      setTenants(tenantsData);
    } catch (error) {
      console.error('Error loading tenants:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle file upload
  const handleFileChange = (event) => {
    if (event === null) {
      setFileUpload(null);
      return;
    }
    
    if (event && event.target && event.target.files && event.target.files[0]) {
      setFileUpload(event.target.files[0]);
      
      // Read the file to pre-populate the form
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          setManualEntry({
            name: manualEntry.name, // Keep existing name
            description: manualEntry.description, // Keep existing description
            authUrl: data.authUrl || '',
            clientId: data.clientId || '',
            clientSecret: data.clientSecret || '',
            apiUrl: data.apiUrl || ''
          });
        } catch (error) {
          console.error('Error parsing JSON file:', error);
        }
      };
      reader.readAsText(event.target.files[0]);
    }
  };
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (isEditMode) {
      setSelectedTenant({
        ...selectedTenant,
        [name]: value
      });
    } else {
      setManualEntry({
        ...manualEntry,
        [name]: value
      });
    }
  };
  
  // Add a new tenant
  const handleAddTenant = async () => {
    try {
      setIsSubmitting(true);
      let tenantData;
      
      if (entryMode === 'file' && fileUpload) {
        // Read the JSON file
        const reader = new FileReader();
        return new Promise((resolve, reject) => {
          reader.onload = async (e) => {
            try {
              const fileData = JSON.parse(e.target.result);
              tenantData = {
                name: manualEntry.name,
                description: manualEntry.description,
                authUrl: fileData.authUrl,
                clientId: fileData.clientId,
                clientSecret: fileData.clientSecret,
                apiUrl: fileData.apiUrl,
                status: 'Inactive' // Will be updated after testing
              };
              
              // Test connection before saving
              const testResult = await testConnection(tenantData);
              
              // If test succeeds, add the tenant
              if (testResult.success) {
                tenantData.status = 'Active';
                tenantData.lastTestedAt = new Date().toISOString();
                await addTenant(tenantData);
                
                // Reset form and refresh
                resetAddForm();
                loadTenants();
              }
              resolve();
            } catch (error) {
              reject(error);
            }
          };
          reader.readAsText(fileUpload);
        });
      } else if (entryMode === 'manual') {
        tenantData = {
          ...manualEntry,
          status: 'Inactive'
        };
        
        // Test connection before saving
        const testResult = await testConnection(tenantData);
        
        // If test succeeds, add the tenant
        if (testResult.success) {
          tenantData.status = 'Active';
          tenantData.lastTestedAt = new Date().toISOString();
          await addTenant(tenantData);
          
          // Reset form and refresh
          resetAddForm();
          loadTenants();
        }
      }
    } catch (error) {
      console.error('Error adding tenant:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Helper function to test connection
  const testConnection = async (tenantData) => {
    try {
      // Make API call to test connection
      const result = await testTenantConnection(tenantData);
      
      setConnectionStatus({
        success: result.success,
        message: result.message || (result.success ? 'Connection successful!' : 'Connection failed')
      });
      
      return result;
    } catch (error) {
      console.error('Error testing connection:', error);
      setConnectionStatus({
        success: false,
        message: 'Error testing connection: ' + (error.message || 'Unknown error')
      });
      return { success: false, message: 'Connection test failed' };
    }
  };
  
  // Reset add tenant form
  const resetAddForm = () => {
    setShowAddTenant(false);
    setFileUpload(null);
    setManualEntry({
      name: '',
      description: '',
      authUrl: '',
      clientId: '',
      clientSecret: '',
      apiUrl: ''
    });
    setConnectionStatus(null);
  };
  
  // Handle tenant selection for detail view
  const handleViewTenantDetails = (tenant) => {
    setSelectedTenant(tenant);
    setShowDetailView(true);
    setConnectionStatus(null);
  };
  
  // Handle back from detail view
  const handleBackFromDetail = () => {
    setShowDetailView(false);
    setIsEditMode(false);
    setSelectedTenant(null);
    setConnectionStatus(null);
  };
  
  // Handle test connection from list
  const handleTestConnection = async (tenantId) => {
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) return;
    
    setIsTesting(prev => ({ ...prev, [tenantId]: true }));
    
    try {
      await testTenantConnection(tenant);
      
      // Refresh tenant list
      loadTenants();
    } catch (error) {
      console.error('Error testing connection:', error);
    } finally {
      setIsTesting(prev => ({ ...prev, [tenantId]: false }));
    }
  };
  
  // Handle test connection from detail view
  const handleTestConnectionDetail = async () => {
    if (!selectedTenant) return;
    
    setIsTesting(prev => ({ ...prev, [selectedTenant.id]: true }));
    setConnectionStatus(null);
    
    try {
      const result = await testTenantConnection(selectedTenant.id);
      setConnectionStatus({
        success: result.success,
        message: result.message || (result.success ? 'Connection successful!' : 'Connection failed')
      });
      
      if (result.success) {
        // Update tenant status in list
        setTenants(prev => prev.map(t => 
          t.id === selectedTenant.id ? { ...t, status: 'Active', lastTestedAt: new Date().toISOString() } : t
        ));
        
        // Update selected tenant
        setSelectedTenant(prev => ({ 
          ...prev, 
          status: 'Active',
          lastTestedAt: new Date().toISOString()
        }));
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      setConnectionStatus({
        success: false,
        message: 'Error testing connection: ' + (error.message || 'Unknown error')
      });
    } finally {
      setIsTesting(prev => ({ ...prev, [selectedTenant.id]: false }));
    }
  };
  
  // Handle edit mode
  const handleEditMode = () => {
    setIsEditMode(true);
  };
  
  // Handle save tenant changes
  const handleSaveTenant = async () => {
    if (!selectedTenant) return;
    
    try {
      setIsSubmitting(true);
      
      // If client secret is empty, use a placeholder to indicate no change
      const dataToUpdate = { ...selectedTenant };
      if (!dataToUpdate.clientSecret) {
        // This is just a frontend convention - backend should handle this specifically
        delete dataToUpdate.clientSecret;
      }
      
      // Test connection before saving if auth details were changed
      const testResult = await testConnection(dataToUpdate);
      
      // Update status based on test result
      dataToUpdate.status = testResult.success ? 'Active' : 'Inactive';
      dataToUpdate.lastTestedAt = new Date().toISOString();
      
      // Save changes
      await updateTenant(dataToUpdate.id, dataToUpdate);
      
      // Exit edit mode and refresh
      setIsEditMode(false);
      loadTenants();
      
      // Update the selected tenant with latest data
      setSelectedTenant({ ...dataToUpdate });
      setConnectionStatus({
        success: testResult.success,
        message: testResult.success ? 'Changes saved and connection verified!' : 'Changes saved but connection failed.'
      });
    } catch (error) {
      console.error('Error updating tenant:', error);
      setConnectionStatus({
        success: false,
        message: 'Error saving changes: ' + (error.message || 'Unknown error')
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle delete tenant
  const handleDeleteTenant = async () => {
    if (!selectedTenant || !window.confirm('Are you sure you want to delete this tenant?')) {
      return;
    }
    
    try {
      await deleteTenant(selectedTenant.id);
      
      // Go back to list view and refresh
      handleBackFromDetail();
      loadTenants();
    } catch (error) {
      console.error('Error deleting tenant:', error);
      setConnectionStatus({
        success: false,
        message: 'Error deleting tenant: ' + (error.message || 'Unknown error')
      });
    }
  };
  
  // Main render
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Tenant Manager</h2>
        {!showDetailView && !isEditMode && (
          <button 
            onClick={() => setShowAddTenant(true)}
            className="px-2 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            
          </button>
        )}
      </div>
      
      {showAddTenant && (
        <AddTenantForm 
          onCancel={resetAddForm}
          onSubmit={handleAddTenant}
          entryMode={entryMode}
          setEntryMode={setEntryMode}
          manualEntry={manualEntry}
          handleInputChange={handleInputChange}
          fileUpload={fileUpload}
          handleFileChange={handleFileChange}
          isSubmitting={isSubmitting}
        />
      )}
      
      {!showAddTenant && showDetailView && selectedTenant && (
        isEditMode ? (
          <EditTenantForm 
            tenant={selectedTenant}
            onCancel={() => setIsEditMode(false)}
            onSave={handleSaveTenant}
            formData={selectedTenant}
            handleInputChange={handleInputChange}
            isSubmitting={isSubmitting}
          />
        ) : (
          <TenantDetailView 
            tenant={selectedTenant}
            onBack={handleBackFromDetail}
            onEdit={handleEditMode}
            onDelete={handleDeleteTenant}
            onTest={handleTestConnectionDetail}
            isTesting={isTesting[selectedTenant.id] || false}
            connectionStatus={connectionStatus}
          />
        )
      )}
      
      {!showAddTenant && !showDetailView && (
        <div className="bg-gray-900 rounded-lg shadow p-6 border border-gray-700">
          <h3 className="text-lg font-medium mb-4 text-white">Registered Tenants</h3>
          
          <TenantList 
            tenants={tenants}
            isLoading={isLoading}
            onTestConnection={handleTestConnection}
            onViewDetails={handleViewTenantDetails}
            isTesting={isTesting}
            onAddTenant={() => setShowAddTenant(true)}
          />
        </div>
      )}
    </div>
  );
};

export default TenantManagerSection;
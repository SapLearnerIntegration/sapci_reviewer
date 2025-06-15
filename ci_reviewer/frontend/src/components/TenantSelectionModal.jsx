import React, { useState, useEffect } from 'react';
import { X, Database, CheckCircle, AlertCircle } from 'lucide-react';
import { fetchTenants } from '../api/tenantApi';

const TenantSelectionModal = ({ onSelect, onCancel }) => {
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [error, setError] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

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
      setError('Failed to load tenants. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTenant = async () => {
    if (!selectedTenantId) {
      setError('Please select a tenant to continue');
      return;
    }

    const tenant = tenants.find(t => t.id === selectedTenantId);
    if (!tenant) {
      setError('Invalid tenant selection');
      return;
    }

    // Simulate testing the connection
    setIsConnecting(true);
    setConnectionStatus({ status: 'connecting', message: 'Testing connection...' });

    try {
      // In a real implementation, this would test the connection to the tenant
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call

      // If connection is successful, call onSelect
      setConnectionStatus({ status: 'success', message: 'Connection successful!' });
      setTimeout(() => onSelect(tenant), 500); // Slight delay to show success message
    } catch (error) {
      console.error('Connection failed:', error);
      setConnectionStatus({ status: 'error', message: 'Connection failed. Please try again.' });
      setIsConnecting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-700 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Select Tenant</h2>
          <button 
            onClick={onCancel}
            className="p-2 bg-gray-700 rounded-md text-gray-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
        
        <p className="text-gray-300 mb-4">
          Please select a tenant to connect to the SAP Integration Manager.
        </p>
        
        {error && (
          <div className="p-3 mb-4 bg-red-900 bg-opacity-20 rounded-md border border-red-800 text-red-300 flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {connectionStatus && (
          <div className={`p-3 mb-4 rounded-md border flex items-start ${
            connectionStatus.status === 'success' 
              ? 'bg-green-900 bg-opacity-20 border-green-800 text-green-300'
              : connectionStatus.status === 'error'
                ? 'bg-red-900 bg-opacity-20 border-red-800 text-red-300'
                : 'bg-blue-900 bg-opacity-20 border-blue-800 text-blue-300'
          }`}>
            {connectionStatus.status === 'success' ? (
              <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            ) : connectionStatus.status === 'error' ? (
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            ) : (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2 flex-shrink-0 mt-0.5"></div>
            )}
            <span>{connectionStatus.message}</span>
          </div>
        )}
        
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-gray-400">
            Tenant:
          </label>
          {isLoading ? (
            <div className="py-2 px-3 bg-gray-700 rounded-md text-gray-500 flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Loading tenants...
            </div>
          ) : tenants.length > 0 ? (
            <select 
              value={selectedTenantId} 
              onChange={(e) => setSelectedTenantId(e.target.value)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white"
            >
              <option value="">-- Select a Tenant --</option>
              {tenants.map(tenant => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name} {tenant.status === 'Active' ? '✓' : ''}
                </option>
              ))}
            </select>
          ) : (
            <div className="py-2 px-3 bg-gray-700 rounded-md text-gray-500 flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              No tenants available. Please configure a tenant in the Administration panel.
            </div>
          )}
        </div>
        
        {selectedTenantId && (
          <div className="mb-6 p-3 bg-gray-700 rounded-md">
            <div className="flex items-start">
              <div>
                <div className="flex items-center mt-2">
                  <span className={`px-2 py-0.5 text-xs rounded-full flex items-center ${
                    tenants.find(t => t.id === selectedTenantId)?.status === 'Active' 
                      ? 'bg-green-900 text-green-300' 
                      : 'bg-red-900 text-red-300'
                  }`}>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {tenants.find(t => t.id === selectedTenantId)?.status || 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleSelectTenant}
            disabled={!selectedTenantId || isConnecting}
            className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 ${
              !selectedTenantId || isConnecting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isConnecting ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Connecting...
              </div>
            ) : (
              'Connect'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TenantSelectionModal;
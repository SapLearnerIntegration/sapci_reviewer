// components/MainHeader.jsx
import React from 'react';
import { ChevronLeft, CheckCircle } from 'lucide-react';

const MainHeader = ({ 
  appName, 
  onBack, 
  selectedTenant 
}) => {
  // Display tenant info in a green pill badge
  const renderTenantBadge = () => {
    if (selectedTenant) {
      return (
        <div className="ml-4 px-3 py-1 bg-green-900 rounded-full text-sm text-green-300 flex items-center">
          <CheckCircle className="h-3 w-3 mr-2" />
          Tenant: {selectedTenant.name}
        </div>
      );
    }
    return null;
  };
  
  return (
    <header className="bg-gray-900 border-b border-gray-700 p-4 flex items-center">
      <button
        onClick={onBack}
        className="flex items-center text-white-400 hover:text-green-300 bg-gray-700 px-3 py-1 rounded"
      >
        <ChevronLeft className="mr-1" size={16} />
        Launchpad
      </button>
      <h1 className="text-xl font-semibold ml-4 text-white">{appName}</h1>
      {renderTenantBadge()}
    </header>
  );
};

export default MainHeader;
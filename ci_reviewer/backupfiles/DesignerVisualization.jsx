// components/designer/DesignerVisualization.jsx
import React from 'react';
import { Search, Package, FileCode2, Database, ArrowRight } from 'lucide-react';

const DesignerVisualization = ({
  activeView,
  packages,
  isPackagesLoading,
  selectedPackages,
  selectedIFlows,
  isIFlowsLoading,
  searchQuery,
  onSearchChange,
  onPackageSelect,
  onIFlowSelect
}) => {
  // Package view
  const renderPackagesView = () => (
    <div>
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
          <Search size={16} />
        </div>
        <input
          type="text"
          placeholder="Search packages..."
          value={searchQuery}
          onChange={onSearchChange}
          className="pl-10 w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
        />
      </div>
      
      {isPackagesLoading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : packages.length > 0 ? (
        <div className="border border-gray-700 rounded divide-y divide-gray-700 bg-gray-800 overflow-hidden">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`p-3 hover:bg-gray-700 cursor-pointer transition-colors ${
                selectedPackages.includes(pkg.id) ? 'bg-gray-700' : ''
              }`}
              onClick={() => onPackageSelect(pkg.id)}
            >
              <div className="flex items-start">
                <input
                  type="checkbox"
                  checked={selectedPackages.includes(pkg.id)}
                  onChange={() => {}} // Controlled by the parent click handler
                  className="mr-3 mt-1"
                />
                <div>
                  <div className="flex items-center">
                    <Package className="h-4 w-4 mr-2 text-blue-400" />
                    <span className="font-medium text-white">{pkg.name}</span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">{pkg.description}</p>
                  {selectedPackages.includes(pkg.id) && isIFlowsLoading[pkg.id] && (
                    <div className="text-xs text-blue-400 mt-1">Loading IFlows...</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-800 border border-gray-700 rounded p-4 text-center text-gray-400">
          {searchQuery ? "No packages match your search" : "No packages available"}
          
          {/* THIS BUTTON IS UPDATED WITH THE CORRECT STYLE - CHANGED FROM WHITE TO DARK GRAY */}
          <button
            onClick={() => loadPackages('*')}
            className="mt-4 px-4 py-2 bg-[#1F2937] text-white rounded hover:bg-[#374151] transition-colors"
            aria-label="Load packages"
          >
            <RefreshCw size={16} className="mr-2" />
            Load Packages
          </button>
        </div>
      )}
    </div>
  );
  
  // IFlows view - content omitted for brevity
  const renderIFlowsView = () => {
    // ...existing code...
  };
  
  // Visualization view - content omitted for brevity
  const renderVisualizationView = () => {
    // ...existing code...
  };
  
  // Render appropriate view based on activeView
  let content;
  switch (activeView) {
    case 'iflows':
      content = renderIFlowsView();
      break;
    case 'visualization':
      content = renderVisualizationView();
      break;
    case 'packages':
    default:
      content = renderPackagesView();
      break;
  }
  
  return (
    <div className="h-full">
      {content}
    </div>
  );
};

export default DesignerVisualization;
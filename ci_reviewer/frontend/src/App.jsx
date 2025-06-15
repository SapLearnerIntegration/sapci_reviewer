// Simplified App.jsx with inline modal (no portal)
import React, { useState } from 'react';
import LaunchPad from './components/LaunchPad';
import Sidebar from './components/Sidebar';
import AppDetailView from './components/AppDetailView';
import TenantSelectionModal from './components/TenantSelectionModal';

// Main Application Component
const App = () => {
  const [currentView, setCurrentView] = useState('launchpad');
  const [selectedApp, setSelectedApp] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState('designer');
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);

  // Handle application selection from launchpad
  const handleAppSelect = (appId) => {
    setSelectedApp(appId);
    
    // Set initial active section based on the app
    if (appId === 'sap-integration') {
      // For SAP Integration, show tenant modal first
      setShowTenantModal(true);
      setActiveSection('designer');
    } else if (appId === 'administration') {
      // For Administration, just navigate directly
      setCurrentView('appDetail');
      setActiveSection('overview');
    } else {
      // For other apps, just navigate directly
      setCurrentView('appDetail');
      setActiveSection('overview');
    }
  };

  // Return to the launchpad
  const handleBackToLaunchpad = () => {
    setCurrentView('launchpad');
    setSelectedApp(null);
    setSelectedTenant(null);
  };

  // Handle tenant selection from modal
  const handleTenantSelect = (tenant) => {
    setSelectedTenant(tenant);
    setShowTenantModal(false);
    setCurrentView('appDetail'); // Only navigate to appDetail after tenant is selected
    console.log(`Connected to tenant: ${tenant.name}`);
  };

  // Handle tenant modal cancel
  const handleTenantModalCancel = () => {
    setShowTenantModal(false);
    // Go back to launchpad if tenant selection was cancelled
    setSelectedApp(null);
  };

  // Render the appropriate view
  const renderView = () => {
    if (currentView === 'launchpad') {
      return <LaunchPad onAppSelect={handleAppSelect} />;
    } else if (currentView === 'appDetail') {
      return (
        <div className="flex h-screen w-full bg-gray-900"> 
          <div className="flex-shrink-0"> 
            <Sidebar 
              collapsed={sidebarCollapsed} 
              onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
              selectedApp={selectedApp}
              onSectionChange={setActiveSection}
              activeSection={activeSection}
            />
          </div>
          <div className="flex-1 overflow-hidden"> 
            <AppDetailView 
              appId={selectedApp} 
              onBack={handleBackToLaunchpad}
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              selectedJobId={selectedJobId}
              setSelectedJobId={setSelectedJobId}
              selectedTenant={selectedTenant}
            />
          </div>
        </div>
      );
    }
  };

  // Modal overlay styles
  const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999
  };

  return (
    <div className="h-screen bg-gray-900 text-gray-100 flex">
      {renderView()}
      
      {/* Inline modal with absolute positioning */}
      {showTenantModal && (
        <div style={modalOverlayStyle}>
          <div style={{ position: 'relative', zIndex: 10000 }}>
            <TenantSelectionModal
              onSelect={handleTenantSelect}
              onCancel={handleTenantModalCancel}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
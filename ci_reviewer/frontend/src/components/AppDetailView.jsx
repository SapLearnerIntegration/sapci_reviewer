// components/AppDetailView.jsx
import React from 'react';
import { ChevronLeft } from 'lucide-react';
import DesignerSection from './designer/DesignerSection';
import JobMonitorSection from './runtime/JobMonitorSection';
import { KPISection } from './sections/OverviewSection';
import { InsightsSection } from './sections/OverviewSection';
import { OverviewSection } from './sections/OverviewSection';
import { SettingsSection } from './sections/OverviewSection';
import TenantManagerSection from './tenant-manager/TenantManagerSection';
import GuidelinesManagerSection from './guidelines-manager/GuidelinesManagerSection';
import DefaultSection from './DefaultSection';

const AppDetailView = ({ 
  appId, 
  onBack, 
  activeSection, 
  setActiveSection, 
  selectedJobId, 
  setSelectedJobId,
  selectedTenant 
}) => {
  // Get the app name based on appId
  const getAppName = () => {
    switch(appId) {
      case 'sap-integration':
        return 'SAP Integration Manager';
      case 'automation':
        return 'Automation';
      case 'administration':
        return 'Administration';
      default:
        return 'Application';
    }
  };
  
  // Render the appropriate content based on the active section and app
  const renderContent = () => {
    // Handle SAP Integration Manager sections
    if (appId === 'sap-integration') {
      // Display tenant name if selected
      const tenantInfo = selectedTenant ? ` (${selectedTenant.name})` : '';
      
      switch (activeSection) {
        case 'designer':
          return <DesignerSection 
                  setActiveSection={setActiveSection}
                  selectedTenant={selectedTenant}
                  tenantName={selectedTenant?.name || 'No tenant selected'} 
                />;
        case 'runtime':
          return <JobMonitorSection 
                  selectedJobId={selectedJobId} 
                  setSelectedJobId={setSelectedJobId} 
                />;
        case 'kpi':
          return <KPISection tenantName={selectedTenant?.name || 'No tenant selected'} />;
        case 'insights':
          return <InsightsSection tenantName={selectedTenant?.name || 'No tenant selected'} />;
        default:
          return <DefaultSection 
                    sectionName={activeSection} 
                    appName={`${getAppName()}${tenantInfo}`} 
                  />;
      }
    } 
    // Handle Administration sections
    else if (appId === 'administration') {
      switch (activeSection) {
        case 'overview':
          return <OverviewSection appName={getAppName()} />;
        case 'tenant-manager':
          return <TenantManagerSection />;
        case 'guidelines':
          return <GuidelinesManagerSection />;
        case 'settings':
          return <SettingsSection />;
        default:
          return <DefaultSection 
                    sectionName={activeSection} 
                    appName={getAppName()} 
                  />;
      }
    } 
    // Handle other apps
    else {
      return <DefaultSection 
                sectionName="overview" 
                appName={getAppName()} 
                isMainApp={true} 
              />;
    }
  };

  // Display tenant info in the header for SAP Integration Manager
  const renderTenantInfo = () => {
    if (appId === 'sap-integration' && selectedTenant) {
      return (
        <div className="ml-4 px-3 py-1 bg-green-900 rounded-full text-sm text-green-300 flex items-center">
          <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
          Tenant: {selectedTenant.name}
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="flex flex-col h-full">
      <header className="bg-gray-900 border-b border-gray-700 p-4 flex items-center">
        <button
          onClick={onBack}
          className="flex items-center text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition-colors"
        >
          <ChevronLeft className="mr-1" size={16} />
          Launchpad
        </button>
        <h1 className="text-xl font-semibold ml-4 text-white">{getAppName()}</h1>
        {renderTenantInfo()}
      </header>
      
      <main className="flex-1 overflow-auto bg-gray-800">
        {renderContent()}
      </main>
    </div>
  );
};

export default AppDetailView;
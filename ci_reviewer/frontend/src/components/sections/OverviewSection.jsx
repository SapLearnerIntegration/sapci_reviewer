// components/sections/OverviewSection.jsx
import React from 'react';
import { BarChart2, TrendingUp, AlertTriangle } from 'lucide-react';
import { AlertCircle } from 'lucide-react';
import { Settings, Save } from 'lucide-react';
// Change from default export to named export
export const OverviewSection = ({ appName }) => {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4 text-white">{appName} Overview</h2>
      
      <p className="mb-4 text-gray-300">
        This is the overview page for {appName}.
      </p>
      
      <div className="bg-gray-900 p-6 rounded-lg shadow border border-gray-700">
        <p className="text-lg text-white">
          Application content will be displayed here.
        </p>
        <p className="mt-4 text-gray-400 text-sm">
          This section is currently under development. Please check back later for updates.
        </p>
      </div>
    </div>
  );
};

// Change from default export to named export
export const KPISection = ({ tenantName }) => {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">KPI Dashboard</h2>
        <div className="text-sm text-blue-300 bg-blue-900 px-3 py-1 rounded-full">
          Tenant: {tenantName}
        </div>
      </div>
      
      {tenantName === 'No tenant selected' ? (
        <div className="bg-yellow-900 bg-opacity-20 border border-yellow-800 p-4 rounded-md">
          <div className="flex items-start">
            <AlertTriangle className="text-yellow-400 mr-3 mt-1" size={20} />
            <p className="text-yellow-300">
              No tenant selected. Please select a tenant to view KPI data.
            </p>
          </div>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
              <div className="flex items-center mb-2">
                <BarChart2 className="text-blue-400 mr-2" size={20} />
                <h3 className="text-lg font-medium text-white">Message Volume</h3>
              </div>
              <p className="text-3xl font-bold text-white">12,458</p>
              <p className="text-sm text-green-400 flex items-center mt-2">
                <TrendingUp size={16} className="mr-1" />
                +18% from last month
              </p>
            </div>
            
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
              <div className="flex items-center mb-2">
                <BarChart2 className="text-blue-400 mr-2" size={20} />
                <h3 className="text-lg font-medium text-white">Success Rate</h3>
              </div>
              <p className="text-3xl font-bold text-white">99.2%</p>
              <p className="text-sm text-green-400 flex items-center mt-2">
                <TrendingUp size={16} className="mr-1" />
                +0.5% from last month
              </p>
            </div>
            
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
              <div className="flex items-center mb-2">
                <BarChart2 className="text-blue-400 mr-2" size={20} />
                <h3 className="text-lg font-medium text-white">Avg. Processing Time</h3>
              </div>
              <p className="text-3xl font-bold text-white">842ms</p>
              <p className="text-sm text-green-400 flex items-center mt-2">
                <TrendingUp size={16} className="mr-1" transform="rotate(180)" />
                -12% from last month
              </p>
            </div>
          </div>
          
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-700 mb-8">
            <h3 className="text-lg font-medium text-white mb-4">KPI Visualization</h3>
            <div className="h-64 bg-gray-800 rounded flex items-center justify-center">
              <p className="text-gray-400">KPI chart visualization will be displayed here</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Change from default export to named export
export const InsightsSection = ({ tenantName }) => {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Integration Insights</h2>
        <div className="text-sm text-blue-300 bg-blue-900 px-3 py-1 rounded-full">
          Tenant: {tenantName}
        </div>
      </div>
      
      {tenantName === 'No tenant selected' ? (
        <div className="bg-yellow-900 bg-opacity-20 border border-yellow-800 p-4 rounded-md">
          <div className="flex items-start">
            <AlertTriangle className="text-yellow-400 mr-3 mt-1" size={20} />
            <p className="text-yellow-300">
              No tenant selected. Please select a tenant to view insights.
            </p>
          </div>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
              <h3 className="text-lg font-medium text-white mb-4">Integration Performance</h3>
              <div className="h-48 bg-gray-800 rounded flex items-center justify-center mb-4">
                <p className="text-gray-400">Performance chart will be displayed here</p>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Last 30 days</span>
                <span className="text-green-400 flex items-center">
                  <TrendingUp size={16} className="mr-1" />
                  8% improvement
                </span>
              </div>
            </div>
            
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
              <h3 className="text-lg font-medium text-white mb-4">Error Distribution</h3>
              <div className="h-48 bg-gray-800 rounded flex items-center justify-center mb-4">
                <p className="text-gray-400">Error chart will be displayed here</p>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Top error: Authentication failures</span>
                <span className="text-red-400 flex items-center">
                  <AlertCircle size={16} className="mr-1" />
                  24% of all errors
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
            <h3 className="text-lg font-medium text-white mb-4">Integration Health</h3>
            <div className="bg-gray-800 p-4 rounded mb-4">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-2 text-gray-400">Integration Flow</th>
                    <th className="text-left py-2 text-gray-400">Status</th>
                    <th className="text-left py-2 text-gray-400">Success Rate</th>
                    <th className="text-left py-2 text-gray-400">Avg. Time</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-white">Customer Data Sync</td>
                    <td className="py-2"><span className="px-2 py-0.5 bg-green-900 text-green-300 rounded-full text-xs">Healthy</span></td>
                    <td className="py-2 text-white">99.8%</td>
                    <td className="py-2 text-white">245ms</td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 text-white">Invoice Processing</td>
                    <td className="py-2"><span className="px-2 py-0.5 bg-yellow-900 text-yellow-300 rounded-full text-xs">Warning</span></td>
                    <td className="py-2 text-white">96.4%</td>
                    <td className="py-2 text-white">1240ms</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-white">Vendor Onboarding</td>
                    <td className="py-2"><span className="px-2 py-0.5 bg-green-900 text-green-300 rounded-full text-xs">Healthy</span></td>
                    <td className="py-2 text-white">99.9%</td>
                    <td className="py-2 text-white">378ms</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



// Change from default export to named export
export const SettingsSection = () => {
  return (
    <div className="p-8">
      <div className="flex items-center mb-6">
        <Settings className="text-blue-400 mr-3" size={24} />
        <h2 className="text-2xl font-bold text-white">Application Settings</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
          <h3 className="text-lg font-medium text-white mb-4">General Settings</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Default Language
              </label>
              <select className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white">
                <option value="en">English</option>
                <option value="de">German</option>
                <option value="fr">French</option>
                <option value="es">Spanish</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Time Zone
              </label>
              <select className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white">
                <option value="utc">UTC</option>
                <option value="est">Eastern Time (EST)</option>
                <option value="cet">Central European Time (CET)</option>
                <option value="pst">Pacific Time (PST)</option>
              </select>
            </div>
            
            <div className="flex items-center">
              <input type="checkbox" id="darkMode" className="mr-2" defaultChecked />
              <label htmlFor="darkMode" className="text-white">
                Enable Dark Mode
              </label>
            </div>
            
            <div className="flex items-center">
              <input type="checkbox" id="notifications" className="mr-2" defaultChecked />
              <label htmlFor="notifications" className="text-white">
                Enable Notifications
              </label>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
          <h3 className="text-lg font-medium text-white mb-4">Connection Settings</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Connection Timeout (seconds)
              </label>
              <input 
                type="number" 
                defaultValue="30"
                className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Refresh Interval (seconds)
              </label>
              <input 
                type="number" 
                defaultValue="60"
                className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Max Concurrent Connections
              </label>
              <input 
                type="number" 
                defaultValue="5"
                className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 flex justify-end">
        <button className="px-4 py-2 bg-blue-600 text-white rounded flex items-center hover:bg-blue-700">
          <Save size={16} className="mr-2" />
          Save Settings
        </button>
      </div>
    </div>
  );
};
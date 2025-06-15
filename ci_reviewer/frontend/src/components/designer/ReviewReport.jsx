// components/designer/ReviewReport.jsx
import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  AlertCircle, 
  ChevronRight, 
  RefreshCw, 
  FileText, 
  Download, 
  Clock, 
  MessageSquare,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const ReviewReport = ({ 
  jobId, 
  reportData, 
  onNewReview, 
  onViewDetailedReport, 
  onProvideFeedback,
  error 
}) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [expandedPackages, setExpandedPackages] = useState({});

  // Load report data when component mounts
  useEffect(() => {
    if (reportData) {
      setReport(reportData);
      setLoading(false);
    } else if (jobId) {
      fetchReport();
    }
  }, [jobId, reportData]);

  // Fetch report data
  const fetchReport = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      
      const response = await fetch(`http://localhost:3001/sap/review/${jobId}/report`);
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Report data:', data);
      setReport(data);
    } catch (error) {
      console.error('Error fetching report:', error);
      setLoadError(`Failed to load report: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle report download in different formats
  const handleDownloadReport = async (format = 'md') => {
    try {
      window.open(`http://localhost:3001/sap/review/${jobId}/download?format=${format}`, '_blank');
    } catch (error) {
      console.error('Error downloading report:', error);
      alert(`Failed to download report: ${error.message}`);
    }
  };

  // Toggle package details
  const togglePackageDetails = (packageId) => {
    setExpandedPackages(prev => ({
      ...prev,
      [packageId]: !prev[packageId]
    }));
  };

  if (loading) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-medium mb-4 text-white">Integration Package Review</h2>
        <div className="bg-gray-900 p-6 rounded-lg shadow border border-gray-700 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-gray-400">Loading review report...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-medium mb-4 text-white">Integration Package Review</h2>
      
      <div className="bg-gray-900 p-6 rounded-lg shadow border border-gray-700">
        <h3 className="text-lg font-medium mb-4 text-white">Review Report</h3>
        
        {(error || loadError) && (
          <div className="p-3 bg-yellow-900 bg-opacity-20 rounded-md mb-4 text-yellow-300 flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <span>{error || loadError}</span>
          </div>
        )}
        
        <div className="flex items-center text-green-400 mb-4 p-3 bg-green-900 bg-opacity-20 rounded-md">
          <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          <span>Review completed successfully!</span>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between mb-2">
            <span className="text-gray-400">Job ID:</span>
            <span className="text-white font-mono">{jobId}</span>
          </div>
          {report && (
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Completed:</span>
              <span className="text-white">{new Date(report.generatedAt || Date.now()).toLocaleString()}</span>
            </div>
          )}
        </div>
        
        {report && report.summary && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-800 p-4 rounded-md">
              <h4 className="text-white font-medium mb-2">Overall Compliance</h4>
              <div className="flex items-center">
                <div className="w-16 h-16 rounded-full bg-blue-900 border-4 border-blue-500 flex items-center justify-center text-xl font-bold text-white">
                  {report.summary.overallCompliance || "N/A"}
                </div>
                <div className="ml-4">
                  <div className="text-sm text-gray-400">Total IFlows</div>
                  <div className="text-white">{report.summary.totalIFlows || 0}</div>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-xs text-gray-400">High</div>
                  <div className="text-green-400">{report.summary.highCompliance || 0}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Medium</div>
                  <div className="text-yellow-400">{report.summary.mediumCompliance || 0}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Low</div>
                  <div className="text-red-400">{report.summary.lowCompliance || 0}</div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800 p-4 rounded-md">
              <h4 className="text-white font-medium mb-2">Review Statistics</h4>
              <ul className="text-sm space-y-2">
                <li className="flex justify-between">
                  <span className="text-gray-300">Total Packages:</span>
                  <span className="text-white">{report.summary.totalPackages || 0}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-300">Total IFlows:</span>
                  <span className="text-white">{report.summary.totalIFlows || 0}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-300">Processing Time:</span>
                  <span className="text-white flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {report.processingTime || "< 5 min"}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-300">Parallel Processing:</span>
                  <span className="text-green-400">Enabled</span>
                </li>
              </ul>
            </div>
          </div>
        )}
        
        {report && report.packages && (
          <div className="mb-6">
            <h4 className="text-white font-medium mb-2">Package Summary</h4>
            <div className="border border-gray-700 rounded-md overflow-hidden">
              {report.packages.map(pkg => (
                <div key={pkg.id} className="border-b border-gray-700 last:border-b-0">
                  <div 
                    className="bg-gray-800 p-3 flex justify-between items-center cursor-pointer hover:bg-gray-700"
                    onClick={() => togglePackageDetails(pkg.id)}
                  >
                    <div className="flex items-center">
                      <span className={`px-2 py-1 text-xs rounded-full mr-3 ${
                        pkg.compliance === 'high' ? 'bg-green-900 text-green-300' :
                        pkg.compliance === 'medium' ? 'bg-yellow-900 text-yellow-300' :
                        'bg-red-900 text-red-300'
                      }`}>
                        {pkg.compliance.charAt(0).toUpperCase() + pkg.compliance.slice(1)}
                      </span>
                      <span className="font-medium text-white">{pkg.name}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-400 mr-2">{pkg.iflows.length} IFlows</span>
                      {expandedPackages[pkg.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>
                  
                  {expandedPackages[pkg.id] && (
                    <div className="p-3 bg-gray-900">
                      <div className="bg-gray-800 rounded-md overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-700">
                          <thead className="bg-gray-700">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase">IFlow</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase">Compliance</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase">Issues</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-700">
                            {pkg.iflows.map(iflow => (
                              <tr key={iflow.id} className="hover:bg-gray-700">
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-white">{iflow.name}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm">
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    iflow.compliance === 'high' ? 'bg-green-900 text-green-300' :
                                    iflow.compliance === 'medium' ? 'bg-yellow-900 text-yellow-300' :
                                    'bg-red-900 text-red-300'
                                  }`}>
                                    {iflow.compliance.charAt(0).toUpperCase() + iflow.compliance.slice(1)}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-sm text-gray-300">
                                  {iflow.issues && iflow.issues.length > 0 ? (
                                    <ul className="list-disc list-inside">
                                      {iflow.issues.map((issue, idx) => (
                                        <li key={idx} className="text-xs">{issue}</li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <span className="text-green-400 text-xs">No issues found</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex justify-between">
          <div className="flex space-x-2">
            <button
              onClick={() => handleDownloadReport('md')}
              className="px-3 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 flex items-center"
              title="Download as Markdown"
            >
              <Download className="h-4 w-4 mr-1" />
              <span>MD</span>
            </button>
            
            <button
              onClick={() => handleDownloadReport('html')}
              className="px-3 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 flex items-center"
              title="Download as HTML"
            >
              <Download className="h-4 w-4 mr-1" />
              <span>HTML</span>
            </button>
            
            <button
              onClick={onViewDetailedReport}
              className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 flex items-center"
            >
              <ChevronRight className="h-4 w-4 mr-2" />
              Full Report
            </button>
            
            <button
              onClick={onProvideFeedback}
              className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 flex items-center"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Provide Feedback
            </button>
          </div>
          
          <button
            onClick={onNewReview}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            New Review
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewReport;
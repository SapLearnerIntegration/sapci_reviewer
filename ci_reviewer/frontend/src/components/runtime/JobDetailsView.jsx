// components/runtime/JobDetailsView.jsx
import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Download,
  XCircle,
  Activity
} from 'lucide-react';

const JobDetailsView = ({ jobId, onBack }) => {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load job details
  useEffect(() => {
    const loadJobDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Try to fetch from API
        try {
          const response = await fetch(`http://localhost:3001/sap/review/${jobId}/report`);
          
          if (response.ok) {
            const data = await response.json();
            setJob(data);
          } else {
            // If API call fails, use mock data
            console.log('Using mock job data');
            setJob(getMockJobDetails(jobId));
          }
        } catch (error) {
          console.error('Error fetching job details, using mock data:', error);
          setJob(getMockJobDetails(jobId));
        }
      } catch (error) {
        console.error('Error loading job details:', error);
        setError('Failed to load job details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    loadJobDetails();
  }, [jobId]);

  // Get mock job details
  const getMockJobDetails = (id) => {
    // This would be a more detailed version of the job with report data
    return {
      id: id,
      tenant: 'Development Tenant',
      packageCount: 2,
      iflowCount: 7,
      guideline: 'Basic Design Guidelines',
      model: 'Anthropic Claude',
      status: 'completed',
      submittedAt: '2024-04-15T10:30:00Z',
      completedAt: '2024-04-15T10:36:00Z',
      submittedBy: 'john.doe@example.com',
      compliance: '78%',
      compliantIFlows: 5,
      nonCompliantIFlows: 2,
      report: {
        summary: {
          totalPackages: 2,
          totalIFlows: 7,
          highCompliance: 4,
          mediumCompliance: 2,
          lowCompliance: 1,
          overallCompliance: '78%'
        }
      }
    };
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-700 p-6 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-700 p-6">
        <div className="flex justify-between items-center mb-4">
            <button
                onClick={onBack}
                className="p-2 bg-gray-800 rounded-md text-gray-400 hover:text-white"
            >
                <ChevronLeft size={16} />
            </button>
            <h3 className="text-lg font-medium text-white">Error</h3>
            </div>
            <div className="p-4 bg-red-900 bg-opacity-20 rounded-md text-red-300 flex items-start">
            <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
            </div>
            <div className="flex justify-end mt-4">
            <button
                onClick={onBack}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
                Back to Jobs
            </button>
            </div>
        </div>
        );
    }

    if (!job) {
        return (
        <div className="bg-gray-900 rounded-lg border border-gray-700 p-6">
            <div className="text-center">
            <AlertTriangle size={48} className="mx-auto mb-4 text-yellow-400" />
            <h3 className="text-xl font-medium text-white mb-2">Job Not Found</h3>
            <p className="text-gray-400 mb-4">The requested job could not be found.</p>
            <button
                onClick={onBack}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
                Back to Jobs
            </button>
            </div>
        </div>
        );
    }

    // For completed job with report
    if (job.status === 'completed' && job.report) {
        return (
        <div className="bg-gray-900 rounded-lg border border-gray-700 p-6">
            <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
                <button
                onClick={onBack}
                className="p-2 mr-2 bg-gray-800 rounded-md text-gray-400 hover:text-white"
                >
                <ChevronLeft size={16} />
                </button>
                <h3 className="text-lg font-medium text-white">Job Report: {job.id}</h3>
            </div>
            <span className="flex items-center px-2 py-1 rounded-full bg-green-900 text-green-300 text-xs">
                <CheckCircle size={12} className="mr-1" />
                Completed
            </span>
            </div>
            
            <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-800 p-4 rounded-md">
                <div className="flex justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-400">Job Details</h4>
                </div>
                <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-gray-400">Tenant:</span>
                    <span className="text-white">{job.tenant}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-400">Submitted:</span>
                    <span className="text-white">{formatDate(job.submittedAt)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-400">Completed:</span>
                    <span className="text-white">{formatDate(job.completedAt)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-400">Guidelines:</span>
                    <span className="text-white">{job.guideline}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-400">Model:</span>
                    <span className="text-white">{job.model}</span>
                </div>
                </div>
            </div>
            
            <div className="bg-gray-800 p-4 rounded-md">
                <h4 className="text-sm font-medium text-gray-400 mb-3">Overall Compliance</h4>
                <div className="flex items-center">
                <div className="w-20 h-20 rounded-full flex items-center justify-center relative">
                    <svg viewBox="0 0 36 36" className="w-full h-full">
                    <path
                        d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#2d3748"
                        strokeWidth="3"
                    />
                    <path
                        d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke={parseFloat(job.compliance) >= 90 ? '#48bb78' : parseFloat(job.compliance) >= 70 ? '#ecc94b' : '#f56565'}
                        strokeWidth="3"
                        strokeDasharray={`${parseFloat(job.compliance)}, 100`}
                    />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-white">
                    {job.compliance}
                    </div>
                </div>
                <div className="ml-4 flex-1">
                    <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                        <div className="text-xs text-gray-400">High</div>
                        <div className="text-green-400">{job.report.summary.highCompliance}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-400">Medium</div>
                        <div className="text-yellow-400">{job.report.summary.mediumCompliance}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-400">Low</div>
                        <div className="text-red-400">{job.report.summary.lowCompliance}</div>
                    </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-400">
                    <div>Total Packages: {job.report.summary.totalPackages}</div>
                    <div>Total IFlows: {job.report.summary.totalIFlows}</div>
                    </div>
                </div>
                </div>
            </div>
            </div>
            
            <div className="flex justify-end">
            <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                onClick={() => {
                // Simulate downloading report
                alert(`Downloading report for job ${job.id}`);
                }}
            >
                <Download size={16} className="mr-2" />
                Download Report
            </button>
            </div>
        </div>
        );
    }

    // For failed or in-progress jobs
    return (
        <div className="bg-gray-900 rounded-lg border border-gray-700 p-6">
        <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
            <button
                onClick={onBack}
                className="p-2 mr-2 bg-gray-800 rounded-md text-gray-400 hover:text-white"
            >
                <ChevronLeft size={16} />
            </button>
            <h3 className="text-lg font-medium text-white">Job Details: {job.id}</h3>
            </div>
            {job.status === 'failed' ? (
            <span className="flex items-center px-2 py-1 rounded-full bg-red-900 text-red-300 text-xs">
                <XCircle size={12} className="mr-1" />
                Failed
            </span>
            ) : (
            <span className="flex items-center px-2 py-1 rounded-full bg-blue-900 text-blue-300 text-xs">
                <Activity size={12} className="mr-1" />
                In Progress
            </span>
            )}
        </div>
        
        {job.status === 'failed' && (
            <div className="bg-red-900 bg-opacity-20 border border-red-800 rounded-md p-4 mb-6">
            <div className="flex items-start">
                <XCircle className="text-red-400 mr-2 flex-shrink-0 mt-0.5" size={20} />
                <div>
                <h4 className="text-red-400 font-medium">Job Failed</h4>
                <p className="text-red-300 mt-1">{job.error || "Unknown error occurred"}</p>
                </div>
            </div>
            </div>
        )}
        
        {job.status === 'in-progress' && (
            <div className="mb-6">
            <div className="flex justify-between mb-2">
                <span className="text-gray-400">Progress:</span>
                <span className="text-white">{job.progress || 50}%</span>
            </div>
            <div className="w-full bg-gray-800 h-2 rounded-full mb-4">
                <div 
                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${job.progress || 50}%` }}
                ></div>
            </div>
            </div>
        )}
        
        <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-800 p-4 rounded-md">
            <h4 className="text-sm font-medium text-gray-400 mb-2">Tenant</h4>
            <p className="text-white">{job.tenant}</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-md">
            <h4 className="text-sm font-medium text-gray-400 mb-2">Submitted By</h4>
            <p className="text-white">{job.submittedBy}</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-md">
            <h4 className="text-sm font-medium text-gray-400 mb-2">Packages / IFlows</h4>
            <p className="text-white">{job.packageCount} / {job.iflowCount}</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-md">
            <h4 className="text-sm font-medium text-gray-400 mb-2">Submitted At</h4>
            <p className="text-white">{formatDate(job.submittedAt)}</p>
            </div>
        </div>
        
        <div className="flex justify-end">
            {job.status === 'failed' ? (
            <button
                onClick={() => {
                alert(`Resubmitting job ${job.id}`);
                onBack();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
                Resubmit Job
            </button>
            ) : job.status === 'in-progress' ? (
            <button
                onClick={() => {
                alert(`Cancelling job ${job.id}`);
                onBack();
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
                Cancel Job
            </button>
            ) : null}
        </div>
        </div>
    );
    };

    export default JobDetailsView;
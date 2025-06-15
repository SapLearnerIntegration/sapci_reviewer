// components/runtime/JobMonitorSection.jsx
import React, { useState, useEffect } from 'react';
import { 
  ChevronRight,
  Search, 
  RefreshCw, 
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Activity,
  AlertCircle
} from 'lucide-react';
import JobDetailsView from './JobDetailsView';

const JobMonitorSection = ({ selectedJobId, setSelectedJobId }) => {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);

  // Mock jobs for development
  const mockJobs = [
    {
      id: 'job-20240415001',
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
      nonCompliantIFlows: 2
    },
    {
      id: 'job-20240414001',
      tenant: 'QA Tenant',
      packageCount: 1,
      iflowCount: 3,
      guideline: 'Security-focused Guidelines',
      model: 'OpenAI GPT-4',
      status: 'completed',
      submittedAt: '2024-04-14T15:45:00Z',
      completedAt: '2024-04-14T15:48:30Z',
      submittedBy: 'jane.smith@example.com',
      compliance: '92%',
      compliantIFlows: 3,
      nonCompliantIFlows: 0
    },
    {
      id: 'job-20240413001',
      tenant: 'Development Tenant',
      packageCount: 3,
      iflowCount: 8,
      guideline: 'Advanced Design Guidelines',
      model: 'Anthropic Claude',
      status: 'failed',
      submittedAt: '2024-04-13T09:15:00Z',
      error: 'Connection to tenant timed out',
      submittedBy: 'john.doe@example.com'
    },
    {
      id: 'job-20240415002',
      tenant: 'Production Tenant',
      packageCount: 2,
      iflowCount: 4,
      guideline: 'Basic Design Guidelines',
      model: 'Groq LLaMA',
      status: 'in-progress',
      submittedAt: '2024-04-15T08:30:00Z',
      progress: 65,
      submittedBy: 'admin@example.com'
    }
  ];

  // Load jobs on component mount
  useEffect(() => {
    loadJobs();
  }, []);
  
  // Effect to handle selected job from props
  useEffect(() => {
    if (selectedJobId) {
      setShowJobDetails(true);
    }
  }, [selectedJobId]);

  // Load jobs, either from API or mock data
  const loadJobs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Attempt to fetch jobs from the backend
      try {
        const response = await fetch('http://localhost:3001/sap/review/jobs');
        
        if (response.ok) {
          const data = await response.json();
          setJobs(data);
        } else {
          // If API call fails, use mock data
          console.log('Using mock jobs data');
          setJobs(mockJobs);
        }
      } catch (error) {
        console.error('Error fetching jobs, using mock data:', error);
        setJobs(mockJobs);
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
      setError('Failed to load jobs. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle job selection for details view
  const handleSelectJob = (job) => {
    setSelectedJobId(job.id);
    setShowJobDetails(true);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  // Filtered jobs based on search and status filter
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      job.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.tenant.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.submittedBy?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || 
      job.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Status badge component
  const StatusBadge = ({ status }) => {
    switch(status) {
      case 'completed':
        return (
          <span className="flex items-center px-2 py-1 rounded-full bg-green-900 text-green-300 text-xs">
            <CheckCircle size={12} className="mr-1" />
            Completed
          </span>
        );
      case 'in-progress':
        return (
          <span className="flex items-center px-2 py-1 rounded-full bg-blue-900 text-blue-300 text-xs">
            <Activity size={12} className="mr-1" />
            In Progress
          </span>
        );
      case 'failed':
        return (
          <span className="flex items-center px-2 py-1 rounded-full bg-red-900 text-red-300 text-xs">
            <XCircle size={12} className="mr-1" />
            Failed
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center px-2 py-1 rounded-full bg-yellow-900 text-yellow-300 text-xs">
            <Clock size={12} className="mr-1" />
            Pending
          </span>
        );
      default:
        return (
          <span className="flex items-center px-2 py-1 rounded-full bg-gray-700 text-gray-300 text-xs">
            <AlertCircle size={12} className="mr-1" />
            Unknown
          </span>
        );
    }
  };
  
  // Get color based on compliance level
  const getComplianceColor = (compliance) => {
    if (!compliance) return 'text-gray-400';
    
    const complianceValue = parseFloat(compliance);
    if (isNaN(complianceValue)) return 'text-gray-400';
    
    if (complianceValue >= 90) return 'text-green-400';
    if (complianceValue >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-white mb-6">Job Monitoring</h2>
      
      {error && (
        <div className="p-3 bg-red-900 bg-opacity-20 rounded-md mb-4 text-red-300 flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      
      {showJobDetails ? (
        <JobDetailsView 
          jobId={selectedJobId} 
          onBack={() => {
            setShowJobDetails(false);
            setSelectedJobId(null);
          }} 
        />
      ) : (
        <div className="bg-gray-900 rounded-lg border border-gray-700">
          <div className="p-4 border-b border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-white">Integration Review Jobs</h3>
              <button 
                className="p-2 bg-gray-800 rounded-md text-gray-400 hover:text-white"
                onClick={loadJobs}
              >
                <RefreshCw size={16} />
              </button>
            </div>
            
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={16} />
                <input
                  type="text"
                  placeholder="Search by ID, tenant, or user..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-2 pl-10 bg-gray-800 border border-gray-700 rounded-md text-white"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="p-2 bg-gray-800 border border-gray-700 rounded-md text-white"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="in-progress">In Progress</option>
                <option value="failed">Failed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
          
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-gray-400">Loading jobs...</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <FileText size={48} className="mx-auto mb-4 opacity-30" />
              <p>No jobs found matching your criteria</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Job ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Tenant
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Packages/IFlows
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Submitted At
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Compliance
                    </th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredJobs.map(job => (
                    <tr key={job.id} className="hover:bg-gray-800">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-white">
                        {job.id}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-white">
                        {job.tenant}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                        {job.packageCount} / {job.iflowCount}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={job.status} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                        {formatDate(job.submittedAt)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {job.status === 'completed' ? (
                          <span className={getComplianceColor(job.compliance)}>
                            {job.compliance}
                          </span>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleSelectJob(job)}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default JobMonitorSection;
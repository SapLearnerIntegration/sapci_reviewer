// components/designer/DesignerSection.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import debounce from 'lodash/debounce';
import IFlowsView from './IFlowsView'; // Component for separate IFlow view
import ReviewProgress from './ReviewProgress';
import ReviewDisplay from './ReviewDisplay';



const DesignerSection = ({ setActiveSection, selectedTenant, tenantName }) => {
  // State for form values and UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPackages, setSelectedPackages] = useState([]);
  const [selectedIFlows, setSelectedIFlows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [packages, setPackages] = useState([]);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [actionsMenuPosition, setActionsMenuPosition] = useState({ visible: false, x: 0, y: 0, iflowId: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [iflowCurrentPage, setIflowCurrentPage] = useState(1);
  const [iflowItemsPerPage, setIflowItemsPerPage] = useState(10);
  const [iflowTotalPages, setIflowTotalPages] = useState(0);
  // State for view management
  const [currentView, setCurrentView] = useState('packages'); // 'packages' or 'iflows'
  const [selectedPackage, setSelectedPackage] = useState(null);
  
  const [jobId, setJobId] = useState(null);
  const [isReviewing, setIsReviewing] = useState(false);
  // Ref for storing event handler for cleanup
  const handleClickOutsideRef = useRef(null);
  // Add a cancel review function
  const cancelReview = async () => {
    if (!jobId) return;
    
    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL;
      const cancelEndpoint = `/sap/review/${jobId}/cancel`;
      const apiEndpoint = `${baseUrl}${cancelEndpoint}`;
      
      const response = await fetch(apiEndpoint, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to cancel review: HTTP ${response.status}`);
      }
      
      // Clear review states
      setIsReviewing(false);
      setJobId(null);
      setJobStatus(null);
      
      // Stop polling
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
    } catch (error) {
      console.error('Error canceling review:', error);
      setError(`Error canceling review: ${error.message}`);
    }
  };
  // Function to load packages from the API
  const loadPackages = useCallback(async (query = '') => {
    if (!selectedTenant) {
      setError("No tenant selected. Please select a tenant to load packages.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Prepare the payload with tenant information
      const payload = {
        tenant: tenantName,
        tenant_data: {
          id: selectedTenant.id,
          name: selectedTenant.name,
          authUrl: selectedTenant.authUrl,
          apiUrl: selectedTenant.apiUrl,
          clientId: selectedTenant.clientId,
          clientSecret: selectedTenant.clientSecret
        },
        query: query 
      };

      // Use environment variables for API endpoint construction
      const baseUrl = process.env.REACT_APP_API_BASE_URL;
      const searchPackagesEndpoint = process.env.REACT_APP_SAP_EXTRACTION_SEARCH_PACKAGES;
      const apiEndpoint = `${baseUrl}${searchPackagesEndpoint}`;

      // Call the backend API to get packages
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();

      if (result && result.d && result.d.results && Array.isArray(result.d.results)) {
        // Filter packages based on search query if provided
        let filteredPackages = result.d.results;
        if (query) {
          const lowerQuery = query.toLowerCase();
          filteredPackages = result.d.results.filter(pkg => 
            pkg.Name.toLowerCase().includes(lowerQuery) || 
            (pkg.Description && pkg.Description.toLowerCase().includes(lowerQuery))
          );
        }

        // Sort by date if available, newest first
        filteredPackages.sort((a, b) => {
          const dateA = a.ModifiedDate || a.CreationDate || ''; 
          const dateB = b.ModifiedDate || b.CreationDate || '';
          return dateB.localeCompare(dateA); // Descending order
        });

        // Calculate pagination
        const totalItems = filteredPackages.length;
        const totalPagesCalc = Math.ceil(totalItems / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedPackages = filteredPackages.slice(startIndex, endIndex);

        setPackages(paginatedPackages);
        setTotalPages(totalPagesCalc);
        setTotalCount(result.d.results.length);
        // Fetch iFlow counts for each package
try {
  const packagesWithCounts = await Promise.all(
    paginatedPackages.map(async (pkg) => {
      try {
        const baseUrl = process.env.REACT_APP_API_BASE_URL;
        const extractIFlowsEndpoint = process.env.REACT_APP_SAP_EXTRACTION_EXTRACT_IFLOWS;
        const iflowApiEndpoint = `${baseUrl}${extractIFlowsEndpoint}`;
        
        const iflowResponse = await fetch(iflowApiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            tenant: tenantName,
            tenant_data: {
              id: selectedTenant.id,
              name: selectedTenant.name,
              authUrl: selectedTenant.authUrl,
              apiUrl: selectedTenant.apiUrl,
              clientId: selectedTenant.clientId,
              clientSecret: selectedTenant.clientSecret
            },
            package: pkg.Id
          })
        });

        if (iflowResponse.ok) {
          const iflowData = await iflowResponse.json();
          const iflowCount = iflowData && iflowData.d && iflowData.d.results ? iflowData.d.results.length : 0;
          return { ...pkg, iflowCount };
        } else {
          console.warn(`Failed to fetch iFlow count for package ${pkg.Id}: ${iflowResponse.status}`);
          return { ...pkg, iflowCount: 0 };
        }
      } catch (error) {
        console.error(`Error fetching iFlow count for package ${pkg.Id}:`, error);
        return { ...pkg, iflowCount: 0 };
      }
    })
  );

  // Update packages with iFlow counts
  setPackages(packagesWithCounts);
} catch (error) {
  console.error('Error fetching iFlow counts:', error);
  // Keep the packages without counts if there's an error
}
      } else {
        throw new Error('Invalid packages format in response');
      }
    } catch (err) {
      setError(`Failed to load packages: ${err.message}`);
      setPackages([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [selectedTenant, tenantName, currentPage, itemsPerPage]);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((query) => {
      loadPackages(query);
    }, 500),
    [loadPackages]
  );

  // Load packages on mount
  useEffect(() => {
    if (selectedTenant) {
      loadPackages('');
    } else {
      setIsLoading(false);
    }
  }, [selectedTenant, loadPackages]);
  // Reload packages when page changes
  useEffect(() => {
  if (selectedTenant && currentPage > 1) {
    loadPackages(searchQuery);
  }
}, [currentPage, loadPackages, searchQuery, selectedTenant]);
  // Handle search input change
  const handleSearchChange = (e) => {
  const query = e.target.value;
  setSearchQuery(query);
  setCurrentPage(1); // Add this line
  debouncedSearch(query);
  };

 // Add to DesignerSection.jsx after the state declarations
// Add to DesignerSection.jsx
const [reportData, setReportData] = useState(null);

// Function to fetch the report data
const fetchReportData = async (jobId) => {
  try {
    setIsLoading(true);
    
    const baseUrl = process.env.REACT_APP_API_BASE_URL;
    const reportEndpoint = `/sap/review/${jobId}/report`;
    const apiEndpoint = `${baseUrl}${reportEndpoint}`;
    
    const response = await fetch(apiEndpoint);
    
    if (!response.ok) {
      throw new Error(`Error fetching report: HTTP ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Report data:', data);
    
    // Update report data state
    setReportData(data);
    
    // Show the report to the user
    setShowReport(true);
    setIsReviewing(false);
  } catch (error) {
    console.error('Error fetching report:', error);
    setError(`Error fetching report: ${error.message}`);
    setIsReviewing(false);
  } finally {
    setIsLoading(false);
  }
};

// Add state for report display
const [showReport, setShowReport] = useState(false);

const [jobStatus, setJobStatus] = useState(null);
const [pollingInterval, setPollingInterval] = useState(null);

// Job status polling function
const startJobStatusPolling = (jobId) => {
  // Clear any existing polling interval
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }
  
  // Set initial job status
  setJobStatus({
    status: 'pending',
    progress: 0,
    message: 'Initializing review...'
  });
  
  // Create polling function
  const pollJobStatus = async () => {
    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL;
      const statusEndpoint = `/sap/review/${jobId}/status`;
      const apiEndpoint = `${baseUrl}${statusEndpoint}`;
      
      const response = await fetch(apiEndpoint);
      
      if (!response.ok) {
        console.error(`Error fetching job status: HTTP ${response.status}`);
        return;
      }
      
      const data = await response.json();
      console.log('Job status update:', data);
      
      // Update job status state
      setJobStatus({
        status: data.status,
        progress: data.progress,
        message: getStatusMessage(data),
        completedIFlows: data.completedIFlows,
        totalIFlows: data.totalIFlows,
        error: data.error || null,
        reportFile: data.reportFile
      });
      
      // If job is completed or failed, stop polling and update UI
      if (['completed', 'failed'].includes(data.status)) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
        
        if (data.status === 'completed') {
          // Fetch report
          fetchReportData(jobId);
        } else if (data.status === 'failed') {
          setIsReviewing(false);
          setError(`Review failed: ${data.error || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Error polling job status:', error);
    }
  };
  
  // Start polling immediately
  pollJobStatus();
  
  // Then set interval
  const interval = setInterval(pollJobStatus, 3000); // Poll every 3 seconds
  setPollingInterval(interval);
  
  // Cleanup function
  return () => {
    clearInterval(interval);
    setPollingInterval(null);
  };
};

// Helper function to get human-readable status message
const getStatusMessage = (statusData) => {
  switch (statusData.status) {
    case 'pending':
      return 'Review job is queued...';
    case 'running':
      if (statusData.completedIFlows && statusData.totalIFlows) {
        return `Processing iFlows (${statusData.completedIFlows}/${statusData.totalIFlows})...`;
      }
      return `Processing... (${statusData.progress}%)`;
    case 'completed':
      return 'Review completed successfully!';
    case 'failed':
      return `Review failed: ${statusData.error || 'Unknown error'}`;
    default:
      return 'Processing review...';
  }
};

// Cleanup polling on component unmount
useEffect(() => {
  return () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
  };
}, [pollingInterval]);
  // Handle package selection
  const handlePackageSelect = (packageId) => {
    setSelectedPackages(prev =>
      prev.includes(packageId)
        ? prev.filter(id => id !== packageId)
        : [...prev, packageId]
    );
  };

  // Handle iflow selection with enhanced functionality
  const handleIFlowSelect = (iflowId, iflowIds) => {
    // Handle special cases
    if (iflowId === 'clear') {
      // Clear all selections
      setSelectedIFlows([]);
    } else if (iflowId === 'selectAll' && iflowIds) {
      // Select all provided IFlow IDs
      setSelectedIFlows(iflowIds);
    } else {
      // Normal toggle for individual IFlow
      setSelectedIFlows(prev =>
        prev.includes(iflowId)
          ? prev.filter(id => id !== iflowId)
          : [...prev, iflowId]
      );
    }
  };

  // Handle select all packages
  const handleSelectAll = () => {
    setSelectedPackages(prev => {
      if (prev.length === packages.length) {
        return [];
      } else {
        return packages.map(pkg => pkg.Id);
      }
    });
  };

  // Show actions menu for IFlow
  const showActionsMenu = (e, iflowId) => {
    e.preventDefault();
    e.stopPropagation();
    
    setActionsMenuPosition({ 
      visible: true, 
      x: e.clientX, 
      y: e.clientY, 
      iflowId 
    });
    
    // Create function for closing the menu on outside click
    const handleClickOutside = (event) => {
      setActionsMenuPosition(prev => ({
        ...prev,
        visible: false
      }));
      document.removeEventListener('click', handleClickOutside);
    };
    
    // Store handler reference for cleanup
    handleClickOutsideRef.current = handleClickOutside;
    
    // Add event listener to close menu when clicking outside
    document.addEventListener('click', handleClickOutside);
  };

  // Close actions menu
  const closeActionsMenu = useCallback(() => {
    setActionsMenuPosition(prev => ({
      ...prev,
      visible: false
    }));
    
    // Remove event listener if it exists
    if (handleClickOutsideRef.current) {
      document.removeEventListener('click', handleClickOutsideRef.current);
      handleClickOutsideRef.current = null;
    }
  }, []);

  // Clean up event listener on unmount
  useEffect(() => {
    return () => {
      if (handleClickOutsideRef.current) {
        document.removeEventListener('click', handleClickOutsideRef.current);
        handleClickOutsideRef.current = null;
      }
    };
  }, []);

  // Handle actions

  const handleAction = async (action, iflowId) => {
    console.log(`${action} IFlow: ${iflowId}`);
    closeActionsMenu();
    
    // Validate required parameters
    if (!iflowId) {
      console.error("Missing iFlow ID for action:", action);
      setError("No iFlow selected for this action");
      return;
    }
    
    if (!selectedPackage) {
      console.error("No package selected for action:", action);
      setError("Please select a package first");
      return;
    }
  
    try {
      // Debug logging
      console.log("Action request details:", {
        action,
        iflowId,
        packageId: selectedPackage.Id,
        packageName: selectedPackage.Name,
      });
      
      // Always use the direct iFlow ID without additional lookup logic
      // This ensures we're always working with IDs directly
      const selectedIflowId = iflowId;
      const packageId = selectedPackage.Id;
      
      console.log(`Performing ${action} on iFlow ${selectedIflowId} in package ${packageId}`);
      
      if (action === 'review') {
        setIsLoading(true);
        setError(null);
        
        // Create review payload with package ID and iFlow ID
        const reviewPayload = {
          tenant: tenantName,
          tenant_data: {
            id: selectedTenant.id,
            name: selectedTenant.name,
            authUrl: selectedTenant.authUrl,
            apiUrl: selectedTenant.apiUrl,
            clientId: selectedTenant.clientId,
            clientSecret: selectedTenant.clientSecret
          },
          // Use package ID
          packages: [packageId],
          // Use package ID as key and iFlow ID array as value
          iflowSelections: {
            [packageId]: selectedIflowId
          },
          guideline: 'design_guidelines',
          model: 'gpt-4.1',
          llm: 'openai'
        };
        
        console.log('Review payload:', reviewPayload);
        
        try {
          const baseUrl = process.env.REACT_APP_API_BASE_URL;
          const reviewEndpoint = process.env.REACT_APP_SAP_REVIEW_SUBMIT;
          const apiEndpoint = `${baseUrl}${reviewEndpoint}`;
          const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(reviewPayload)
          });
  
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error submitting review: ${errorText}`);
          }
  
          const data = await response.json();
          console.log('Review submitted successfully:', data);
          
          // Store the job ID and update review state
          setJobId(data.jobId); // Updated to match backend response field name
          setIsReviewing(true);
          
          // Start polling for job status
          startJobStatusPolling(data.jobId);
        } catch (fetchError) {
          console.error('Error submitting review:', fetchError);
          setError(`Error submitting review: ${fetchError.message}`);
          setIsReviewing(false);
        } finally {
          setIsLoading(false);
        }
      }
      // Handle other actions (download, fix, deploy, test, version)
      else {
        alert(`Action '${action}' not yet implemented for iFlow: ${iflowId}`);
      }
    } catch (error) {
      console.error(`Error in handleAction: ${error.message}`);
      setError(error.message);
      setIsLoading(false);
      setIsReviewing(false);
    }
  };

  // Navigate to IFlows view
  // Navigate to IFlows view
const viewIFlows = async (pkg) => {
  try {
    // First, get IFlows for this package
    setIsLoading(true);
    
    // Use environment variables for API endpoint construction
    const baseUrl = process.env.REACT_APP_API_BASE_URL;
    const extractIFlowsEndpoint = process.env.REACT_APP_SAP_EXTRACTION_EXTRACT_IFLOWS;
    const apiEndpoint = `${baseUrl}${extractIFlowsEndpoint}`;
    
    // Fetch IFlows from API
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tenant: tenantName,
        tenant_data: {
          id: selectedTenant.id,
          name: selectedTenant.name,
          authUrl: selectedTenant.authUrl,
          apiUrl: selectedTenant.apiUrl,
          clientId: selectedTenant.clientId,
          clientSecret: selectedTenant.clientSecret
        },
        package: pkg.Id
      })
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    
    // Validate iflows data structure
    const iflows = data && data.d && data.d.results ? data.d.results : [];
    
    // Log iflows data for debugging
    console.log("Loaded iflows:", {
      packageId: pkg.Id,
      packageName: pkg.Name,
      iflowsCount: iflows.length,
      iflowsSample: iflows.slice(0, 3).map(f => ({ Id: f.Id, Name: f.Name }))
    });
    
    // Ensure each iflow has Id and Name properties
    const validatedIflows = iflows.map(iflow => ({
      ...iflow,
      Id: iflow.Id || `unknown-${Math.random().toString(36).substring(2, 9)}`,
      Name: iflow.Name || `Unnamed IFlow ${Math.random().toString(36).substring(2, 9)}`
    }));
    
    // Add IFlows to the package object
    // Calculate IFlow pagination
const totalIflows = validatedIflows.length;
const iflowTotalPagesCalc = Math.ceil(totalIflows / iflowItemsPerPage);
const iflowStartIndex = (iflowCurrentPage - 1) * iflowItemsPerPage;
const iflowEndIndex = iflowStartIndex + iflowItemsPerPage;
const paginatedIflows = validatedIflows.slice(iflowStartIndex, iflowEndIndex);

// Add IFlows to the package object
const packageWithIFlows = {
  ...pkg,
  iflows: validatedIflows, // Keep all iflows for total count
  paginatedIflows: paginatedIflows, // Add paginated iflows
  totalIflows: totalIflows
};

// Set pagination state
setIflowTotalPages(iflowTotalPagesCalc);

// Set the selected package and change the view
setSelectedPackage(packageWithIFlows);
setCurrentView('iflows');
setIsLoading(false);
  } catch (err) {
    console.error("Error loading IFlows:", err);
    setError(`Failed to load IFlows: ${err.message}`);
    
    // Still change to IFlow view but with empty IFlows
    setSelectedPackage({
      ...pkg,
      iflows: []
    });
    setCurrentView('iflows');
    setIsLoading(false);
  }
};
  // Back to packages view
  const backToPackages = () => {
  setCurrentView('packages');
  setSelectedPackage(null);
  setSelectedIFlows([]);
  resetIflowPagination(); 
};
  
  // Actions menu component - shown when an IFlow's action button is clicked
  // Actions menu component - shown when an IFlow's action button is clicked
  // Handle IFlow pagination
// Handle IFlow pagination
const handleIflowPageChange = (newPage) => {
  if (selectedPackage && selectedPackage.iflows) {
    setIflowCurrentPage(newPage);
    
    // Recalculate pagination
    const totalIflows = selectedPackage.iflows.length;
    const iflowStartIndex = (newPage - 1) * iflowItemsPerPage;
    const iflowEndIndex = iflowStartIndex + iflowItemsPerPage;
    const paginatedIflows = selectedPackage.iflows.slice(iflowStartIndex, iflowEndIndex);
    
    // Update the selected package with new paginated data
    setSelectedPackage(prev => ({
      ...prev,
      paginatedIflows: paginatedIflows
    }));
  }
};

// Handle first page for IFlows
const handleIflowFirstPage = () => {
  handleIflowPageChange(1);
};

// Handle last page for IFlows
const handleIflowLastPage = () => {
  handleIflowPageChange(iflowTotalPages);
};

// Handle previous page for IFlows
const handleIflowPreviousPage = () => {
  if (iflowCurrentPage > 1) {
    handleIflowPageChange(iflowCurrentPage - 1);
  }
};

// Handle next page for IFlows
const handleIflowNextPage = () => {
  if (iflowCurrentPage < iflowTotalPages) {
    handleIflowPageChange(iflowCurrentPage + 1);
  }
};

// Reset IFlow pagination when switching packages
const resetIflowPagination = () => {
  setIflowCurrentPage(1);
  setIflowTotalPages(0);
};
const ActionsMenu = () => {
  if (!actionsMenuPosition.visible) return null;
  
  const menuStyle = {
    position: 'fixed',
    top: `${actionsMenuPosition.y}px`,
    left: `${actionsMenuPosition.x}px`,
    backgroundColor: '#2A3A3B',
    border: '1px solid #3C4B4C',
    borderRadius: '4px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
    zIndex: 1000,
    overflow: 'hidden'
  };
  
  const menuItemStyle = {
    padding: '8px 16px',
    color: 'white',
    cursor: 'pointer',
    fontSize: '0.875rem',
    display: 'block',
    width: '100%',
    textAlign: 'left',
    border: 'none',
    backgroundColor: 'transparent',
    transition: 'background-color 0.2s'
  };

  // Only show actions that are valid for the current state
  const isIFlowValid = selectedPackage && 
                      selectedPackage.iflows && 
                      selectedPackage.iflows.some(flow => 
                        String(flow.Id).toLowerCase() === String(actionsMenuPosition.iflowId).toLowerCase() || 
                        String(flow.Name).toLowerCase() === String(actionsMenuPosition.iflowId).toLowerCase()
                      );

  const actions = [
    { id: 'review', label: 'Review', disabled: !isIFlowValid },
    { id: 'fix', label: 'Fix', disabled: !isIFlowValid },
    { id: 'deploy', label: 'Deploy', disabled: !isIFlowValid },
    { id: 'download', label: 'Download', disabled: !isIFlowValid },
    { id: 'test', label: 'Test', disabled: !isIFlowValid },
    { id: 'version', label: 'Version', disabled: !isIFlowValid }
  ];

  return (
    <div style={menuStyle}>
      {actions.map((action) => (
        <button
          key={action.id}
          style={{
            ...menuItemStyle,
            opacity: action.disabled ? 0.5 : 1,
            cursor: action.disabled ? 'not-allowed' : 'pointer'
          }}
          onClick={() => !action.disabled && handleAction(action.id, actionsMenuPosition.iflowId)}
          onMouseOver={(e) => { !action.disabled && (e.currentTarget.style.backgroundColor = '#3C4B4C'); }}
          onMouseOut={(e) => { !action.disabled && (e.currentTarget.style.backgroundColor = 'transparent'); }}
          disabled={action.disabled}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
};

  // Styles
  const containerStyle = {
    padding: '1rem',
    display: 'flex', 
    flexDirection: 'column',
    gap: '1rem',
    backgroundColor: '#1A2526',
    minHeight: '100vh',
    position: 'relative',
    '@media (min-width: 768px)': {
      padding: '1.5rem',
      gap: '1.5rem'
    }
  };

  const headingStyle = {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: 'white'
  };

  const searchContainerStyle = {
    position: 'relative'
  };

  const searchIconStyle = {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#A1A9AA',
    width: '16px',
    height: '16px',
    pointerEvents: 'none'
  };

  const searchInputStyle = {
    width: '100%',
    paddingLeft: '40px',
    paddingRight: '16px',
    paddingTop: '8px',
    paddingBottom: '8px',
    backgroundColor: '#2A3A3B',
    border: '1px solid #3C4B4C',
    borderRadius: '8px',
    color: 'white',
    fontSize: '1rem'
  };

  const loadingContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '5rem 0',
    backgroundColor: '#2A3A3B',
    borderRadius: '8px',
    border: '1px solid rgba(161, 169, 170, 0.3)'
  };

  const spinnerStyle = {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: '2px solid #0078D4',
    borderTopColor: 'transparent',
    marginBottom: '1rem',
    animation: 'spin 1s linear infinite'
  };

  const packageContainerStyle = {
    border: '1px solid rgba(161, 169, 170, 0.3)',
    borderRadius: '8px',
    overflow: 'hidden'
  };

  const packageHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem 1rem',
    backgroundColor: '#2A3A3B'
  };

  const headerTextStyle = {
    color: 'white',
    fontWeight: '500'
  };

  // Button styles
  const buttonStyle = {
    padding: '0.5rem 1rem',
    backgroundColor: '#005A9E',
    color: 'white',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'background-color 0.2s',
    marginLeft: '8px'
  };

  // Chevron button style for package detail view
  const chevronButtonStyle = {
    color: 'white',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  // Render the appropriate view based on currentView state
  if (currentView === 'iflows' && selectedPackage) {
    return (
      <IFlowsView
        packageData={selectedPackage}
        onBack={backToPackages}
        selectedIFlows={selectedIFlows}
        onIFlowSelect={handleIFlowSelect}
        showActionsMenu={showActionsMenu}
        actionsMenu={<ActionsMenu />}
        selectedTenant={selectedTenant}
        tenantName={tenantName}
        // Pass the new props
        isReviewing={isReviewing}
        jobStatus={jobStatus}
        onCancelReview={cancelReview}
        showReport={showReport}
        reportData={reportData}
        onCloseReport={() => setShowReport(false)}
        iflowCurrentPage={iflowCurrentPage}
        iflowTotalPages={iflowTotalPages}
        iflowItemsPerPage={iflowItemsPerPage}
        onIflowPageChange={handleIflowPageChange}
        handleAction={handleAction}
      />
    );
  }
  // Default view - Packages
  

  return (
    <div style={containerStyle}>
      <h2 style={headingStyle}>Integration Package Review</h2>

      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'rgba(255, 204, 0, 0.1)',
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          marginBottom: '1rem'
        }}>
          <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="#FFCC00" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            style={{ width: '16px', height: '16px', marginRight: '6px', flexShrink: 0 }}
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span style={{ color: '#FFCC00', flex: 1 }}>Failed to load packages: {error}</span>
          <button
            onClick={() => loadPackages('')}
            style={{
              padding: '0.25rem 0.75rem',
              backgroundColor: '#005A9E',
              color: 'white',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              fontWeight: '500',
              fontSize: '0.875rem'
            }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#003F6C'; }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#005A9E'; }}
          >
            Retry
          </button>
        </div>
      )}
      
      {/* Search Bar */}
      <div style={searchContainerStyle}>
        <div style={searchIconStyle}>
          <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search packages by name or description..."
          value={searchQuery}
          onChange={handleSearchChange}
          style={searchInputStyle}
          aria-label="Search packages"
        />
      </div>

      {/* Packages Content */}
      <div>
        {isLoading ? (
          <div style={loadingContainerStyle}>
            <div style={spinnerStyle}></div>
            <p style={{ color: '#A1A9AA' }}>Loading packages for {tenantName || 'selected tenant'}...</p>
          </div>
        ) : packages.length > 0 ? (
          <div style={packageContainerStyle}>
            <div style={packageHeaderStyle}>
              <h3 style={headerTextStyle}>
                Packages ({packages.length} of {totalCount})
              </h3>
              <div style={{ display: 'flex' }}>
                {/* Only Refresh button */}
                <button
                  onClick={() => loadPackages(searchQuery)}
                  style={buttonStyle}
                  onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#003F6C'; }}
                  onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#005A9E'; }}
                  aria-label="Refresh packages"
                >
                  <svg 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    style={{ width: '16px', height: '16px', marginRight: '6px' }}
                  >
                    <path d="M21 12a9 9 0 0 1-9 9c-4.97 0-9-4.03-9-9s4.03-9 9-9h3"></path>
                    <path d="M18 3l3 3-3 3"></path>
                  </svg>
                  Refresh
                </button>
              </div>
            </div>
            <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' // Ensure minimum width for proper layout
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#2A3A3B', textAlign: 'left', fontSize: '0.875rem', fontWeight: '500', color: '#A1A9AA', textTransform: 'uppercase' }}>
                    {/*<th style={{ padding: '0.75rem', width: '48px' }}>
                      <input
                        type="checkbox"
                        onChange={handleSelectAll}
                        checked={selectedPackages.length === packages.length && packages.length > 0}
                        style={{ accentColor: '#0078D4' }}
                        aria-label="Select all packages"
                      />
                    </th>*/}
                    <th style={{ padding: '0.5rem 0.75rem', minWidth: '200px' }}>Name</th>
                    <th style={{ padding: '0.5rem 0.75rem', width: '96px' }}>Mode</th>
                    <th style={{ padding: '0.5rem 0.75rem', width: '96px' }}>Version</th>
                    <th style={{ padding: '0.5rem 0.75rem', width: '80px' }}>iFlows</th>
                    <th style={{ padding: '0.5rem 0.75rem', minWidth: '150px' }}>Created By</th>
                    <th style={{ padding: '0.5rem 0.75rem', minWidth: '120px' }}>Created Date</th>
                    <th style={{ padding: '0.5rem 0.75rem', minWidth: '300px' }}>Description</th>
                  </tr>
                </thead>
                <tbody>
  {packages.map((pkg) => (
    <tr
      key={pkg.Id}
      style={{ 
        borderTop: '1px solid rgba(161, 169, 170, 0.2)',
        backgroundColor: 'transparent',
        transition: 'background-color 0.2s',
        cursor: 'pointer' // Add cursor pointer
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.backgroundColor = '#2A3A3B';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
      onDoubleClick={() => viewIFlows(pkg)} // Add double-click handler
    >
      {/* Remove checkbox cell */}
      <td style={{ padding: '0.5rem 0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ flexShrink: 0, width: '16px', height: '16px', marginRight: '8px' }}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ width: '16px', height: '16px', color: '#A1A9AA' }}
            >
              <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <span style={{ fontSize: '0.875rem', color: 'white' }}>{pkg.Name}</span>
        </div>
      </td>
      <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#A1A9AA' }}>
        {pkg.Mode === 'EDIT_ALLOWED' ? 'Editable' : pkg.Mode}
      </td>
      <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#A1A9AA' }}>{pkg.Version}</td>
      <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#A1A9AA', textAlign: 'center' }}>
        {pkg.iflowCount !== undefined ? (
          <span style={{ 
            backgroundColor: pkg.iflowCount > 0 ? '#005A9E' : '#666',
            color: 'white',
            padding: '0.25rem 0.5rem',
            borderRadius: '12px',
            fontSize: '0.75rem',
            fontWeight: '500'
          }}>
            {pkg.iflowCount}
          </span>
        ) : (
          <span style={{ color: '#666' }}>...</span>
        )}
      </td>
      <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#A1A9AA' }}>{pkg.CreatedBy}</td>
      <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#A1A9AA' }}>
        {pkg.CreationDate ? new Date(parseInt(pkg.CreationDate)).toLocaleDateString() : "-"}
      </td>
      <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#A1A9AA', wordBreak: 'break-word' }}>
        {pkg.Description ? 
          pkg.Description.replace(/<[^>]*>?/gm, '') : 
          ""
        }
      </td>
      {/* Remove the arrow button cell */}
    </tr>
  ))}
</tbody>
              </table>
            </div>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4rem 1rem',
            backgroundColor: '#1A2526',
            border: '1px solid rgba(161, 169, 170, 0.3)',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <p style={{ color: '#A1A9AA', marginBottom: '1.5rem' }}>
              No packages found. Try refreshing or adjusting your search query.
            </p>
            
            <button
              onClick={() => loadPackages('')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#005A9E',
                color: 'white',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#003F6C'; }}
              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#005A9E'; }}
              aria-label="Load packages"
            >
              <svg 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                style={{ width: '16px', height: '16px', marginRight: '6px' }}
              >
                <path d="M21 12a9 9 0 0 1-9 9c-4.97 0-9-4.03-9-9s4.03-9 9-9h3"></path>
                <path d="M18 3l3 3-3 3"></path>
              </svg>
              Load Packages
            </button>
          </div>
        )}
      </div>
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '1.5rem',
          backgroundColor: '#1A2526',
          borderTop: '1px solid rgba(161, 169, 170, 0.2)',
          marginTop: 'auto' // Push to bottom
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
  <button
    onClick={() => setCurrentPage(1)}
    disabled={currentPage === 1}
    style={{
      padding: '0.5rem 0.75rem',
      backgroundColor: currentPage === 1 ? '#2A3A3B' : '#005A9E',
      color: currentPage === 1 ? '#666' : 'white',
      border: '1px solid #3C4B4C',
      borderRadius: '4px',
      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
      fontSize: '0.875rem'
    }}
  >
    First
  </button>
  
  <button
    onClick={() => {
      setCurrentPage(prev => Math.max(prev - 1, 1));
    }}
    disabled={currentPage === 1}
    style={{
      padding: '0.5rem 0.75rem',
      backgroundColor: currentPage === 1 ? '#2A3A3B' : '#005A9E',
      color: currentPage === 1 ? '#666' : 'white',
      border: '1px solid #3C4B4C',
      borderRadius: '4px',
      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
      fontSize: '0.875rem'
    }}
  >
    Previous
  </button>
  
  {/* Page numbers */}
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', margin: '0 1rem' }}>
    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
      let pageNum;
      if (totalPages <= 5) {
        pageNum = i + 1;
      } else {
        if (currentPage <= 3) {
          pageNum = i + 1;
        } else if (currentPage >= totalPages - 2) {
          pageNum = totalPages - 4 + i;
        } else {
          pageNum = currentPage - 2 + i;
        }
      }
      
      return (
        <button
          key={pageNum}
          onClick={() => setCurrentPage(pageNum)}
          style={{
            padding: '0.5rem 0.75rem',
            backgroundColor: currentPage === pageNum ? '#0078D4' : '#2A3A3B',
            color: 'white',
            border: '1px solid #3C4B4C',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            minWidth: '40px'
          }}
        >
          {pageNum}
        </button>
      );
    })}
  </div>
  
  <button
    onClick={() => {
      setCurrentPage(prev => Math.min(prev + 1, totalPages));
    }}
    disabled={currentPage === totalPages}
    style={{
      padding: '0.5rem 0.75rem',
      backgroundColor: currentPage === totalPages ? '#2A3A3B' : '#005A9E',
      color: currentPage === totalPages ? '#666' : 'white',
      border: '1px solid #3C4B4C',
      borderRadius: '4px',
      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
      fontSize: '0.875rem'
    }}
  >
    Next
  </button>
  
  <button
    onClick={() => setCurrentPage(totalPages)}
    disabled={currentPage === totalPages}
    style={{
      padding: '0.5rem 0.75rem',
      backgroundColor: currentPage === totalPages ? '#2A3A3B' : '#005A9E',
      color: currentPage === totalPages ? '#666' : 'white',
      border: '1px solid #3C4B4C',
      borderRadius: '4px',
      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
      fontSize: '0.875rem'
    }}
  >
    Last
  </button>
</div>
          
          {/* Page info below */}
          <div style={{ 
            position: 'absolute',
            bottom: '0.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            color: '#A1A9AA', 
            fontSize: '0.75rem',
            textAlign: 'center'
          }}>
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} packages
          </div>
        </div>
      )}
      {/* Add some keyframes for the spinner animation */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default DesignerSection;
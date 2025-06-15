// components/designer/ReviewInProgress.jsx
import React, { useState, useEffect } from 'react';
import { AlertCircle, Activity, CheckCircle, Server, X, RefreshCw, Package } from 'lucide-react';

const ReviewInProgress = ({ jobId, onCancel, error }) => {
  const [status, setStatus] = useState({
    progress: 10,
    stage: 'initializing',
    completedIFlows: 0,
    totalIFlows: 0,
    message: 'Initializing review process...'
  });
  
  const [isCancelling, setIsCancelling] = useState(false);
  
  // Helper to determine the current stage based on progress
  const determineStage = (progress) => {
    if (progress < 20) return 'initializing';
    if (progress < 40) return 'extracting';
    if (progress < 80) return 'reviewing';
    return 'reporting';
  };
  
  // Generate status message based on stage and progress
  const generateStatusMessage = (stage, completedIFlows, totalIFlows) => {
    switch (stage) {
      case 'initializing':
        return "Initializing review process...";
      case 'extracting':
        return "Extracting packages and IFlows...";
      case 'reviewing':
        return totalIFlows > 0 
          ? `Analyzing IFlows against design guidelines (${completedIFlows}/${totalIFlows})...`
          : "Analyzing IFlows against design guidelines...";
      case 'reporting':
        return "Generating comprehensive compliance report...";
      default:
        return "Processing review...";
    }
  };

  // Handle job cancellation
  const handleCancelJob = async () => {
    if (!jobId || isCancelling) return;
    
    try {
      setIsCancelling(true);
      
      // Call the backend API to cancel the job
      const response = await fetch(`http://localhost:3001/sap/review/${jobId}/cancel`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to cancel job: ${response.statusText}`);
      }
      
      // Call the onCancel handler passed from parent
      onCancel();
      
    } catch (error) {
      console.error('Error cancelling job:', error);
      // Still call onCancel even if the API call fails, so user can go back
      onCancel();
    } finally {
      setIsCancelling(false);
    }
  };

  // Poll for job status updates
  useEffect(() => {
    if (!jobId) return;
    
    const polling = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:3001/sap/review/${jobId}/status`);
        
        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }
        
        const statusData = await response.json();
        console.log('Job status update:', statusData);
        
        // Update our local status state
        setStatus(prevStatus => ({
          ...prevStatus,
          progress: statusData.progress || prevStatus.progress,
          stage: determineStage(statusData.progress),
          completedIFlows: statusData.completedIFlows || prevStatus.completedIFlows,
          totalIFlows: statusData.totalIFlows || prevStatus.totalIFlows,
          message: generateStatusMessage(
            determineStage(statusData.progress), 
            statusData.completedIFlows || prevStatus.completedIFlows,
            statusData.totalIFlows || prevStatus.totalIFlows
          )
        }));
        
        // If job is done, we don't need to continue polling
        if (statusData.status === 'completed' || statusData.status === 'failed' || statusData.status === 'cancelled') {
          clearInterval(polling);
          
          // If completed, the parent component will handle the transition to report view
        }
      } catch (error) {
        console.error('Error polling job status:', error);
      }
    }, 2000); // Poll every 2 seconds
    
    return () => clearInterval(polling);
  }, [jobId]);

  return (
    <div className="p-6">
      <h2 className="text-xl font-medium mb-4 text-white">Integration Package Review</h2>
      
      <div className="bg-gray-900 p-6 rounded-lg shadow border border-gray-700">
        <h3 className="text-lg font-medium mb-4 text-white">Review in Progress</h3>
        
        {error && (
          <div className="p-3 bg-yellow-900 bg-opacity-20 rounded-md mb-4 text-yellow-300 flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-gray-400">Job ID:</span>
            <span className="text-white font-mono">{jobId}</span>
          </div>
          
          <div className="w-full h-2 bg-gray-800 rounded-full mb-2 overflow-hidden">
            <div 
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${status.progress}%` }}
            ></div>
          </div>
          
          <p className="text-sm text-gray-400 text-center">
            {status.message}
          </p>
        </div>
        
        <div className="mb-6 p-3 bg-gray-800 rounded-md">
          <h4 className="text-white font-medium mb-2">Current Progress:</h4>
          <ul className="space-y-2">
            <li className="flex items-center text-green-400">
              <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
              <span>Connected to tenant</span>
            </li>
            
            <li className={`flex items-center ${status.stage === 'initializing' ? 'text-white' : 'text-green-400'}`}>
              <div className={`w-4 h-4 rounded-full mr-2 ${status.stage === 'initializing' ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`}></div>
              <span>Setup review configuration</span>
            </li>
            
            <li className={`flex items-center ${status.stage === 'extracting' ? 'text-white' : (status.stage === 'initializing' ? 'text-gray-400' : 'text-green-400')}`}>
              <div className={`w-4 h-4 rounded-full mr-2 ${
                status.stage === 'extracting' ? 'bg-blue-500 animate-pulse' : 
                (status.stage === 'initializing' ? 'bg-gray-600' : 'bg-green-500')
              }`}></div>
              <span>Extracting IFlows for review</span>
            </li>
            
            <li className={`flex items-center ${status.stage === 'reviewing' ? 'text-white' : (status.stage === 'initializing' || status.stage === 'extracting' ? 'text-gray-400' : 'text-green-400')}`}>
              <div className={`w-4 h-4 rounded-full mr-2 ${
                status.stage === 'reviewing' ? 'bg-blue-500 animate-pulse' : 
                (status.stage === 'initializing' || status.stage === 'extracting' ? 'bg-gray-600' : 'bg-green-500')
              }`}></div>
              <span>
                Analyzing IFlow implementations
                {status.totalIFlows > 0 && status.stage === 'reviewing' && (
                  <span className="ml-2 text-xs">
                    ({status.completedIFlows}/{status.totalIFlows})
                  </span>
                )}
              </span>
            </li>
            
            <li className={`flex items-center ${status.stage === 'reporting' ? 'text-white' : 'text-gray-400'}`}>
              <div className={`w-4 h-4 rounded-full mr-2 ${status.stage === 'reporting' ? 'bg-blue-500 animate-pulse' : 'bg-gray-600'}`}></div>
              <span>Generating compliance report</span>
            </li>
          </ul>
          
          {status.stage === 'reviewing' && status.totalIFlows > 0 && (
            <div className="mt-4 p-2 bg-gray-700 rounded text-xs text-gray-300">
              <div className="flex justify-between mb-1">
                <span>IFlow Review Progress:</span>
                <span>{Math.round((status.completedIFlows / status.totalIFlows) * 100)}%</span>
              </div>
              <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-600 rounded-full"
                  style={{ width: `${(status.completedIFlows / status.totalIFlows) * 100}%` }}
                ></div>
              </div>
              <div className="mt-2 flex items-center">
                <Activity className="h-3 w-3 mr-1 text-blue-400" />
                <span>Reviews running in parallel for faster processing</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={handleCancelJob}
            disabled={isCancelling}
            className={`px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center ${
              isCancelling ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isCancelling ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Cancelling...
              </>
            ) : (
              <>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewInProgress;
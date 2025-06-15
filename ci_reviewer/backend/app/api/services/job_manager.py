"""
Job Management Service for SAP Integration API
"""

import uuid
import threading
from datetime import datetime
from typing import Dict, Any, Optional, List


class Job:
    """Simple job class for tracking background jobs"""
    
    def __init__(self, job_id: str, params: Dict[str, Any]):
        self.id = job_id
        self.params = params
        self.status = "pending"
        self.progress = 0
        self.created_at = datetime.now().isoformat()
        self.completed_at: Optional[str] = None
        self.completedIFlows = 0
        self.totalIFlows = 0
        self.logs: List[Dict[str, str]] = []
        self.result_file: Optional[str] = None
        self.error: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert job to dictionary"""
        return {
            "id": self.id,
            "params": self.params,
            "status": self.status,
            "progress": self.progress,
            "created_at": self.created_at,
            "completed_at": self.completed_at,
            "completedIFlows": self.completedIFlows,
            "totalIFlows": self.totalIFlows,
            "logs": self.logs,
            "result_file": self.result_file,
            "error": self.error
        }


class JobManager:
    """Service for managing background jobs"""
    
    def __init__(self):
        self._jobs: Dict[str, Job] = {}
        self._lock = threading.Lock()
    
    def create_job(self, params: Dict[str, Any]) -> str:
        """
        Create a new job
        
        Args:
            params: Job parameters
            
        Returns:
            Job ID
        """
        job_id = f"job-{uuid.uuid4()}"
        
        with self._lock:
            job = Job(job_id, params)
            self._jobs[job_id] = job
        
        return job_id
    
    def get_job(self, job_id: str) -> Optional[Job]:
        """Get job by ID"""
        with self._lock:
            return self._jobs.get(job_id)
    
    def update_job(self, job_id: str, **updates) -> bool:
        """
        Update job fields
        
        Args:
            job_id: Job ID
            **updates: Fields to update
            
        Returns:
            True if job was updated, False if not found
        """
        with self._lock:
            if job_id not in self._jobs:
                return False
            
            job = self._jobs[job_id]
            for key, value in updates.items():
                if hasattr(job, key):
                    setattr(job, key, value)
            
            return True
    
    def add_log(self, job_id: str, message: str, level: str = "info") -> bool:
        """
        Add a log entry to a job
        
        Args:
            job_id: Job ID
            message: Log message
            level: Log level
            
        Returns:
            True if log was added, False if job not found
        """
        with self._lock:
            if job_id not in self._jobs:
                return False
            
            log_entry = {
                "timestamp": datetime.now().isoformat(),
                "message": message,
                "level": level
            }
            
            self._jobs[job_id].logs.append(log_entry)
            return True
    
    def list_jobs(self) -> Dict[str, Job]:
        """List all jobs"""
        with self._lock:
            return self._jobs.copy()
    
    def delete_job(self, job_id: str) -> bool:
        """
        Delete a job
        
        Args:
            job_id: Job ID
            
        Returns:
            True if job was deleted, False if not found
        """
        with self._lock:
            if job_id in self._jobs:
                del self._jobs[job_id]
                return True
            return False
    
    def cancel_job(self, job_id: str) -> bool:
        """
        Cancel a job
        
        Args:
            job_id: Job ID
            
        Returns:
            True if job was cancelled, False if not found or not cancellable
        """
        with self._lock:
            if job_id not in self._jobs:
                return False
            
            job = self._jobs[job_id]
            if job.status in ["pending", "running"]:
                job.status = "cancelled"
                job.completed_at = datetime.now().isoformat()
                return True
            
            return False


# Global job manager instance
job_manager = JobManager()
# FastAPI Backend for SAP Integration Version History

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import asyncpg
import os
from enum import Enum
import json
import logging
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)



# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL")

# Enums' 
class DeploymentStatus(str, Enum):
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    ROLLBACK = "ROLLBACK"

class DeploymentEnvironment(str, Enum):
    DEV = "DEV"
    QA = "QA"
    PROD = "PROD"

# Pydantic models
class VersionHistoryBase(BaseModel):
    tenant_id: str
    package_id: str
    package_name: str
    iflow_id: str
    iflow_name: str
    version_number: str
    version_type: str
    status: str
    description: Optional[str] = None
    changelog: Optional[str] = None
    created_by: str
    modified_by: Optional[str] = None
    content_size: Optional[int] = None
    content_hash: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None
    is_current_version: bool = False
    rollback_available: bool = True

class VersionHistoryCreate(VersionHistoryBase):
    pass

class VersionHistoryUpdate(BaseModel):
    version_type: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None
    changelog: Optional[str] = None
    modified_by: Optional[str] = None
    content_size: Optional[int] = None
    content_hash: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None
    is_current_version: Optional[bool] = None
    rollback_available: Optional[bool] = None

class VersionHistory(VersionHistoryBase):
    id: int
    created_at: datetime
    modified_at: datetime
    deployed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class DeploymentCreate(BaseModel):
    version_history_id: int
    deployment_environment: DeploymentEnvironment
    deployment_type: str = "DEPLOY"
    deployed_by: str
    deployment_config: Optional[Dict[str, Any]] = None

class Deployment(BaseModel):
    id: int
    version_history_id: int
    deployment_environment: DeploymentEnvironment
    deployment_status: DeploymentStatus
    deployment_type: str
    deployed_by: str
    deployed_at: datetime
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    deployment_config: Optional[Dict[str, Any]] = None
    rollback_version_id: Optional[int] = None

    class Config:
        from_attributes = True

class VersionComparison(BaseModel):
    id: int
    from_version_id: int
    to_version_id: int
    comparison_type: str
    diff_summary: Optional[Dict[str, Any]] = None
    changes_count: int
    compared_by: str
    compared_at: datetime

    class Config:
        from_attributes = True

# Database connection
logger.info(f"Database URL: ", DATABASE_URL)
async def get_database():
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        yield conn
    finally:
        await conn.close()

# API Endpoints

@router.get("/version-history", response_model=List[VersionHistory])
async def get_version_history(
    tenant_id: Optional[str] = Query(None),
    package_id: Optional[str] = Query(None),
    iflow_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    conn: asyncpg.Connection = Depends(get_database)
):
    """Get version history with optional filtering"""
    try:
        # Build dynamic query
        where_clauses = []
        params = []
        param_count = 0

        if tenant_id:
            param_count += 1
            where_clauses.append(f"tenant_id = ${param_count}")
            params.append(tenant_id)

        if package_id:
            param_count += 1
            where_clauses.append(f"package_id = ${param_count}")
            params.append(package_id)

        if iflow_id:
            param_count += 1
            where_clauses.append(f"iflow_id = ${param_count}")
            params.append(iflow_id)

        if status:
            param_count += 1
            where_clauses.append(f"status = ${param_count}")
            params.append(status.value)

        where_clause = " WHERE " + " AND ".join(where_clauses) if where_clauses else ""
        
        param_count += 1
        params.append(limit)
        limit_clause = f" LIMIT ${param_count}"
        
        param_count += 1
        params.append(offset)
        offset_clause = f" OFFSET ${param_count}"

        query = f"""
            SELECT * FROM version_history
            {where_clause}
            ORDER BY created_at DESC
            {limit_clause}
            {offset_clause}
        """

        rows = await conn.fetch(query, *params)
        return [dict(row) for row in rows]

    except Exception as e:
        logger.error(f"Error fetching version history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/version-history/{version_id}", response_model=VersionHistory)
async def get_version_by_id(
    version_id: int,
    conn: asyncpg.Connection = Depends(get_database)
):
    """Get specific version by ID"""
    try:
        query = "SELECT * FROM version_history WHERE id = $1"
        row = await conn.fetchrow(query, version_id)
        
        if not row:
            raise HTTPException(status_code=404, detail="Version not found")
        
        return dict(row)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching version {version_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/version-history", response_model=VersionHistory)
async def create_version(
    version: VersionHistoryCreate,
    conn: asyncpg.Connection = Depends(get_database)
):
    """Create new version"""
    try:
        # Convert metadata and tags to appropriate format
        metadata_json = json.dumps(version.metadata) if version.metadata else None
        tags_array = version.tags if version.tags else []

        query = """
            INSERT INTO version_history (
                tenant_id, package_id, package_name, iflow_id, iflow_name,
                version_number, version_type, status, description, changelog,
                created_by, modified_by, content_size, content_hash,
                metadata, tags, is_current_version, rollback_available
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                $11, $12, $13, $14, $15, $16, $17, $18
            ) RETURNING *
        """

        row = await conn.fetchrow(
            query,
            version.tenant_id, version.package_id, version.package_name,
            version.iflow_id, version.iflow_name, version.version_number,
            version.version_type.value, version.status.value, version.description,
            version.changelog, version.created_by, version.modified_by,
            version.content_size, version.content_hash, metadata_json,
            tags_array, version.is_current_version, version.rollback_available
        )

        return dict(row)

    except Exception as e:
        logger.error(f"Error creating version: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/version-history/{version_id}", response_model=VersionHistory)
async def update_version(
    version_id: int,
    version_update: VersionHistoryUpdate,
    conn: asyncpg.Connection = Depends(get_database)
):
    """Update existing version"""
    try:
        # Check if version exists
        existing = await conn.fetchrow("SELECT * FROM version_history WHERE id = $1", version_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Version not found")

        # Build dynamic update query
        update_fields = []
        params = []
        param_count = 0

        for field, value in version_update.dict(exclude_unset=True).items():
            if value is not None:
                param_count += 1
                if field == "version_type" and hasattr(value, 'value'):
                    update_fields.append(f"{field} = ${param_count}")
                    params.append(value.value)
                elif field == "status" and hasattr(value, 'value'):
                    update_fields.append(f"{field} = ${param_count}")
                    params.append(value.value)
                elif field == "metadata":
                    update_fields.append(f"{field} = ${param_count}")
                    params.append(json.dumps(value) if value else None)
                else:
                    update_fields.append(f"{field} = ${param_count}")
                    params.append(value)

        if not update_fields:
            return dict(existing)

        param_count += 1
        params.append(version_id)

        query = f"""
            UPDATE version_history 
            SET {', '.join(update_fields)}
            WHERE id = ${param_count}
            RETURNING *
        """

        row = await conn.fetchrow(query, *params)
        return dict(row)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating version {version_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/version-history/{version_id}")
async def delete_version(
    version_id: int,
    conn: asyncpg.Connection = Depends(get_database)
):
    """Delete version (soft delete by archiving)"""
    try:
        # Check if version exists
        existing = await conn.fetchrow("SELECT * FROM version_history WHERE id = $1", version_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Version not found")

        # Soft delete by setting status to ARCHIVED
        query = """
            UPDATE version_history 
            SET status = 'ARCHIVED', is_current_version = false
            WHERE id = $1
            RETURNING id
        """

        result = await conn.fetchrow(query, version_id)
        
        if result:
            return {"message": "Version archived successfully", "id": version_id}
        else:
            raise HTTPException(status_code=500, detail="Failed to archive version")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting version {version_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Deployment Endpoints

@router.get("/version-history/{version_id}/deployments", response_model=List[Deployment])
async def get_version_deployments(
    version_id: int,
    conn: asyncpg.Connection = Depends(get_database)
):
    """Get deployments for a specific version"""
    try:
        query = """
            SELECT * FROM version_deployments 
            WHERE version_history_id = $1 
            ORDER BY deployed_at DESC
        """
        rows = await conn.fetch(query, version_id)
        return [dict(row) for row in rows]

    except Exception as e:
        logger.error(f"Error fetching deployments for version {version_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/version-history/{version_id}/deployments", response_model=Deployment)
async def create_deployment(
    version_id: int,
    deployment: DeploymentCreate,
    conn: asyncpg.Connection = Depends(get_database)
):
    """Create new deployment for a version"""
    try:
        # Verify version exists
        version_exists = await conn.fetchrow("SELECT id FROM version_history WHERE id = $1", version_id)
        if not version_exists:
            raise HTTPException(status_code=404, detail="Version not found")

        # Convert deployment config to JSON
        config_json = json.dumps(deployment.deployment_config) if deployment.deployment_config else None

        query = """
            INSERT INTO version_deployments (
                version_history_id, deployment_environment, deployment_type,
                deployed_by, deployment_config
            ) VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        """

        row = await conn.fetchrow(
            query,
            version_id, deployment.deployment_environment.value,
            deployment.deployment_type, deployment.deployed_by, config_json
        )

        return dict(row)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating deployment: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Version Comparison Endpoints

@router.get("/version-history/{from_version_id}/compare/{to_version_id}", response_model=VersionComparison)
async def compare_versions(
    from_version_id: int,
    to_version_id: int,
    comparison_type: str = "CONTENT",
    compared_by: str = "system",
    conn: asyncpg.Connection = Depends(get_database)
):
    """Compare two versions"""
    try:
        # Verify both versions exist
        from_version = await conn.fetchrow("SELECT * FROM version_history WHERE id = $1", from_version_id)
        to_version = await conn.fetchrow("SELECT * FROM version_history WHERE id = $1", to_version_id)

        if not from_version:
            raise HTTPException(status_code=404, detail=f"From version {from_version_id} not found")
        if not to_version:
            raise HTTPException(status_code=404, detail=f"To version {to_version_id} not found")

        # Simple comparison logic (in real implementation, this would be more sophisticated)
        changes_count = 0
        diff_summary = {
            "version_changed": from_version['version_number'] != to_version['version_number'],
            "status_changed": from_version['status'] != to_version['status'],
            "content_size_changed": from_version['content_size'] != to_version['content_size'],
            "description_changed": from_version['description'] != to_version['description']
        }

        changes_count = sum(1 for changed in diff_summary.values() if changed)

        # Store comparison result
        query = """
            INSERT INTO version_comparisons (
                from_version_id, to_version_id, comparison_type,
                diff_summary, changes_count, compared_by
            ) VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        """

        row = await conn.fetchrow(
            query,
            from_version_id, to_version_id, comparison_type,
            json.dumps(diff_summary), changes_count, compared_by
        )

        return dict(row)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error comparing versions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Statistics Endpoints

@router.get("/version-history/stats/{iflow_id}")
async def get_version_stats(
    iflow_id: str,
    conn: asyncpg.Connection = Depends(get_database)
):
    """Get version statistics for an iFlow"""
    try:
        query = """
            SELECT 
                COUNT(*) as total_versions,
                COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active_versions,
                COUNT(CASE WHEN status = 'DEPRECATED' THEN 1 END) as deprecated_versions,
                COUNT(CASE WHEN status = 'ARCHIVED' THEN 1 END) as archived_versions,
                MAX(created_at) as latest_version_date,
                MIN(created_at) as first_version_date
            FROM version_history 
            WHERE iflow_id = $1
        """

        row = await conn.fetchrow(query, iflow_id)
        return dict(row) if row else {}

    except Exception as e:
        logger.error(f"Error fetching version stats for {iflow_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
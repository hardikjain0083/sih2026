from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from datetime import datetime

class ScanRequest(BaseModel):
    url: str
    mode: str = "live"

class PreCheckRequest(BaseModel):
    listing_text: str
    image_url: Optional[str] = None

class ComplianceReportResponse(BaseModel):
    scan_id: str
    listing_id: str
    compliance_score: float
    severity_tier: str
    cross_checks: List[Any] = []
    violations: List[str] = []
    corrections: List[str] = []
    created_at: datetime
    # Debug / Inspection fields
    raw_text: Optional[str] = None
    text_fields: Optional[Dict[str, Any]] = None
    image_fields: Optional[Dict[str, Any]] = None
    images_scanned: Optional[int] = None

class DashboardStats(BaseModel):
    total_scans: int
    avg_score: float
    violation_breakdown: Dict[str, int]
    recent_scans: List[Any]

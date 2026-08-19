import uuid
from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict

def generate_uuid():
    return str(uuid.uuid4())

class ListingDoc(BaseModel):
    id: str = Field(default_factory=generate_uuid, alias="_id")
    url: str
    platform: Optional[str] = None
    seller_name: Optional[str] = None
    raw_text: Optional[str] = None
    image_url: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = ConfigDict(
        populate_by_name=True,
        json_encoders={datetime: lambda v: v.isoformat()}
    )

    def to_dict(self):
        return self.model_dump(by_alias=True)

class FieldCheckDoc(BaseModel):
    id: str = Field(default_factory=generate_uuid, alias="_id")
    listing_id: str
    field_name: str
    text_value: Optional[str] = None
    image_value: Optional[str] = None
    match_status: str                          # "match" | "MISMATCH" | "missing_both" | "missing_in_image" | "missing_in_text"
    fraud_risk: bool = False
    confidence: float = 0.0
    rule_cited: Optional[str] = None
    severity: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True)

    def to_dict(self):
        return self.model_dump(by_alias=True)

class ScanHistoryDoc(BaseModel):
    id: str = Field(default_factory=generate_uuid, alias="_id")
    scan_id: str = Field(default_factory=generate_uuid)
    listing_id: str
    compliance_score: float
    severity_tier: str
    violations: List[str] = []
    passed_fields: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = ConfigDict(
        populate_by_name=True,
        json_encoders={datetime: lambda v: v.isoformat()}
    )

    def to_dict(self):
        return self.model_dump(by_alias=True)

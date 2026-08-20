import sys
import asyncio

if sys.platform == "win32":
    try:
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    except Exception:
        pass

import logging
from datetime import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pymongo.database import Database
from pymongo import DESCENDING

from app.database import get_db, create_indexes
from app.schemas import ScanRequest, PreCheckRequest, ComplianceReportResponse, DashboardStats
from app.models import ListingDoc, FieldCheckDoc, ScanHistoryDoc
from app.engines.scraper import ListingScraper
from app.engines.nlp_engine import NLPEngine
from app.engines.ocr_engine import OCREngine
from app.engines.cross_check import CrossCheckEngine
from app.engines.rule_validator import RuleValidator

# Configure standard logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("uvicorn.error")

# Initialize robust intelligence engines
scraper = ListingScraper()
nlp = NLPEngine()
ocr = OCREngine()
cross_check = CrossCheckEngine()
validator = RuleValidator()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup Event Trigger
    logger.info("Initializing SuRaksha MAPS backend...")
    create_indexes()
    logger.info("MongoDB indexes verified.")
    yield
    # Shutdown
    logger.info("Shutting down SuRaksha MAPS gracefully...")

app = FastAPI(title="SuRaksha MAPS API", lifespan=lifespan)

# Allow React localhost access
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "https://sih2026-frontend-7d428lei9-atharv-porwals-projects.vercel.app"
    ],allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Incoming request: {request.method} {request.url}")
    response = await call_next(request)
    return response

# --- DEMO DATA HANDLER ---
def get_mock_demo_data():
    """Bypasses scraping and hugging face APIs to return instant compliant mock JSON for presentations."""
    listing_id = "mock-listing-123"
    scan_id = "mock-scan-456"
    
    # Generate mock cross checks
    cross_results = [
        {"field_name": "net_quantity", "text_value": "1 Unit", "image_value": "1 Unit", "match_status": "match", "fraud_risk": False},
        {"field_name": "mrp", "text_value": "499", "image_value": "899", "match_status": "MISMATCH", "fraud_risk": True},
        {"field_name": "manufacturer", "text_value": "SuRaksha Industries", "image_value": "SuRaksha Industries", "match_status": "match", "fraud_risk": False}
    ]
    
    report = {
        "compliance_score": 80.0,
        "severity_tier": "MINOR",
        "violations": [{"field_name": "mrp", "reason": "MISMATCH DETECTED: Listing claims '499' but product label shows '899'.", "rule_citation": "Rule 6(1)(e) - LMPC Rules, 2011"}],
        "passed_fields": ["net_quantity", "manufacturer"]
    }
    
    corrections = validator.get_correction_suggestions(report["violations"])
    
    return {
        "scan_id": scan_id,
        "listing_id": listing_id,
        "compliance_score": report["compliance_score"],
        "severity_tier": report["severity_tier"],
        "cross_checks": cross_results,
        "violations": [v["reason"] for v in report["violations"]],
        "corrections": corrections,
        "created_at": datetime.utcnow()
    }

@app.post("/api/scan", response_model=ComplianceReportResponse)
async def scan_listing(request: ScanRequest, db: Database = Depends(get_db)):
    """
    Main orchestration endpoint: Scrape -> NLP -> OCR -> CrossCheck -> Validate -> DB Save -> Report
    """
    if request.mode == "demo":
        return get_mock_demo_data()
        
    try:
        # 1. Scrape the URL
        active_scraper = ListingScraper()
        listing_dict = await active_scraper.scrape_listing(request.url)
        logger.info(f"SCRAPER RESULT TITLE: {listing_dict.get('title')}")
        logger.info(f"SCRAPER RESULT MRP: {listing_dict.get('mrp')}")
        logger.info(f"SCRAPER RESULT PRICE: {listing_dict.get('price')}")
        logger.info(f"SCRAPER RESULT IMAGE URL: {listing_dict.get('image_url')}")
        logger.info(f"SCRAPER RESULT IMAGE URLS: {listing_dict.get('image_urls')}")
        # Combine title, description, bullet points for NLP (title on line 1)
        raw_text_parts = [listing_dict.get("title", ""), listing_dict.get("description", "")] + listing_dict.get("bullet_points", [])
        raw_text = "\n".join(filter(None, raw_text_parts))
        listing_dict["raw_text"] = raw_text
        
        # 2. Extract Fields (NLP from text, OCR from ALL product images)
        text_fields = nlp.extract_from_text(raw_text)
        all_image_urls = listing_dict.get("image_urls") or []
        if not all_image_urls and listing_dict.get("image_url"):
            all_image_urls = [listing_dict["image_url"]]  # fallback to primary
        logger.info(f"Found {len(all_image_urls)} product image(s) to scan via OCR.")
        image_fields = ocr.scan_all_images(all_image_urls)
        
        # 3. Intelligent Cross Check
        cross_results = cross_check.compare(text_fields, image_fields)
        
        # 4. Final Rule Validation
        report = validator.validate(cross_results)
        
        # 5. Persist to MongoDB — upsert listing so re-scanning the same URL doesn't crash
        listing_doc = ListingDoc(**listing_dict)
        listing_dict_to_save = listing_doc.to_dict()
        listing_dict_to_save.pop("_id", None)    # _id is immutable — must not be in $set
        db.listings.update_one(
            {"url": listing_doc.url},
            {"$set": listing_dict_to_save, "$setOnInsert": {"_id": listing_doc.id}},
            upsert=True
        )
        # Fetch back the stored doc to get the canonical _id
        stored_listing = db.listings.find_one({"url": listing_doc.url})
        listing_id = str(stored_listing["_id"]) if stored_listing else listing_doc.id
        field_check_docs = []
        for cr in cross_results:
            fc = FieldCheckDoc(
                listing_id=listing_id,
                field_name=cr["field_name"],
                text_value=cr.get("text_value"),
                image_value=cr.get("image_value"),
                match_status=cr["match_status"],
                fraud_risk=cr.get("fraud_risk", False),
                rule_cited=validator.RULE_BOOK.get(cr["field_name"], {}).get("rule_citation")
            )
            field_check_docs.append(fc.to_dict())
            
        if field_check_docs:
            for fcd in field_check_docs:
                fcd_copy = dict(fcd)
                fcd_copy.pop("_id", None)
                db.field_checks.update_one(
                    {"listing_id": listing_id, "field_name": fcd_copy["field_name"]},
                    {"$set": fcd_copy, "$setOnInsert": {"_id": fcd["_id"]}},
                    upsert=True
                )
            
        scan_history_doc = ScanHistoryDoc(
            listing_id=listing_id,
            compliance_score=report["compliance_score"],
            severity_tier=report["severity_tier"],
            violations=[v["reason"] for v in report["violations"]],
            passed_fields=report["passed_fields"]
        )
        db.scan_history.insert_one(scan_history_doc.to_dict())
        
        # 6. Response Construction
        corrections = validator.get_correction_suggestions(report["violations"])
        
        return {
            "scan_id": scan_history_doc.scan_id,
            "listing_id": listing_id,
            "compliance_score": scan_history_doc.compliance_score,
            "severity_tier": scan_history_doc.severity_tier,
            "cross_checks": cross_results,
            "violations": scan_history_doc.violations,
            "corrections": corrections,
            "created_at": scan_history_doc.created_at,
            # Debug fields so UI can display what was extracted
            "raw_text": raw_text[:2000] if raw_text else None,   # cap at 2k chars
            "text_fields": text_fields,
            "image_fields": image_fields,
            "images_scanned": image_fields.get("images_scanned", 1)
        }
    except Exception as e:
        logger.error(f"Failed scanning listing: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/scan-demo", response_model=ComplianceReportResponse)
async def scan_demo():
    """Forces the mock demo mode directly without evaluating URL parameters."""
    return get_mock_demo_data()

@app.get("/api/reports/{scan_id}", response_model=ComplianceReportResponse)
async def get_report(scan_id: str, db: Database = Depends(get_db)):
    """Fetch an existing compliance report and reconstruct its fields."""
    scan_doc = db.scan_history.find_one({"scan_id": scan_id})
    if not scan_doc:
        raise HTTPException(status_code=404, detail="Compliance Scan Report not found.")
        
    listing_id = scan_doc["listing_id"]
    field_checks = list(db.field_checks.find({"listing_id": listing_id}))
    
    cross_checks = []
    # Regenerate violation rules to reconstruct corrections
    pseudo_violations = []
    
    for fc in field_checks:
        cross_checks.append({
            "field_name": fc["field_name"],
            "text_value": fc.get("text_value"),
            "image_value": fc.get("image_value"),
            "match_status": fc.get("match_status"),
            "fraud_risk": fc.get("match_status") == "MISMATCH"
        })
        
        if fc.get("match_status") != "match" and fc.get("match_status") != "missing_in_image":
            # Very rough reconstruction, relies on original engine logic
            pass
            
    # For robust reconstruction, we would re-run RuleValidator 
    # but the instructions requested we return existing data.
    return {
        "scan_id": scan_doc["scan_id"],
        "listing_id": listing_id,
        "compliance_score": scan_doc["compliance_score"],
        "severity_tier": scan_doc["severity_tier"],
        "cross_checks": cross_checks,
        "violations": scan_doc.get("violations", []),
        "corrections": [], # Corrections generation generally requires full validator rerun.
        "created_at": scan_doc["created_at"]
    }

@app.get("/api/dashboard", response_model=DashboardStats)
async def get_dashboard(db: Database = Depends(get_db)):
    """Aggregate statistics natively inside MongoDB for the frontend dashboard."""
    total_scans = db.scan_history.count_documents({})
    
    pipeline = [{"$group": {"_id": None, "avg_score": {"$avg": "$compliance_score"}}}]
    avg_score_res = list(db.scan_history.aggregate(pipeline))
    avg_score = avg_score_res[0]["avg_score"] if avg_score_res else 0.0
    
    violation_pipeline = [
        {"$match": {"match_status": {"$ne": "match"}}},
        {"$group": {"_id": "$field_name", "count": {"$sum": 1}}}
    ]
    v_res = list(db.field_checks.aggregate(violation_pipeline))
    violation_breakdown = {item["_id"]: item["count"] for item in v_res if item["_id"] is not None}
    
    recent_scans = list(db.scan_history.find({}, {"_id": 0}).sort("created_at", DESCENDING).limit(5))
    
    return {
        "total_scans": total_scans,
        "avg_score": round(avg_score, 2),
        "violation_breakdown": violation_breakdown,
        "recent_scans": recent_scans
    }

@app.post("/api/seller-pre-check")
async def seller_pre_check(request: PreCheckRequest):
    """
    Allow sellers to evaluate their raw listing description and images 
    *before* publishing to prevent accidental violations.
    """
    try:
        text_fields = nlp.extract_from_text(request.listing_text)
        image_fields = ocr.extract_from_image(request.image_url) if request.image_url else {}
        
        cross_results = cross_check.compare(text_fields, image_fields)
        report = validator.validate(cross_results)
        corrections = validator.get_correction_suggestions(report["violations"])
        
        return {
            "compliance_score": report["compliance_score"],
            "severity_tier": report["severity_tier"],
            "cross_checks": cross_results,
            "violations": [v["reason"] for v in report["violations"]],
            "corrections": corrections
        }
    except Exception as e:
        logger.error(f"Pre-check failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

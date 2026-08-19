import re
import spacy
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class NLPEngine:
    def __init__(self):
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except OSError:
            # Fallback in case model is missing
            from spacy.cli import download
            download("en_core_web_sm")
            self.nlp = spacy.load("en_core_web_sm")

    def mock_extract(self) -> dict:
        """Return realistic fake data for demo purposes."""
        return {
            "net_quantity": "1 Unit",
            "mrp": "499",
            "manufacturer": "SuRaksha Industries Pvt Ltd",
            "country_of_origin": "India",
            "customer_care": "care@surakshagear.in",
            "product_name": "SuRaksha High-Visibility Safety Jacket",
            "dimensions": "40 x 30 x 5 cm",
            "unit_price": "499.00 per pcs"
        }

    def normalize_quantity(self, value: str) -> Optional[dict]:
        """
        Convert variations like '500gm' -> {'value': 500, 'unit': 'g'}, 
        '0.5kg' -> {'value': 500, 'unit': 'g'}, '1L' -> {'value': 1000, 'unit': 'ml'}
        """
        if not value:
            return None
            
        match = re.search(r"([\d\.]+)\s*([a-zA-Z]+)", value.lower())
        if not match:
            return None
            
        try:
            num = float(match.group(1))
            unit = match.group(2).strip()
        except ValueError:
            return None

        # Normalization conversions
        if unit in ["kg", "kgs", "kilogram", "kilograms"]:
            return {"value": num * 1000, "unit": "g"}
        elif unit in ["g", "gm", "gms", "gram", "grams"]:
            return {"value": num, "unit": "g"}
        elif unit in ["l", "lt", "liter", "liters", "litre", "litres"]:
            return {"value": num * 1000, "unit": "ml"}
        elif unit in ["ml", "milliliter", "milliliters"]:
            return {"value": num, "unit": "ml"}
        elif unit in ["pc", "pcs", "piece", "pieces", "unit", "units"]:
            return {"value": num, "unit": "pcs"}
            
        return {"value": num, "unit": unit}

    def extract_from_text(self, text: str) -> dict:
        """
        Extract deterministic data points using pure RegEx and spaCy NER.
        """
        extracted = {
            "net_quantity": None,
            "mrp": None,
            "manufacturer": None,
            "country_of_origin": None,
            "customer_care": None,
            "product_name": None,
            "dimensions": None,
            "unit_price": None
        }

        if not text:
            return extracted
            
        if "demo" in text.lower() and len(text) < 50:
            return self.mock_extract()

        # Clean noise headers commonly found in scraped pages
        clean_lines = []
        for line in text.split('\n'):
            line_str = line.strip()
            if line_str and not any(noise in line_str.lower() for noise in ["main content", "skip to", "javascript", "cookies", "browser"]):
                clean_lines.append(line_str)
        cleaned_text = "\n".join(clean_lines)

        doc = self.nlp(cleaned_text[:5000]) # Cap for spacy processing speed

        # 1. net_quantity (e.g., 1kg, 1 kg Pack, 1500 g, 500g, 1L, 1.5 kg, Net Wt: 1kg, 340 ml)
        qty_match = re.search(r"(?:net\s*(?:wt|weight|vol|quantity)?[:\s]*)?(\d+(?:\.\d+)?)\s*(kg|g|gm|gms|l|ml|litre|litres|liter|liters|pcs|pc|unit|units)\b", cleaned_text, re.IGNORECASE)
        if qty_match:
            extracted["net_quantity"] = f"{qty_match.group(1)} {qty_match.group(2)}"

        # 2. mrp / price (Handle OCR OCR space variations like MIRP, RS, PS, ₹, etc.)
        mrp_match = re.search(r"(?:m\.?r\.?p\.?|mirp|price)[:\s]*(?:rs\.?|₹|inr|ps\.?)?\s*([\d,]+(?:\.\d{2})?)", cleaned_text, re.IGNORECASE)
        if not mrp_match:
            mrp_match = re.search(r"(?:rs\.?|₹|ps\.?)\s*([\d,]+(?:\.\d{2})?)", cleaned_text, re.IGNORECASE)
        if mrp_match:
            extracted["mrp"] = mrp_match.group(1).replace(",", "")
            
        # 3. manufacturer (e.g., Mfd by: Bikanervala, Marketed by: X, Manufactured by: Y)
        mfg_match = re.search(r"(?:mfd\.?\s*by|mfg\.?\s*by|manufactured\s*by|marketed\s*by|packed\s*by|mktd\.?\s*by)[:\s]*([^\n.,]+)", cleaned_text, re.IGNORECASE)
        if mfg_match:
            mfg_val = mfg_match.group(1).strip()
            if len(mfg_val) > 2 and mfg_val.lower() not in ["see below", "see pack", "refer label"]:
                extracted["manufacturer"] = mfg_val
        if not extracted["manufacturer"]:
            # Fallback to spaCy ORG entity ignoring obvious non-brand categories
            ignore_orgs = ["grocery & gourmet foods", "amazon", "amazon.in", "flipkart", "food products", "namkeen", "main content", "customer care", "mirp", "country of origin"]
            for ent in doc.ents:
                if ent.label_ == "ORG" and ent.text.strip().lower() not in ignore_orgs and not re.search(r"\d", ent.text):
                    extracted["manufacturer"] = ent.text.strip()
                    break

        # 4. country_of_origin (e.g. Country of Origin: India, Made in India, Product of India)
        coo_match = re.search(r"(?:country\s*of\s*origin|made\s*in|product\s*of)\s*:?\s*([a-zA-Z\s]+)", cleaned_text, re.IGNORECASE)
        if coo_match:
            coo_val = coo_match.group(1).strip().split('\n')[0]
            if len(coo_val) < 20:
                extracted["country_of_origin"] = coo_val
        elif "india" in cleaned_text.lower():
            extracted["country_of_origin"] = "India"

        # 5. customer_care (extract email and/or phone)
        email_match = re.search(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", cleaned_text)
        phone_match = re.search(r"\b(?:\+?91[\-\s]?)?(?:1800[\-\s]?\d{3,4}[\-\s]?\d{3,4}|[6-9]\d{9})\b", cleaned_text)
        contacts = []
        if email_match:
            contacts.append(email_match.group(0))
        if phone_match:
            contacts.append(phone_match.group(0))
        if contacts:
            extracted["customer_care"] = " | ".join(contacts)

        # 6. product_name
        if clean_lines:
            # Line 1 of scraped text is always the primary page title
            first_line = clean_lines[0].strip()
            if first_line and not any(skip in first_line.lower() for skip in ["skip to", "javascript", "cookies", "main content"]):
                words = first_line.split()
                extracted["product_name"] = " ".join(words[:12])
            else:
                for l in clean_lines[:5]:
                    l_lower = l.lower()
                    if any(skip in l_lower for skip in ["mrp", "mirp", "net wt", "manufactured by", "mfd by", "country of origin", "customer care", "buy", "online", "price in india", "home"]):
                        continue
                    if len(l.split()) >= 1:
                        words = l.split()
                        extracted["product_name"] = " ".join(words[:12])
                        break

        # 7. dimensions
        dim_match = re.search(r"(\d+(?:\.\d+)?)\s*[xX*]\s*(\d+(?:\.\d+)?)\s*(?:[xX*]\s*(\d+(?:\.\d+)?))?\s*(cm|mm|m|inch|inches)", cleaned_text, re.IGNORECASE)
        if dim_match:
            extracted["dimensions"] = dim_match.group(0).strip()

        # 8. unit_price
        if extracted["mrp"] and extracted["net_quantity"]:
            norm = self.normalize_quantity(extracted["net_quantity"])
            if norm and norm["value"] > 0:
                try:
                    price_val = float(extracted["mrp"])
                    unit_price = price_val / norm["value"]
                    extracted["unit_price"] = f"{unit_price:.2f} per {norm['unit']}"
                except ValueError:
                    pass

        return extracted

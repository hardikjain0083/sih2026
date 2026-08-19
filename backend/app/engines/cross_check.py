import re
from typing import Dict, List
from app.engines.nlp_engine import NLPEngine

class CrossCheckEngine:
    def __init__(self):
        self.nlp = NLPEngine()
        # The master list of fields we want to check across text and image
        self.fields = [
            "product_name",
            "net_quantity",
            "mrp",
            "manufacturer",
            "country_of_origin",
            "customer_care",
            "dimensions",
            "unit_price"
        ]
        
        # Legal Metrology (Packaged Commodities) Rules, 2011 references
        self.rules_mapping = {
            "net_quantity": "Rule 6(1)(c)",
            "mrp": "Rule 6(1)(e)",
            "manufacturer": "Rule 6(1)(a)",
            "country_of_origin": "Rule 6(1)(ea)",
            "customer_care": "Rule 6(1)(h)",
            "product_name": "Rule 6(1)(b)"
        }

    def normalize_string(self, s) -> str:
        """Lowercase and strip excessive whitespace."""
        if not s:
            return ""
        return re.sub(r'\s+', ' ', str(s)).strip().lower()

    def normalize_numeric(self, s) -> float:
        """Strip currency symbols, commas, etc., and return float."""
        if not s:
            return None
        # Keep only digits and decimal point
        num_str = re.sub(r'[^\d\.]', '', str(s))
        try:
            return float(num_str)
        except ValueError:
            return None

    def compare_mrp(self, val1, val2) -> bool:
        num1 = self.normalize_numeric(val1)
        num2 = self.normalize_numeric(val2)
        if num1 is not None and num2 is not None:
            return abs(num1 - num2) < 0.01
        return self.normalize_string(val1) == self.normalize_string(val2)

    def compare_quantity(self, val1, val2) -> bool:
        norm1 = self.nlp.normalize_quantity(val1)
        norm2 = self.nlp.normalize_quantity(val2)
        
        # If both successfully normalized to the same unit, compare numerically
        if norm1 and norm2 and norm1["unit"] == norm2["unit"]:
            return abs(norm1["value"] - norm2["value"]) < 0.01
            
        # Fallback to direct string match
        return self.normalize_string(val1) == self.normalize_string(val2)

    def is_match(self, field: str, text_val: str, img_val: str) -> bool:
        if field == "mrp":
            return self.compare_mrp(text_val, img_val)
        elif field == "net_quantity":
            return self.compare_quantity(text_val, img_val)
        else:
            return self.normalize_string(text_val) == self.normalize_string(img_val)

    def compare(self, text_fields: dict, image_fields: dict) -> List[dict]:
        """
        Compare the dictionaries extracted from the listing text vs the label image.
        """
        results = []
        for field in self.fields:
            text_val = text_fields.get(field)
            img_val = image_fields.get(field)
            
            # Clean up empty states
            if str(text_val).strip().lower() in ["", "none", "null"]:
                text_val = None
            if str(img_val).strip().lower() in ["", "none", "null"]:
                img_val = None

            # Determine match status
            if text_val is None and img_val is None:
                status = "missing_both"
                fraud_risk = False
            elif text_val is not None and img_val is None:
                status = "missing_in_image"
                fraud_risk = False
            elif text_val is None and img_val is not None:
                status = "missing_in_text"
                fraud_risk = False
            else:
                if self.is_match(field, text_val, img_val):
                    status = "match"
                    fraud_risk = False
                else:
                    status = "MISMATCH"
                    fraud_risk = True

            results.append({
                "field_name": field,
                "text_value": text_val,
                "image_value": img_val,
                "match_status": status,
                "fraud_risk": fraud_risk
            })
            
        return results

    def generate_alert(self, result: dict) -> str:
        """
        Produce a human-readable sentence explaining the discrepancy.
        """
        if not result["fraud_risk"]:
            return ""
            
        field_name = result["field_name"].replace("_", " ").title()
        text_val = result["text_value"]
        img_val = result["image_value"]
        
        # Attach authentic Indian Legal Metrology Rules
        rule = self.rules_mapping.get(result["field_name"], "General compliance rule")
        
        return f"MISMATCH DETECTED: Text claims {field_name} = '{text_val}', but Image shows '{img_val}'. {rule} violation."

from typing import Dict, List, Any

class RuleValidator:
    def __init__(self):
        # Master Rule Book mapped to Legal Metrology (Packaged Commodities) Rules, 2011
        self.RULE_BOOK = {
            "net_quantity": {
                "required": True,
                "rule_citation": "Rule 6(1)(c) - LMPC Rules, 2011",
                "weight": 0.20
            },
            "mrp": {
                "required": True,
                "rule_citation": "Rule 6(1)(e) - LMPC Rules, 2011",
                "weight": 0.20
            },
            "manufacturer": {
                "required": True,
                "rule_citation": "Rule 6(1)(a) - LMPC Rules, 2011",
                "weight": 0.15
            },
            "country_of_origin": {
                "required": True,
                "rule_citation": "Rule 6(1)(ea) - LMPC Rules, 2011",
                "weight": 0.15
            },
            "customer_care": {
                "required": True,
                "rule_citation": "Rule 6(1)(h) - LMPC Rules, 2011",
                "weight": 0.15
            },
            "product_name": {
                "required": True,
                "rule_citation": "Rule 6(1)(b) - LMPC Rules, 2011",
                "weight": 0.10
            },
            "dimensions": {
                "required": False,
                "rule_citation": "Rule 6(1)(d) - LMPC Rules, 2011",
                "weight": 0.05
            },
            "unit_price": {
                "required": False,
                "rule_citation": "Rule 18(2) - Unit Sale Price",
                "weight": 0.00
            }
        }

    def validate(self, cross_check_results: List[Dict[str, Any]], product_category: str = "general") -> Dict[str, Any]:
        """
        Validate cross-checked fields against legal metrology rules and calculate compliance score.
        """
        violations = []
        passed_fields = []
        
        penalty_score = 0.0

        for result in cross_check_results:
            field_name = result.get("field_name")
            status = result.get("match_status")
            
            rule_info = self.RULE_BOOK.get(field_name, {
                "required": False,
                "rule_citation": "General standard",
                "weight": 0.0
            })
            
            is_violation = False
            violation_reason = ""
            
            # 1. Check for mandatory omissions
            if rule_info["required"] and status in ["missing_both", "missing_in_text"]:
                is_violation = True
                violation_reason = f"Mandatory field '{field_name}' is missing in the listing text."
                
            # 2. Check for fraudulent mismatches
            if status == "MISMATCH":
                is_violation = True
                violation_reason = f"MISMATCH DETECTED: Listing claims '{result.get('text_value')}' but product label shows '{result.get('image_value')}'."

            # Calculate penalties
            if is_violation:
                penalty_score += (rule_info["weight"] * 100)
                violations.append({
                    "field_name": field_name,
                    "reason": violation_reason,
                    "rule_citation": rule_info["rule_citation"]
                })
            else:
                passed_fields.append(field_name)

        # Base compliance score starts at 100
        compliance_score = max(0.0, min(100.0, 100.0 - penalty_score))
        
        # Determine Severity Tier
        if compliance_score == 100:
            severity_tier = "COMPLIANT"
        elif compliance_score < 40:
            severity_tier = "CRITICAL"
        elif compliance_score <= 70:
            severity_tier = "MAJOR"
        else:
            severity_tier = "MINOR"

        return {
            "compliance_score": round(compliance_score, 2),
            "severity_tier": severity_tier,
            "violations": violations,
            "passed_fields": passed_fields
        }

    def get_correction_suggestions(self, violations: List[Dict[str, str]]) -> List[str]:
        """
        Generate actionable suggestions for sellers to fix compliance violations.
        """
        suggestions = []
        for v in violations:
            field = v["field_name"]
            field_pretty = field.replace('_', ' ').title()
            rule = v["rule_citation"]
            
            if "MISMATCH" in v["reason"]:
                suggestions.append(f"Ensure the {field_pretty} in your listing text EXACTLY matches the physical product label. Cite: {rule}")
            else:
                # E.g. "Add 'Net Quantity: 500g' to your listing description. Cite: Rule 6(1)(c)"
                # To make it dynamic:
                suggestions.append(f"Add '{field_pretty}' to your listing description explicitly. Cite: {rule}")
                
        return suggestions

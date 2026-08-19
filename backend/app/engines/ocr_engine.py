import os
import json
import time
import base64
import logging
from io import BytesIO

import requests
from PIL import Image
from huggingface_hub import InferenceClient

from app.config import settings

logger = logging.getLogger(__name__)

class OCREngine:
    def __init__(self):
        # Initialize inference client using the configured HF token
        self.client = InferenceClient(
            provider="hf-inference",
            api_key=settings.hf_token
        )
        self.model = "Qwen/Qwen2.5-VL-7B-Instruct"
        
        self.expected_keys = [
            "product_name", 
            "net_quantity", 
            "mrp", 
            "manufacturer", 
            "country_of_origin", 
            "customer_care"
        ]

    def mock_extract(self) -> dict:
        """Return realistic fake data for demo purposes."""
        return {
            "product_name": "SuRaksha High-Visibility Safety Jacket",
            "net_quantity": "1 Unit",
            "mrp": "499.00",
            "manufacturer": "SuRaksha Industries Pvt Ltd, Industrial Estate, Delhi",
            "country_of_origin": "India",
            "customer_care": "care@surakshagear.in | 1800-123-456",
            "confidence_score": 1.0
        }

    def _download_and_encode_image(self, image_url: str) -> str:
        """Download image using requests or load local file, return base64 encoded string."""
        if not image_url or ".svg" in image_url.lower():
            logger.warning(f"Skipping unsupported image format or SVG: {image_url}")
            return None

        try:
            if os.path.exists(image_url):
                with open(image_url, "rb") as f:
                    content = f.read()
            else:
                response = requests.get(image_url, timeout=10)
                response.raise_for_status()
                content = response.content
            
            # Use Pillow to ensure it is a valid image and convert to RGB
            img = Image.open(BytesIO(content))
            if img.mode != "RGB":
                img = img.convert("RGB")
                
            buffered = BytesIO()
            img.save(buffered, format="JPEG")
            img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
            return img_str
        except Exception as e:
            logger.warning(f"Failed to download or encode image from {image_url[:80]}: {e}")
            return None

    def _parse_response(self, text: str) -> dict:
        """Parse JSON from the model's text response, stripping markdown blocks if needed."""
        cleaned_text = text.strip()
        
        # Strip markdown json blocks
        if cleaned_text.startswith("```"):
            lines = cleaned_text.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            cleaned_text = "\n".join(lines).strip()
            
        try:
            return json.loads(cleaned_text)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON from OCR response: {e}. Raw text: {text}")
            return {}

    def _try_qwen_vlm(self, base64_image: str) -> dict:
        """Attempt extraction using Hugging Face Qwen Vision Model API."""
        if not settings.hf_token:
            return {}

        prompt = (
            "Extract all mandatory Legal Metrology product packaging details from this image. "
            "Return ONLY a valid JSON object with exact keys: product_name, net_quantity, mrp, "
            "manufacturer, country_of_origin, customer_care. Use null for missing fields."
        )
        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}},
                ],
            }
        ]

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=400,
                temperature=0.1,
            )
            raw_content = response.choices[0].message.content
            return self._parse_response(raw_content)
        except Exception as e:
            logger.warning(f"Qwen VLM call failed or permission denied: {e}. Falling back to OCR.space.")
            return {}

    def extract_from_image(self, image_url: str) -> dict:
        """
        Main extraction method using OCR.space API + NLPEngine text extraction.
        """
        if not image_url:
            return {key: None for key in self.expected_keys} | {"confidence_score": 0.0}
            
        if "demo" in image_url.lower():
            return self.mock_extract()

        try:
            # 1. Download image and convert to Base64
            base64_image = self._download_and_encode_image(image_url)
            if not base64_image:
                return {key: None for key in self.expected_keys} | {"confidence_score": 0.0}

            # 2. Try Qwen Vision LLM first if base64_image is available
            qwen_result = self._try_qwen_vlm(base64_image)
            if qwen_result and any(v for k, v in qwen_result.items() if k in self.expected_keys and v):
                logger.info(f"Qwen VLM successfully extracted image fields.")
                non_null_count = sum(1 for v in qwen_result.values() if v is not None and str(v).strip() not in ("", "null"))
                confidence_score = round(non_null_count / len(self.expected_keys), 2)
                qwen_result["confidence_score"] = confidence_score
                return qwen_result

            # 3. Fallback to OCR.space API + NLPEngine
            logger.info("Using OCR.space + NLPEngine extraction pipeline.")
            api_url = "https://api.ocr.space/parse/image"
            payload = {
                "base64Image": f"data:image/jpeg;base64,{base64_image}",
                "apikey": getattr(settings, "ocr_space_key", "helloworld"),
                "language": "eng",
                "isTable": "true"
            }
            
            response = requests.post(api_url, data=payload, timeout=20)
            res_json = response.json()
            
            parsed_results = res_json.get("ParsedResults", [])
            if not parsed_results:
                logger.warning(f"OCR.space returned no parsed results for {image_url[:80]}")
                return {key: None for key in self.expected_keys} | {"confidence_score": 0.0}

            ocr_text = parsed_results[0].get("ParsedText", "")
            logger.info(f"OCR.space extracted text ({len(ocr_text)} chars): {ocr_text[:100]}...")

            # 4. Pass extracted OCR text through NLPEngine parser
            from app.engines.nlp_engine import NLPEngine
            nlp = NLPEngine()
            nlp_result = nlp.extract_from_text(ocr_text)

            final_data = {key: nlp_result.get(key) for key in self.expected_keys}

            # Calculate confidence score based on non-null extracted fields
            non_null_count = sum(1 for v in final_data.values() if v is not None and str(v).strip() not in ("", "null"))
            confidence_score = round(non_null_count / len(self.expected_keys), 2)
            final_data["confidence_score"] = confidence_score

            return final_data

        except requests.exceptions.Timeout:
            logger.warning(f"OCR.space API request timed out for image: {image_url[:80]}")
            return {key: None for key in self.expected_keys} | {"confidence_score": 0.0}
        except Exception as e:
            logger.error(f"OCR Extraction failed for {image_url[:80]}: {e}")
            return {key: None for key in self.expected_keys} | {"confidence_score": 0.0}

    def scan_all_images(self, image_urls: list) -> dict:
        """
        Run OCR on every product image and merge results.
        Strategy: for each field, use the first non-null value found across all images.
        This ensures that even if the back label is image #3, its data is captured.
        """
        if not image_urls:
            return {key: None for key in self.expected_keys} | {"confidence_score": 0.0}

        merged = {key: None for key in self.expected_keys}
        images_scanned = 0
        images_with_data = 0

        for idx, url in enumerate(image_urls[:6]):  # Hard cap at 6 images
            logger.info(f"OCR scanning image {idx + 1}/{min(len(image_urls), 6)}: {url[:80]}...")
            result = self.extract_from_image(url)
            images_scanned += 1

            any_field_found = False
            for key in self.expected_keys:
                # Only overwrite a field if we don't have a value yet
                if merged[key] is None and result.get(key) not in (None, "", "null"):
                    merged[key] = result[key]
                    any_field_found = True

            if any_field_found:
                images_with_data += 1

            # Early exit: if all fields are found, no need to scan more images
            if all(merged[k] is not None for k in self.expected_keys):
                logger.info(f"All fields found after scanning {images_scanned} image(s). Stopping early.")
                break

        # Recalculate confidence based on merged result
        non_null_count = sum(1 for v in merged.values() if v is not None and str(v).strip() not in ("", "null"))
        merged["confidence_score"] = round(non_null_count / len(self.expected_keys), 2)
        merged["images_scanned"] = images_scanned

        logger.info(f"Multi-image OCR complete: {images_scanned} scanned, {images_with_data} had data, confidence={merged['confidence_score']}")
        return merged

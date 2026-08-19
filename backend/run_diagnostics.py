"""Full diagnostic: VLM, OCR, scraper, NER. Run: python run_diagnostics.py"""
import asyncio
import json
import base64
import os
import sys
from io import BytesIO
from pathlib import Path

from dotenv import load_dotenv
load_dotenv()

BACKEND = Path(__file__).parent
LABEL_PATH = BACKEND / "test_label.jpg"


def section(title: str):
    print(f"\n{'='*60}\n  {title}\n{'='*60}")


def test_nlp_ner():
    section("TEST 1: NLP/NER (Regex + spaCy)")
    from app.engines.nlp_engine import NLPEngine

    nlp = NLPEngine()
    sample = """Dove Daily Shine Shampoo
Net Wt: 340 ml
MRP: Rs. 349.00 (inclusive of all taxes)
Manufactured by: Hindustan Unilever Ltd, Mumbai
Country of Origin: India
Customer Care: care@hul.co.in | 1800-102-2222"""

    result = nlp.extract_from_text(sample)
    critical = ["net_quantity", "mrp", "manufacturer", "country_of_origin", "customer_care"]
    ok = True
    for k in critical:
        v = result.get(k)
        status = "OK" if v else "MISSING"
        if not v:
            ok = False
        print(f"  [{status}] {k}: {v}")
    print(f"  product_name: {result.get('product_name')}")

    doc = nlp.nlp(sample)
    print("  spaCy entities:")
    for ent in doc.ents:
        print(f"    {repr(ent.text)} ({ent.label_})")

    return ok, nlp


def test_production_ocr(nlp):
    section("TEST 2: Production OCR (OCR.space + NLP) — all images")
    import requests
    from app.engines.ocr_engine import OCREngine

    if not LABEL_PATH.exists():
        print("  SKIP: test_label.jpg not found")
        return False, {}

    ocr = OCREngine()
    img_bytes = LABEL_PATH.read_bytes()

    class FakeResp:
        content = img_bytes

        def raise_for_status(self):
            pass

    orig_get = requests.get

    def fake_get(url, **kwargs):
        if "test_label" in url or url.startswith("file://"):
            return FakeResp()
        return orig_get(url, **kwargs)

    requests.get = fake_get
    try:
        single = ocr.extract_from_image("file://test_label.jpg")
        merged = ocr.scan_all_images(["file://test_label.jpg", "file://test_label.jpg"])
    finally:
        requests.get = orig_get

    print("  Single image extraction:")
    mrp_ok = False
    for k in ocr.expected_keys:
        v = single.get(k)
        if k == "mrp" and v:
            mrp_ok = True
        print(f"    {k}: {v}")
    print(f"  confidence: {single.get('confidence_score')}")

    print("\n  Multi-image merge (2 same images):")
    for k in ocr.expected_keys:
        print(f"    {k}: {merged.get(k)}")
    print(f"  images_scanned: {merged.get('images_scanned')}, confidence: {merged.get('confidence_score')}")

    return mrp_ok and single.get("confidence_score", 0) > 0, single


def test_vlm():
    section("TEST 3: VLM (Qwen2.5-VL-7B-Instruct via HuggingFace)")
    hf_token = os.getenv("HF_TOKEN")
    if not hf_token:
        print("  SKIP: HF_TOKEN not set")
        return False

    if not LABEL_PATH.exists():
        print("  SKIP: test_label.jpg not found")
        return False

    from huggingface_hub import InferenceClient
    from PIL import Image

    img = Image.open(LABEL_PATH).convert("RGB")
    buf = BytesIO()
    img.save(buf, format="JPEG")
    b64 = base64.b64encode(buf.getvalue()).decode()

    client = InferenceClient(provider="hf-inference", api_key=hf_token)
    prompt = (
        "Extract all text from this product label image. "
        "Return ONLY a JSON object with keys: product_name, net_quantity, mrp, "
        "manufacturer, country_of_origin, customer_care. Use null if not found."
    )
    messages = [
        {
            "role": "user",
            "content": [
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64}"}},
            ],
        }
    ]

    try:
        response = client.chat.completions.create(
            model="Qwen/Qwen2.5-VL-7B-Instruct",
            messages=messages,
            max_tokens=400,
            temperature=0.1,
        )
        content = response.choices[0].message.content
        print(f"  Raw response:\n{content}\n")

        cleaned = content.strip()
        if cleaned.startswith("```"):
            lines = cleaned.splitlines()
            lines = lines[1:] if lines[0].startswith("```") else lines
            lines = lines[:-1] if lines and lines[-1].startswith("```") else lines
            cleaned = "\n".join(lines).strip()

        parsed = json.loads(cleaned)
        mrp = parsed.get("mrp")
        filled = sum(1 for v in parsed.values() if v and str(v).lower() != "null")
        for k, v in parsed.items():
            print(f"    {k}: {v}")
        print(f"  Fields extracted: {filled}/6, mrp present: {bool(mrp)}")
        return bool(mrp) and filled >= 3
    except Exception as e:
        print(f"  VLM FAILED: {e}")
        return False


async def test_scraper(nlp):
    section("TEST 4: Web Scraper + NER on scraped text")
    from app.engines.scraper import ListingScraper

    scraper = ListingScraper()
    # Use a stable public page first, then demo fallback
    test_urls = [
        ("Amazon product (public)", "https://www.amazon.in/dp/B0BSHF7WHW"),
        ("Demo mode", "https://demo.example.com/product"),
    ]

    any_ok = False
    for label, url in test_urls:
        print(f"\n  [{label}] {url}")
        try:
            data = await scraper.scrape_listing(url)
            title = (data.get("title") or "")[:100]
            desc = (data.get("description") or "")[:100]
            price = data.get("price") or ""
            images = data.get("image_urls") or []
            bullets = data.get("bullet_points") or []

            print(f"    platform: {data.get('platform')}")
            print(f"    title: {repr(title)}")
            print(f"    description: {repr(desc)}")
            print(f"    price: {repr(price)}")
            print(f"    seller_name: {repr(data.get('seller_name'))}")
            print(f"    image_urls: {len(images)}")
            print(f"    bullet_points: {len(bullets)}")
            if bullets:
                for bp in bullets[:2]:
                    print(f"      - {repr(bp[:80])}")

            raw_parts = bullets + [data.get("description", ""), data.get("title", ""), price]
            raw_text = "\n".join(filter(None, raw_parts))
            if raw_text.strip():
                nf = nlp.extract_from_text(raw_text)
                print("    NLP from scraped text:")
                for k in ["product_name", "mrp", "net_quantity", "manufacturer", "country_of_origin"]:
                    if nf.get(k):
                        print(f"      {k}: {nf.get(k)}")

            has_content = bool(title or desc or price or bullets)
            if has_content:
                any_ok = True
        except Exception as e:
            print(f"    ERROR: {e}")

    return any_ok


async def main():
    print("SuRaksha MAPS — Full Diagnostic Report")

    results = {}

    ner_ok, nlp = test_nlp_ner()
    results["NER (structured text)"] = ner_ok

    ocr_ok, _ = test_production_ocr(nlp)
    results["Production OCR + NLP"] = ocr_ok

    vlm_ok = test_vlm()
    results["VLM (Qwen HF API)"] = vlm_ok

    scrape_ok = await test_scraper(nlp)
    results["Web Scraper + NLP"] = scrape_ok

    section("SUMMARY")
    for name, ok in results.items():
        print(f"  {'PASS' if ok else 'FAIL'} — {name}")

    all_pass = all(results.values())
    print(f"\nOverall: {'ALL CHECKS PASSED' if all_pass else 'ISSUES DETECTED'}")
    return 0 if all_pass else 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))

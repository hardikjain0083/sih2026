"""
Diagnostic script to test production OCR (OCR.space + NLP), web scraper, and NER.
Run from backend/: python test_pipeline.py
"""
import os
import asyncio
import json
import sys
import warnings

if sys.platform == "win32":
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    except Exception:
        pass

# Test image URLs — sample demo/label images
LOCAL_LABEL = os.path.join(os.path.dirname(__file__), "test_label.jpg")
TEST_IMAGES = [LOCAL_LABEL] if os.path.exists(LOCAL_LABEL) else [
    "https://via.placeholder.com/500x500.png?text=Dove+Shampoo+Label+Net+340ml+MRP+349",
]

# Sample product URL for scraper test (public Flipkart listing)
TEST_PRODUCT_URL = "https://www.flipkart.com/dove-daily-shine-shampoo/p/itm1234567890"

# Synthetic listing text for NER validation
SAMPLE_LISTING_TEXT = """
Dove Daily Shine Shampoo
Net Wt: 340 ml
MRP: Rs. 349.00 (inclusive of all taxes)
Manufactured by: Hindustan Unilever Ltd, Mumbai
Country of Origin: India
Customer Care: care@hul.co.in | 1800-102-2222
"""


def print_section(title: str):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print('='*60)


def test_nlp_ner():
    print_section("NER / NLP Engine (Regex + spaCy)")
    from app.engines.nlp_engine import NLPEngine

    nlp = NLPEngine()
    result = nlp.extract_from_text(SAMPLE_LISTING_TEXT)

    expected_fields = ["product_name", "net_quantity", "mrp", "manufacturer", "country_of_origin", "customer_care"]
    print("\nExtracted from sample listing text:")
    all_ok = True
    for field in expected_fields:
        val = result.get(field)
        status = "OK" if val else "MISSING"
        if not val:
            all_ok = False
        print(f"  [{status}] {field}: {val}")

    # Show spaCy entities
    doc = nlp.nlp(SAMPLE_LISTING_TEXT)
    print("\n  spaCy entities detected:")
    for ent in doc.ents:
        print(f"    - {ent.text!r} ({ent.label_})")

    return all_ok, result


def test_ocr_single_and_multi():
    print_section("Production OCR (OCR.space + NLP) — All Images")
    from app.engines.ocr_engine import OCREngine

    ocr = OCREngine()

    print(f"\nScanning {len(TEST_IMAGES)} image(s)...")
    merged = ocr.scan_all_images(TEST_IMAGES)

    expected = ocr.expected_keys
    print(f"\nMerged result (confidence={merged.get('confidence_score')}, images_scanned={merged.get('images_scanned')}):")
    mrp_found = False
    for key in expected:
        val = merged.get(key)
        status = "OK" if val else "MISSING"
        if key == "mrp" and val:
            mrp_found = True
        print(f"  [{status}] {key}: {val}")

    # Also test each image individually
    print("\nPer-image breakdown:")
    for i, url in enumerate(TEST_IMAGES):
        single = ocr.extract_from_image(url)
        non_null = sum(1 for k in expected if single.get(k))
        print(f"  Image {i+1}: {non_null}/{len(expected)} fields, confidence={single.get('confidence_score')}")

    return mrp_found and merged.get("confidence_score", 0) > 0, merged


async def test_scraper(url: str):
    print_section(f"Web Scraper — {url[:70]}...")
    from app.engines.scraper import ListingScraper
    from app.engines.nlp_engine import NLPEngine

    scraper = ListingScraper()
    nlp = NLPEngine()

    print("\nAttempting scrape (Crawl4AI -> static fallback)...")
    try:
        data = await scraper.scrape_listing(url)
    except Exception as e:
        print(f"  SCRAPE FAILED: {e}")
        return False, {}

    fields_to_check = ["title", "description", "price", "image_url", "image_urls", "platform", "seller_name", "bullet_points"]
    print("\nScraped fields:")
    scrape_ok = False
    for field in fields_to_check:
        val = data.get(field)
        if field == "bullet_points":
            print(f"  bullet_points: {len(val or [])} items")
            if val:
                for bp in val[:3]:
                    print(f"    - {bp[:80]}")
        elif field == "image_urls":
            print(f"  image_urls: {len(val or [])} images")
            for img in (val or [])[:3]:
                print(f"    - {img[:80]}...")
        else:
            status = "OK" if val else "MISSING"
            if val and field in ("title", "description", "price"):
                scrape_ok = True
            print(f"  [{status}] {field}: {(str(val)[:100] + '...') if val and len(str(val)) > 100 else val}")

    # Run NLP on scraped content
    raw_text = "\n".join(filter(None, [
        data.get("title", ""),
        data.get("description", ""),
        data.get("price", ""),
        "\n".join(data.get("bullet_points", [])),
    ]))
    print(f"\nNLP extraction from scraped text ({len(raw_text)} chars):")
    nlp_result = nlp.extract_from_text(raw_text)
    for k, v in nlp_result.items():
        if v:
            print(f"  {k}: {v}")

    return scrape_ok, data


async def main():
    print("SuRaksha MAPS — Pipeline Diagnostic Test")
    print("=" * 60)

    results = {}

    # 1. NLP/NER
    ner_ok, ner_data = test_nlp_ner()
    results["ner"] = ner_ok

    # 2. OCR
    ocr_ok, ocr_data = test_ocr_single_and_multi()
    results["ocr"] = ocr_ok

    # 3. Scraper — try real URL, fallback to demo
    scrape_ok, scrape_data = await test_scraper(TEST_PRODUCT_URL)
    if not scrape_ok:
        print("\n  Real URL scrape weak/empty — trying demo mode...")
        scrape_ok, scrape_data = await test_scraper("https://demo.example.com/product")
    results["scraper"] = scrape_ok

    # Summary
    print_section("SUMMARY")
    for name, ok in results.items():
        print(f"  {'PASS' if ok else 'FAIL'} — {name}")

    all_pass = all(results.values())
    print(f"\nOverall: {'ALL CHECKS PASSED' if all_pass else 'SOME CHECKS FAILED'}")
    return 0 if all_pass else 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))

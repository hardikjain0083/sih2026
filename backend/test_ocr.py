"""
Quick diagnostic script to test if Qwen VLM is reachable and responding correctly.
Run from backend/ with: python test_ocr.py
"""
import os, json, base64, sys
from io import BytesIO

# Load .env manually
from dotenv import load_dotenv
load_dotenv()

HF_TOKEN = os.getenv("HF_TOKEN")
if not HF_TOKEN:
    print("[X] HF_TOKEN not found in .env — check backend/.env")
    sys.exit(1)

print(f"[OK] HF_TOKEN loaded: {HF_TOKEN[:8]}...")

# Test image — local test_label.jpg
LABEL_PATH = os.path.join(os.path.dirname(__file__), "test_label.jpg")

print(f"\n[+] Loading test image: {LABEL_PATH}...")
import requests
from PIL import Image

try:
    img = Image.open(LABEL_PATH).convert("RGB")
    buf = BytesIO()
    img.save(buf, format="JPEG")
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    print(f"[OK] Image loaded and encoded. Size: {len(b64)//1024} KB base64")
except Exception as e:
    print(f"[X] Image loading failed: {e}")
    sys.exit(1)

print("\n[+] Calling Qwen2.5-VL-7B-Instruct via HuggingFace Inference API...")
from huggingface_hub import InferenceClient

client = InferenceClient(provider="hf-inference", api_key=HF_TOKEN)

PROMPT = (
    "Extract all text from this product label image. "
    "Return ONLY a JSON object with these keys: product_name, net_quantity, mrp, manufacturer, country_of_origin, customer_care. "
    "If a field is not found, use null. Do not include markdown or explanation."
)

messages = [
    {
        "role": "user",
        "content": [
            {"type": "text", "text": PROMPT},
            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64}"}}
        ]
    }
]

try:
    response = client.chat.completions.create(
        model="Qwen/Qwen2.5-VL-7B-Instruct",
        messages=messages,
        max_tokens=400,
        temperature=0.1
    )
    content = response.choices[0].message.content
    print(f"\n[OK] Raw model response:\n{'-'*50}\n{repr(content)}\n{'-'*50}")

    # Try parsing JSON
    cleaned = content.strip()
    if cleaned.startswith("```"):
        lines = cleaned.splitlines()
        lines = lines[1:] if lines[0].startswith("```") else lines
        lines = lines[:-1] if lines and lines[-1].startswith("```") else lines
        cleaned = "\n".join(lines).strip()

    try:
        parsed = json.loads(cleaned)
        print(f"\n[OK] Parsed JSON successfully:")
        for k, v in parsed.items():
            status = "[OK]" if v and str(v).lower() != "null" else "[!]"
            print(f"  {status} {k}: {repr(v)}")
    except json.JSONDecodeError as e:
        print(f"\n[!] Could not parse as JSON: {e}")
        print("   Raw content was:", repr(content))

except Exception as e:
    print(f"\n[X] API call failed: {e}")
    if "401" in str(e):
        print("   -> Token is invalid or expired. Get a new one at https://huggingface.co/settings/tokens")
    elif "429" in str(e):
        print("   -> Rate limited. Wait a few seconds and retry.")
    elif "503" in str(e) or "loading" in str(e).lower():
        print("   -> Model is loading on HF servers. Wait 30s and retry.")
    elif "404" in str(e):
        print("   -> Model not found. Check model name: Qwen/Qwen2.5-VL-7B-Instruct")

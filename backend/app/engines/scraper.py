import asyncio
import logging
import sys
from urllib.parse import urlparse
from typing import Dict, Any, List

import requests
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

class ListingScraper:
    def __init__(self):
        pass

    def get_platform(self, url: str) -> str:
        """Helper to deduce the e-commerce platform from the URL domain."""
        try:
            parsed = urlparse(url)
            domain = parsed.netloc.lower()
            if "amazon" in domain:
                return "Amazon"
            if "flipkart" in domain:
                return "Flipkart"
            if "myntra" in domain:
                return "Myntra"
            if "meesho" in domain:
                return "Meesho"
            
            # Simple fallback: extract the main domain part
            parts = domain.split(".")
            if len(parts) >= 2:
                if parts[0] == "www":
                    return parts[1].capitalize()
                return parts[0].capitalize()
            return domain
        except Exception:
            return "Unknown"

    def mock_scrape(self, url: str) -> Dict[str, Any]:
        """Return predefined mock data for demo mode."""
        return {
            "url": url,
            "title": "SuRaksha High-Visibility Safety Jacket",
            "description": "Premium quality industrial safety jacket with reflective strips. Compliant with EN ISO 20471.",
            "price": "₹499",
            "bullet_points": [
                "High visibility reflective tape",
                "Breathable mesh fabric",
                "Lightweight and durable",
                "Available in multiple sizes",
                "CE Certified"
            ],
            "image_url": "https://via.placeholder.com/500x500.png?text=Safety+Jacket",
            "platform": "Demo Platform",
            "seller_name": "Demo Safety Gear Pvt Ltd"
        }

    def _extract_data_from_html(self, html: str, url: str) -> Dict[str, Any]:
        """Helper to extract common fields using BeautifulSoup."""
        data = {
            "url": url,
            "title": "",
            "description": "",
            "price": "",
            "bullet_points": [],
            "image_url": "",        # primary image (for backward compat)
            "image_urls": [],       # ALL product images for multi-image OCR
            "platform": self.get_platform(url),
            "seller_name": ""
        }
        
        try:
            soup = BeautifulSoup(html, 'html.parser')
            
            # 1. Title
            title_tag = soup.find('title')
            if title_tag:
                data["title"] = title_tag.get_text(strip=True)
                
            # 2. Description
            meta_desc = soup.find('meta', attrs={'name': 'description'}) or soup.find('meta', property='og:description')
            if meta_desc:
                data["description"] = meta_desc.get('content', '').strip()

            # 3. Image URLs — collect ALL meaningful product images (up to 6)
            import re
            def normalize_url(src: str) -> str:
                if not src:
                    return ""
                src = src.strip()
                if src.startswith("data:"):  # skip base64 inline images
                    return ""
                if src.startswith("//"):
                    src = "https:" + src
                elif src.startswith("/"):
                    p = urlparse(url)
                    src = f"{p.scheme}://{p.netloc}{src}"

                # Clean Amazon thumbnail modifiers (e.g. `._SX38_SY50_CR,0,0,38,50_` -> `.`)
                if "media-amazon.com/images/I/" in src or "ssl-images-amazon.com/images/I/" in src:
                    src = re.sub(r'\._[A-Za-z0-9_,-]+_\.', '.', src)
                return src

            def is_valid_product_image(src: str) -> bool:
                if not src or not src.startswith("http"):
                    return False
                src_lower = src.lower()
                skip_keywords = [
                    'icon', 'logo', 'pixel', 'sprite', 'blank', 'gif', '.svg',
                    'uedata', 'batch', 'fls-eu', 'amazonbazaar', 'transparent',
                    'badge', 'banner', 'button', 'rating', 'star', 'captcha', 'tracking'
                ]
                return not any(skip in src_lower for skip in skip_keywords)

            # Priority 1: OG image is always the best hero shot
            og_image = soup.find('meta', property='og:image')
            if og_image:
                primary = normalize_url(og_image.get('content', ''))
                if is_valid_product_image(primary):
                    data["image_url"] = primary
                    data["image_urls"].append(primary)

            # Priority 2: Check <img> tags for hires attributes or src
            for img_tag in soup.find_all('img'):
                # Try high-res attributes first
                candidates = [
                    img_tag.get('data-old-hires', ''),
                    img_tag.get('data-src', ''),
                    img_tag.get('src', '')
                ]
                for raw in candidates:
                    src = normalize_url(raw)
                    if src and is_valid_product_image(src) and src not in data["image_urls"]:
                        data["image_urls"].append(src)
                        if len(data["image_urls"]) >= 6:
                            break
                if len(data["image_urls"]) >= 6:
                    break

            # Set primary image if OG image wasn't found
            if not data["image_url"] and data["image_urls"]:
                data["image_url"] = data["image_urls"][0]
                    
            # 4. Seller Name (Try OG site name, or meta author)
            og_site_name = soup.find('meta', property='og:site_name')
            if og_site_name:
                data["seller_name"] = og_site_name.get('content', '').strip()
            else:
                author_meta = soup.find('meta', attrs={'name': 'author'})
                if author_meta:
                    data["seller_name"] = author_meta.get('content', '').strip()

            # 5. Price (Basic heuristic for demonstration)
            # Find elements containing currency symbols.
            price_elem = soup.find(string=lambda t: t and ('₹' in t or 'Rs.' in t or '$' in t))
            if price_elem:
                data["price"] = price_elem.strip()
                
            # 6. Bullet points (Find the first UL list and extract its LIs)
            ul = soup.find('ul')
            if ul:
                for li in ul.find_all('li')[:8]: # Limit to first 8 points
                    text = li.get_text(strip=True)
                    if text:
                        data["bullet_points"].append(text)
                        
        except Exception as e:
            logger.error(f"Error parsing HTML: {e}")
            
        return data

    async def async_scrape(self, url: str) -> Dict[str, Any]:
        """Use Crawl4AI to run a headless browser and scrape the page.
        
        NOTE: On Windows with Python 3.12+, Playwright subprocesses require
        ProactorEventLoop. We set this before launching the crawler.
        """
        try:
            # Windows requires ProactorEventLoop for subprocess-based Playwright
            if sys.platform == "win32":
                asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
            
            from crawl4ai import AsyncWebCrawler
            async with AsyncWebCrawler(verbose=False) as crawler:
                result = await crawler.arun(url=url)
                if not result or not result.html:
                    raise ValueError("Crawl4AI returned empty or null HTML.")
                
                return self._extract_data_from_html(result.html, url)
        except Exception as e:
            logger.error(f"Crawl4AI async_scrape failed for {url}: {e}")
            raise  # Re-raise to trigger static fallback

    def scrape_static(self, url: str) -> Dict[str, Any]:
        """Fallback static scraper using requests and BeautifulSoup."""
        try:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
                "Accept-Language": "en-US,en;q=0.9",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8"
            }
            response = requests.get(url, headers=headers, timeout=15)
            response.raise_for_status()
            return self._extract_data_from_html(response.text, url)
        except Exception as e:
            logger.error(f"Static scrape failed for {url}: {e}")
            # Ensure we return empty fields instead of crashing
            return {
                "url": url,
                "title": "",
                "description": "",
                "price": "",
                "bullet_points": [],
                "image_url": "",
                "platform": self.get_platform(url),
                "seller_name": ""
            }

    async def scrape_listing(self, url: str) -> Dict[str, Any]:
        """
        Main orchestration function.
        Checks for demo mode, tries Crawl4AI, and falls back to static scrape.
        """
        if "demo" in url.lower():
            return self.mock_scrape(url)
            
        try:
            return await self.async_scrape(url)
        except Exception as e:
            logger.warning(f"Crawl4AI failed for {url}, falling back to static scrape: {e}")
            return self.scrape_static(url)

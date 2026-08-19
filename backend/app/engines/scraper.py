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
            
            # 1. Title (Try e-commerce product title element first, fallback to og:title / title tag)
            p_title = soup.find(id='productTitle') or soup.find('h1', class_='a-size-large')
            if p_title:
                data["title"] = p_title.get_text(strip=True)
            if not data["title"] or data["title"].lower() in ["amazon.in", "page not found", "amazon"]:
                og_title = soup.find('meta', property='og:title')
                if og_title and og_title.get('content') and og_title.get('content').strip().lower() not in ["amazon.in", "amazon"]:
                    data["title"] = og_title.get('content').strip()
                else:
                    title_tag = soup.find('title')
                    if title_tag:
                        t_text = title_tag.get_text(strip=True)
                        if t_text.lower() not in ["amazon.in", "amazon"]:
                            data["title"] = t_text
                
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
                    img_tag.get('data-a-dynamic-image', ''),
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
                    
            # 4. Seller Name / Brand
            byline = soup.find(id='bylineInfo') or soup.find(id='merchant-info')
            if byline:
                data["seller_name"] = byline.get_text(strip=True)
            else:
                og_site_name = soup.find('meta', property='og:site_name')
                if og_site_name:
                    data["seller_name"] = og_site_name.get('content', '').strip()

            # 5. Price
            price_span = soup.find('span', class_='a-price-whole') or soup.find('span', id='priceblock_ourprice') or soup.find('span', class_='a-offscreen')
            if price_span:
                data["price"] = "₹" + price_span.get_text(strip=True).rstrip('.')
            else:
                price_elem = soup.find(string=lambda t: t and ('₹' in t or 'Rs.' in t or '$' in t))
                if price_elem:
                    data["price"] = price_elem.strip()
                
            # 6. Bullet points
            feature_bullets = soup.find(id='feature-bullets') or soup.find(id='bullet-point-group')
            if feature_bullets:
                for li in feature_bullets.find_all('li'):
                    text = li.get_text(strip=True)
                    if text and not text.lower().startswith('show more'):
                        data["bullet_points"].append(text)
            else:
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
        """Use Crawl4AI with custom BrowserConfig headers to bypass bot detection."""
        try:
            if sys.platform == "win32":
                asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
            
            from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode

            b_config = BrowserConfig(
                headless=True,
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Accept-Language": "en-US,en;q=0.9",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8"
                }
            )
            r_config = CrawlerRunConfig(
                cache_mode=CacheMode.BYPASS,
                wait_for="body",
                delay_before_return_html=2.0
            )

            async with AsyncWebCrawler(config=b_config) as crawler:
                result = await crawler.arun(url=url, config=r_config)
                if not result or not result.html:
                    raise ValueError("Crawl4AI returned empty or null HTML.")
                
                return self._extract_data_from_html(result.html, url)
        except Exception as e:
            logger.error(f"Crawl4AI async_scrape failed for {url}: {e}")
            raise

    def scrape_static(self, url: str) -> Dict[str, Any]:
        """Ultra-fast fallback scraper using curl_cffi (curl-impersonate) to bypass TLS anti-bot protections."""
        try:
            from curl_cffi import requests as c_requests
            logger.info(f"Scraping {url[:80]} via curl_cffi (Chrome impersonation)...")
            response = c_requests.get(url, impersonate="chrome120", timeout=15)
            response.raise_for_status()
            extracted = self._extract_data_from_html(response.text, url)
            if extracted.get("title") and extracted.get("title").lower() not in ["amazon.in", "page not found", "amazon"]:
                logger.info(f"curl_cffi successfully scraped title: {extracted.get('title')[:60]}...")
                return extracted
            else:
                logger.warning(f"curl_cffi got generic response for {url[:80]}")
                return extracted
        except Exception as e:
            logger.error(f"curl_cffi static scrape failed for {url}: {e}")
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
        Cleans long tracking URLs, uses curl_cffi (curl-impersonate) as primary fast scraper,
        and falls back to Crawl4AI browser if needed.
        """
        if "demo" in url.lower():
            return self.mock_scrape(url)
            
        # Clean Amazon affiliate/tracking query parameters to canonical URL format
        import re
        asin_match = re.search(r"/(?:dp|gp/product)/([A-Z0-9]{10})", url)
        if asin_match and ("amazon.in" in url or "amazon.com" in url):
            asin = asin_match.group(1)
            domain = "amazon.in" if "amazon.in" in url else "amazon.com"
            clean_url = f"https://www.{domain}/dp/{asin}"
            logger.info(f"Normalized Amazon URL from {url[:80]}... to {clean_url}")
            url = clean_url

        # 1. Try ultra-fast TLS impersonation via curl_cffi first
        fast_res = self.scrape_static(url)
        if fast_res.get("title") and fast_res.get("title").lower() not in ["amazon.in", "page not found", "amazon"]:
            return fast_res

        # 2. Fallback to Crawl4AI headless browser if curl_cffi didn't get full DOM
        logger.warning(f"curl_cffi returned incomplete data for {url}, falling back to Crawl4AI browser...")
        try:
            return await self.async_scrape(url)
        except Exception as e:
            logger.error(f"Crawl4AI fallback failed for {url}: {e}")
            return fast_res

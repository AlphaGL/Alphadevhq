import os
import sys
from playwright.sync_api import sync_playwright

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "img", "work")
os.makedirs(OUT_DIR, exist_ok=True)

SITES = [
    ("sugamama", "https://sugamamasugababiesdaycare.org"),
    ("ahiolu", "https://ahiolu.com"),
    ("nextmedia", "https://www.nextmediahq.net"),
    ("princess-honey", "https://princesspurehoney.vercel.app"),
    ("futobme", "https://futobme.vercel.app"),
    ("alifing", "https://alifing-power-engineering-site.vercel.app/"),
    ("crestcare", "https://crestcaremedicalcenter.vercel.app/"),
    ("eze-enyia", "https://eze-enyia-website.vercel.app/"),
    ("guarantee-dental", "https://guarantee-specialist.vercel.app/"),
    ("naoberry", "https://naoberry-signature.vercel.app/"),
]
SITES_URL = dict(SITES)


def capture_one(browser, slug, url, attempt=1):
    context = browser.new_context(viewport={"width": 1600, "height": 1000})
    page = context.new_page()
    shots = []
    try:
        page.goto(url, wait_until="domcontentloaded", timeout=40000)
        page.wait_for_timeout(2200)
        p1 = os.path.join(OUT_DIR, f"{slug}-1.png")
        page.screenshot(path=p1)
        shots.append(p1)

        page.evaluate("window.scrollTo(0, Math.min(document.body.scrollHeight*0.35, 1400))")
        page.wait_for_timeout(900)
        p2 = os.path.join(OUT_DIR, f"{slug}-2.png")
        page.screenshot(path=p2)
        shots.append(p2)

        page.set_viewport_size({"width": 430, "height": 932})
        page.evaluate("window.scrollTo(0,0)")
        page.wait_for_timeout(900)
        p3 = os.path.join(OUT_DIR, f"{slug}-3.png")
        page.screenshot(path=p3)
        shots.append(p3)
    except Exception as e:
        print(f"FAILED ({attempt}) {slug}: {e}")
    finally:
        context.close()
    return shots


def main():
    only = sys.argv[1:] if len(sys.argv) > 1 else None
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for slug, url in SITES:
            if only and slug not in only:
                continue
            print(f"Capturing {slug} -> {url}", flush=True)
            shots = capture_one(browser, slug, url, attempt=1)
            if not shots:
                print(f"  retrying {slug}...", flush=True)
                shots = capture_one(browser, slug, url, attempt=2)
            print(f"  got {len(shots)} shots", flush=True)
        browser.close()


if __name__ == "__main__":
    main()

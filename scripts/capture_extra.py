import os
from playwright.sync_api import sync_playwright

ROOT = os.path.join(os.path.dirname(__file__), "..", "assets", "img")
WORK_DIR = os.path.join(ROOT, "work")
SVC_DIR = os.path.join(ROOT, "services")
os.makedirs(WORK_DIR, exist_ok=True)
os.makedirs(SVC_DIR, exist_ok=True)


def shot_site(browser, slug, url):
    context = browser.new_context(viewport={"width": 1600, "height": 1000})
    page = context.new_page()
    shots = []
    try:
        page.goto(url, wait_until="domcontentloaded", timeout=40000)
        page.wait_for_timeout(2200)
        p1 = os.path.join(WORK_DIR, f"{slug}-1.png")
        page.screenshot(path=p1)
        shots.append(p1)

        page.evaluate("window.scrollTo(0, Math.min(document.body.scrollHeight*0.35, 1400))")
        page.wait_for_timeout(900)
        p2 = os.path.join(WORK_DIR, f"{slug}-2.png")
        page.screenshot(path=p2)
        shots.append(p2)

        page.set_viewport_size({"width": 430, "height": 932})
        page.evaluate("window.scrollTo(0,0)")
        page.wait_for_timeout(900)
        p3 = os.path.join(WORK_DIR, f"{slug}-3.png")
        page.screenshot(path=p3)
        shots.append(p3)
    except Exception as e:
        print(f"FAILED site {slug}: {e}")
    finally:
        context.close()
    return shots


def shot_google_search(browser, slug, query):
    context = browser.new_context(viewport={"width": 1440, "height": 1400}, locale="en-NG")
    page = context.new_page()
    try:
        page.goto("https://www.google.com/search?q=" + query.replace(" ", "+") + "&hl=en&gl=ng",
                   wait_until="domcontentloaded", timeout=40000)
        page.wait_for_timeout(2500)
        # try to dismiss consent dialog if present
        for text in ["Accept all", "I agree", "Reject all"]:
            try:
                btn = page.get_by_role("button", name=text)
                if btn.count() > 0:
                    btn.first.click(timeout=2000)
                    page.wait_for_timeout(1000)
                    break
            except Exception:
                pass
        path = os.path.join(SVC_DIR, f"{slug}.png")
        page.screenshot(path=path)
        print(f"OK google search {slug}")
        return path
    except Exception as e:
        print(f"FAILED google search {slug}: {e}")
        return None
    finally:
        context.close()


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch()

        print("--- sugamama retry ---", flush=True)
        shots = shot_site(browser, "sugamama", "https://www.sugamamasugababiesdaycare.org/")
        print(f"sugamama got {len(shots)} shots", flush=True)

        print("--- google business profile shots ---", flush=True)
        shot_google_search(browser, "gbp-watch2d", "Watch2D Owerri")
        shot_google_search(browser, "gbp-princess-honey", "Princess Pure Honey Owerri")

        print("--- seo serp shot ---", flush=True)
        shot_google_search(browser, "seo-serp", "Guarantee Specialist Dental Clinics Owerri")

        browser.close()


if __name__ == "__main__":
    main()

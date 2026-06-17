"""Admin audit — lightweight with longer timeouts."""
from playwright.sync_api import sync_playwright
import json, os

BASE = "http://localhost:3000"
OUT = "/workspace/.trae/admin_audit"
os.makedirs(OUT, exist_ok=True)
results = {}

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={"width": 1440, "height": 900})
    page = ctx.new_page()

    print("=== Login ===")
    try:
        page.goto(f"{BASE}/admin/login", wait_until="networkidle", timeout=60000)
    except:
        page.goto(f"{BASE}/admin/login", timeout=60000)
        page.wait_for_timeout(5000)
    page.screenshot(path=f"{OUT}/01_login.png", full_page=True)

    page.fill('input[type="text"]', "admin")
    page.fill('input[type="password"]', "admin123")
    page.click('button[type="submit"]')
    try:
        page.wait_for_url(f"{BASE}/admin", timeout=15000)
    except:
        page.wait_for_timeout(5000)
    page.wait_for_load_state("networkidle")
    page.screenshot(path=f"{OUT}/02_dashboard.png", full_page=True)
    results["dashboard"] = {"url": page.url, "title": page.title()}
    print(f"  Dashboard: {page.url}")

    pages = ["/admin/users", "/admin/courses", "/admin/languages", "/admin/community", "/admin/badges"]
    for pn in pages:
        print(f"=== {pn} ===")
        try:
            page.goto(f"{BASE}{pn}", wait_until="networkidle", timeout=30000)
        except:
            page.goto(f"{BASE}{pn}", timeout=30000)
            page.wait_for_timeout(3000)
        page.wait_for_timeout(1000)
        name = pn.replace("/admin/", "").replace("/admin", "dashboard")
        page.screenshot(path=f"{OUT}/{name}.png", full_page=True)
        rows = page.locator('table tbody tr').count()
        results[name] = {"rows": rows}
        print(f"  {name}: rows={rows}")

    # Console errors
    console_msgs = []
    def on_console(msg):
        if msg.type in ("error", "warning"):
            console_msgs.append(f"[{msg.type}] {msg.text}")
    page.on("console", on_console)

    for pn in pages + ["/admin"]:
        try:
            page.goto(f"{BASE}{pn}", wait_until="networkidle", timeout=30000)
        except:
            page.goto(f"{BASE}{pn}", timeout=30000)
            page.wait_for_timeout(2000)

    results["console"] = {"issues": console_msgs[:30]}
    print(f"  Console issues: {len(console_msgs)}")

    # Mobile
    page.set_viewport_size({"width": 375, "height": 812})
    page.goto(f"{BASE}/admin", timeout=30000)
    page.wait_for_timeout(2000)
    page.screenshot(path=f"{OUT}/mobile.png", full_page=True)
    results["mobile"] = True

    browser.close()

with open(f"{OUT}/audit_results.json", "w") as f:
    json.dump(results, f, indent=2, ensure_ascii=False)
print("\n=== DONE ===")
print(json.dumps(results, indent=2, ensure_ascii=False))
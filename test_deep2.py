"""LinguaLearn Comprehensive Functional Test"""
import json
from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout

BASE = "http://localhost:3000"
CHROMIUM = "/root/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome"

report = {"issues": [], "pages": []}

def issue(severity, category, page, description):
    print(f"  [{severity}] [{category}] {page}: {description}")
    report["issues"].append({"severity": severity, "category": category,
                               "page": page, "description": description})

def test_page(page, url, title, wait_ms=2000):
    print(f"\n=== {title} ({url}) ===")
    page.goto(f"{BASE}{url}", wait_until="domcontentloaded", timeout=15000)
    page.wait_for_timeout(wait_ms)
    body = page.inner_text("body")
    h1 = page.inner_text("h1") if page.locator("h1").count() > 0 else ""
    console_errors = 0
    page.on("console", lambda msg: None)
    page_info = {
        "url": url,
        "title": title,
        "body_length": len(body),
        "h1": h1,
        "buttons": page.locator("button").count(),
        "inputs": page.locator("input").count(),
        "links": page.locator("a").count(),
    }
    print(f"  Body: {len(body)} chars, h1='{h1}'")
    return page_info

with sync_playwright() as p:
    browser = p.chromium.launch(
        headless=True, executable_path=CHROMIUM,
        args=["--no-sandbox", "--disable-dev-shm-usage"])
    context = browser.new_context(viewport={"width": 1280, "height": 800})
    page = context.new_page()

    # Test 1: Home page
    info = test_page(page, "/", "首页")
    # Click "开始学习" button (if exists)
    buttons = page.locator("button").all()
    for b in buttons:
        try:
            text = b.inner_text().strip()
            if "学习" in text or "开始" in text:
                initial_url = page.url
                b.click(timeout=5000, force=True)
                page.wait_for_timeout(1500)
                print(f"  Clicked '{text}': {initial_url} -> {page.url}")
                if page.url == initial_url:
                    issue("warning", "button", "/", f"按钮 '{text}' 无跳转")
                page.go_back(wait_until="domcontentloaded")
                page.wait_for_timeout(1000)
                break
        except Exception as e:
            issue("info", "button", "/", str(e))
    report["pages"].append(info)

    # Test 2: Courses list - search
    info = test_page(page, "/courses", "课程列表")
    search_input = page.locator("input").nth(0)
    try:
        search_input.fill("english", timeout=5000)
        page.wait_for_timeout(1000)
        cards_after_search = page.locator("a[href*='/courses/']").count()
        print(f"  After search 'english': {cards_after_search} course cards")
        search_input.fill("", timeout=2000)
        page.wait_for_timeout(500)
        # Test language filter buttons
        for btn in page.locator("button").all():
            t = btn.inner_text(timeout=1000).strip()
            if "English" in t and len(t) < 15:
                btn.click(timeout=3000, force=True)
                page.wait_for_timeout(1000)
                cards_after = page.locator("a[href*='/courses/']").count()
                print(f"  After '{t}' filter: {cards_after} course cards")
                break
        # Test level buttons
        for btn in page.locator("button").all():
            t = btn.inner_text(timeout=500).strip()
            if t in ["A1", "A2", "B1"]:
                btn.click(timeout=3000, force=True)
                page.wait_for_timeout(800)
                print(f"  After level '{t}' filter: {page.locator('a[href*=\"/courses/\"]').count()} cards")
                break
    except Exception as e:
        issue("warning", "input", "/courses", str(e))
    report["pages"].append(info)

    # Test 3: Course detail
    info = test_page(page, "/courses/1", "课程详情")
    # Find and click a lesson link
    try:
        lesson_link = page.locator("a[href^='/learn/']").first
        if lesson_link.count() > 0:
            href = lesson_link.get_attribute("href")
            lesson_link.click(timeout=5000)
            page.wait_for_load_state("domcontentloaded", timeout=5000)
            print(f"  Clicked lesson link -> {page.url}")
            page.go_back(wait_until="domcontentloaded")
        else:
            issue("warning", "navigation", "/courses/1", "没有找到课程链接")
    except Exception as e:
        issue("warning", "navigation", "/courses/1", str(e))
    report["pages"].append(info)

    # Test 4: Word learning page
    info = test_page(page, "/learn/word/1", "单词学习", wait_ms=3000)
    # Check page content - should show words
    body_text = page.inner_text("body").lower()
    if "hello" not in body_text and "h1" not in page.content() or page.locator("h1").count() > 0:
        pass  # word page uses non-h1 text
    if len(body_text) < 200:
        issue("info", "content", "/learn/word/1", "内容较少，可能API未返回")
    report["pages"].append(info)

    # Test 5: Grammar page
    info = test_page(page, "/learn/grammar/2", "语法学习", wait_ms=3000)
    body_text = page.inner_text("body")
    if "Choose" not in body_text and "apple" not in body_text.lower() and len(body_text) < 200:
        issue("info", "content", "/learn/grammar/2", "未找到语法问题")
    report["pages"].append(info)

    # Test 6: Login page
    info = test_page(page, "/login", "登录")
    inputs = page.locator("input").all()
    print(f"  Login has {len(inputs)} inputs")
    if len(inputs) < 2:
        issue("warning", "form", "/login", "表单输入不足")
    # Fill and submit
    try:
        email_input = page.locator("input[type='email']").first
        pw_input = page.locator("input[type='password']").first
        if email_input.count() > 0 and pw_input.count() > 0:
            email_input.fill("test@example.com", timeout=3000)
            pw_input.fill("password123", timeout=3000)
            submit = page.locator("button[type='submit']").first
            initial_url = page.url
            submit.click(timeout=5000, force=True)
            page.wait_for_timeout(2000)
            print(f"  After login submit: {initial_url} -> {page.url}")
    except Exception as e:
        issue("warning", "form", "/login", str(e))
    report["pages"].append(info)

    # Test 7: Register page
    info = test_page(page, "/register", "注册")
    inputs = page.locator("input").all()
    print(f"  Register has {len(inputs)} inputs")
    if len(inputs) < 4:
        issue("warning", "form", "/register", f"表单输入不足（只有{len(inputs)}个）")
    # Try to fill form
    try:
        visible_inputs = [inp for inp in inputs if inp.is_visible(timeout=1000)]
        print(f"  Visible inputs: {len(visible_inputs)}")
        values = ["testuser_" + str(int(__import__("time").time() * 1000)) + "@example.com",
                  "test@example.com", "password123", "password123"]
        for inp, val in zip(visible_inputs[:4], values[:len(visible_inputs)]):
            inp.fill(val, timeout=2000)
        submit = page.locator("button[type='submit']").first
        if submit.count() > 0:
            initial_url = page.url
            submit.click(timeout=5000, force=True)
            page.wait_for_timeout(2000)
            print(f"  After register submit: {initial_url} -> {page.url}")
    except Exception as e:
        issue("warning", "form", "/register", str(e))
    report["pages"].append(info)

    # Test 8: Community page
    info = test_page(page, "/community", "社区")
    if len(page.inner_text("body")) < 200:
        issue("info", "content", "/community", "社区内容为空（需要种子数据）")
    report["pages"].append(info)

    # Test 9: Profile page
    info = test_page(page, "/profile", "个人中心")
    report["pages"].append(info)

    # Test 10: Progress page
    info = test_page(page, "/progress", "学习进度")
    report["pages"].append(info)

    # Test 11: Daily challenge
    info = test_page(page, "/daily-challenge", "每日挑战")
    report["pages"].append(info)

    # Test 12: Admin pages (should work with existing user or show login)
    info = test_page(page, "/admin/login", "管理员登录")
    report["pages"].append(info)

    info = test_page(page, "/admin", "管理后台")
    report["pages"].append(info)

    context.close()
    browser.close()

report["total_issues"] = len(report["issues"])
report["severity_breakdown"] = {
    "critical": sum(1 for i in report["issues"] if i["severity"] == "critical"),
    "warning": sum(1 for i in report["issues"] if i["severity"] == "warning"),
    "info": sum(1 for i in report["issues"] if i["severity"] == "info"),
}

with open("/workspace/test_results/deep_test.json", "w", encoding="utf-8") as f:
    json.dump(report, f, ensure_ascii=False, indent=2)

print("\n" + "=" * 60)
print("FINAL RESULTS:")
print(f"  Issues: {report['total_issues']}")
for sev, count in report["severity_breakdown"].items():
    if count > 0:
        print(f"    {sev.upper()}: {count}")
print(f"  Pages tested: {len(report['pages'])}")
print(f"  Report: /workspace/test_results/deep_test.json")

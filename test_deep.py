"""LinguaLearn — Deep interaction test to find actual bugs."""
import json
from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout

BASE = "http://localhost:3000"
OUT = "/workspace/test_results/deep_test_report.md"

issues = []

def log_issue(severity, category, page_url, description, suggestion=""):
    issues.append({
        "severity": severity,
        "category": category,
        "page": page_url,
        "description": description,
        "suggestion": suggestion,
    })
    print(f"  [{severity}][{category}] {page_url}: {description[:100]}")

def safe_screenshot(page, name):
    try:
        page.screenshot(path=f"/workspace/test_results/{name}.png", full_page=True)
    except Exception:
        pass

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            executable_path="/root/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome",
            args=["--no-sandbox", "--disable-dev-shm-usage"],
        )
        context = browser.new_context(viewport={"width": 1280, "height": 800})

        # ------------------------------------------------------------------
        # TEST 1: Home page hero — does CTA button navigate?
        # ------------------------------------------------------------------
        print("\n=== TEST 1: Home page CTA ===")
        page = context.new_page()
        page.on("pageerror", lambda e: log_issue("critical", "pageerror", "/", str(e)[:150]))
        page.goto(f"{BASE}/", wait_until="domcontentloaded")
        page.wait_for_timeout(2000)

        # Find all buttons and links
        initial_url = page.url

        # Check if there are visible buttons/CTAs
        all_buttons = page.locator("button, a").all()
        interactive_count = 0
        for btn in all_buttons:
            try:
                if btn.is_visible():
                    interactive_count += 1
            except Exception:
                pass

        # Try clicking first big button — look for CTA-like buttons
        cta_buttons = []
        for btn in page.locator("button").all():
            try:
                if btn.is_visible():
                    text = (btn.inner_text() or "").strip()
                    if text:
                        cta_buttons.append((btn, text))
            except Exception:
                pass

        print(f"  Found {interactive_count} interactive elements, {len(cta_buttons)} text buttons")

        # Check "开始学习" CTA
        for btn, text in cta_buttons:
            if "开始" in text or "学习" in text or "注册" in text:
                print(f"  Testing button: '{text}'")
                try:
                    btn.click(timeout=3000, force=True)
                    page.wait_for_timeout(1500)
                    new_url = page.url
                    if new_url == initial_url:
                        log_issue("warning", "button", "/", f"按钮 '{text}' 点击后未跳转 (URL未变)",
                                 "确认按钮有正确的 onClick/router.push 或用 Link 包裹")
                    else:
                        print(f"    ✓ Navigated to: {new_url}")
                        # Go back
                        page.go_back(wait_until="domcontentloaded")
                        page.wait_for_timeout(1000)
                except Exception as e:
                    log_issue("warning", "button", "/", f"按钮 '{text}' 点击失败: {e}", "")
        safe_screenshot(page, "home_page")

        # ------------------------------------------------------------------
        # TEST 2: Courses page — search + language filter + level filter
        # ------------------------------------------------------------------
        print("\n=== TEST 2: Courses page interactions ===")
        page.goto(f"{BASE}/courses", wait_until="domcontentloaded")
        page.wait_for_timeout(2000)

        # Get initial course card count
        initial_cards = page.locator("a[href*='/courses/']").count()
        print(f"  Initial course cards: {initial_cards}")

        # Test language filter buttons
        lang_buttons = []
        for btn in page.locator("button").all():
            try:
                if btn.is_visible():
                    text = (btn.inner_text() or "").strip()
                    if text and len(text) < 30:
                        lang_buttons.append((btn, text))
            except Exception:
                pass

        print(f"  Found {len(lang_buttons)} language filter buttons")
        for btn, text in lang_buttons[:6]:
            try:
                before = page.url
                btn.click(timeout=3000, force=True)
                page.wait_for_timeout(1000)
                after = page.url
                # Check URL didn't change unexpectedly and page still has content
                try:
                    cards_after = page.locator("a[href*='/courses/']").count()
                    print(f"    '{text}' — cards before/after: {initial_cards}/{cards_after}")
                except Exception:
                    pass
            except Exception as e:
                log_issue("warning", "button", "/courses", f"语言筛选 '{text}' 失败: {e}", "")

        # Test search input
        search_inputs = page.locator("input[type='text']").all() + page.locator("input").all()
        search_box = None
        for inp in search_inputs:
            try:
                if inp.is_visible():
                    search_box = inp
                    break
            except Exception:
                pass

        if search_box:
            try:
                search_box.fill("英语", timeout=3000)
                page.wait_for_timeout(1500)
                search_count = page.locator("a[href*='/courses/']").count()
                print(f"  After search '英语': {search_count} cards")
                search_box.fill("", timeout=3000)
                search_box.fill("xyz不存在的关键词", timeout=3000)
                page.wait_for_timeout(1500)
                search_after = page.locator("a[href*='/courses/']").count()
                print(f"  After search '不存在': {search_after} cards")
            except Exception as e:
                log_issue("warning", "input", "/courses", f"搜索框交互失败: {e}",
                         "检查 search 框的 onChange 处理器是否正确绑定")
        else:
            log_issue("warning", "input", "/courses", "找不到可见的搜索输入框",
                     "检查搜索 input 的 CSS 选择器或可见性")

        safe_screenshot(page, "courses_page")

        # ------------------------------------------------------------------
        # TEST 3: Course detail page
        # ------------------------------------------------------------------
        print("\n=== TEST 3: Course detail page ===")
        page.goto(f"{BASE}/courses/1", wait_until="domcontentloaded")
        page.wait_for_timeout(2000)

        # Check for CTA button and try to click
        for btn in page.locator("button").all():
            try:
                if btn.is_visible():
                    text = (btn.inner_text() or "").strip()
                    if text:
                        before_url = page.url
                        btn.click(timeout=3000, force=True)
                        page.wait_for_timeout(1500)
                        after_url = page.url
                        print(f"  Button '{text[:20]}': {before_url} -> {after_url}")
                        if before_url == after_url:
                            log_issue("info", "button", "/courses/1",
                                     f"按钮 '{text[:30]}' 点击后无跳转/状态变化", "")
                        page.go_back(wait_until="domcontentloaded")
                        page.wait_for_timeout(1000)
            except Exception:
                pass

        # Test accordion summaries
        summaries = page.locator("summary").all()
        for i, s in enumerate(summaries):
            try:
                s.click(timeout=3000, force=True)
                page.wait_for_timeout(500)
            except Exception:
                pass
        print(f"  Tested {len(summaries)} accordion sections")

        # Test lesson link navigation
        lesson_links = page.locator("a[href^='/learn/']").all()
        if lesson_links:
            try:
                lesson_links[0].click(timeout=3000)
                page.wait_for_load_state("domcontentloaded", timeout=5000)
                print(f"  Lesson nav -> {page.url}")
                page.go_back(wait_until="domcontentloaded")
            except Exception as e:
                log_issue("warning", "navigation", "/courses/1", f"课程导航失败: {e}", "")

        safe_screenshot(page, "course_detail")

        # ------------------------------------------------------------------
        # TEST 4: Learn pages — interactive elements
        # ------------------------------------------------------------------
        for lesson_type in ["word", "grammar", "listening", "speaking"]:
            print(f"\n=== TEST 4: Learn/{lesson_type} ===")
            page.goto(f"{BASE}/learn/{lesson_type}/1", wait_until="domcontentloaded")
            page.wait_for_timeout(2000)
            safe_screenshot(page, f"learn_{lesson_type}")

            # Count buttons and click them all
            btns = page.locator("button").all()
            print(f"  Buttons on page: {len(btns)}")
            for i, b in enumerate(btns):
                try:
                    if b.is_visible():
                        text = (b.inner_text() or "").strip()
                        b.click(timeout=3000, force=True)
                        page.wait_for_timeout(500)
                        # Check console hasn't exploded
                except Exception as e:
                    log_issue("info", "button", f"/learn/{lesson_type}/1",
                             f"button {i} failed: {str(e)[:80]}", "")

            # Check inputs
            inputs = page.locator("input, textarea").all()
            for inp in inputs:
                try:
                    if inp.is_visible():
                        inp.fill("test", timeout=3000)
                        page.wait_for_timeout(500)
                except Exception:
                    pass

        # ------------------------------------------------------------------
        # TEST 5: Login form
        # ------------------------------------------------------------------
        print("\n=== TEST 5: Login form ===")
        page.goto(f"{BASE}/login", wait_until="domcontentloaded")
        page.wait_for_timeout(2000)

        # Fill invalid data and submit
        email_input = page.locator("input[type='email']").first
        pw_input = page.locator("input[type='password']").first
        submit_btn = page.locator("button[type='submit']").first

        if email_input.count() > 0 and pw_input.count() > 0:
            email_input.fill("invalid-email", timeout=3000)
            pw_input.fill("short", timeout=3000)
            try:
                submit_btn.click(timeout=3000, force=True)
                page.wait_for_timeout(2000)
                print("  Submitted invalid login form")
                # Check for error messages
                page_text = page.inner_text("body").lower()
                if any(k in page_text for k in ["error", "错误", "fail", "invalid", "required"]):
                    print("  ✓ Error feedback found")
            except Exception as e:
                log_issue("warning", "form", "/login", f"登录表单提交失败: {e}", "")

        safe_screenshot(page, "login_page")

        # Test with valid-format data (but non-existent user)
        page.goto(f"{BASE}/login", wait_until="domcontentloaded")
        page.wait_for_timeout(1500)
        email_input = page.locator("input[type='email']").first
        pw_input = page.locator("input[type='password']").first
        submit_btn = page.locator("button[type='submit']").first
        if email_input.count() > 0 and pw_input.count() > 0:
            email_input.fill("test@example.com", timeout=3000)
            pw_input.fill("password123", timeout=3000)
            try:
                before_url = page.url
                submit_btn.click(timeout=3000, force=True)
                page.wait_for_timeout(2000)
                # After failed login, should stay or show error
                print(f"  After valid-format submit: {before_url} -> {page.url}")
            except Exception as e:
                log_issue("warning", "form", "/login", f"登录提交: {e}", "")

        # ------------------------------------------------------------------
        # TEST 6: Register form
        # ------------------------------------------------------------------
        print("\n=== TEST 6: Register form ===")
        page.goto(f"{BASE}/register", wait_until="domcontentloaded")
        page.wait_for_timeout(2000)

        inputs = page.locator("input").all()
        visible_inputs = [i for i in inputs if i.is_visible()]
        print(f"  Visible inputs: {len(visible_inputs)}")

        # Fill valid data
        data = ["testuser_123", "test@example.com", "password123", "password123"]
        for inp, val in zip(visible_inputs[:4], data):
            inp.fill(val, timeout=3000)

        submit_btn = page.locator("button[type='submit']").first
        if submit_btn.count() > 0:
            try:
                before_url = page.url
                submit_btn.click(timeout=3000, force=True)
                page.wait_for_timeout(3000)
                print(f"  After register submit: {before_url} -> {page.url}")
            except Exception as e:
                log_issue("warning", "form", "/register", f"注册提交失败: {e}", "")

        safe_screenshot(page, "register_page")

        # ------------------------------------------------------------------
        # TEST 7: Check all page titles / content
        # ------------------------------------------------------------------
        print("\n=== TEST 7: All pages content check ===")
        all_routes = [
            ("/", "首页"),
            ("/courses", "课程列表"),
            ("/courses/1", "课程详情"),
            ("/learn/word/1", "单词学习"),
            ("/learn/grammar/1", "语法学习"),
            ("/learn/listening/1", "听力学习"),
            ("/learn/speaking/1", "口语学习"),
            ("/login", "登录"),
            ("/register", "注册"),
            ("/profile", "个人中心"),
            ("/progress", "学习进度"),
            ("/community", "社区"),
            ("/daily-challenge", "每日挑战"),
            ("/admin/login", "管理员登录"),
            ("/admin", "管理后台"),
        ]

        for route, title in all_routes:
            try:
                page.goto(f"{BASE}{route}", wait_until="domcontentloaded", timeout=8000)
                page.wait_for_timeout(1500)
                h1_text = page.inner_text("h1") if page.locator("h1").count() > 0 else ""
                page_title = page.title()
                body_len = len(page.inner_text("body"))
                print(f"  {route:25s} title='{page_title[:40]}' h1='{h1_text[:40]}' body={body_len} chars")

                if body_len < 100 and route not in ["/admin"]:
                    log_issue("warning", "content", route,
                             f"页面内容过短 (仅 {body_len} 字符)",
                             "确认数据获取/渲染逻辑是否正常")

            except PWTimeout:
                log_issue("critical", "navigation", route, "页面加载超时",
                         "检查服务器/路由/数据获取")
            except Exception as e:
                log_issue("critical", "navigation", route, f"加载失败: {e}", "")

        # ------------------------------------------------------------------
        # FINAL: Capture home page final state
        # ------------------------------------------------------------------
        page.goto(f"{BASE}/", wait_until="domcontentloaded")
        page.wait_for_timeout(1500)
        safe_screenshot(page, "home_final")

        context.close()
        browser.close()


if __name__ == "__main__":
    run()
    # Write report
    by_severity = {"critical": 0, "warning": 0, "info": 0}
    for i in issues:
        by_severity[i["severity"]] = by_severity.get(i["severity"], 0) + 1

    lines = []
    lines.append(f"# LinguaLearn — 深度功能测试报告\n")
    lines.append(f"- **总问题数**: {len(issues)}")
    lines.append(f"- 🔴 Critical: {by_severity.get('critical', 0)}")
    lines.append(f"- 🟡 Warning: {by_severity.get('warning', 0)}")
    lines.append(f"- 🔵 Info: {by_severity.get('info', 0)}\n")

    for sev in ["critical", "warning", "info"]:
        items = [i for i in issues if i["severity"] == sev]
        if not items:
            continue
        label = {"critical": "## 🔴 Critical", "warning": "## 🟡 Warning", "info": "## 🔵 Info"}[sev]
        lines.append(f"{label} ({len(items)}项)\n")
        for it in items:
            lines.append(f"### `{it['page']}` — {it['category']}\n")
            lines.append(f"{it['description']}\n")
            if it["suggestion"]:
                lines.append(f"**建议**: {it['suggestion']}\n")
            lines.append("")

    with open(OUT, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"\n=== RESULTS ===")
    print(f"Total issues: {len(issues)}")
    print(f"  Critical: {by_severity.get('critical', 0)}")
    print(f"  Warning:  {by_severity.get('warning', 0)}")
    print(f"  Info:     {by_severity.get('info', 0)}")
    print(f"Report: {OUT}")

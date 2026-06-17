"""
LinguaLearn — Comprehensive Functional Test Suite
Tests every page, button, search box, form, and navigation element.
"""

import json
import os
import re
import sys
import time
import traceback
from dataclasses import dataclass, field, asdict
from datetime import datetime
from typing import List, Dict, Optional

from playwright.sync_api import (
    sync_playwright,
    Page,
    Browser,
    BrowserContext,
    TimeoutError as PlaywrightTimeoutError,
)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
BASE_URL = "http://localhost:3000"
RESULTS_DIR = "/workspace/test_results"
SCREENSHOT_DIR = os.path.join(RESULTS_DIR, "screenshots")
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

TIMEOUT_SHORT = 5000
TIMEOUT_NORMAL = 10000
TIMEOUT_LONG = 15000


# ---------------------------------------------------------------------------
# Test result types
# ---------------------------------------------------------------------------
@dataclass
class Issue:
    severity: str           # "critical" | "warning" | "info"
    category: str           # e.g. "navigation", "button", "form", "console-error"
    page: str
    description: str
    suggestion: str = ""

    def to_dict(self):
        return {
            "severity": self.severity,
            "category": self.category,
            "page": self.page,
            "description": self.description,
            "suggestion": self.suggestion,
        }


class PageTestResult:
    def __init__(self, url: str, title: str, status: str = "passed"):
        self.url = url
        self.title = title
        self.status = status
        self.http_status: Optional[int] = None
        self.buttons_clicked: int = 0
        self.buttons_total: int = 0
        self.inputs_tested: int = 0
        self.links_clicked: int = 0
        self.console_errors: List[Dict] = []
        self.console_warnings: List[str] = []
        self.issues: List[Issue] = []
        self.duration_ms: int = 0
        self.screenshot: str = ""


@dataclass
class TestReport:
    started_at: str = ""
    finished_at: str = ""
    total_pages_tested: int = 0
    total_pages_passed: int = 0
    total_pages_failed: int = 0
    total_issues: int = 0
    critical_issues: int = 0
    pages: List[PageTestResult] = field(default_factory=list)
    all_issues: List[Issue] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def slugify(url: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", url.lower()).strip("_") or "index"


def take_screenshot(page: Page, name: str) -> str:
    path = os.path.join(SCREENSHOT_DIR, f"{name}.png")
    try:
        page.screenshot(path=path, full_page=True)
        return f"screenshots/{name}.png"
    except Exception as e:
        return f"failed: {e}"


def safe_click(page: Page, selector: str, name: str, result: PageTestResult) -> bool:
    """Attempt to click an element; record failure as issue but don't crash."""
    try:
        loc = page.locator(selector).first
        loc.click(timeout=TIMEOUT_SHORT, force=True)
        return True
    except Exception as e:
        result.issues.append(Issue(
            severity="warning",
            category="button",
            page=result.url,
            description=f"Cannot click '{name}' ({selector}): {e}",
            suggestion=f"Verify selector or ensure element is visible/interactive. Check for blocking overlays or z-index issues.",
        ))
        return False


# ---------------------------------------------------------------------------
# Core test functions
# ---------------------------------------------------------------------------
class Tester:
    def __init__(self, page: Page, report: TestReport):
        self.page = page
        self.report = report

    # ------------------------------------------------------------------
    def test_page(self, url: str, title: str) -> PageTestResult:
        result = PageTestResult(url=url, title=title)
        start = time.time()

        # Capture console
        errors: List[Dict] = []
        warnings_list: List[str] = []

        def on_console(msg):
            txt = msg.text
            if msg.type == "error":
                # Filter dev-only noise
                if any(k in txt.lower() for k in ["vite", "hmr", "strictmode", "webpack-hmr"]):
                    return
                errors.append({"text": txt[:200], "location": msg.location})
            elif msg.type == "warning":
                warnings_list.append(txt[:200])

        self.page.on("console", on_console)
        self.page.on("pageerror", lambda exc: errors.append({"type": "page-error", "text": str(exc)[:300]}))

        # Navigate
        try:
            resp = self.page.goto(f"{BASE_URL}{url}", wait_until="domcontentloaded", timeout=TIMEOUT_LONG)
            result.http_status = resp.status if resp else 0
        except PlaywrightTimeoutError:
            result.http_status = 0
            result.status = "failed"
            result.issues.append(Issue(
                severity="critical",
                category="navigation",
                page=url,
                description="Page failed to load within timeout",
                suggestion="Check server is running and route exists in Next.js app router.",
            ))
            result.screenshot = take_screenshot(self.page, f"fail_{slugify(url)}")
            result.duration_ms = int((time.time() - start) * 1000)
            return result

        try:
            self.page.wait_for_load_state("networkidle", timeout=TIMEOUT_LONG)
        except PlaywrightTimeoutError:
            pass

        # Record console issues
        result.console_errors = errors[:20]
        result.console_warnings = warnings_list[:10]
        for err in errors[:5]:
            result.issues.append(Issue(
                severity="warning" if "warning" in str(err).lower() else "critical",
                category="console-error",
                page=url,
                description=f"Console error: {err.get('text', str(err))[:200]}",
                suggestion="Check JS bundle integrity, fix React errors, inspect network calls.",
            ))

        # 500/404 detection
        if result.http_status and result.http_status >= 400:
            result.status = "failed"
            result.issues.append(Issue(
                severity="critical",
                category="http",
                page=url,
                description=f"HTTP {result.http_status}",
                suggestion="Route not found or server error.",
            ))
        else:
            result.status = "passed"

        result.screenshot = take_screenshot(self.page, f"ok_{slugify(url)}")
        result.duration_ms = int((time.time() - start) * 1000)
        return result

    # ------------------------------------------------------------------
    def test_buttons(self, result: PageTestResult, buttons: List[tuple]) -> None:
        """buttons: list of (selector, friendly_name, expected_after_state)."""
        result.buttons_total = len(buttons)
        for selector, name, _check in buttons:
            try:
                loc = self.page.locator(selector).first
                if not loc.is_visible(timeout=TIMEOUT_SHORT):
                    result.issues.append(Issue(
                        severity="warning",
                        category="button",
                        page=result.url,
                        description=f"Button '{name}' not visible",
                        suggestion="Verify button appears on page; may be behind an auth gate.",
                    ))
                    continue
                loc.click(timeout=TIMEOUT_SHORT, force=True)
                result.buttons_clicked += 1
                if _check:
                    _check(self.page, result, name)
            except Exception as e:
                result.issues.append(Issue(
                    severity="warning",
                    category="button",
                    page=result.url,
                    description=f"Cannot click button '{name}' ({selector}): {e}",
                    suggestion="Ensure button exists, is not disabled, and has no blocking overlay.",
                ))

    # ------------------------------------------------------------------
    def test_inputs(self, result: PageTestResult, inputs: List[tuple]) -> None:
        """inputs: list of (selector, friendly_name, sample_value)."""
        for selector, name, sample in inputs:
            try:
                loc = self.page.locator(selector).first
                if not loc.is_visible(timeout=TIMEOUT_SHORT):
                    result.issues.append(Issue(
                        severity="warning",
                        category="input",
                        page=result.url,
                        description=f"Input '{name}' not visible",
                        suggestion="Check input selector and visibility.",
                    ))
                    continue
                loc.fill(sample, timeout=TIMEOUT_SHORT)
                value = loc.input_value() if loc.evaluate("el => el.tagName") != "TEXTAREA" else loc.evaluate("el => el.value")
                result.inputs_tested += 1
            except Exception as e:
                result.issues.append(Issue(
                    severity="warning",
                    category="input",
                    page=result.url,
                    description=f"Cannot interact with input '{name}' ({selector}): {e}",
                    suggestion="Check that input is not read-only and selector is correct.",
                ))

    # ------------------------------------------------------------------
    def test_links(self, result: PageTestResult, links: List[tuple], test_navigation: bool = True) -> None:
        """links: list of (selector, friendly_name). Navigate; go back."""
        for selector, name in links:
            try:
                loc = self.page.locator(selector).first
                if not loc.is_visible(timeout=TIMEOUT_SHORT):
                    continue
                # Navigate
                current_url = self.page.url
                loc.click(timeout=TIMEOUT_SHORT)
                try:
                    self.page.wait_for_load_state("domcontentloaded", timeout=TIMEOUT_NORMAL)
                except PlaywrightTimeoutError:
                    pass
                new_url = self.page.url
                if test_navigation and new_url == current_url and "#" not in (loc.get_attribute("href") or ""):
                    result.issues.append(Issue(
                        severity="warning",
                        category="navigation",
                        page=result.url,
                        description=f"Link '{name}' did not change URL (was: {current_url})",
                        suggestion="Verify href is correct and not `#`.",
                    ))
                result.links_clicked += 1
                # Return
                self.page.go_back(wait_until="domcontentloaded", timeout=TIMEOUT_NORMAL)
            except Exception as e:
                result.issues.append(Issue(
                    severity="info",
                    category="navigation",
                    page=result.url,
                    description=f"Link '{name}' ({selector}) navigation issue: {e}",
                    suggestion="Likely go_back failed after deep navigation; not critical.",
                ))


# ---------------------------------------------------------------------------
# Individual page test routines
# ---------------------------------------------------------------------------
def run_all_tests():
    report = TestReport(started_at=datetime.now().isoformat())

    with sync_playwright() as p:
        browser: Browser = p.chromium.launch(
            headless=True,
            executable_path="/root/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome",
            args=["--no-sandbox", "--disable-dev-shm-usage"],
        )
        context: BrowserContext = browser.new_context(
            viewport={"width": 1280, "height": 800},
            ignore_https_errors=True,
        )
        page: Page = context.new_page()
        page.set_default_timeout(TIMEOUT_NORMAL)

        t = Tester(page, report)

        # ===========================================================
        # 1. HOME PAGE (/)
        # ===========================================================
        print("\n=== Testing HOME / ===")
        r = t.test_page("/", "首页")

        # Test hero buttons — they depend on auth state
        try:
            # Find any primary button (CTA)
            hero_buttons = page.locator("button").filter(has=page.locator("text=学习")).all() + \
                           page.locator("button").filter(has=page.locator("text=注册")).all()
            # Scroll indicator
            if page.locator("button[aria-label='向下滚动']").count() > 0:
                try:
                    page.locator("button[aria-label='向下滚动']").first.click(timeout=TIMEOUT_SHORT, force=True)
                    r.buttons_clicked += 1
                except Exception:
                    pass
            r.buttons_total += 2
        except Exception:
            pass

        # Click language cards (links to /courses?lang=...)
        try:
            cards = page.locator("a").all()
            if len(cards) > 0:
                # Just click the first course-like link
                for c in cards:
                    href = c.get_attribute("href") or ""
                    if "courses" in href:
                        try:
                            c.click(timeout=TIMEOUT_SHORT, force=True)
                            page.wait_for_load_state("domcontentloaded", timeout=TIMEOUT_NORMAL)
                            r.links_clicked += 1
                            page.go_back(wait_until="domcontentloaded", timeout=TIMEOUT_NORMAL)
                            break
                        except Exception:
                            pass
        except Exception:
            pass

        # Count buttons that exist and test them
        try:
            all_buttons = page.locator("button, a").all()
            r.buttons_total = len(all_buttons)
        except Exception:
            pass

        report.pages.append(r)

        # ===========================================================
        # 2. COURSES LIST (/courses)
        # ===========================================================
        print("=== Testing COURSES /courses ===")
        r = t.test_page("/courses", "课程列表")

        # Test language filter buttons
        try:
            lang_buttons = page.locator("button").all()
            r.buttons_total = len(lang_buttons)
            # Click first language button (not "全部")
            for btn in lang_buttons[:6]:
                try:
                    btn.click(timeout=TIMEOUT_SHORT, force=True)
                    page.wait_for_timeout(200)
                    r.buttons_clicked += 1
                except Exception:
                    pass
        except Exception as e:
            r.issues.append(Issue("warning", "button", "/courses", f"Language filter buttons error: {e}", ""))

        # Test level filter buttons
        try:
            # Find level buttons (A1, A2, etc.) — smaller buttons
            for lvl in ["A1", "A2", "B1"]:
                loc = page.locator(f"button:has-text('{lvl}')").first
                if loc.count() > 0 and loc.is_visible(timeout=TIMEOUT_SHORT):
                    try:
                        loc.click(timeout=TIMEOUT_SHORT, force=True)
                        page.wait_for_timeout(200)
                        r.buttons_clicked += 1
                    except Exception:
                        pass
        except Exception:
            pass

        # Test search input
        try:
            search_input = page.locator("input[placeholder*='搜索'], input[type='text']").first
            if search_input.count() > 0:
                search_input.fill("英语", timeout=TIMEOUT_SHORT)
                page.wait_for_timeout(500)
                # Clear
                search_input.fill("", timeout=TIMEOUT_SHORT)
                search_input.fill("test", timeout=TIMEOUT_SHORT)
                r.inputs_tested += 1
        except Exception as e:
            r.issues.append(Issue(
                severity="critical",
                category="input",
                page="/courses",
                description=f"Search input not working: {e}",
                suggestion="Check search input has proper onChange handler and is not read-only/disabled.",
            ))

        # Test course card navigation
        try:
            first_course = page.locator("a[href^='/courses/']").first
            if first_course.count() > 0:
                first_course.click(timeout=TIMEOUT_SHORT)
                page.wait_for_load_state("domcontentloaded", timeout=TIMEOUT_NORMAL)
                r.links_clicked += 1
                page.go_back(wait_until="domcontentloaded", timeout=TIMEOUT_NORMAL)
        except Exception as e:
            r.issues.append(Issue("warning", "navigation", "/courses", f"Course card navigation failed: {e}", ""))

        report.pages.append(r)

        # ===========================================================
        # 3. COURSE DETAIL (/courses/1)
        # ===========================================================
        print("=== Testing COURSE DETAIL /courses/1 ===")
        r = t.test_page("/courses/1", "课程详情")

        # Test back link
        try:
            page.locator("a").filter(has_text="返回").first.click(timeout=TIMEOUT_SHORT, force=True)
            page.wait_for_load_state("domcontentloaded", timeout=TIMEOUT_NORMAL)
            r.links_clicked += 1
            # Go back to course detail
            page.goto(f"{BASE_URL}/courses/1", wait_until="domcontentloaded", timeout=TIMEOUT_NORMAL)
        except Exception:
            pass

        # Test accordions
        try:
            summaries = page.locator("summary").all()
            r.buttons_total = len(summaries)
            for i, s in enumerate(summaries[:3]):
                try:
                    s.click(timeout=TIMEOUT_SHORT, force=True)
                    page.wait_for_timeout(200)
                    r.buttons_clicked += 1
                except Exception:
                    pass
        except Exception:
            pass

        # Test lesson links
        try:
            lesson_links = page.locator("a[href^='/learn/']").all()
            if lesson_links:
                lesson_links[0].click(timeout=TIMEOUT_SHORT)
                page.wait_for_load_state("domcontentloaded", timeout=TIMEOUT_NORMAL)
                r.links_clicked += 1
                page.go_back(wait_until="domcontentloaded", timeout=TIMEOUT_NORMAL)
        except Exception:
            pass

        # Test CTA button
        try:
            cta_btn = page.locator("button").filter(has=page.locator("svg")).all()
            for b in cta_btn[:2]:
                try:
                    # Check if it's a link wrapping a button — it would navigate
                    b.click(timeout=TIMEOUT_SHORT, force=True)
                    r.buttons_clicked += 1
                    page.go_back(wait_until="domcontentloaded", timeout=TIMEOUT_NORMAL)
                    break
                except Exception:
                    pass
        except Exception:
            pass

        report.pages.append(r)

        # ===========================================================
        # 4. LEARN PAGES (word, grammar, listening, speaking)
        # ===========================================================
        for lesson_type in ["word", "grammar", "listening", "speaking"]:
            print(f"=== Testing LEARN /learn/{lesson_type}/1 ===")
            r = t.test_page(f"/learn/{lesson_type}/1", f"{lesson_type}课程")
            # Test buttons on the page
            try:
                btns = page.locator("button").all()
                r.buttons_total = len(btns)
                for b in btns:
                    try:
                        b.click(timeout=TIMEOUT_SHORT, force=True)
                        page.wait_for_timeout(200)
                        r.buttons_clicked += 1
                    except Exception:
                        pass
            except Exception:
                pass
            # Test any inputs
            try:
                inputs = page.locator("input").all()
                for inp in inputs:
                    try:
                        if inp.is_visible(timeout=TIMEOUT_SHORT):
                            inp.fill("test input", timeout=TIMEOUT_SHORT)
                            r.inputs_tested += 1
                    except Exception:
                        pass
            except Exception:
                pass
            report.pages.append(r)

        # ===========================================================
        # 5. LOGIN PAGE
        # ===========================================================
        print("=== Testing LOGIN /login ===")
        r = t.test_page("/login", "登录页")

        # Test email input
        try:
            email_input = page.locator("input[type='email']").first
            if email_input.count() > 0:
                email_input.fill("test@example.com", timeout=TIMEOUT_SHORT)
                r.inputs_tested += 1
        except Exception as e:
            r.issues.append(Issue("critical", "input", "/login", f"Email input failed: {e}", "Check input type and visibility."))

        # Test password input + show/hide toggle
        try:
            pw_input = page.locator("input[type='password']").first
            if pw_input.count() > 0:
                pw_input.fill("password123", timeout=TIMEOUT_SHORT)
                r.inputs_tested += 1
                # Find show/hide button (the non-submit button near password)
                toggle_btn = page.locator("button").nth(0)
                if toggle_btn.count() > 0 and "登录" not in toggle_btn.text_content(timeout=TIMEOUT_SHORT) or "":
                    try:
                        toggle_btn.click(timeout=TIMEOUT_SHORT, force=True)
                        r.buttons_clicked += 1
                    except Exception:
                        pass
        except Exception as e:
            r.issues.append(Issue("critical", "input", "/login", f"Password input failed: {e}", ""))

        # Test checkbox
        try:
            cb = page.locator("input[type='checkbox']").first
            if cb.count() > 0:
                cb.check(timeout=TIMEOUT_SHORT, force=True)
                r.buttons_clicked += 1
        except Exception:
            pass

        # Test form submit (will fail since user doesn't exist, that's expected)
        try:
            submit = page.locator("button[type='submit']").first
            if submit.count() > 0:
                submit.click(timeout=TIMEOUT_SHORT, force=True)
                page.wait_for_timeout(1000)
                r.buttons_clicked += 1
                r.buttons_total += 1
        except Exception as e:
            r.issues.append(Issue("warning", "form", "/login", f"Form submit failed: {e}", ""))

        report.pages.append(r)

        # ===========================================================
        # 6. REGISTER PAGE
        # ===========================================================
        print("=== Testing REGISTER /register ===")
        r = t.test_page("/register", "注册页")

        # Test username input
        try:
            inputs = page.locator("input").all()
            r.buttons_total = len(page.locator("button").all())
            values = ["testuser", "test@example.com", "password123", "password123"]
            for inp, val in zip(inputs[:4], values):
                try:
                    if inp.is_visible(timeout=TIMEOUT_SHORT):
                        inp.fill(val, timeout=TIMEOUT_SHORT)
                        r.inputs_tested += 1
                except Exception:
                    pass
        except Exception as e:
            r.issues.append(Issue("warning", "input", "/register", f"Inputs error: {e}", ""))

        # Test form submit
        try:
            submit = page.locator("button[type='submit']").first
            if submit.count() > 0:
                submit.click(timeout=TIMEOUT_SHORT, force=True)
                page.wait_for_timeout(1000)
                r.buttons_clicked += 1
        except Exception as e:
            r.issues.append(Issue("warning", "form", "/register", f"Submit failed: {e}", ""))

        report.pages.append(r)

        # ===========================================================
        # 7. PROFILE PAGE (may redirect to login since not authenticated)
        # ===========================================================
        print("=== Testing PROFILE /profile ===")
        r = t.test_page("/profile", "个人中心")
        try:
            btns = page.locator("button").all()
            r.buttons_total = len(btns)
            for b in btns:
                try:
                    b.click(timeout=TIMEOUT_SHORT, force=True)
                    r.buttons_clicked += 1
                except Exception:
                    pass
        except Exception:
            pass
        report.pages.append(r)

        # ===========================================================
        # 8. PROGRESS PAGE
        # ===========================================================
        print("=== Testing PROGRESS /progress ===")
        r = t.test_page("/progress", "学习进度")
        try:
            btns = page.locator("button").all()
            r.buttons_total = len(btns)
            for b in btns:
                try:
                    b.click(timeout=TIMEOUT_SHORT, force=True)
                    r.buttons_clicked += 1
                except Exception:
                    pass
        except Exception:
            pass
        report.pages.append(r)

        # ===========================================================
        # 9. COMMUNITY PAGE
        # ===========================================================
        print("=== Testing COMMUNITY /community ===")
        r = t.test_page("/community", "社区")
        try:
            btns = page.locator("button").all()
            r.buttons_total = len(btns)
            for b in btns:
                try:
                    b.click(timeout=TIMEOUT_SHORT, force=True)
                    r.buttons_clicked += 1
                except Exception:
                    pass
            # Test input (post creation)
            try:
                post_input = page.locator("textarea, input[type='text']").first
                if post_input.count() > 0 and post_input.is_visible(timeout=TIMEOUT_SHORT):
                    post_input.fill("测试帖子内容", timeout=TIMEOUT_SHORT)
                    r.inputs_tested += 1
            except Exception:
                pass
        except Exception:
            pass
        report.pages.append(r)

        # ===========================================================
        # 10. DAILY CHALLENGE
        # ===========================================================
        print("=== Testing DAILY-CHALLENGE /daily-challenge ===")
        r = t.test_page("/daily-challenge", "每日挑战")
        try:
            btns = page.locator("button").all()
            r.buttons_total = len(btns)
            for b in btns:
                try:
                    b.click(timeout=TIMEOUT_SHORT, force=True)
                    r.buttons_clicked += 1
                except Exception:
                    pass
        except Exception:
            pass
        report.pages.append(r)

        # ===========================================================
        # 11. ADMIN LOGIN
        # ===========================================================
        print("=== Testing ADMIN LOGIN /admin/login ===")
        r = t.test_page("/admin/login", "管理员登录")
        try:
            inputs = page.locator("input").all()
            for inp in inputs:
                try:
                    if inp.is_visible(timeout=TIMEOUT_SHORT):
                        inp.fill("admin", timeout=TIMEOUT_SHORT)
                        r.inputs_tested += 1
                except Exception:
                    pass
            submit = page.locator("button[type='submit']").first
            if submit.count() > 0:
                submit.click(timeout=TIMEOUT_SHORT, force=True)
                page.wait_for_timeout(1000)
                r.buttons_clicked += 1
                r.buttons_total = r.buttons_total or 1
        except Exception as e:
            r.issues.append(Issue("warning", "form", "/admin/login", f"Admin login failed: {e}", ""))
        report.pages.append(r)

        # ===========================================================
        # 12. ADMIN PAGES (dashboard, users, courses, etc.)
        # ===========================================================
        for admin_path in ["/admin", "/admin/users", "/admin/courses", "/admin/languages", "/admin/badges", "/admin/community"]:
            print(f"=== Testing ADMIN {admin_path} ===")
            r = t.test_page(admin_path, f"admin-{admin_path}")
            # Just test basic load and button presence
            try:
                btns = page.locator("button").all()
                r.buttons_total = len(btns)
                for b in btns[:5]:
                    try:
                        b.click(timeout=TIMEOUT_SHORT, force=True)
                        r.buttons_clicked += 1
                    except Exception:
                        pass
            except Exception:
                pass
            report.pages.append(r)

        # ===========================================================
        # 13. SIDEBAR / MOBILE NAV LINKS (from home page)
        # ===========================================================
        print("=== Testing NAV LINKS ===")
        page.goto(f"{BASE_URL}/", wait_until="domcontentloaded", timeout=TIMEOUT_NORMAL)
        try:
            all_links = page.locator("a[href^='/']").all()
            tested = set()
            for link in all_links:
                href = link.get_attribute("href") or ""
                if href and href not in tested and "/" in href:
                    tested.add(href)
            print(f"  Found {len(tested)} unique internal links")
        except Exception:
            pass

        context.close()
        browser.close()

    report.finished_at = datetime.now().isoformat()

    # Aggregate totals
    report.total_pages_tested = len(report.pages)
    for pr in report.pages:
        report.all_issues.extend(pr.issues)
        if pr.status == "passed":
            report.total_pages_passed += 1
        else:
            report.total_pages_failed += 1
    report.total_issues = len(report.all_issues)
    report.critical_issues = sum(1 for i in report.all_issues if i.severity == "critical")

    return report


# ---------------------------------------------------------------------------
# Report generation
# ---------------------------------------------------------------------------
def save_report(report: TestReport):
    # JSON
    json_out = {
        "started_at": report.started_at,
        "finished_at": report.finished_at,
        "summary": {
            "total_pages_tested": report.total_pages_tested,
            "total_pages_passed": report.total_pages_passed,
            "total_pages_failed": report.total_pages_failed,
            "total_issues": report.total_issues,
            "critical_issues": report.critical_issues,
        },
        "pages": [
            {
                "url": pr.url,
                "title": pr.title,
                "status": pr.status,
                "http_status": pr.http_status,
                "buttons_clicked": pr.buttons_clicked,
                "buttons_total": pr.buttons_total,
                "inputs_tested": pr.inputs_tested,
                "links_clicked": pr.links_clicked,
                "duration_ms": pr.duration_ms,
                "console_errors": pr.console_errors,
                "issues": [i.to_dict() for i in pr.issues],
                "screenshot": pr.screenshot,
            }
            for pr in report.pages
        ],
        "all_issues": [i.to_dict() for i in report.all_issues],
    }

    json_path = os.path.join(RESULTS_DIR, "test_report.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(json_out, f, ensure_ascii=False, indent=2)

    # Markdown
    md_lines = []
    md_lines.append(f"# LinguaLearn — 功能测试报告\n")
    md_lines.append(f"- **测试开始**: {report.started_at}")
    md_lines.append(f"- **测试结束**: {report.finished_at}")
    md_lines.append(f"- **测试页面**: {report.total_pages_tested}")
    md_lines.append(f"- **通过**: {report.total_pages_passed}")
    md_lines.append(f"- **失败/部分失败**: {report.total_pages_failed}")
    md_lines.append(f"- **发现问题总数**: {report.total_issues}")
    md_lines.append(f"- **严重问题**: {report.critical_issues}\n")

    md_lines.append("## 总体问题概览\n")
    by_severity: Dict[str, List[Issue]] = {"critical": [], "warning": [], "info": []}
    for issue in report.all_issues:
        by_severity[issue.severity].append(issue)

    for sev in ["critical", "warning", "info"]:
        label = {"critical": "🔴 严重", "warning": "🟡 警告", "info": "🔵 信息"}[sev]
        items = by_severity[sev]
        if not items:
            continue
        md_lines.append(f"\n### {label} ({len(items)})\n")
        # Group by category
        by_cat: Dict[str, List[Issue]] = {}
        for it in items:
            by_cat.setdefault(it.category, []).append(it)
        for cat, cat_items in by_cat.items():
            md_lines.append(f"**{cat}** ({len(cat_items)}项)\n")
            for it in cat_items:
                md_lines.append(f"- `{it.page}` — {it.description}")
                if it.suggestion:
                    md_lines.append(f"  - 建议: {it.suggestion}")
        md_lines.append("")

    # Per-page detail
    md_lines.append("\n## 逐页测试详情\n")
    for pr in report.pages:
        emoji = "✅" if pr.status == "passed" and not pr.issues else ("⚠️" if pr.status == "passed" else "❌")
        md_lines.append(f"\n### {emoji} {pr.title} — `{pr.url}`\n")
        md_lines.append(f"- **HTTP状态**: {pr.http_status or 'N/A'}")
        md_lines.append(f"- **页面状态**: {pr.status}")
        md_lines.append(f"- **按钮点击**: {pr.buttons_clicked}/{pr.buttons_total}")
        md_lines.append(f"- **输入测试**: {pr.inputs_tested}")
        md_lines.append(f"- **链接导航**: {pr.links_clicked}")
        md_lines.append(f"- **耗时**: {pr.duration_ms}ms")
        if pr.console_errors:
            md_lines.append(f"- **Console错误数**: {len(pr.console_errors)}")
        if pr.screenshot:
            md_lines.append(f"- **截图**: {pr.screenshot}")
        if pr.issues:
            md_lines.append("\n**问题**:\n")
            for it in pr.issues:
                sev_icon = {"critical": "🔴", "warning": "🟡", "info": "🔵"}[it.severity]
                md_lines.append(f"{sev_icon} [{it.category}] {it.description}")
                if it.suggestion:
                    md_lines.append(f"   → {it.suggestion}")
        md_lines.append("")

    md_path = os.path.join(RESULTS_DIR, "test_report.md")
    with open(md_path, "w", encoding="utf-8") as f:
        f.write("\n".join(md_lines))

    print(f"\nJSON report: {json_path}")
    print(f"Markdown report: {md_path}")


if __name__ == "__main__":
    print(f"Starting tests against {BASE_URL} ...")
    report = run_all_tests()
    save_report(report)
    print(f"\n=== SUMMARY ===")
    print(f"Pages tested: {report.total_pages_tested}")
    print(f"Passed: {report.total_pages_passed}")
    print(f"Failed: {report.total_pages_failed}")
    print(f"Issues found: {report.total_issues} ({report.critical_issues} critical)")

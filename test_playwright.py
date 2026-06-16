"""
LinguaLearn - Comprehensive Playwright Functional Test
Tests all pages, navigation flows, and core features.
"""
import os, sys, json, time
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"
RESULTS = []
SCREENSHOTS_DIR = "/tmp/lingualearn_screenshots"
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

def add_result(test_name, status, detail=""):
    RESULTS.append({"test": test_name, "status": status, "detail": detail})

def screenshot(page, name):
    path = os.path.join(SCREENSHOTS_DIR, f"{name}.png")
    page.screenshot(path=path, full_page=True)
    return path

def run_tests():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1440, "height": 900},
            locale="zh-CN"
        )
        page = context.new_page()

        # Collect console errors
        console_errors = []
        page.on("console", lambda msg: console_errors.append(f"[{msg.type}] {msg.text}") if msg.type in ("error", "warning") else None)

        # ============================================================
        # 1. PUBLIC PAGES (no auth required)
        # ============================================================
        print("=" * 60)
        print("SECTION 1: Public Pages")
        print("=" * 60)

        # 1a. Homepage
        print("\n--- Homepage ---")
        try:
            page.goto(f"{BASE}/", wait_until="networkidle", timeout=15000)
            page.wait_for_timeout(1000)
            screenshot(page, "01_homepage")

            # Check title
            title = page.title()
            add_result("Homepage - Title exists", "PASS" if title else "FAIL", title)

            # Check for key elements
            has_nav = page.locator("nav, header, aside").count() > 0
            add_result("Homepage - Navigation present", "PASS" if has_nav else "FAIL")

            # Check for CTA / hero
            has_cta = page.locator("a[href*='courses'], a[href*='register'], a[href*='login'], button").count() > 0
            add_result("Homepage - CTA buttons present", "PASS" if has_cta else "FAIL")

            # Check language cards
            lang_cards = page.locator("a[href*='courses']").count()
            add_result("Homepage - Language/course links", "PASS" if lang_cards > 0 else "FAIL", f"Found {lang_cards} links")

            # Try clicking a CTA
            cta = page.locator("a[href*='courses']").first
            if cta.is_visible():
                cta_text = cta.text_content() or ""
                add_result("Homepage - CTA clickable", "PASS", f"Text: {cta_text[:50]}")
        except Exception as e:
            add_result("Homepage - Load", "FAIL", str(e)[:200])

        # 1b. Login page
        print("\n--- Login Page ---")
        try:
            page.goto(f"{BASE}/login", wait_until="networkidle", timeout=15000)
            page.wait_for_timeout(500)
            screenshot(page, "02_login")

            has_form = page.locator("form").count() > 0
            add_result("Login - Form present", "PASS" if has_form else "FAIL")

            has_email = page.locator("input[type='email'], input[name='email'], input[id*='email']").count() > 0
            add_result("Login - Email input", "PASS" if has_email else "FAIL")

            has_password = page.locator("input[type='password'], input[name='password'], input[id*='password']").count() > 0
            add_result("Login - Password input", "PASS" if has_password else "FAIL")

            has_submit = page.locator("button[type='submit'], button:has-text('Login'), button:has-text('登录'), button:has-text('Sign')").count() > 0
            add_result("Login - Submit button", "PASS" if has_submit else "FAIL")

            # Test register link
            reg_link = page.locator("a[href*='register']")
            if reg_link.count() > 0:
                add_result("Login - Register link", "PASS", reg_link.first.text_content() or "")
            else:
                add_result("Login - Register link", "FAIL", "No register link found")
        except Exception as e:
            add_result("Login - Load", "FAIL", str(e)[:200])

        # 1c. Register page
        print("\n--- Register Page ---")
        try:
            page.goto(f"{BASE}/register", wait_until="networkidle", timeout=15000)
            page.wait_for_timeout(500)
            screenshot(page, "03_register")

            has_form = page.locator("form").count() > 0
            add_result("Register - Form present", "PASS" if has_form else "FAIL")

            # Check login link
            login_link = page.locator("a[href*='login']")
            if login_link.count() > 0:
                add_result("Register - Login link", "PASS", login_link.first.text_content() or "")
            else:
                add_result("Register - Login link", "FAIL", "No login link found")
        except Exception as e:
            add_result("Register - Load", "FAIL", str(e)[:200])

        # ============================================================
        # 2. REGISTER & LOGIN FLOW
        # ============================================================
        print("\n" + "=" * 60)
        print("SECTION 2: Auth Flow")
        print("=" * 60)

        test_email = f"test_{int(time.time())}@test.com"
        test_password = "TestPass123!"
        test_username = f"Tester_{int(time.time())}"

        # 2a. Register a new user
        print("\n--- Register Flow ---")
        try:
            page.goto(f"{BASE}/register", wait_until="networkidle", timeout=15000)
            page.wait_for_timeout(500)

            # Fill form fields
            name_inputs = page.locator("input").all()
            add_result("Register - Input fields found", "PASS", f"Count: {len(name_inputs)}")

            # Try to fill the form
            for inp in name_inputs:
                placeholder = inp.get_attribute("placeholder") or inp.get_attribute("name") or inp.get_attribute("id") or ""
                try:
                    if "name" in placeholder.lower() or "username" in placeholder.lower() or "用户名" in placeholder:
                        inp.fill(test_username)
                    elif "email" in placeholder.lower() or "邮箱" in placeholder:
                        inp.fill(test_email)
                    elif "password" in placeholder.lower() or "密码" in placeholder:
                        inp.fill(test_password)
                except:
                    pass

            # If no placeholders matched, try sequential fill
            if len(name_inputs) >= 3:
                try:
                    if not name_inputs[0].input_value():
                        name_inputs[0].fill(test_username)
                    if not name_inputs[1].input_value():
                        name_inputs[1].fill(test_email)
                    if not name_inputs[2].input_value():
                        name_inputs[2].fill(test_password)
                except:
                    pass

            screenshot(page, "04_register_filled")

            # Submit form
            submit_btn = page.locator("button[type='submit'], button:has-text('Register'), button:has-text('注册'), button:has-text('Sign up'), button:has-text('Create')").first
            if submit_btn.is_visible():
                submit_btn.click()
                page.wait_for_timeout(3000)
                screenshot(page, "05_after_register")

                # Check if redirected (login or dashboard)
                current_url = page.url
                add_result("Register - Submit & redirect", "PASS" if "register" not in current_url.lower() or current_url != f"{BASE}/register" else "NEEDS CHECK", current_url)
            else:
                add_result("Register - Submit button not found", "FAIL")
        except Exception as e:
            add_result("Register - Flow error", "FAIL", str(e)[:200])

        # 2b. Login flow (if not already logged in from register)
        print("\n--- Login Flow ---")
        try:
            page.goto(f"{BASE}/login", wait_until="networkidle", timeout=15000)
            page.wait_for_timeout(500)

            login_inputs = page.locator("input").all()
            for inp in login_inputs:
                placeholder = inp.get_attribute("placeholder") or inp.get_attribute("name") or inp.get_attribute("id") or ""
                try:
                    if "email" in placeholder.lower() or "邮箱" in placeholder:
                        inp.fill(test_email)
                    elif "password" in placeholder.lower() or "密码" in placeholder:
                        inp.fill(test_password)
                except:
                    pass

            screenshot(page, "06_login_filled")

            login_btn = page.locator("button[type='submit'], button:has-text('Login'), button:has-text('登录'), button:has-text('Sign in')").first
            if login_btn.is_visible():
                login_btn.click()
                page.wait_for_timeout(3000)
                screenshot(page, "07_after_login")

                current_url = page.url
                add_result("Login - Submit & redirect", "PASS" if "login" not in current_url.lower() else "NEEDS CHECK", current_url)
            else:
                add_result("Login - Submit button not found", "FAIL")
        except Exception as e:
            add_result("Login - Flow error", "FAIL", str(e)[:200])

        # ============================================================
        # 3. AUTHENTICATED PAGES
        # ============================================================
        print("\n" + "=" * 60)
        print("SECTION 3: Authenticated Pages")
        print("=" * 60)

        # 3a. Courses list
        print("\n--- Courses List ---")
        try:
            page.goto(f"{BASE}/courses", wait_until="networkidle", timeout=15000)
            page.wait_for_timeout(1000)
            screenshot(page, "08_courses")

            # Check course cards
            course_links = page.locator("a[href*='/courses/']").count()
            add_result("Courses - Course cards/links", "PASS" if course_links > 0 else "FAIL", f"Found {course_links}")

            has_title = page.locator("h1, h2").first.text_content() if page.locator("h1, h2").count() > 0 else ""
            add_result("Courses - Page heading", "PASS" if has_title else "FAIL", has_title[:80])

            # Try filter/language pills if present
            pills = page.locator("button:has-text('English'), button:has-text('French'), button:has-text('Spanish'), button:has-text('German'), button:has-text('Russian'), button:has-text('全部'), button:has-text('All')")
            if pills.count() > 0:
                # Click first language filter
                pills.first.click()
                page.wait_for_timeout(1000)
                add_result("Courses - Language filter works", "PASS", f"Clicked: {pills.first.text_content()}")
            else:
                add_result("Courses - Language filter", "NEEDS CHECK", "No filter pills found")
        except Exception as e:
            add_result("Courses - Load error", "FAIL", str(e)[:200])

        # 3b. Course Detail page (click first course)
        print("\n--- Course Detail ---")
        try:
            page.goto(f"{BASE}/courses", wait_until="networkidle", timeout=15000)
            page.wait_for_timeout(500)

            first_course = page.locator("a[href*='/courses/']").first
            if first_course.is_visible():
                course_href = first_course.get_attribute("href")
                first_course.click()
                page.wait_for_timeout(2000)
                screenshot(page, "09_course_detail")

                add_result("Course Detail - Navigation works", "PASS", f"Navigated to: {page.url}")

                # Check for unit/section accordion or list
                has_units = page.locator("[class*='unit'], [class*='accordion'], [class*='section']").count() > 0
                add_result("Course Detail - Units visible", "PASS" if has_units else "NEEDS CHECK")

                # Check for lesson cards
                lesson_elements = page.locator("a[href*='learn']").count()
                add_result("Course Detail - Lesson links", "PASS" if lesson_elements > 0 else "FAIL", f"Found {lesson_elements}")
            else:
                add_result("Course Detail - No course to click", "FAIL")
        except Exception as e:
            add_result("Course Detail - Error", "FAIL", str(e)[:200])

        # 3c. Learning Modules
        print("\n--- Learning Modules ---")
        # Navigate to course detail first to find a lesson link
        try:
            page.goto(f"{BASE}/courses", wait_until="networkidle", timeout=15000)
            page.wait_for_timeout(500)

            # Click into first available course
            course_link = page.locator("a[href*='/courses/']").first
            course_link.click()
            page.wait_for_timeout(2000)

            # Find a word lesson
            word_lesson = page.locator("a[href*='learn/word']").first
            if word_lesson.count() > 0:
                word_lesson.click()
                page.wait_for_timeout(2000)
                screenshot(page, "10_word_lesson")

                has_card = page.locator("[class*='card'], [class*='flip']").count() > 0
                add_result("Word Lesson - Loaded & card visible", "PASS" if has_card else "NEEDS CHECK")
            else:
                add_result("Word Lesson - No word lesson found", "NEEDS CHECK")

            # Find a grammar lesson
            page.go_back()
            page.wait_for_timeout(1000)
            grammar_lesson = page.locator("a[href*='learn/grammar']").first
            if grammar_lesson.count() > 0:
                grammar_lesson.click()
                page.wait_for_timeout(2000)
                screenshot(page, "11_grammar_lesson")

                has_options = page.locator("button[class*='option'], [class*='choice'], [class*='answer']").count() > 0
                add_result("Grammar Lesson - Options present", "PASS" if has_options else "NEEDS CHECK")
            else:
                add_result("Grammar Lesson - No grammar lesson found", "NEEDS CHECK")

            # Find a listening lesson
            page.go_back()
            page.wait_for_timeout(1000)
            listening_lesson = page.locator("a[href*='learn/listening']").first
            if listening_lesson.count() > 0:
                listening_lesson.click()
                page.wait_for_timeout(2000)
                screenshot(page, "12_listening_lesson")
                add_result("Listening Lesson - Loaded", "PASS")
            else:
                add_result("Listening Lesson - No listening lesson found", "NEEDS CHECK")

            # Find a speaking lesson
            page.go_back()
            page.wait_for_timeout(1000)
            speaking_lesson = page.locator("a[href*='learn/speaking']").first
            if speaking_lesson.count() > 0:
                speaking_lesson.click()
                page.wait_for_timeout(2000)
                screenshot(page, "13_speaking_lesson")
                add_result("Speaking Lesson - Loaded", "PASS")
            else:
                add_result("Speaking Lesson - No speaking lesson found", "NEEDS CHECK")
        except Exception as e:
            add_result("Learning Modules - Error", "FAIL", str(e)[:200])

        # 3d. Daily Challenge
        print("\n--- Daily Challenge ---")
        try:
            page.goto(f"{BASE}/daily-challenge", wait_until="networkidle", timeout=15000)
            page.wait_for_timeout(1000)
            screenshot(page, "14_daily_challenge")

            has_content = page.locator("h1, h2, h3").count() > 0
            headings = [page.locator("h1, h2, h3").nth(i).text_content() for i in range(min(3, page.locator("h1, h2, h3").count()))]
            add_result("Daily Challenge - Content loaded", "PASS" if has_content else "FAIL", str(headings)[:100])

            # Check for start button or timer
            has_action = page.locator("button:has-text('Start'), button:has-text('开始'), button:has-text('Challenge')").count() > 0
            add_result("Daily Challenge - Action button", "PASS" if has_action else "NEEDS CHECK")
        except Exception as e:
            add_result("Daily Challenge - Error", "FAIL", str(e)[:200])

        # 3e. Progress page
        print("\n--- Progress Page ---")
        try:
            page.goto(f"{BASE}/progress", wait_until="networkidle", timeout=15000)
            page.wait_for_timeout(1500)
            screenshot(page, "15_progress")

            has_charts = page.locator("[class*='recharts'], svg, canvas").count() > 0
            add_result("Progress - Charts/visuals", "PASS" if has_charts else "NEEDS CHECK", f"Found {has_charts} chart elements")

            has_stats = page.locator("[class*='stat'], [class*='xp'], [class*='streak']").count() > 0
            add_result("Progress - Stats visible", "PASS" if has_stats else "NEEDS CHECK")
        except Exception as e:
            add_result("Progress - Error", "FAIL", str(e)[:200])

        # 3f. Community page
        print("\n--- Community Page ---")
        try:
            page.goto(f"{BASE}/community", wait_until="networkidle", timeout=15000)
            page.wait_for_timeout(1000)
            screenshot(page, "16_community")

            has_posts = page.locator("[class*='post'], [class*='card']").count() > 0
            add_result("Community - Posts/content", "PASS" if has_posts else "NEEDS CHECK")

            has_tabs = page.locator("button[role='tab'], [class*='tab']").count() > 0
            add_result("Community - Tab navigation", "PASS" if has_tabs else "NEEDS CHECK")

            has_leaderboard = page.locator("[class*='leaderboard'], [class*='rank']").count() > 0
            add_result("Community - Leaderboard section", "PASS" if has_leaderboard else "NEEDS CHECK")
        except Exception as e:
            add_result("Community - Error", "FAIL", str(e)[:200])

        # 3g. Profile page
        print("\n--- Profile Page ---")
        try:
            page.goto(f"{BASE}/profile", wait_until="networkidle", timeout=15000)
            page.wait_for_timeout(1000)
            screenshot(page, "17_profile")

            has_avatar = page.locator("[class*='avatar'], img[alt*='vatar'], [class*='profile']").count() > 0
            add_result("Profile - Avatar section", "PASS" if has_avatar else "NEEDS CHECK")

            has_settings = page.locator("[class*='setting'], button:has-text('Save'), button:has-text('保存')").count() > 0
            add_result("Profile - Settings section", "PASS" if has_settings else "NEEDS CHECK")
        except Exception as e:
            add_result("Profile - Error", "FAIL", str(e)[:200])

        # ============================================================
        # 4. NAVIGATION & RESPONSIVENESS
        # ============================================================
        print("\n" + "=" * 60)
        print("SECTION 4: Navigation & Responsive")
        print("=" * 60)

        # 4a. Sidebar navigation
        print("\n--- Sidebar Navigation ---")
        try:
            page.goto(f"{BASE}/", wait_until="networkidle", timeout=15000)
            page.wait_for_timeout(500)

            nav_links = page.locator("nav a, aside a, [class*='sidebar'] a, [class*='nav'] a").all()
            nav_texts = []
            for link in nav_links[:15]:
                try:
                    txt = link.text_content()
                    if txt and txt.strip():
                        nav_texts.append(txt.strip()[:30])
                except:
                    pass
            add_result("Navigation - Sidebar links found", "PASS" if nav_links else "NEEDS CHECK", f"Links: {nav_texts[:10]}")
        except Exception as e:
            add_result("Navigation - Error", "FAIL", str(e)[:200])

        # 4b. Mobile viewport test
        print("\n--- Mobile Responsive ---")
        try:
            mobile_page = context.new_page()
            mobile_page.set_viewport_size({"width": 390, "height": 844})
            mobile_page.goto(f"{BASE}/", wait_until="networkidle", timeout=15000)
            mobile_page.wait_for_timeout(1000)
            screenshot(mobile_page, "18_mobile_home")

            has_mobile_nav = mobile_page.locator("[class*='mobile'], [class*='bottom'], [class*='hamburger'], button[aria-label*='menu']").count() > 0
            add_result("Mobile - Navigation adapts", "PASS" if has_mobile_nav else "NEEDS CHECK")

            # Check no horizontal overflow
            body_width = mobile_page.evaluate("document.body.scrollWidth")
            viewport_width = mobile_page.evaluate("window.innerWidth")
            add_result("Mobile - No horizontal overflow", "PASS" if body_width <= viewport_width + 10 else "FAIL", f"Body: {body_width}, Viewport: {viewport_width}")

            mobile_page.close()
        except Exception as e:
            add_result("Mobile - Error", "FAIL", str(e)[:200])

        # ============================================================
        # 5. PERFORMANCE & ERRORS
        # ============================================================
        print("\n" + "=" * 60)
        print("SECTION 5: Console Errors & Warnings")
        print("=" * 60)

        # Collect unique errors
        unique_errors = list(set([e for e in console_errors if "[error]" in e.lower()]))
        unique_warnings = list(set([e for e in console_errors if "[warning]" in e.lower()]))

        add_result("Console - Total errors", "PASS" if len(unique_errors) == 0 else "FAIL", f"Count: {len(unique_errors)}")
        for err in unique_errors[:10]:
            add_result(f"Console Error: {err[:120]}", "ERROR", "")

        add_result("Console - Total warnings", "INFO", f"Count: {len(unique_warnings)}")
        for warn in unique_warnings[:5]:
            if "404" not in warn and "audio" not in warn.lower():
                add_result(f"Console Warning: {warn[:120]}", "WARN", "")

        # Page nav timing
        print("\n--- Page Load Performance ---")
        for url_name, url_path in [
            ("Homepage", "/"),
            ("Courses", "/courses"),
            ("Progress", "/progress"),
            ("Community", "/community"),
            ("Daily Challenge", "/daily-challenge"),
            ("Profile", "/profile"),
        ]:
            try:
                start = time.time()
                page.goto(f"{BASE}{url_path}", wait_until="networkidle", timeout=15000)
                elapsed = time.time() - start
                status = "PASS" if elapsed < 5 else "SLOW"
                add_result(f"Perf - {url_name} load time", status, f"{elapsed:.2f}s")
            except Exception as e:
                add_result(f"Perf - {url_name} load", "FAIL", str(e)[:100])

        browser.close()

    # ============================================================
    # GENERATE REPORT
    # ============================================================
    passed = sum(1 for r in RESULTS if r["status"] == "PASS")
    failed = sum(1 for r in RESULTS if r["status"] == "FAIL")
    needs_check = sum(1 for r in RESULTS if r["status"] == "NEEDS CHECK")
    total = len(RESULTS)

    report = []
    report.append("# LinguaLearn - Playwright 功能测试报告\n")
    report.append(f"**测试时间**: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    report.append(f"**测试总数**: {total} | **通过**: {passed} | **失败**: {failed} | **需检查**: {needs_check}")
    report.append(f"**通过率**: {passed/total*100:.1f}%\n")

    report.append("---\n")
    report.append("## 详细测试结果\n")
    for r in RESULTS:
        icon = "✅" if r["status"] == "PASS" else ("❌" if r["status"] == "FAIL" else "⚠️")
        detail = f" — {r['detail']}" if r["detail"] else ""
        report.append(f"- {icon} **{r['test']}**{detail}\n")

    report.append("\n---\n")
    report.append("## 截屏文件\n")
    for f in sorted(os.listdir(SCREENSHOTS_DIR)):
        if f.endswith(".png"):
            report.append(f"- `/tmp/lingualearn_screenshots/{f}`\n")

    report_content = "".join(report)

    # Save report
    report_path = "/workspace/.trae/documents/playwright-test-report.md"
    os.makedirs(os.path.dirname(report_path), exist_ok=True)
    with open(report_path, "w") as f:
        f.write(report_content)

    print(report_content)
    print(f"\nReport saved to: {report_path}")

    # Print summary
    print("\n" + "=" * 60)
    print(f"SUMMARY: {passed}/{total} PASS ({passed/total*100:.1f}%)")
    print(f"Screenshots: {SCREENSHOTS_DIR}")
    return RESULTS


if __name__ == "__main__":
    run_tests()
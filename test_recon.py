"""Reconnaissance: discover all interactive elements on every page."""
from playwright.sync_api import sync_playwright

PAGES = [
    ('/', 'Home'),
    ('/login', 'Login'),
    ('/register', 'Register'),
    ('/courses', 'Courses'),
    ('/courses/1', 'Course Detail'),
    ('/learn/word/1', 'Word Learning'),
    ('/learn/grammar/2', 'Grammar Learning'),
    ('/learn/listening/3', 'Listening'),
    ('/learn/speaking/4', 'Speaking'),
    ('/daily-challenge', 'Daily Challenge'),
    ('/progress', 'Progress'),
    ('/community', 'Community'),
    ('/profile', 'Profile'),
]

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1440, 'height': 900})
    
    # Collect console errors
    console_errors = []
    page.on('console', lambda msg: console_errors.append(f"[{msg.type}] {msg.text}") if msg.type in ('error', 'warning') else None)
    page.on('pageerror', lambda err: console_errors.append(f"[PAGE ERROR] {err.message}"))
    
    for path, name in PAGES:
        print(f"\n{'='*60}")
        print(f"PAGE: {name} ({path})")
        print(f"{'='*60}")
        
        try:
            page.goto(f'http://localhost:3000{path}', timeout=15000)
            page.wait_for_load_state('networkidle', timeout=15000)
            page.wait_for_timeout(2000)
        except Exception as e:
            print(f"  NAVIGATION ERROR: {e}")
            page.screenshot(path=f'/tmp/recon_{name.replace(" ", "_")}.png')
            continue
        
        # Take screenshot
        page.screenshot(path=f'/tmp/recon_{name.replace(" ", "_")}.png', full_page=True)
        
        # Discover all buttons
        buttons = page.locator('button').all()
        print(f"  BUTTONS ({len(buttons)}):")
        for i, btn in enumerate(buttons):
            try:
                text = btn.inner_text(timeout=1000).strip()[:80]
                visible = btn.is_visible()
                enabled = btn.is_enabled()
                print(f"    [{i}] visible={visible} enabled={enabled} text='{text}'")
            except:
                print(f"    [{i}] (could not read)")
        
        # Discover all links
        links = page.locator('a[href]').all()
        print(f"  LINKS ({len(links)}):")
        for i, link in enumerate(links):
            try:
                text = link.inner_text(timeout=1000).strip()[:60]
                href = link.get_attribute('href') or ''
                print(f"    [{i}] href='{href}' text='{text}'")
            except:
                print(f"    [{i}] (could not read)")
        
        # Discover all inputs
        inputs = page.locator('input').all()
        print(f"  INPUTS ({len(inputs)}):")
        for i, inp in enumerate(inputs):
            try:
                name = inp.get_attribute('name') or ''
                itype = inp.get_attribute('type') or ''
                placeholder = inp.get_attribute('placeholder') or ''
                print(f"    [{i}] type='{itype}' name='{name}' placeholder='{placeholder}'")
            except:
                print(f"    [{i}] (could not read)")
        
        # Discover all interactive elements
        clickable = page.locator('button, a, input[type="submit"], [role="button"], [onclick]').all()
        print(f"  TOTAL CLICKABLE: {len(clickable)}")
        
        # Check for error states in DOM
        error_count = page.locator('[class*="error"], [class*="Error"]').count()
        if error_count:
            print(f"  ⚠ ERROR CLASSES FOUND: {error_count}")
    
    # Print console errors summary
    if console_errors:
        print(f"\n{'='*60}")
        print(f"CONSOLE ERRORS/WARNINGS: {len(console_errors)}")
        print(f"{'='*60}")
        for err in console_errors[:30]:
            print(f"  {err[:200]}")
    
    browser.close()
    print("\n\nRECONNAISSANCE COMPLETE")
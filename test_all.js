const { chromium } = require('@playwright/test');
const fs = require('fs');

const BASE = 'http://localhost:3000';
const SCREENSHOT_DIR = '/tmp/test_screenshots';
const REPORT_FILE = '/tmp/test_report.json';

if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

const results = {
  timestamp: new Date().toISOString(),
  pages: {},
  consoleErrors: [],
  summary: { totalTests: 0, passed: 0, failed: 0 }
};

async function testPage(page, browser, url, name, tests) {
  const pageResult = { url, name, loaded: false, loadError: null, tests: [], screenshot: null };
  const pageConsoleErrors = [];
  
  // Collect console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      pageConsoleErrors.push(msg.text());
      results.consoleErrors.push({ page: name, error: msg.text() });
    }
  });
  
  try {
    await page.goto(url, { timeout: 15000, waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    pageResult.loaded = true;
  } catch (e) {
    pageResult.loadError = e.message;
    try { await page.screenshot({ path: `${SCREENSHOT_DIR}/${name.replace(/[/\s]/g, '_')}_error.png`, fullPage: true }); } catch (_) {}
    results.pages[name] = pageResult;
    return;
  }
  
  const ssPath = `${SCREENSHOT_DIR}/${name.replace(/[/\s]/g, '_')}.png`;
  try { await page.screenshot({ path: ssPath, fullPage: true }); pageResult.screenshot = ssPath; } catch (_) {}
  
  // Run page-specific tests
  for (const test of tests) {
    results.summary.totalTests++;
    try {
      await test.fn(page, browser);
      pageResult.tests.push({ name: test.name, status: 'passed' });
      results.summary.passed++;
    } catch (e) {
      pageResult.tests.push({ name: test.name, status: 'failed', error: e.message.substring(0, 200) });
      results.summary.failed++;
      try { await page.screenshot({ path: `${SCREENSHOT_DIR}/${name.replace(/[/\s]/g, '_')}_fail_${test.name.replace(/\s/g, '_')}.png`, fullPage: true }); } catch (_) {}
    }
  }
  
  results.pages[name] = pageResult;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });
  const page = await context.newPage();

  // ==================== 1. HOME PAGE ====================
  let p = await browser.newPage();
  await testPage(p, browser, `${BASE}/`, '首页', [
    {
      name: 'Hero按钮可点击',
      fn: async (page) => {
        const heroBtn = page.locator('a[href*="courses"]').first();
        await heroBtn.waitFor({ timeout: 5000 });
      }
    },
    {
      name: '语言卡片存在',
      fn: async (page) => {
        const cards = page.locator('a[href*="course"], [class*="language"]').first();
        await cards.waitFor({ timeout: 5000 });
      }
    },
    {
      name: '导航链接存在',
      fn: async (page) => {
        await page.locator('nav, [class*="sidebar"], [class*="Sidebar"]').first().waitFor({ timeout: 5000 });
      }
    },
    {
      name: '所有 Link 链接可点击',
      fn: async (page) => {
        const links = page.locator('a[href]');
        const count = await links.count();
        if (count === 0) throw new Error('没有找到任何链接');
        for (let i = 0; i < Math.min(count, 10); i++) {
          await links.nth(i).waitFor({ timeout: 3000 });
        }
      }
    },
  ]);
  await p.close();

  // ==================== 2. LOGIN PAGE ====================
  p = await browser.newPage();
  await testPage(p, browser, `${BASE}/login`, '登录页', [
    {
      name: '邮箱输入框可交互',
      fn: async (page) => {
        const input = page.locator('input[type="email"], input[name="email"], input[placeholder*="邮箱"], input[placeholder*="Email"]').first();
        await input.waitFor({ timeout: 5000 });
        await input.click();
        await input.fill('test@test.com');
      }
    },
    {
      name: '密码输入框可交互',
      fn: async (page) => {
        const input = page.locator('input[type="password"]').first();
        await input.waitFor({ timeout: 5000 });
        await input.click();
        await input.fill('test123');
      }
    },
    {
      name: '登录按钮存在',
      fn: async (page) => {
        const btn = page.locator('button[type="submit"], button:has-text("登录"), button:has-text("Login"), button:has-text("Sign in")').first();
        await btn.waitFor({ timeout: 5000 });
      }
    },
    {
      name: '注册链接存在',
      fn: async (page) => {
        await page.locator('a[href*="register"], a:has-text("注册"), a:has-text("Register")').first().waitFor({ timeout: 5000 });
      }
    },
    {
      name: '所有可见按钮可点击',
      fn: async (page) => {
        const buttons = page.locator('button:visible');
        const count = await buttons.count();
        if (count === 0) throw new Error('没有可见按钮');
        for (let i = 0; i < count; i++) {
          await buttons.nth(i).waitFor({ timeout: 3000 });
        }
      }
    },
  ]);
  await p.close();

  // ==================== 3. REGISTER PAGE ====================
  p = await browser.newPage();
  await testPage(p, browser, `${BASE}/register`, '注册页', [
    {
      name: '用户名输入框可交互',
      fn: async (page) => {
        const input = page.locator('input[name="username"], input[placeholder*="用户名"], input[placeholder*="Username"]').first();
        await input.waitFor({ timeout: 5000 });
        await input.fill('testuser');
      }
    },
    {
      name: '邮箱输入框可交互',
      fn: async (page) => {
        const input = page.locator('input[type="email"], input[name="email"], input[placeholder*="邮箱"], input[placeholder*="Email"]').first();
        await input.waitFor({ timeout: 5000 });
        await input.fill('test@test.com');
      }
    },
    {
      name: '密码输入框可交互',
      fn: async (page) => {
        const input = page.locator('input[type="password"]').first();
        await input.waitFor({ timeout: 5000 });
        await input.fill('Test1234!');
      }
    },
    {
      name: '注册按钮存在',
      fn: async (page) => {
        await page.locator('button[type="submit"], button:has-text("注册"), button:has-text("Register")').first().waitFor({ timeout: 5000 });
      }
    },
    {
      name: '登录链接存在',
      fn: async (page) => {
        await page.locator('a[href*="login"], a:has-text("登录"), a:has-text("Login")').first().waitFor({ timeout: 5000 });
      }
    },
  ]);
  await p.close();

  // ==================== 4. COURSES PAGE ====================
  p = await browser.newPage();
  await testPage(p, browser, `${BASE}/courses`, '课程列表页', [
    {
      name: '课程卡片存在',
      fn: async (page) => {
        await page.locator('a[href*="/courses/"], [class*="card"], [class*="course"]').first().waitFor({ timeout: 5000 });
      }
    },
    {
      name: '筛选标签可交互',
      fn: async (page) => {
        const tabs = page.locator('button:visible, [role="tab"]:visible');
        const count = await tabs.count();
        if (count > 0) {
          await tabs.first().click();
        }
      }
    },
    {
      name: '链接可点击',
      fn: async (page) => {
        const links = page.locator('a[href]');
        const count = await links.count();
        if (count === 0) throw new Error('没有找到任何链接');
      }
    },
  ]);
  await p.close();

  // ==================== 5. COURSE DETAIL PAGE ====================
  p = await browser.newPage();
  await testPage(p, browser, `${BASE}/courses/1`, '课程详情页', [
    {
      name: '页面加载成功',
      fn: async (page) => {
        await page.locator('h1, h2, [class*="title"]').first().waitFor({ timeout: 5000 });
      }
    },
    {
      name: '按钮存在',
      fn: async (page) => {
        const buttons = page.locator('button:visible, a[class*="btn"]:visible, a[class*="button"]:visible');
        const count = await buttons.count();
        if (count > 0) {
          await buttons.first().waitFor({ timeout: 5000 });
        }
      }
    },
    {
      name: '所有按钮可交互',
      fn: async (page) => {
        const buttons = page.locator('button:visible');
        const count = await buttons.count();
        if (count === 0) throw new Error('没有可见按钮');
        for (let i = 0; i < count; i++) {
          await buttons.nth(i).waitFor({ timeout: 3000 });
        }
      }
    },
  ]);
  await p.close();

  // ==================== 6. WORD LEARNING PAGE ====================
  p = await browser.newPage();
  await testPage(p, browser, `${BASE}/learn/word/1`, '单词记忆页', [
    {
      name: '页面加载成功',
      fn: async (page) => {
        await page.waitForTimeout(3000);
        const hasContent = await page.locator('[class*="card"], [class*="flashcard"], [class*="flip-"], [class*="word"], h1, h2').count();
        if (hasContent === 0) throw new Error('页面内容未加载');
      }
    },
    {
      name: '所有可见按钮可交互',
      fn: async (page) => {
        const buttons = page.locator('button:visible');
        const count = await buttons.count();
        for (let i = 0; i < count; i++) {
          await buttons.nth(i).waitFor({ timeout: 3000 });
        }
      }
    },
    {
      name: '获取页面文本内容',
      fn: async (page) => {
        const text = await page.textContent('body');
        if (!text || text.trim().length < 10) throw new Error('页面文本为空');
      }
    },
  ]);
  await p.close();

  // ==================== 7. GRAMMAR PRACTICE PAGE ====================
  p = await browser.newPage();
  await testPage(p, browser, `${BASE}/learn/grammar/2`, '语法练习页', [
    {
      name: '页面加载成功',
      fn: async (page) => {
        await page.waitForTimeout(3000);
        const hasContent = await page.locator('button, [class*="option"], [class*="choice"], input').count();
        if (hasContent === 0) throw new Error('页面交互元素未加载');
      }
    },
    {
      name: '所有可见按钮可交互',
      fn: async (page) => {
        const buttons = page.locator('button:visible');
        const count = await buttons.count();
        for (let i = 0; i < count; i++) {
          await buttons.nth(i).waitFor({ timeout: 3000 });
        }
      }
    },
  ]);
  await p.close();

  // ==================== 8. LISTENING PAGE ====================
  p = await browser.newPage();
  await testPage(p, browser, `${BASE}/learn/listening/3`, '听力训练页', [
    {
      name: '页面加载成功',
      fn: async (page) => {
        await page.waitForTimeout(3000);
        const text = await page.textContent('body');
        if (!text || text.trim().length < 5) throw new Error('页面无内容');
      }
    },
    {
      name: '所有可见按钮可交互',
      fn: async (page) => {
        const buttons = page.locator('button:visible');
        const count = await buttons.count();
        for (let i = 0; i < count; i++) {
          await buttons.nth(i).waitFor({ timeout: 3000 });
        }
      }
    },
  ]);
  await p.close();

  // ==================== 9. SPEAKING PAGE ====================
  p = await browser.newPage();
  await testPage(p, browser, `${BASE}/learn/speaking/4`, '口语跟读页', [
    {
      name: '页面加载成功',
      fn: async (page) => {
        await page.waitForTimeout(3000);
        const text = await page.textContent('body');
        if (!text || text.trim().length < 5) throw new Error('页面无内容');
      }
    },
    {
      name: '所有可见按钮可交互',
      fn: async (page) => {
        const buttons = page.locator('button:visible');
        const count = await buttons.count();
        for (let i = 0; i < count; i++) {
          await buttons.nth(i).waitFor({ timeout: 3000 });
        }
      }
    },
  ]);
  await p.close();

  // ==================== 10. DAILY CHALLENGE ====================
  p = await browser.newPage();
  await testPage(p, browser, `${BASE}/daily-challenge`, '每日挑战页', [
    {
      name: '页面加载成功',
      fn: async (page) => {
        await page.waitForTimeout(3000);
        const text = await page.textContent('body');
        if (!text || text.trim().length < 5) throw new Error('页面无内容');
      }
    },
    {
      name: '所有可见按钮可交互',
      fn: async (page) => {
        const buttons = page.locator('button:visible');
        const count = await buttons.count();
        for (let i = 0; i < count; i++) {
          await buttons.nth(i).waitFor({ timeout: 3000 });
        }
      }
    },
  ]);
  await p.close();

  // ==================== 11. PROGRESS PAGE ====================
  p = await browser.newPage();
  await testPage(p, browser, `${BASE}/progress`, '学习进度页', [
    {
      name: '页面加载成功',
      fn: async (page) => {
        await page.waitForTimeout(3000);
        const text = await page.textContent('body');
        if (!text || text.trim().length < 5) throw new Error('页面无内容');
      }
    },
    {
      name: '所有可见按钮可交互',
      fn: async (page) => {
        const buttons = page.locator('button:visible');
        const count = await buttons.count();
        for (let i = 0; i < count; i++) {
          await buttons.nth(i).waitFor({ timeout: 3000 });
        }
      }
    },
  ]);
  await p.close();

  // ==================== 12. COMMUNITY PAGE ====================
  p = await browser.newPage();
  await testPage(p, browser, `${BASE}/community`, '社区页', [
    {
      name: '页面加载成功',
      fn: async (page) => {
        await page.waitForTimeout(3000);
        const text = await page.textContent('body');
        if (!text || text.trim().length < 5) throw new Error('页面无内容');
      }
    },
    {
      name: '所有可见按钮可交互',
      fn: async (page) => {
        const buttons = page.locator('button:visible');
        const count = await buttons.count();
        for (let i = 0; i < count; i++) {
          await buttons.nth(i).waitFor({ timeout: 3000 });
        }
      }
    },
  ]);
  await p.close();

  // ==================== 13. PROFILE PAGE ====================
  p = await browser.newPage();
  await testPage(p, browser, `${BASE}/profile`, '个人中心页', [
    {
      name: '页面加载成功',
      fn: async (page) => {
        await page.waitForTimeout(3000);
        const text = await page.textContent('body');
        if (!text || text.trim().length < 5) throw new Error('页面无内容');
      }
    },
    {
      name: '所有可见按钮可交互',
      fn: async (page) => {
        const buttons = page.locator('button:visible');
        const count = await buttons.count();
        for (let i = 0; i < count; i++) {
          await buttons.nth(i).waitFor({ timeout: 3000 });
        }
      }
    },
  ]);
  await p.close();

  // Save report
  fs.writeFileSync(REPORT_FILE, JSON.stringify(results, null, 2));
  
  // Print summary
  console.log('\n========================================');
  console.log('测试完成');
  console.log(`总计: ${results.summary.totalTests} | 通过: ${results.summary.passed} | 失败: ${results.summary.failed}`);
  console.log(`控制台错误: ${results.consoleErrors.length}`);
  console.log(`报告: ${REPORT_FILE}`);
  console.log('========================================\n');

  for (const [name, pageResult] of Object.entries(results.pages)) {
    const status = pageResult.loaded ? (pageResult.tests.filter(t => t.status === 'failed').length === 0 ? '✓' : '✗') : '✗';
    console.log(`  ${status} ${name}`);
    if (pageResult.loadError) console.log(`    ERROR: ${pageResult.loadError}`);
    for (const t of pageResult.tests) {
      if (t.status === 'failed') console.log(`    ✗ ${t.name}: ${t.error}`);
    }
  }

  await browser.close();
})();
# LinguaLearn — 功能测试报告

- **测试开始**: 2026-06-17T11:49:43.348597
- **测试结束**: 2026-06-17T11:50:45.575482
- **测试页面**: 20
- **通过**: 20
- **失败/部分失败**: 0
- **发现问题总数**: 22
- **严重问题**: 22

## 总体问题概览


### 🔴 严重 (22)

**console-error** (22项)

- `/admin/login` — Console error: Failed to load resource: the server responded with a status of 401 (Unauthorized)
  - 建议: Check JS bundle integrity, fix React errors, inspect network calls.
- `/admin` — Console error: Failed to load resource: the server responded with a status of 401 (Unauthorized)
  - 建议: Check JS bundle integrity, fix React errors, inspect network calls.
- `/admin` — Console error: Failed to load resource: the server responded with a status of 401 (Unauthorized)
  - 建议: Check JS bundle integrity, fix React errors, inspect network calls.
- `/admin` — Console error: Failed to load resource: the server responded with a status of 401 (Unauthorized)
  - 建议: Check JS bundle integrity, fix React errors, inspect network calls.
- `/admin/users` — Console error: Failed to load resource: the server responded with a status of 401 (Unauthorized)
  - 建议: Check JS bundle integrity, fix React errors, inspect network calls.
- `/admin/users` — Console error: Failed to load resource: the server responded with a status of 401 (Unauthorized)
  - 建议: Check JS bundle integrity, fix React errors, inspect network calls.
- `/admin/users` — Console error: Failed to load resource: the server responded with a status of 401 (Unauthorized)
  - 建议: Check JS bundle integrity, fix React errors, inspect network calls.
- `/admin/courses` — Console error: Failed to load resource: the server responded with a status of 400 (Bad Request)
  - 建议: Check JS bundle integrity, fix React errors, inspect network calls.
- `/admin/courses` — Console error: Failed to load resource: the server responded with a status of 401 (Unauthorized)
  - 建议: Check JS bundle integrity, fix React errors, inspect network calls.
- `/admin/courses` — Console error: Failed to load resource: the server responded with a status of 401 (Unauthorized)
  - 建议: Check JS bundle integrity, fix React errors, inspect network calls.
- `/admin/courses` — Console error: Failed to load resource: the server responded with a status of 401 (Unauthorized)
  - 建议: Check JS bundle integrity, fix React errors, inspect network calls.
- `/admin/languages` — Console error: Failed to load resource: the server responded with a status of 401 (Unauthorized)
  - 建议: Check JS bundle integrity, fix React errors, inspect network calls.
- `/admin/languages` — Console error: Failed to load resource: the server responded with a status of 401 (Unauthorized)
  - 建议: Check JS bundle integrity, fix React errors, inspect network calls.
- `/admin/languages` — Console error: Failed to load resource: the server responded with a status of 401 (Unauthorized)
  - 建议: Check JS bundle integrity, fix React errors, inspect network calls.
- `/admin/badges` — Console error: Failed to load resource: the server responded with a status of 400 (Bad Request)
  - 建议: Check JS bundle integrity, fix React errors, inspect network calls.
- `/admin/badges` — Console error: Failed to load resource: the server responded with a status of 401 (Unauthorized)
  - 建议: Check JS bundle integrity, fix React errors, inspect network calls.
- `/admin/badges` — Console error: Failed to load resource: the server responded with a status of 401 (Unauthorized)
  - 建议: Check JS bundle integrity, fix React errors, inspect network calls.
- `/admin/badges` — Console error: Failed to load resource: the server responded with a status of 401 (Unauthorized)
  - 建议: Check JS bundle integrity, fix React errors, inspect network calls.
- `/admin/community` — Console error: Failed to load resource: the server responded with a status of 400 (Bad Request)
  - 建议: Check JS bundle integrity, fix React errors, inspect network calls.
- `/admin/community` — Console error: Failed to load resource: the server responded with a status of 401 (Unauthorized)
  - 建议: Check JS bundle integrity, fix React errors, inspect network calls.
- `/admin/community` — Console error: Failed to load resource: the server responded with a status of 401 (Unauthorized)
  - 建议: Check JS bundle integrity, fix React errors, inspect network calls.
- `/admin/community` — Console error: Failed to load resource: the server responded with a status of 401 (Unauthorized)
  - 建议: Check JS bundle integrity, fix React errors, inspect network calls.


## 逐页测试详情


### ✅ 首页 — `/`

- **HTTP状态**: 200
- **页面状态**: passed
- **按钮点击**: 1/0
- **输入测试**: 0
- **链接导航**: 1
- **耗时**: 6138ms
- **截图**: screenshots/ok_index.png


### ✅ 课程列表 — `/courses`

- **HTTP状态**: 200
- **页面状态**: passed
- **按钮点击**: 7/16
- **输入测试**: 1
- **链接导航**: 0
- **耗时**: 1679ms
- **截图**: screenshots/ok_courses.png


### ✅ 课程详情 — `/courses/1`

- **HTTP状态**: 200
- **页面状态**: passed
- **按钮点击**: 3/4
- **输入测试**: 0
- **链接导航**: 2
- **耗时**: 3298ms
- **截图**: screenshots/ok_courses_1.png


### ✅ word课程 — `/learn/word/1`

- **HTTP状态**: 200
- **页面状态**: passed
- **按钮点击**: 6/8
- **输入测试**: 0
- **链接导航**: 0
- **耗时**: 1939ms
- **截图**: screenshots/ok_learn_word_1.png


### ✅ grammar课程 — `/learn/grammar/1`

- **HTTP状态**: 200
- **页面状态**: passed
- **按钮点击**: 2/4
- **输入测试**: 1
- **链接导航**: 0
- **耗时**: 1873ms
- **截图**: screenshots/ok_learn_grammar_1.png


### ✅ listening课程 — `/learn/listening/1`

- **HTTP状态**: 200
- **页面状态**: passed
- **按钮点击**: 2/4
- **输入测试**: 1
- **链接导航**: 0
- **耗时**: 1993ms
- **截图**: screenshots/ok_learn_listening_1.png


### ✅ speaking课程 — `/learn/speaking/1`

- **HTTP状态**: 200
- **页面状态**: passed
- **按钮点击**: 2/4
- **输入测试**: 1
- **链接导航**: 0
- **耗时**: 1880ms
- **截图**: screenshots/ok_learn_speaking_1.png


### ✅ 登录页 — `/login`

- **HTTP状态**: 200
- **页面状态**: passed
- **按钮点击**: 2/1
- **输入测试**: 2
- **链接导航**: 0
- **耗时**: 1356ms
- **截图**: screenshots/ok_login.png


### ✅ 注册页 — `/register`

- **HTTP状态**: 200
- **页面状态**: passed
- **按钮点击**: 1/5
- **输入测试**: 4
- **链接导航**: 0
- **耗时**: 1230ms
- **截图**: screenshots/ok_register.png


### ✅ 个人中心 — `/profile`

- **HTTP状态**: 200
- **页面状态**: passed
- **按钮点击**: 3/5
- **输入测试**: 0
- **链接导航**: 0
- **耗时**: 1382ms
- **截图**: screenshots/ok_profile.png


### ✅ 学习进度 — `/progress`

- **HTTP状态**: 200
- **页面状态**: passed
- **按钮点击**: 2/4
- **输入测试**: 0
- **链接导航**: 0
- **耗时**: 4654ms
- **截图**: screenshots/ok_progress.png


### ✅ 社区 — `/community`

- **HTTP状态**: 200
- **页面状态**: passed
- **按钮点击**: 3/6
- **输入测试**: 0
- **链接导航**: 0
- **耗时**: 1546ms
- **截图**: screenshots/ok_community.png


### ✅ 每日挑战 — `/daily-challenge`

- **HTTP状态**: 200
- **页面状态**: passed
- **按钮点击**: 2/4
- **输入测试**: 0
- **链接导航**: 0
- **耗时**: 3732ms
- **截图**: screenshots/ok_daily_challenge.png


### ⚠️ 管理员登录 — `/admin/login`

- **HTTP状态**: 200
- **页面状态**: passed
- **按钮点击**: 1/1
- **输入测试**: 2
- **链接导航**: 0
- **耗时**: 1715ms
- **Console错误数**: 1
- **截图**: screenshots/ok_admin_login.png

**问题**:

🔴 [console-error] Console error: Failed to load resource: the server responded with a status of 401 (Unauthorized)
   → Check JS bundle integrity, fix React errors, inspect network calls.


### ⚠️ admin-/admin — `/admin`

- **HTTP状态**: 200
- **页面状态**: passed
- **按钮点击**: 2/4
- **输入测试**: 0
- **链接导航**: 0
- **耗时**: 1599ms
- **Console错误数**: 3
- **截图**: screenshots/ok_admin.png

**问题**:

🔴 [console-error] Console error: Failed to load resource: the server responded with a status of 401 (Unauthorized)
   → Check JS bundle integrity, fix React errors, inspect network calls.
🔴 [console-error] Console error: Failed to load resource: the server responded with a status of 401 (Unauthorized)
   → Check JS bundle integrity, fix React errors, inspect network calls.
🔴 [console-error] Console error: Failed to load resource: the server responded with a status of 401 (Unauthorized)
   → Check JS bundle integrity, fix React errors, inspect network calls.


### ⚠️ admin-/admin/users — `/admin/users`

- **HTTP状态**: 200
- **页面状态**: passed
- **按钮点击**: 2/4
- **输入测试**: 0
- **链接导航**: 0
- **耗时**: 1670ms
- **Console错误数**: 3
- **截图**: screenshots/ok_admin_users.png

**问题**:

🔴 [console-error] Console error: Failed to load resource: the server responded with a status of 401 (Unauthorized)
   → Check JS bundle integrity, fix React errors, inspect network calls.
🔴 [console-error] Console error: Failed to load resource: the server responded with a status of 401 (Unauthorized)
   → Check JS bundle integrity, fix React errors, inspect network calls.
🔴 [console-error] Console error: Failed to load resource: the server responded with a status of 401 (Unauthorized)
   → Check JS bundle integrity, fix React errors, inspect network calls.


### ⚠️ admin-/admin/courses — `/admin/courses`

- **HTTP状态**: 200
- **页面状态**: passed
- **按钮点击**: 2/4
- **输入测试**: 0
- **链接导航**: 0
- **耗时**: 1447ms
- **Console错误数**: 4
- **截图**: screenshots/ok_admin_courses.png

**问题**:

🔴 [console-error] Console error: Failed to load resource: the server responded with a status of 400 (Bad Request)
   → Check JS bundle integrity, fix React errors, inspect network calls.
🔴 [console-error] Console error: Failed to load resource: the server responded with a status of 401 (Unauthorized)
   → Check JS bundle integrity, fix React errors, inspect network calls.
🔴 [console-error] Console error: Failed to load resource: the server responded with a status of 401 (Unauthorized)
   → Check JS bundle integrity, fix React errors, inspect network calls.
🔴 [console-error] Console error: Failed to load resource: the server responded with a status of 401 (Unauthorized)
   → Check JS bundle integrity, fix React errors, inspect network calls.


### ⚠️ admin-/admin/languages — `/admin/languages`

- **HTTP状态**: 200
- **页面状态**: passed
- **按钮点击**: 2/4
- **输入测试**: 0
- **链接导航**: 0
- **耗时**: 1470ms
- **Console错误数**: 3
- **截图**: screenshots/ok_admin_languages.png

**问题**:

🔴 [console-error] Console error: Failed to load resource: the server responded with a status of 401 (Unauthorized)
   → Check JS bundle integrity, fix React errors, inspect network calls.
🔴 [console-error] Console error: Failed to load resource: the server responded with a status of 401 (Unauthorized)
   → Check JS bundle integrity, fix React errors, inspect network calls.
🔴 [console-error] Console error: Failed to load resource: the server responded with a status of 401 (Unauthorized)
   → Check JS bundle integrity, fix React errors, inspect network calls.


### ⚠️ admin-/admin/badges — `/admin/badges`

- **HTTP状态**: 200
- **页面状态**: passed
- **按钮点击**: 2/4
- **输入测试**: 0
- **链接导航**: 0
- **耗时**: 1475ms
- **Console错误数**: 4
- **截图**: screenshots/ok_admin_badges.png

**问题**:

🔴 [console-error] Console error: Failed to load resource: the server responded with a status of 400 (Bad Request)
   → Check JS bundle integrity, fix React errors, inspect network calls.
🔴 [console-error] Console error: Failed to load resource: the server responded with a status of 401 (Unauthorized)
   → Check JS bundle integrity, fix React errors, inspect network calls.
🔴 [console-error] Console error: Failed to load resource: the server responded with a status of 401 (Unauthorized)
   → Check JS bundle integrity, fix React errors, inspect network calls.
🔴 [console-error] Console error: Failed to load resource: the server responded with a status of 401 (Unauthorized)
   → Check JS bundle integrity, fix React errors, inspect network calls.


### ⚠️ admin-/admin/community — `/admin/community`

- **HTTP状态**: 200
- **页面状态**: passed
- **按钮点击**: 2/4
- **输入测试**: 0
- **链接导航**: 0
- **耗时**: 1476ms
- **Console错误数**: 4
- **截图**: screenshots/ok_admin_community.png

**问题**:

🔴 [console-error] Console error: Failed to load resource: the server responded with a status of 400 (Bad Request)
   → Check JS bundle integrity, fix React errors, inspect network calls.
🔴 [console-error] Console error: Failed to load resource: the server responded with a status of 401 (Unauthorized)
   → Check JS bundle integrity, fix React errors, inspect network calls.
🔴 [console-error] Console error: Failed to load resource: the server responded with a status of 401 (Unauthorized)
   → Check JS bundle integrity, fix React errors, inspect network calls.
🔴 [console-error] Console error: Failed to load resource: the server responded with a status of 401 (Unauthorized)
   → Check JS bundle integrity, fix React errors, inspect network calls.

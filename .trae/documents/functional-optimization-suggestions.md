# LinguaLearn 功能性优化建议文档

> **测试时间**: 2026-06-16  
> **测试工具**: Playwright (Chromium Headless)  
> **测试通过率**: 31/47 (66.0%)  
> **测试范围**: 全站 13 个页面、注册/登录流程、导航、响应式、性能、控制台错误

---

## 一、测试概览

| 类别 | 通过 | 失败 | 需检查 | 状态 |
|------|------|------|--------|------|
| 公共页面 (首页/登录/注册) | 12 | 0 | 0 | ✅ |
| 认证流程 (注册/登录) | 2 | 1 | 0 | ⚠️ |
| 课程浏览 | 3 | 0 | 1 | ⚠️ |
| 课程详情 & 学习模块 | 1 | 1 | 4 | ❌ |
| 每日挑战 | 1 | 0 | 1 | ❌ |
| 进度/社区/个人中心 | 4 | 0 | 4 | ⚠️ |
| 导航 & 响应式 | 3 | 0 | 0 | ✅ |
| 控制台错误 | 0 | 1 | 0 | ❌ |
| 页面加载性能 | 6 | 0 | 0 | ✅ |
| **总计** | **31** | **3** | **10** | |

---

## 二、严重问题 (P0 — 必须修复)

### 2.1 每日挑战页面数据映射错误导致页面崩溃

**问题描述**: 每日挑战页面的 API 响应格式与前端数据映射不匹配，导致页面渲染 `[object Object]` 而非实际题目文本，选项列表为空，页面无法正常使用。

**根因分析**:

[route.ts](file:///workspace/src/app/api/daily-challenge/route.ts) 中 API 返回的 `tasks` 格式为：
```javascript
{ ...task, question: { /* 完整的 grammar_questions 或 listening_questions 行 */ } }
```

而 [page.tsx](file:///workspace/src/app/daily-challenge/page.tsx#L42-L48) 中前端期望的格式为：
```typescript
{
  id: t.id,
  type: t.type,
  question: t.question as string,        // ❌ 实际是对象，不是字符串
  options: t.options as string[],         // ❌ t.options 不存在于 task 对象
  correctAnswer: t.correct_answer as string  // ❌ t.correct_answer 不存在于 task 对象
}
```

**修复建议**:
- 方案 A：修改前端映射，正确读取嵌套对象：
  ```typescript
  question: t.question.question as string,
  options: JSON.parse(t.question.options_json) as string[],
  correctAnswer: t.question.correct_answer as string,
  ```
- 方案 B：修改 API 返回格式，在服务端展平数据结构（推荐，更清晰）

**影响范围**: 每日挑战核心功能完全不可用

---

### 2.2 个人中心页面永久处于加载状态

**问题描述**: [profile-client.tsx](file:///workspace/src/app/profile/profile-client.tsx#L34-L35) 中 `loading` 状态初始化为 `true`，但没有任何 `useEffect` 或异步操作将其设置为 `false`，导致页面永远显示骨架屏。

**根因分析**:
```typescript
const [loading, setLoading] = useState(true);  // 初始为 true
// ... 缺少 useEffect 来 setLoading(false)
if (authLoading || loading) {
  return <Skeleton />;  // 永远渲染骨架屏
}
```

**修复建议**:
- 移除未使用的 `loading` 状态，或添加 `useEffect` 在组件挂载后设置 `loading = false`
- 当前页面实际上不需要 `loading` 状态（数据来自 zustand store 的 `user`），可以直接删除相关代码

**影响范围**: 已登录用户无法查看个人中心

---

### 2.3 缺少 `/api/auth/logout` 路由

**问题描述**: [authStore.ts](file:///workspace/src/stores/authStore.ts#L111-L118) 中的 `logout` 函数调用 `fetch('/api/auth/logout', ...)`，但该 API 路由不存在，导致退出登录时产生 404 错误。

**修复建议**: 创建 [logout/route.ts](file:///workspace/src/app/api/auth/logout/route.ts)：
```typescript
import { NextResponse } from 'next/server';
export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('token', '', { httpOnly: true, path: '/', maxAge: 0 });
  return response;
}
```

**影响范围**: 退出登录功能静默失败，token 未清除

---

## 三、中等问题 (P1 — 建议修复)

### 3.1 React "Cannot update a component while rendering" 控制台错误

**问题描述**: 浏览器控制台出现两次 `Cannot update a component while rendering a different component` 错误。

**根因分析**: [themeStore.ts](file:///workspace/src/stores/themeStore.ts) 使用 `zustand/middleware` 的 `persist` 中间件，在 React 渲染期间从 localStorage 同步状态，触发组件在渲染中更新。

**修复建议**:
- 方案 A：使用 `useEffect` 延迟 hydration：
  ```typescript
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);
  if (!hydrated) return null; // 等待 hydration
  ```
- 方案 B：在 `persist` 配置中添加 `skipHydration: true`，然后手动调用 `useThemeStore.persist.rehydrate()` 在 `useEffect` 中

**影响范围**: 控制台错误，不影响功能但影响开发者体验

---

### 3.2 每日挑战 API 认证行为不一致

**问题描述**: [daily-challenge/route.ts](file:///workspace/src/app/api/daily-challenge/route.ts#L10) 在未认证时返回 401，而 [auth/me/route.ts](file:///workspace/src/app/api/auth/me/route.ts) 返回 200 + `{ authenticated: false }`。这种不一致导致浏览器控制台报错。

**修复建议**: 统一为返回 200 + `{ authenticated: false }`，或统一使用 401（但会触发浏览器错误日志）。建议方案：统一使用 200 + `{ authenticated: false }` 模式，由前端静默处理。

**影响范围**: 控制台错误，用户体验无影响

---

### 3.3 课程详情页 — 所有课程除第一节外均被锁定

**问题描述**: [courses/[id]/page.tsx](file:///workspace/src/app/courses/[id]/page.tsx#L90) 中 `isLocked = li > 0` 逻辑导致每个单元除第一课外所有课程被锁定，用户无法自由选择学习顺序。

**修复建议**:
- 基于用户实际学习进度（`user_progress` 表）动态判断解锁状态
- 或改为允许用户自由选课，只在完成前序课程后标记为"推荐顺序"

**影响范围**: 用户只能按固定顺序学习，无法跳转到感兴趣的内容

---

### 3.4 课程详情页 — 学习进度状态未与实际数据关联

**问题描述**: [courses/[id]/page.tsx](file:///workspace/src/app/courses/[id]/page.tsx#L91) 中 `isCompleted = false` 硬编码，所有课程始终显示为"未完成"状态，进度条始终为 0%。

**修复建议**: 从 `user_progress` 表查询当前用户的学习进度，动态更新完成状态和进度条。

**影响范围**: 进度追踪功能形同虚设

---

### 3.5 登录后跳转到登录页导致表单不可见

**问题描述**: 用户注册成功后自动登录并跳转到首页。此时再访问 `/login` 页面，如果前端未做重定向，已登录用户仍能看到登录表单但无意义；如果做了重定向，Playwright 测试找不到表单元素。

**修复建议**:
- 在登录/注册页面添加 `useEffect` 检查：如果已登录则 `router.push('/')`
- 或保持当前行为，但测试用例需要适配

**影响范围**: 已登录用户访问登录页的体验

---

## 四、优化建议 (P2 — 体验提升)

### 4.1 听力训练 — 音频文件缺失

**问题描述**: 所有听力训练课程的 `audio_url` 指向 `/audio/*.mp3`，但这些文件不存在，页面只能显示降级 UI（"音频暂不可用，请阅读文字稿"）。

**修复建议**:
- 方案 A：使用 Web Speech API 的 `SpeechSynthesis` 进行客户端 TTS 朗读
- 方案 B：预生成简单的音频文件（使用 `say` 命令或在线 TTS 服务）
- 方案 C：使用公开的音频 CDN 资源

**影响范围**: 听力训练模块失去核心功能

---

### 4.2 口语跟读 — 缺少语音识别功能

**问题描述**: 口语练习页面显示句子和录音按钮，但没有实际的语音识别/评分功能。用户点击录音后无法获得反馈。

**修复建议**:
- 短期：使用 Web Speech API 的 `SpeechRecognition` 进行浏览器端语音识别
- 长期：集成第三方语音评分 API（如 Google Cloud Speech-to-Text）

**影响范围**: 口语训练模块仅为展示

---

### 4.3 社区 — 帖子评论功能缺失

**问题描述**: 社区页面有帖子列表和点赞功能，但评论按钮无实际功能（点击后无反应）。

**修复建议**:
- 实现评论弹窗/内联评论区域
- 添加评论输入框和提交功能
- 已有 API 路由 `/api/community/posts/[id]/comments`，前端需要对接

**影响范围**: 社区互动性降低

---

### 4.4 首页 — 未登录用户体验优化

**问题描述**: 未登录用户访问首页时，课程卡片显示"课程"按钮但点击后跳转到登录页，体验不够流畅。

**修复建议**:
- 在首页添加醒目的 CTA 区域（如 Hero 区域的"开始免费学习"按钮）
- 允许未登录用户浏览课程列表（只读），点击具体课程时再提示登录
- 添加"游客体验"模式，允许试学前几节课

---

### 4.5 学习进度页 — 热力图数据为空

**问题描述**: 进度页面的热力图区域显示 90 天无数据，因为新用户没有学习记录。

**修复建议**:
- 添加模拟数据或引导提示："开始学习后，这里将显示你的学习热力图"
- 添加"去学习"按钮引导用户进入课程

---

### 4.6 全局 — 缺少错误边界和友好错误提示

**问题描述**: 部分页面（如每日挑战）在数据异常时显示 Next.js 默认错误页面 "This page couldn't load"，缺乏用户友好的错误提示。

**修复建议**:
- 添加 `error.tsx` 错误边界文件到每个路由段
- 使用统一的错误 UI 组件，包含重试按钮和返回首页选项

---

### 4.7 响应式设计 — 移动端侧边栏导航

**问题描述**: 移动端测试通过，但某些页面在 390px 宽度下内容密度较高，建议优化间距。

**修复建议**:
- 课程卡片在移动端改为单列布局
- 学习模块的选项按钮增大点击区域（至少 44px 高度）
- 底部导航栏添加标签文字

---

## 五、测试总结

| 指标 | 当前值 | 目标值 |
|------|--------|--------|
| 测试通过率 | 66.0% | ≥ 95% |
| 严重问题 (P0) | 3 | 0 |
| 中等问题 (P1) | 5 | ≤ 2 |
| 优化建议 (P2) | 7 | ≤ 5 |
| 控制台错误 | 2 | 0 |
| 页面平均加载时间 | 0.79s | < 1.5s ✅ |

### 修复优先级建议

1. **立即修复 (P0)**: 每日挑战数据映射、个人中心加载状态、缺失的 logout API
2. **本周修复 (P1)**: React 渲染错误、API 认证一致性、课程进度追踪、课程解锁逻辑
3. **下个迭代 (P2)**: 音频/语音功能、社区评论、错误边界、未登录引导

---

## 六、附录：测试截屏

| 页面 | 截屏路径 |
|------|----------|
| 首页 | `/tmp/lingualearn_screenshots/01_homepage.png` |
| 登录 | `/tmp/lingualearn_screenshots/02_login.png` |
| 注册 | `/tmp/lingualearn_screenshots/03_register.png` |
| 注册填写 | `/tmp/lingualearn_screenshots/04_register_filled.png` |
| 注册后 | `/tmp/lingualearn_screenshots/05_after_register.png` |
| 登录填写 | `/tmp/lingualearn_screenshots/06_login_filled.png` |
| 课程列表 | `/tmp/lingualearn_screenshots/08_courses.png` |
| 课程详情 | `/tmp/lingualearn_screenshots/09_course_detail.png` |
| 每日挑战 | `/tmp/lingualearn_screenshots/14_daily_challenge.png` |
| 学习进度 | `/tmp/lingualearn_screenshots/15_progress.png` |
| 社区 | `/tmp/lingualearn_screenshots/16_community.png` |
| 个人中心 | `/tmp/lingualearn_screenshots/17_profile.png` |
| 移动端首页 | `/tmp/lingualearn_screenshots/18_mobile_home.png` |
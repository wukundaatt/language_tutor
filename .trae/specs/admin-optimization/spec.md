# 用户后台功能优化 Spec

## Why
当前用户后台管理系统已实现基础的 CRUD 功能，但存在以下问题：(1) API 性能瓶颈 — 仪表盘 9 次独立 COUNT 查询、全量返回无分页；(2) 用户体验粗糙 — 缺少 Toast 通知、搜索无防抖、错误处理仅 alert()；(3) 功能缺失 — 无批量操作、无导出、无排序、无操作日志。本优化将系统性地提升后台的性能、交互体验和运维能力。

## What Changes
- **API 性能优化**: 仪表盘 SQL 合并为单次查询、全量接口添加分页/排序支持
- **用户体验提升**: 统一 Toast 通知系统替代 alert()、搜索防抖 300ms、操作确认 toast 反馈
- **功能增强**: 批量删除用户/帖子、CSV 导出用户数据、列排序、管理员操作日志
- **安全加固**: 管理员 API 速率限制、操作审计日志
- **代码质量**: 前端状态管理收敛到 useAdminApi hook、消除重复 CRUD 逻辑

## Impact
- Affected specs: 无 (新功能)
- Affected code:
  - `src/app/api/admin/*` — 所有 API 路由
  - `src/components/admin/*` — 所有前端组件
  - `src/app/admin/*` — 所有后台页面
  - `src/lib/db.ts` — 新增 audit_logs 表
  - 新增 `src/hooks/useAdminApi.ts` — 统一 API 调用 hook
  - 新增 `src/components/admin/Toast.tsx` — Toast 通知组件

---

## ADDED Requirements

### Requirement: 仪表盘 SQL 性能优化
系统 SHALL 将仪表盘 9 次独立 COUNT 查询合并为单次 SQL 查询，减少数据库往返。

#### Scenario: 仪表盘数据加载
- **WHEN** 管理员访问仪表盘页面
- **THEN** 单个 SQL 查询在 < 50ms 内返回所有统计数据

### Requirement: API 分页支持
系统 SHALL 为 users、courses、community、badges 接口添加分页参数 (page, pageSize) 和排序参数 (sortBy, order)。

#### Scenario: 用户列表分页
- **WHEN** 请求 GET /api/admin/users?page=2&pageSize=20
- **THEN** 返回第 2 页的 20 条用户数据，响应包含 total 总数

#### Scenario: 用户排序
- **WHEN** 请求 GET /api/admin/users?sortBy=level&order=desc
- **THEN** 按等级降序排列返回用户列表

### Requirement: 统一 Toast 通知系统
系统 SHALL 提供全局 Toast 通知组件，替换所有 alert() 调用。

#### Scenario: 操作成功通知
- **WHEN** 管理员成功创建用户
- **THEN** 右上角弹出绿色 Toast: "用户创建成功"，3 秒后自动消失

#### Scenario: 操作失败通知
- **WHEN** API 返回错误
- **THEN** 右上角弹出红色 Toast 显示错误信息

### Requirement: 搜索输入防抖
系统 SHALL 对搜索输入添加 300ms 防抖，避免每次按键都触发 API 请求。

#### Scenario: 搜索防抖
- **WHEN** 用户快速输入 "admin" 搜索
- **THEN** 仅在最后一次输入 300ms 后发送一次 API 请求

### Requirement: 批量删除功能
系统 SHALL 支持在用户管理和社区管理页面多选并批量删除条目。

#### Scenario: 批量删除用户
- **WHEN** 管理员勾选 3 个用户并点击"批量删除"
- **THEN** 弹出确认框，确认后删除 3 个用户并刷新列表

### Requirement: CSV 导出功能
系统 SHALL 支持将用户列表导出为 CSV 文件。

#### Scenario: 导出用户
- **WHEN** 管理员点击"导出 CSV"按钮
- **THEN** 浏览器下载包含所有用户数据的 CSV 文件

### Requirement: 数据表列排序
系统 SHALL 支持在 DataTable 中点击表头进行升序/降序切换。

#### Scenario: 点击表头排序
- **WHEN** 管理员在用户列表点击"等级"列表头
- **THEN** 列表按等级升序排列，再次点击切换为降序

### Requirement: 管理员操作日志
系统 SHALL 记录所有管理员操作（创建/编辑/删除）到 audit_logs 表。

#### Scenario: 记录操作日志
- **WHEN** 管理员删除一个用户
- **THEN** audit_logs 表新增一条记录，包含操作人、操作类型、目标 ID、时间戳

### Requirement: 操作日志查看页面
系统 SHALL 在后台提供操作日志查看页面 (/admin/logs)。

#### Scenario: 查看操作日志
- **WHEN** 管理员访问 /admin/logs
- **THEN** 显示最近 100 条操作记录，包含时间、操作人、操作类型、详情

### Requirement: API 速率限制
系统 SHALL 对管理员 API 添加速率限制，防止暴力攻击。

#### Scenario: 速率限制
- **WHEN** 同一 IP 在 1 分钟内请求超过 60 次管理员 API
- **THEN** 返回 429 Too Many Requests

---

## MODIFIED Requirements

### Requirement: 用户搜索体验优化
(修改自现有用户搜索功能)

系统 SHALL 在前端对搜索输入添加 300ms 防抖，减少不必要的 API 请求。表单验证错误 SHALL 使用 Toast 通知代替 alert()。

#### Scenario: 防抖搜索
- **WHEN** 用户连续输入搜索关键词
- **THEN** 仅最后一次输入 300ms 后发送一次 API 请求

### Requirement: 仪表盘数据加载
(修改自现有仪表盘 API)

系统 SHALL 使用单次 SQL 查询获取所有统计数据，而非 9 次独立 COUNT 查询。仪表盘卡片 SHALL 显示加载骨架屏。

#### Scenario: 快速加载
- **WHEN** 管理员打开仪表盘
- **THEN** 所有统计数据在单次 API 请求中返回，前端显示骨架屏直到数据就绪
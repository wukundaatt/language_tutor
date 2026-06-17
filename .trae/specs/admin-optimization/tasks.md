# Tasks

## Phase 1: 基础设施 (parallel)

- [x] Task 1: 创建 Toast 通知系统
  - [x] 创建 `src/components/admin/Toast.tsx` 组件
  - [x] 创建 `src/hooks/useToast.tsx` 全局 Toast 状态管理
  - [x] 在 AdminLayout 中集成 ToastProvider
  - [x] 支持 success/error/info/warning 四种类型，3 秒自动消失

- [x] Task 2: 创建统一 API Hook
  - [x] 创建 `src/hooks/useAdminApi.ts`
  - [x] 封装 fetch 调用、错误处理、Toast 反馈
  - [x] 提供 useDebounce、useAdminApi 等 hook

- [x] Task 3: 数据库扩展 — audit_logs 表
  - [x] 在 `src/lib/db.ts` 添加 audit_logs 表 (id, admin_id, admin_username, action, target_type, target_id, details, created_at)
  - [x] 添加自动迁移逻辑
  - [x] 导出 logAdminAction 辅助函数

## Phase 2: API 优化 (parallel)

- [x] Task 4: 仪表盘 SQL 合并
  - [x] 修改 `src/app/api/admin/dashboard/route.ts`，将 9 次 COUNT 合并为单次查询
  - [x] 使用 SELECT 子查询在一次查询中获取所有统计

- [x] Task 5: 用户 API 分页 + 排序
  - [x] 修改 `src/app/api/admin/users/route.ts`，添加 page/pageSize/sortBy/order 参数
  - [x] 返回 total 总数

- [x] Task 6: 课程/社区/徽章 API 分页
  - [x] 修改 `src/app/api/admin/courses/route.ts` 添加分页
  - [x] 修改 `src/app/api/admin/community/route.ts` 添加分页
  - [x] 修改 `src/app/api/admin/badges/route.ts` 添加分页

- [x] Task 7: 操作日志记录
  - [x] 在所有管理员写操作 API 中插入 audit_logs 记录
  - [x] 创建 `src/app/api/admin/logs/route.ts` (GET) 操作日志查询接口
  - [x] 创建管理员操作日志页面 `src/app/admin/logs/page.tsx`

- [x] Task 8: API 速率限制
  - [x] 在 `src/middleware.ts` 中添加管理员 API 路径速率限制
  - [x] 使用内存 Map 实现简单计数器（60req/min）

## Phase 3: 前端功能增强

- [x] Task 9: 搜索防抖 + Toast 替换
  - [x] 在 `src/hooks/useAdminApi.ts` 中创建 useDebounce hook
  - [x] 在所有搜索输入中集成 300ms 防抖
  - [x] 替换所有 alert() 为 Toast 通知

- [x] Task 10: DataTable 列排序功能
  - [x] 扩展 `src/components/admin/DataTable.tsx`，添加 sortable、onSort props
  - [x] 在管理员页面中启用列排序

- [x] Task 11: 批量删除功能
  - [x] 创建批量删除 API `src/app/api/admin/users/batch/route.ts` (DELETE)
  - [x] 创建批量删除 API `src/app/api/admin/community/batch/route.ts` (DELETE)
  - [x] 在 DataTable 中添加多选复选框
  - [x] 在用户管理和社区管理页面添加批量删除按钮

- [x] Task 12: CSV 导出
  - [x] 在用户管理页面添加"导出 CSV"按钮
  - [x] 客户端生成 CSV 文件并触发下载

- [x] Task 13: 操作日志页面
  - [x] 创建 `src/app/admin/logs/page.tsx` 为完整的操作日志查看页面
  - [x] 支持按操作类型筛选

## Phase 4: 验证

- [x] Task 14: 构建验证
  - [x] 运行 `npm run build` 确认无编译错误
  - [x] 验证所有新路由正常编译

# Task Dependencies
- Task 2 依赖 Task 1 (API hook 使用 Toast)
- Task 4-8 依赖 Task 3 (audit_logs 表)
- Task 9 依赖 Task 1 (Toast 系统)
- Task 10 依赖 Task 5 (后端排序支持)
- Task 11 无依赖 (可并行)
- Task 12 无依赖 (可并行)
- Task 13 依赖 Task 7 (操作日志 API)
- Task 14 依赖所有前序任务
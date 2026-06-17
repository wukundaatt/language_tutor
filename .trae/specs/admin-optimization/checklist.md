# Checklist

## 基础设施
- [x] Toast 组件四种类型均正常渲染
- [x] Toast 3 秒后自动消失
- [x] AdminLayout 正确集成 ToastProvider
- [x] useAdminApi hook 正确处理成功/失败响应
- [x] audit_logs 表已创建并可写入

## API 性能
- [x] 仪表盘接口单次查询返回所有统计数据
- [x] 用户列表接口支持 page/pageSize 参数
- [x] 用户列表接口支持 sortBy/order 参数
- [x] 用户列表接口返回 total 总数
- [x] 课程列表接口支持分页
- [x] 社区列表接口支持分页
- [x] 徽章列表接口支持分页
- [x] 分页参数缺失时使用合理默认值 (page=1, pageSize=20)

## 功能增强
- [x] 搜索输入 300ms 防抖生效
- [x] 操作成功/失败均显示 Toast 而非 alert()
- [x] DataTable 点击表头排序功能正常
- [x] 用户管理页面批量删除可用
- [x] 社区管理页面批量删除可用
- [x] CSV 导出文件包含完整用户数据
- [x] 操作日志页面显示最近操作记录
- [x] 操作日志支持按操作类型筛选

## 安全
- [x] 管理员 API 超过速率限制返回 429
- [x] 所有写操作记录到 audit_logs
- [x] 操作日志包含操作人、时间、类型、目标

## 构建
- [x] npm run build 无编译错误
- [x] 所有后台页面路由正常编译
- [x] 无 TypeScript 类型错误
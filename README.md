# XINQISONG · 站点状态

[状态页](https://status.istsong.com/) · [个人主站](https://istsong.com/) · [技术笔记](https://blog.istsong.com/)

由 [Upptime](https://upptime.js.org/) 执行真实 HTTP、响应耗时和正文关键词检查。所有数据从首次检查开始积累。

<!--start: status pages-->
等待首次真实监测结果。
<!--end: status pages-->

## 维护

- `.upptimerc.yml`：三个站点、5 秒慢响应阈值、中文文案和状态页风格。
- `.github/workflows/uptime.yml`：每 5 分钟计划检查，记录故障并指派 `xinqisong`；GitHub 通知是否发送邮件由账户通知偏好控制。
- `.github/workflows/site.yml`：通过 GitHub 官方 Pages Actions 发布状态页，首次监测、手动检查后及每天刷新构建。
- `api/status.json`：供主站页脚读取的公开结果，包含检查时间。工作流异常或数据过期时，主站显示未知状态。
- `skipDeleteIssues: true`：保留所有故障记录，包括短暂故障。

GitHub 的定时工作流可能延迟，5 分钟是计划频率。响应耗时反映监测节点的请求，不代表所有地区的完整页面加载体验。

## 凭据与版本

工作流使用 GitHub 自动签发且限于本仓库的 `GITHUB_TOKEN`，无需保存个人 PAT。监测任务仅可写本仓库的内容与 Issues；Pages 发布使用 OIDC。

采用官方 `upptime/uptime-monitor` v1.46.0，固定提交 `a284d6064bcbf89db3f1e2a6c533d0e69111573b`。工作流由本仓库维护，不运行官方的模板重写和依赖自动升级任务；升级时检查官方变更后更新固定提交。

公开仓库仅包含公开站点地址与监测数据，不存放主站源码或账户凭据。

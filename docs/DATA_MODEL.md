# 数据模型

- `users`：账户，不保存明文密码。
- `refresh_sessions`：刷新会话，保存 token 摘要与吊销状态。
- `projects`：用户项目。
- `canvases`：项目唯一画布、视口与版本。
- `canvas_nodes` / `canvas_edges`：规范化的图数据，支持独立查询和运行时上下文提取。
- `assets`：对象存储元数据，不把大文件塞进 PostgreSQL。
- `provider_credentials`：加密模型凭证。
- `graph_definitions`：版本化 Graph IR。
- `graph_runs`：可恢复的运行状态。
- `graph_run_events`：节点级事件流，供 SSE 和审计使用。
- `audit_logs`：关键行为记录。

生产对象文件建议放 S3/MinIO，数据库只保存 `object_key`、摘要、类型和大小。

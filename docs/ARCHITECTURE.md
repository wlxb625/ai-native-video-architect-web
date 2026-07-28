# 系统架构

```text
Browser / React + XYFlow
        │ HTTPS REST + SSE
        ▼
Fastify API ─────────────── PostgreSQL
  │ 鉴权/权限/校验             │
  │ 画布/资产/密钥             ├─ projects/canvases/nodes/edges
  │ 创建 Graph Run            ├─ graph_runs/events
  ▼                           └─ provider_credentials/audit_logs
Graph Run Queue (Postgres SKIP LOCKED)
        │
        ▼
Worker ── GraphEngineering Adapter ── Model Gateway
          ├─ native runtime（可选）
          └─ compatible runtime（默认）
```

## 为什么不把画布直接存成浏览器 JSON

浏览器存储无法提供可靠的用户隔离、并发控制、审计、备份和服务器端任务恢复。当前版本将画布拆成 `canvas_nodes` 与 `canvas_edges`，使用 `canvases.version` 做乐观并发控制。保存时在事务中锁定画布版本，版本不一致返回 `409 VERSION_CONFLICT`。

## GraphEngineering 的位置

GraphEngineering 只负责“如何执行图”：并行、依赖、重试、超时、事件和输出收敛。用户、项目、权限、模型密钥、资产对象和审计仍由 CineWeave 的应用层负责。这样即使上游 alpha API 改动，也不会污染核心业务数据。

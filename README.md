# CineWeave Graph Studio

面向 AI 影视创作的前后端分离工作台。核心不是“在浏览器里画几个节点”，而是把画布、资产、模型调用和生成任务变成可持久化、可审计、可恢复的图工作流。

## 架构

- `apps/web`：React + TypeScript + Vite + XYFlow 无限画布
- `apps/api`：Fastify REST API，负责鉴权、权限、画布与资产数据
- `apps/worker`：独立任务执行器，从 PostgreSQL 领取 Graph Run
- `packages/graph-runtime`：GraphEngineering Graph IR 适配层与兼容执行器
- `packages/contracts`：前后端共享 Zod 契约
- `infra/postgres`：数据库迁移

GraphEngineering 上游目前是 source-only alpha，因此本项目默认使用 Graph IR 兼容执行器；执行 `npm run graph:setup` 后，可以通过环境变量切换到本地构建的原生 Runtime。业务数据、权限和密钥加密不依赖上游 alpha 能力。

## 快速启动

```bash
cp .env.example .env
# 生成 32 字节主密钥：openssl rand -base64 32
# 将结果写入 APP_MASTER_KEY_BASE64

docker compose up --build
```

打开：

- Web: `http://localhost:8080`
- API: `http://localhost:8780`
- API 健康检查: `http://localhost:8780/health`

本地开发：

```bash
npm install
npm run db:migrate
npm run dev
```

## 数据存储原则

画布项目数据不存入 `localStorage`。节点、连线、视口、资产、Graph IR、运行事件和审计记录均存入 PostgreSQL。浏览器只保存非敏感偏好；访问令牌只驻留内存，刷新令牌使用 `HttpOnly + SameSite=Strict` Cookie。

## 安全边界

此工程提供生产基线，不宣称“绝对安全”。上线前仍需配置 TLS、数据库备份、密钥轮换、基础设施最小权限和外呼网络策略。详见：

- [安全设计](docs/SECURITY.md)
- [威胁模型](docs/THREAT_MODEL.md)
- [数据模型](docs/DATA_MODEL.md)
- [GraphEngineering 接入](docs/GRAPHENGINEERING.md)
- [API](docs/API.md) / [OpenAPI](docs/openapi.yaml)
- [实现状态](docs/IMPLEMENTATION_STATUS.md)

## 许可证说明

本项目代码为原创实现。GraphEngineering 通过可选的 Git 子模块/本地源码接入，遵循其 MIT License；DramaClaw 仅用于产品交互研究，没有复制其源码。参见 `THIRD_PARTY_NOTICES.md`。

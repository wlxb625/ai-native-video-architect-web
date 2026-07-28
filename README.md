# CineWeave Media Studio

面向 AI 影视创作的媒体生成画布。前台以剧本、人物、场景、分镜、图片和视频为主体；Agent 在后台调用 Skills 完成剧本生成、分析、拆解、分镜规划和连续性检查。

## 产品边界

这不是 Coze 或 Dify 式逻辑流程编辑器。用户看到的是素材和生成血缘：

```text
剧本 / 人物 / 场景 / 参考图
              ↓
             分镜
              ↓
          图片生成任务
              ↓
          图片候选版本
              ↓
          视频生成任务
              ↓
          视频候选版本
```

GraphEngineering 只用于后台 Agent 与生成任务编排，不作为前台画布的产品模型。

## Monorepo

- `apps/web`：React + TypeScript + XYFlow 媒体无限画布
- `apps/api`：Fastify REST API、鉴权、权限、画布和任务接口
- `apps/worker`：Graph Run Worker、LLM Skill 执行和 Provider Adapter
- `packages/contracts`：前后端共享 Zod 契约
- `packages/agent-skills`：剧本和影视生产 Skills 注册表
- `packages/graph-runtime`：GraphEngineering Graph IR 适配层
- `infra/postgres`：PostgreSQL 迁移

## 快速预览

只看前端交互：

```bash
npm install
npm -w @cineweave/contracts run build
npm -w @cineweave/web run dev
```

打开 `http://localhost:5173`，点击“先查看交互演示”。演示模式包含图片、视频、分镜、资产库、右键生成和 Agent Skills 写回画布。

完整启动：

```bash
cp .env.example .env
# 设置 ACCESS_TOKEN_SECRET 和 APP_MASTER_KEY_BASE64
docker compose up --build
```

- Web：`http://localhost:8080`
- API：`http://localhost:8780`

## 数据与安全

画布、节点、连线、生成任务、Agent 运行事件和审计记录存入 PostgreSQL。访问令牌短时存在内存，刷新令牌使用 HttpOnly Cookie；模型密钥在服务端使用 AES-256-GCM 加密。媒体文件正式环境应存入 S3、OSS、COS 或 MinIO，数据库仅保存对象地址、哈希、元数据和生成血缘。

## Provider Adapter

- LLM：OpenAI-compatible Chat Completions
- 图片：OpenAI-compatible `/images/generations`
- 视频：供应商接口不统一，需要专用 Adapter

详见 `docs/AGENT_SKILLS.md`、`docs/SECURITY.md` 和 `docs/API.md`。

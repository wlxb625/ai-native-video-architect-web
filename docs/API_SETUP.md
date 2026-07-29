# 模型 API 接入

## 哪些功能需要 API

以下功能需要真实模型 API：

- Agent 调用剧本生成、剧本诊断、场次拆解、人物设定、分镜规划、连续性检查和提示词生成 Skills。
- 文生图、图生图和图片变体。
- 文生视频、图生视频、首尾帧生视频和视频延长。

以下功能不需要模型 API：

- 演示模式。
- 无限画布和节点操作。
- 剧本、人物、场景和分镜的手动编辑。
- 本地 UI、右键菜单、资产筛选和参数填写。

## 当前接入方式

当前 Worker 使用一个 OpenAI-compatible 统一模型网关：

- Agent：`POST {baseUrl}/chat/completions`
- 图片：`POST {baseUrl}/images/generations`
- 视频：尝试 `POST {baseUrl}/videos/generations`

图片和视频节点中的 `model` 字段可以覆盖网关默认模型。

视频生成 API 尚无统一行业标准。如果目标服务不是上述兼容格式，需要在 Worker 的 Provider Adapter 层实现对应请求、轮询和结果解析。

## 在界面中配置

1. 使用完整前后端模式启动项目。
2. 注册或登录账户。
3. 在右侧参数面板展开“统一模型网关”。
4. 输入 Base URL、Agent 默认模型和 API Key。
5. 保存后再运行 Agent Skill 或生成任务。

演示模式没有服务端会话，不能保存 API Key。

## 服务端安全

- 前端不会把 API Key 写入 localStorage。
- API Key 通过后端 Provider API 保存。
- 数据库中保存 AES-256-GCM 密文、IV 和认证标签。
- API 的读取接口不会返回密钥明文。
- 生产环境必须启用 HTTPS。
- 生产环境建议将 `APP_MASTER_KEY_BASE64` 迁移到 KMS 或 Secret Manager。
- 禁止把真实 API Key 提交到 `.env.example`、GitHub、日志或画布节点数据中。

## 完整启动

```powershell
Copy-Item .env.example .env
docker compose up --build
```

打开：

- Web：`http://localhost:8080`
- API：`http://localhost:8780`

开发模式可以分别运行：

```powershell
npm install
npm run db:migrate
npm run dev
```

## Provider Adapter 下一阶段

建议把不同服务拆为独立 Adapter：

```text
providers/
├── openai-chat.ts
├── openai-image.ts
├── seedance-video.ts
├── kling-video.ts
└── runway-video.ts
```

统一接口至少包含：

```ts
interface MediaProviderAdapter {
  submit(input: GenerationInput): Promise<{ externalJobId: string }>;
  poll(externalJobId: string): Promise<GenerationProgress>;
  cancel?(externalJobId: string): Promise<void>;
  normalize(result: unknown): Promise<GenerationOutput[]>;
}
```

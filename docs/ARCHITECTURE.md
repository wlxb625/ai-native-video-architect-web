# AI Native Film Studio：整体架构

## 1. 产品原则

网站不是模型调用集合，也不是只有聊天记录的助手。系统以 **Project → Canvas → Node → Version → Job → Review → Output** 为主链，每次 AI 结果都必须落到可编辑、可引用和可验收的数据实体中。

无限画布负责表达关系，但数据库才是事实来源。移动卡片只改变布局，不改变剧情、资产或镜头之间的业务关系；连线必须具有明确语义，例如“角色参考被镜头使用”“镜头触发视频生成”“候选视频进入验收”。

## 2. 系统分层

### 2.1 Web 客户端

- Next.js App Router；
- React Flow 无限画布；
- 节点详情面板、项目导航、任务中心和素材选择器；
- 本地即时交互，服务端保存项目事实；
- 桌面端优先，平板端只提供查看和轻编辑。

### 2.2 应用服务层

负责用户身份、项目、节点、版本、素材、任务和验收记录的读写。第一阶段可使用 Next.js Route Handlers；业务增长后仍保持模块化单体，不提前拆微服务。

### 2.3 工作流引擎

工作流引擎不依赖画布坐标，只处理：

- 节点输入是否完整；
- 上游依赖是否已确认；
- 当前节点允许执行哪些动作；
- 执行后产生什么版本和下游事件；
- 哪些连续性规则被破坏。

内部工作流可以保留严格状态，但界面只展示用户易懂的“草稿、可执行、生成中、待验收、已确认、已阻塞”。

### 2.4 AI 编排与模型适配层

统一定义文本、生图、生视频和语音接口。业务代码只提交标准化请求，不直接绑定厂商字段。

```ts
interface MediaProvider<TInput, TTask> {
  submit(input: TInput): Promise<TTask>;
  getStatus(taskId: string): Promise<ProviderStatus>;
  cancel(taskId: string): Promise<void>;
}
```

每次执行必须保存模型、参数、Prompt 版本、输入素材版本、供应商任务 ID、原始响应、标准化状态和费用记录。

### 2.5 异步任务层

图片、视频、音频、抽帧、转码和导出均作为后台任务处理。任务状态统一为：

```text
QUEUED → SUBMITTING → RUNNING → DOWNLOADING → PROCESSING → SUCCEEDED
                                                     ↘ FAILED / CANCELED
```

推荐使用 Trigger.dev 管理长任务、重试、并发和实时进度。任务完成后先把结果复制到自有对象存储，再建立素材版本，避免依赖供应商临时链接。

### 2.6 数据与文件层

推荐组合：

- Supabase PostgreSQL：业务数据；
- Supabase Auth：登录和用户身份；
- RLS：工作区和项目隔离；
- Supabase Realtime：节点、任务和协作状态；
- S3 兼容对象存储：图片、视频、音频和导出文件。

## 3. 无限画布领域模型

### 3.1 内容节点

- 创意节点；
- 故事方案节点；
- 剧本节点；
- 场景节点；
- 备注和参考节点。

### 3.2 资产节点

- 角色身份；
- 角色造型和状态；
- 场景空镜；
- 道具；
- 音频和风格参考。

### 3.3 生产节点

- 镜头；
- 首帧、尾帧和控制帧；
- 图片生成；
- 视频生成；
- 语音生成；
- 后期处理。

### 3.4 决策节点

- 候选选择；
- 镜头验收；
- 修复方案；
- 版本锁定。

### 3.5 输出节点

- 时间线；
- 导出任务；
- 成片、字幕、音频和工程清单。

## 4. 核心数据实体

```text
users
workspaces
workspace_members
projects
canvases
canvas_nodes
canvas_edges
node_versions
scripts
scenes
shots
assets
asset_versions
asset_usages
prompts
prompt_versions
generation_jobs
generation_outputs
review_results
timelines
timeline_items
project_events
```

画布节点只保存布局、展示数据和领域实体引用。完整剧本、素材、镜头、任务和验收结果分别存入对应业务表，避免把所有内容塞进一个 JSON。

## 5. 版本和连续性

所有关键内容只新增版本，不直接覆盖：

- 剧本修改产生 `script_version`；
- 角色参考变更产生 `asset_version`；
- Prompt 调整产生 `prompt_version`；
- 每次生成产生独立 `generation_output`；
- 验收只针对具体输出版本。

镜头依赖被锁定的角色、场景、道具和状态版本。替换上游资产时，系统标记受影响镜头，而不是悄悄更新全部引用。

## 6. 权限和安全

- 浏览器只使用公开客户端密钥；
- 服务端密钥和模型密钥只存在服务端任务环境；
- 暴露给浏览器的业务表全部启用 RLS；
- 供应商回调必须验证签名或使用不可预测任务令牌；
- 上传使用短时预签名 URL；
- 文件类型、大小、时长和分辨率都在服务端再次校验。

## 7. 部署结构

```text
Browser
  ↓
Next.js Web / API
  ├─ Supabase Auth + PostgreSQL + Realtime
  ├─ Trigger.dev Tasks
  ├─ Provider Adapters
  └─ S3-compatible Media Storage
         ↓
      FFmpeg Workers / Export Renderer
```

第一版采用模块化单体。只有当媒体处理量和团队规模真实增长后，才把转码、导出或模型网关拆成独立服务。

## 8. 开发阶段

### 阶段一：画布与项目事实

完成节点、连线、布局、选择、版本入口和项目保存。

### 阶段二：剧本与资产

完成结构化剧本、视觉设定、角色、场景、道具和素材版本。

### 阶段三：镜头与生成

完成镜头表、控制帧、模型适配、任务中心和生成历史。

### 阶段四：验收与成片

完成候选对比、镜头验收、修复决策、简单时间线和导出。

### 阶段五：协作与商业化

完成团队权限、评论、用量、额度、计费和运营后台。

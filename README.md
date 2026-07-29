# CineWeave Generation Studio

> 当前开发预览：**DESCRIPTION COMPOSER V5**  
> 正确分支：`agent/cineweave-description-composer-v5`

CineWeave 是面向 AI 影视创作的媒体生成画布。用户不需要先学会写复杂模型 Prompt，而是先用自然语言描述想生成的内容；系统再结合生成模式、剧本、分镜、人物、场景和参考素材，整理成最终模型提示词并调用对应 Provider。

```text
用户创作描述
      ↓
规则 Prompt 草稿
      ↓
Agent Prompt Composer（可选优化）
      ↓
图片 / 视频 Provider
      ↓
结果节点 + 完整生成记录
```

GraphEngineering 负责后台上下文加载、Prompt 编译、Provider 调用、校验、重试和结果写回，不作为前台画布的产品模型。

## 这版解决了什么

上一版只有文生图、图生图、文生视频和图生视频的参数框，但缺少真正重要的一层：**用户到底怎样描述要生成的内容，以及描述怎样变成模型可执行的提示词**。

V5 增加：

- 每个生成任务都有“想生成什么”必填描述。
- 不同模式提供不同描述提示和示例。
- 自动模式先生成规则草稿，再用 Agent Provider 优化。
- 没有 Agent API Key 时，仍使用规则草稿调用媒体 Provider。
- 高级用户可以切换到“手动最终 Prompt”。
- 图生图、图生视频和首尾帧支持直接选择本地图片。
- 开发模式将本地文件编码为受限大小的 data URI，不强制先搭对象存储。
- 输出节点保存原始描述、规则草稿、最终 Prompt、Prompt 来源、输入素材和模型参数。
- 演示模式只展示描述编译结果，不冒充外部模型已真实生成。

## 四种主要模式应该怎样描述

| 模式 | 用户主要描述什么 | 必需输入 |
|---|---|---|
| 文生图 | 主体、环境、构图、景别、光线、色彩和质感 | 无 |
| 图生图 | 保留什么、修改什么、变化幅度和目标风格 | 至少一张图片 |
| 文生视频 | 动作先后、环境变化、镜头运动和节奏 | 无 |
| 图生视频 | 当前图片之后发生什么、人物怎样动、镜头怎样动 | 至少一张图片 |

高级模式还包括首尾帧生视频、多参考图生图、局部重绘和视频延长。

### 文生图描述示例

```text
雨夜末班地铁站，一名穿深灰风衣的短发女孩捡起旧摄像机，
屏幕中出现空月台，手部和屏幕是画面焦点，冷白灯反射在潮湿地面，
整体克制、现实主义、低饱和。
```

### 图生图描述示例

```text
保留参考图中女孩的脸、发型、风衣和原构图，
把白天地铁站改成雨夜，地面增加冷白灯反光，减少霓虹感，
人物身份和五官不要变化。
```

### 文生视频描述示例

```text
女孩弯腰捡起旧摄像机，屏幕先闪烁一次，她随后缓慢抬头看向站台尽头，
镜头从手部特写平稳推到中近景，远处列车风吹动她的发梢。
```

### 图生视频描述示例

```text
从当前首帧开始，摄像机屏幕短暂闪烁，女孩的手指轻轻收紧，
镜头缓慢推近屏幕，远处列车风吹动她的发梢，人物外观和构图保持稳定。
```

---

## ZIP 和 Git 克隆不是一回事

通过 GitHub 的 **Download ZIP** 下载后，目录中没有 `.git`，因此不能运行：

```powershell
git fetch
git pull
git checkout
git reset
```

出现下面报错，说明当前是 ZIP 解压目录：

```text
fatal: not a git repository (or any of the parent directories): .git
```

项目仍在频繁更新，推荐使用 Git 克隆。

## 环境要求

- Node.js 20 或更高版本
- npm
- Git：仅 Git 克隆方式需要
- Docker Desktop：完整前后端和真实 API 模式需要

```powershell
node -v
npm -v
```

# 方式一：Git 克隆 V5

```powershell
cd "D:\ai\ai漫剧"
git clone --branch "agent/cineweave-description-composer-v5" --single-branch https://github.com/wlxb625/ai-native-video-architect-web.git cineweave-description-v5
cd cineweave-description-v5
```

确认：

```powershell
git branch --show-current
git log -1 --oneline
```

分支必须显示：

```text
agent/cineweave-description-composer-v5
```

只预览前端：

```powershell
npm install
npm -w @cineweave/contracts run build
npm -w @cineweave/web run dev -- --force
```

打开：

```text
http://localhost:5173
```

点击“先查看交互演示”。正确版本顶部显示：

```text
DESCRIPTION COMPOSER V5
```

# 方式二：Download ZIP

在 GitHub 页面先切换到：

```text
agent/cineweave-description-composer-v5
```

然后选择：

```text
Code → Download ZIP
```

解压后进入能看到 `apps`、`packages`、`package.json` 和 `docker-compose.yml` 的最外层目录，执行：

```powershell
npm install
npm -w @cineweave/contracts run build
npm -w @cineweave/web run dev -- --force
```

ZIP 目录不能使用 `git pull`。更新版本需要重新下载，或改用 Git 克隆。

---

# 怎样体验描述驱动生成

1. 打开画布顶部的“文生图”“图生图”“文生视频”或“图生视频”。
2. 鼠标移到右侧边缘，展开“描述与参数”。
3. 在“想生成什么”中填写自然语言描述。
4. 保持“自动整理提示词”，或切换为“手动最终 Prompt”。
5. 图生图和图生视频可直接点击“选择文件”添加本地参考图。
6. 选择 Provider 和模型。
7. 点击“整理提示词并生成图片/视频”。

演示模式会生成一个“描述编译预览”节点，显示规则草稿，不会访问外部模型，也不会产生费用。

---

# 真实 API 模式

真实 Agent、文生图、图生图、文生视频和图生视频必须启动 API、PostgreSQL 和 Worker。

## 1. 创建环境变量

```powershell
Copy-Item .env.example .env
notepad .env
```

至少修改：

```env
ACCESS_TOKEN_SECRET=填写至少32位的随机字符串
APP_MASTER_KEY_BASE64=填写32字节随机密钥的Base64
```

生成访问令牌密钥：

```powershell
[Convert]::ToBase64String(
  [Security.Cryptography.RandomNumberGenerator]::GetBytes(48)
)
```

生成主加密密钥：

```powershell
[Convert]::ToBase64String(
  [Security.Cryptography.RandomNumberGenerator]::GetBytes(32)
)
```

## 2. 启动

```powershell
docker compose up --build
```

打开：

```text
Web：http://localhost:8080
API：http://localhost:8780
```

## 3. 配置 Provider

登录后移到右侧边缘，展开“描述与参数”，再打开“模型与媒体 API”。

| 配置 ID | 用途 | 是否必需 |
|---|---|---|
| `agent` | 剧本 Skills 和自动 Prompt 优化 | 可选；缺失时使用规则草稿 |
| `image` | OpenAI-compatible 文生图、图生图和编辑 | 生成图片时需要 |
| `runway` | Runway 文生视频和图生视频 | 使用 Runway 时需要 |
| `luma` | Luma 图片、视频和关键帧任务 | 使用 Luma 时需要 |

每项分别填写：

- API Base URL
- 默认模型 ID
- API Key

API Key 不写入浏览器 `localStorage`，服务端使用 AES-256-GCM 加密保存。

## API Key 与 Prompt Composer 的关系

API Key 只解决“调用哪个模型服务”。它不会自动解决用户描述怎样转换为适合该模式的 Prompt。

CineWeave 的处理顺序是：

```text
用户描述
  ↓
规则草稿（永远可用）
  ↓
Agent 优化（配置 agent Key 时）
  ↓
最终 Prompt
  ↓
图片或视频 Provider API
```

因此：

- 没有 `agent` Key：仍可使用规则草稿生成媒体。
- 没有图片或视频 Provider Key：可以预览 Prompt，但不能生成真实媒体。
- 只有 Provider Key、没有内容描述：任务不会提交，因为系统不知道要生成什么。

---

# 当前本地素材支持

开发版支持把小型本地图片或视频编码为 data URI，并随生成请求发送：

- 单个文件限制 10MB。
- API 请求体上限 32MB。
- 图生图可直接使用本地图片。
- Runway 图生视频可使用图片 data URI。
- 首尾帧可选择两张本地图片。

这适合本地开发和功能验证。正式生产仍应使用 MinIO、S3、OSS 或 COS，因为把大文件长期存进画布 JSON 和 PostgreSQL 并不合适。

生产版本仍需完善：

1. 预签名上传。
2. 素材对象存储。
3. 临时访问 URL。
4. 第三方结果转存。
5. 大文件分片与断点续传。
6. 费用、限额、取消和更细进度事件。

---

# 当前 Adapter 能力

## 图片

```text
文生图：POST /images/generations
图生图：multipart POST /images/edits
```

图片 Provider 返回 base64 而没有 URL 时，Worker 会转换成画布可预览的 data URI。

## Runway

- 文生视频
- 图生视频
- 图片参考生成
- 视频转视频
- 异步任务轮询

## Luma

- 文生图
- 图片参考生图
- 文生视频
- 首帧图生视频
- 首尾帧生视频
- 异步任务轮询

Luma 视频延长通常还需要原始 generation ID，仅有 MP4 地址可能不够。

可灵、Seedance 等平台仍需要独立 Provider Adapter，不能假设兼容同一请求格式。

---

# 常见问题

## 打开后不是 V5

```powershell
git branch --show-current
git log -1 --oneline
```

然后清理 Vite 缓存：

```powershell
Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force apps\web\node_modules\.vite -ErrorAction SilentlyContinue
npm -w @cineweave/web run dev -- --force
```

浏览器按 `Ctrl + F5`。

## 生成按钮不可点击

常见原因：

- 没有填写“想生成什么”。
- 图生图或图生视频没有真实图片输入。
- 首尾帧没有两张图片。
- 手动 Prompt 模式没有填写最终 Prompt。

## 只出现“描述编译预览”

当前处于演示模式。真实生成需要 Docker 完整模式、登录和对应媒体 Provider API Key。

## 已连接图片节点，但仍提示缺少真实素材

画布连线只表示关系。该节点还必须具有 HTTPS `previewUrl`、数据库资产 ID，或者在任务面板中直接上传本地图片。

---

# Monorepo

```text
apps/
├── web/              React + TypeScript + XYFlow 媒体画布
├── api/              Fastify REST API、鉴权和任务接口
└── worker/           Prompt Composer、Graph Worker 和 Provider Adapter

packages/
├── contracts/        前后端 Zod 契约
├── agent-skills/     影视剧本 Skills
└── graph-runtime/    GraphEngineering 适配层

infra/postgres/       PostgreSQL 迁移
graphs/               Graph IR
docs/                 API、安全、设计和生成说明
```

相关文档：

- `docs/PROMPT_COMPOSER_DESIGN.md`
- `docs/GENERATION_MODES.md`
- `docs/API_SETUP.md`
- `docs/AGENT_SKILLS.md`
- `docs/SECURITY.md`
- `docs/API.md`

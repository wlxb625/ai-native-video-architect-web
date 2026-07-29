# CineWeave Generation Studio

> 当前开发预览：**GENERATION MODES V4**  
> 正确分支：`agent/cineweave-generation-modes-layout-v4`

CineWeave 是面向 AI 影视创作的媒体生成工作台。主要功能不是普通流程图，而是：

- 文生图
- 图生图
- 文生视频
- 图生视频
- 首尾帧生视频
- 多参考图生图
- 局部重绘
- 视频延长
- Agent 调用影视 Skills 生成和分析剧本

GraphEngineering 只负责后台 Agent、Skills、媒体任务、重试和结果写回，不作为前台画布的产品模型。

## V4 界面变化

- 中间无限画布占据绝大多数窗口。
- 左侧素材库默认收起，鼠标移到左边缘时展开。
- 右侧参数面板默认收起，鼠标移到右边缘时展开。
- 两侧面板都可以固定或取消固定。
- 拖动侧栏内侧边缘可以控制宽度。
- 面板宽度和固定状态只作为本地 UI 偏好保存。
- 顶部删除了尚未实现的搜索、帮助、设置和阶段目录。
- 顶部只保留项目、同步状态、四种主要生成模式和 AI 导演。

## 四种主要生成模式

| 模式 | 输入 | 主要参数 |
|---|---|---|
| 文生图 | 文字 | Prompt、画幅、质量、候选数、Seed |
| 图生图 | 图片 + 文字 | 修改强度、输入图保真、构图保持、候选数 |
| 文生视频 | 文字 | 动作、运镜、时长、分辨率、帧率 |
| 图生视频 | 首帧图片 + 文字 | 动作、运镜、运动强度、时长、分辨率 |

图生图和图生视频没有连接输入素材时，前端不会允许提交任务。详细数据结构和 Provider 映射见 `docs/GENERATION_MODES.md`。

---

## ZIP 和 Git 克隆不是一回事

通过 GitHub 的 **Download ZIP** 下载后，目录里没有 `.git`，因此不能运行：

```powershell
git fetch
git pull
git checkout
git reset
```

报错：

```text
fatal: not a git repository (or any of the parent directories): .git
```

这不是 Git 损坏，而是 ZIP 解压目录本来就不包含 Git 历史。

---

## 环境要求

- Node.js 20 或更高版本
- npm
- Git：仅 Git 克隆方式需要
- Docker Desktop：仅完整前后端和真实 API 模式需要

```powershell
node -v
npm -v
```

---

# 方式一：Git 克隆当前分支

```powershell
cd "D:\ai\ai漫剧"
git clone --branch "agent/cineweave-generation-modes-layout-v4" --single-branch https://github.com/wlxb625/ai-native-video-architect-web.git cineweave-generation-v4
cd cineweave-generation-v4
```

确认分支：

```powershell
git branch --show-current
git log -1 --oneline
```

必须看到：

```text
agent/cineweave-generation-modes-layout-v4
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

点击“先查看交互演示”。

正确版本顶部会显示：

```text
GENERATION MODES V4
```

---

# 方式二：Download ZIP

在 GitHub 页面先切换到：

```text
agent/cineweave-generation-modes-layout-v4
```

然后：

```text
Code → Download ZIP
```

解压后进入能看到下面内容的最外层目录：

```text
apps
packages
package.json
docker-compose.yml
README.md
```

执行：

```powershell
npm install
npm -w @cineweave/contracts run build
npm -w @cineweave/web run dev -- --force
```

ZIP 目录不能使用 `git pull`。版本更新时必须重新下载，或改为 Git 克隆。

---

# 完整前后端和真实 API

演示模式不会调用真实模型。真实 Agent、文生图、图生图、文生视频和图生视频必须启动 API、数据库和 Worker。

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

生成随机字符串：

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

## 3. 分别配置 Provider

登录后，把鼠标移到右侧边缘，展开参数面板，再打开“模型与媒体 API”。

目前配置分成四项：

| 配置 ID | 用途 |
|---|---|
| `agent` | 剧本 Agent 和 Skills |
| `image` | OpenAI-compatible 文生图和图生图 |
| `runway` | Runway 文生视频和图生视频 |
| `luma` | Luma 图片、视频和首尾关键帧 |

每项分别填写：

- API Base URL
- 默认模型 ID
- API Key

密钥不会写入浏览器 `localStorage`，服务端使用 AES-256-GCM 加密保存。

---

# 当前 Adapter 能力

## 图片 Provider

OpenAI-compatible 图片 Adapter：

```text
文生图：POST /images/generations
图生图：multipart POST /images/edits
```

图生图必须能够取得输入图片文件。只有画布节点、没有对象存储 URL 时，Worker 会明确返回“需要上传输入素材”，不会假装生成成功。

## Runway

当前 Adapter 包含：

- 文生视频
- 图生视频
- 文/参考图生图
- 视频转视频
- 异步任务轮询

## Luma

当前 Adapter 包含：

- 文生图
- 图片参考生图
- 文生视频
- 首帧图生视频
- 首尾关键帧生视频
- 异步任务轮询

Luma 视频延长需要保存原始 `generation ID`，仅有 MP4 地址不够。

其他平台，例如可灵、Seedance 等，需要单独实现 Provider Adapter，不能直接假设它们兼容同一接口。

---

# 目前仍未完成的关键能力

这版已经把生成模式、参数、前后端契约和 Provider 分流搭好，但完整生产环境仍需要：

1. 用户上传图片和视频到 MinIO、S3、OSS 或 COS。
2. 预签名上传和下载。
3. `assets` 表与对象存储同步。
4. 把输入素材转换成第三方 Provider 可访问的临时 URL。
5. 把第三方生成结果转存到自己的对象存储。
6. 任务取消、费用统计、限额和更细的进度事件。
7. 可灵、Seedance 等独立 Adapter。

所以当前“文生图”和“文生视频”更容易接通；“图生图”和“图生视频”要真正使用用户文件，还必须继续完成媒体上传链路。

---

# 常见问题

## 打开后不是 V4

确认：

```powershell
git branch --show-current
git log -1 --oneline
```

清理 Vite 缓存：

```powershell
Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force apps\web\node_modules\.vite -ErrorAction SilentlyContinue
npm -w @cineweave/web run dev -- --force
```

浏览器按：

```text
Ctrl + F5
```

## 找不到左右侧栏

- 鼠标移到浏览器最左边缘或最右边缘。
- 点击竖向“素材库”或“参数”标签也可以固定展开。
- 展开后点击图钉切换固定状态。
- 拖动侧栏靠近画布的一侧调整宽度。

## 图生图或图生视频无法提交

任务节点没有连接所需输入素材。把图片结果或参考图连接到任务节点；首尾帧生视频需要两张图片。

## 已连接节点但真实生成提示需要上传

画布连线只说明数据关系。第三方 API 仍需要真实文件或可访问 URL。当前输入节点必须具有 HTTPS `previewUrl`，或者后续完成对象存储上传链路。

---

# Monorepo

```text
apps/
├── web/              React + TypeScript + XYFlow 媒体画布
├── api/              Fastify REST API、鉴权和任务接口
└── worker/           Graph Worker、Skills 和 Provider Adapter

packages/
├── contracts/        前后端 Zod 契约
├── agent-skills/     影视剧本 Skills
└── graph-runtime/    GraphEngineering 适配层

infra/postgres/       PostgreSQL 迁移
graphs/               Graph IR
docs/                 API、安全、设计和生成模式说明
```

相关文档：

- `docs/GENERATION_MODES.md`
- `docs/API_SETUP.md`
- `docs/AGENT_SKILLS.md`
- `docs/SECURITY.md`
- `docs/API.md`

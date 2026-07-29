# CineWeave Media Studio

> 当前开发预览：**LIGHT STUDIO V3**  
> 正确分支：`agent/cineweave-skill-ui-api-v2`

CineWeave 是面向 AI 影视创作的媒体生成工作台。前台以剧本、人物、场景、分镜、图片和视频为主体；Agent 在后台调用 Skills 完成剧本生成、诊断、场次拆解、人物设定提取、分镜规划、连续性检查和提示词生成。

它不是 Coze、Dify 式逻辑流程编辑器。用户看到的是影视素材、生成版本和素材血缘：

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

GraphEngineering 只负责后台 Agent、Skills 和生成任务编排，不作为前台画布的产品模型。

---

## 先看这里：ZIP 和 Git 克隆不是一回事

通过 GitHub 的 **Download ZIP** 下载后，目录里没有 `.git`，因此下面这些命令都会报错：

```powershell
git fetch
git pull
git checkout
git reset
```

常见报错：

```text
fatal: not a git repository (or any of the parent directories): .git
```

这不是 Git 损坏，而是因为你打开的是 ZIP 解压目录。

项目后续会频繁更新，推荐使用 **Git 克隆方式**。只想临时预览时，也可以继续使用 ZIP。

---

## 环境要求

- Node.js 20 或更高版本
- npm
- Git（仅 Git 克隆方式需要）
- Docker Desktop（仅完整前后端和真实 API 模式需要）

检查 Node.js：

```powershell
node -v
npm -v
```

---

# 方式一：推荐，用 Git 克隆正确分支

在 PowerShell 中进入准备存放项目的目录：

```powershell
cd "D:\ai\ai漫剧"
```

克隆当前浅色工作台分支：

```powershell
git clone --branch "agent/cineweave-skill-ui-api-v2" --single-branch https://github.com/wlxb625/ai-native-video-architect-web.git cineweave-ui-v3
cd cineweave-ui-v3
```

确认分支：

```powershell
git branch --show-current
git log -1 --oneline
```

第一行必须显示：

```text
agent/cineweave-skill-ui-api-v2
```

安装并启动前端演示：

```powershell
npm install
npm -w @cineweave/contracts run build
npm -w @cineweave/web run dev -- --force
```

浏览器打开：

```text
http://localhost:5173
```

点击：

```text
先查看交互演示
```

新版页面应明显出现：

- 浅灰白色工作台
- 顶部 `LIGHT STUDIO V3` 标记
- 左侧影视素材库
- 中间媒体生成画布
- 右侧节点属性与模型 API 设置
- 底部 AI 导演、执行历史、任务队列和分镜时间线

---

# 方式二：Download ZIP 预览

在 GitHub 页面先把分支切换为：

```text
agent/cineweave-skill-ui-api-v2
```

然后选择：

```text
Code → Download ZIP
```

解压后进入最外层项目目录。该目录中应该能看到：

```text
apps
packages
package.json
docker-compose.yml
README.md
```

在该目录空白处右键，选择“在终端中打开”，执行：

```powershell
npm install
npm -w @cineweave/contracts run build
npm -w @cineweave/web run dev -- --force
```

打开：

```text
http://localhost:5173
```

ZIP 目录不能使用 `git pull`。版本更新时，需要重新下载 ZIP，或者改用 Git 克隆方式。

---

# 更新已有的 Git 克隆

仅适用于通过 `git clone` 得到的目录。

停止正在运行的开发服务器：

```text
Ctrl + C
```

检查当前目录：

```powershell
git rev-parse --show-toplevel
git status
```

更新分支：

```powershell
git fetch origin
git checkout agent/cineweave-skill-ui-api-v2
git pull --ff-only origin agent/cineweave-skill-ui-api-v2
```

重新启动：

```powershell
npm install
npm -w @cineweave/contracts run build
npm -w @cineweave/web run dev -- --force
```

---

# 哪些功能需要 API

| 功能 | 是否需要模型 API |
|---|---:|
| 查看浅色 UI 和无限画布 | 否 |
| 手动创建剧本、人物、场景和分镜 | 否 |
| 测试右键菜单与节点连接 | 否 |
| 演示模式中的模拟 Agent 写回 | 否 |
| 真实剧本生成与剧本诊断 | 是 |
| Agent 调用影视 Skills | 是 |
| 真实文生图、图生图和图片变体 | 是 |
| 真实文生视频、图生视频和视频延长 | 是 |

演示模式用于验证产品结构和交互，不会真的调用外部模型，也不会产生真实图片或视频。

---

# 完整前后端与真实 API 模式

完整模式会启动：

- React Web
- Fastify API
- PostgreSQL
- Graph Worker
- Agent Skills Runtime

## 1. 创建环境变量

确保 Docker Desktop 已启动，然后在项目根目录执行：

```powershell
Copy-Item .env.example .env
notepad .env
```

至少需要替换：

```env
ACCESS_TOKEN_SECRET=填写至少32位的随机字符串
APP_MASTER_KEY_BASE64=填写32字节随机密钥的Base64
```

PowerShell 生成方式：

```powershell
[Convert]::ToBase64String(
  [Security.Cryptography.RandomNumberGenerator]::GetBytes(48)
)
```

把结果用于 `ACCESS_TOKEN_SECRET`。

再生成主加密密钥：

```powershell
[Convert]::ToBase64String(
  [Security.Cryptography.RandomNumberGenerator]::GetBytes(32)
)
```

把结果用于 `APP_MASTER_KEY_BASE64`。

不要把真实密钥提交到 GitHub。

## 2. 启动完整系统

```powershell
docker compose up --build
```

打开：

```text
Web：http://localhost:8080
API：http://localhost:8780
```

## 3. 配置模型 API

1. 创建本地账户或登录。
2. 选中画布节点，打开右侧属性面板。
3. 展开“统一模型网关”。
4. 填写 API Base URL、默认模型和 API Key。
5. 保存后运行 Agent Skill、生图任务或生视频任务。

演示模式没有服务端登录会话，因此不能保存 API Key。

---

# 当前 Provider 接口

Worker 当前支持 OpenAI-compatible 统一网关：

```text
Agent：POST {baseUrl}/chat/completions
图片：POST {baseUrl}/images/generations
视频：尝试 POST {baseUrl}/videos/generations
```

图片和视频节点中的 `model` 字段可以覆盖网关默认模型。

视频生成接口目前没有统一行业标准。Seedance、可灵、Runway 等服务通常需要各自的：

- 提交任务接口
- 查询进度接口
- 鉴权方式
- 结果解析方式
- 失败重试和取消逻辑

因此这些平台需要分别实现 Provider Adapter，当前项目不会假装已经全部接通。

---

# 数据与安全

完整模式下：

- 画布、节点、连线、生成任务和 Agent 运行记录存入 PostgreSQL。
- 访问令牌短时保存在前端内存中。
- 刷新令牌使用 HttpOnly Cookie。
- API Key 不写入浏览器 `localStorage`。
- API Key 在服务端使用 AES-256-GCM 加密存储。
- Provider 查询接口不会返回密钥明文。
- 正式部署必须启用 HTTPS。
- 正式环境建议将主密钥迁移到 KMS 或 Secret Manager。
- 图片、视频和音频应存入 S3、OSS、COS 或 MinIO，数据库只保存地址、哈希、元数据和生成血缘。

---

# 常见问题

## 1. `fatal: not a git repository`

你打开的是 ZIP 解压目录。重新下载 ZIP，或者使用本文的 `git clone` 命令。

## 2. 打开后仍然是黑色旧界面

先确认文件夹不是旧分支：

```powershell
git branch --show-current
git log -1 --oneline
```

正确分支必须是：

```text
agent/cineweave-skill-ui-api-v2
```

然后清理 Vite 缓存并强制启动：

```powershell
Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force apps\web\node_modules\.vite -ErrorAction SilentlyContinue
npm -w @cineweave/web run dev -- --force
```

浏览器执行：

```text
Ctrl + F5
```

如果你使用 ZIP，文件夹名称中仍包含 `agent-cineweave-media-canvas-agent-skills`，说明下载的是旧版本，需要重新切换分支并下载。

## 3. 端口 5173 已被占用

先停止之前运行的 Vite 终端，或者关闭旧的 Node.js 进程，再重新启动。

## 4. 页面能打开，但真实生成无结果

前端演示能运行不代表模型 API 已配置。请使用完整 Docker 模式登录，并在右侧“统一模型网关”中保存有效的 Base URL、模型和 API Key。

## 5. 视频 Provider 返回 404 或 405

目标平台通常不兼容 `/videos/generations`，需要实现对应的视频 Provider Adapter。

---

# Monorepo 结构

```text
apps/
├── web/              React + TypeScript + XYFlow 媒体画布
├── api/              Fastify REST API、鉴权和数据接口
└── worker/           Graph Worker、Skills 与 Provider 调用

packages/
├── contracts/        前后端共享 Zod 契约
├── agent-skills/     影视剧本 Skills 注册表
└── graph-runtime/    GraphEngineering Graph IR 适配层

infra/postgres/       PostgreSQL 数据库迁移
graphs/               后台 Graph IR
docs/                 架构、安全、API 与设计说明
```

---

# 相关文档

- `docs/API_SETUP.md`：模型 API 配置与 Provider 边界
- `docs/AGENT_SKILLS.md`：剧本和影视 Skills
- `docs/UI_DIRECTION_V2.md`：LIGHT STUDIO V3 视觉方向
- `docs/SECURITY.md`：安全设计
- `docs/API.md`：REST API
- `docs/reference-research.yaml`：外部组件和动效调研记录

当前版本仍处于开发预览阶段。不要直接把演示配置、默认密码或开发环境密钥用于正式生产环境。

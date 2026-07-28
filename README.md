# AI Native Film Studio Web

面向中文创作者的可视化 AI 影视生产工作台。

本项目采用自主架构开发，不基于 DramaClaw 源码进行二次开发。产品层面会吸收无限画布、资产复用、异步任务和镜头验收等通用思路，但数据模型、工作流、界面和实现均重新设计。

## 当前阶段

第一阶段建立可运行的无限画布原型与系统架构：

- 影视语义节点；
- 节点连接与项目关系；
- 创作视图和生产视图；
- 节点状态、进度和检查信息；
- 后续数据库、AI 模型与异步任务的接口边界。

## 技术基线

- Next.js 16 App Router
- React 19
- TypeScript
- React Flow
- CSS Variables

规划中的服务端能力：

- Supabase：登录、PostgreSQL、RLS 与实时数据；
- Trigger.dev：长时间生成任务、重试和实时进度；
- S3 兼容对象存储：图片、视频、音频和导出文件；
- 模型适配层：文本、生图、生视频、语音模型统一接口。

## 本地运行

```bash
pnpm install
pnpm dev
```

访问 `http://localhost:3000`。

## 文档

- [系统架构](docs/ARCHITECTURE.md)
- [主要功能](docs/FEATURES.md)

## 分支说明

`independent-rebuild` 是自主开发分支。确认架构和首个可运行版本后，再替换当前 `main`。

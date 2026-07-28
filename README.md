# AI Native Film Studio Web

一个从零自主开发的可视化 AI 影视生产工作台。

项目以无限画布为核心，将创意、剧本、角色、场景、分镜、生成任务、镜头验收和成片组织在同一个可追踪的项目空间中。它不是把聊天框套在模型接口外面，而是让每次 AI 输出都落到可编辑、可连接、可版本化的数据节点里。

## 当前原型

`independent-rebuild` 分支已经建立第一版可运行骨架：

- React Flow 无限画布；
- 影视语义节点与连线；
- 创作、生产和全部三种视图；
- 节点状态、进度和详情检查；
- 可新增节点的工具栏；
- 系统架构和功能范围文档。

## 技术基线

- Next.js 16 App Router
- React 19
- TypeScript
- React Flow
- 原生 CSS Variables

服务端规划：Supabase、Trigger.dev、S3 兼容对象存储以及自研模型适配层。

## 本地运行

```bash
npm install
npm run dev
```

浏览器访问 `http://localhost:3000`。

## 文档

- [整体架构](docs/ARCHITECTURE.md)
- [主要功能](docs/FEATURES.md)
- [自主开发说明](docs/INDEPENDENCE.md)

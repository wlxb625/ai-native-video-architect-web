# Agent 与 Skills 架构

CineWeave 的前台画布只表达创作素材和生成血缘，不让用户手动编排 Agent 的内部步骤。

## 前台可见对象

- 剧本、分析、人物、场景、参考图
- 分镜、图片生成任务、图片候选
- 视频生成任务、视频候选
- 提示词包与版本关系

## 后台执行

Agent 请求进入 `graph_runs`，由 Worker 通过 GraphEngineering Graph IR 执行。当前注册 Skills：

- `script-writer`：生成结构化剧本
- `script-doctor`：诊断动机、冲突、节奏与实现风险
- `scene-breakdown`：拆解场次、人物、动作、道具与连续性
- `character-bible`：生成稳定人物资产卡
- `storyboard-planner`：拆解镜头、景别、机位、运镜与时长
- `continuity-checker`：检查服装、道具、光线、站位和轴线
- `prompt-engineer`：按目标模型生成提示词包

Skill 定义位于 `packages/agent-skills`。每个 Skill 包含：

- 稳定 ID
- 角色与职责
- 输出节点类型
- 系统提示词
- JSON 输出契约

## 执行边界

Agent 可以读取当前项目的画布节点和资产，但模型密钥只在 Worker 内解密。Agent 输出先形成结构化结果，再作为新节点写回画布。媒体生成任务通过 Provider Adapter 执行，图片可使用 OpenAI-compatible `/images/generations`；视频因供应商接口差异，需实现 Seedance、Runway、可灵等专用 Adapter。

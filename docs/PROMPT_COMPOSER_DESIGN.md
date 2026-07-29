# Prompt Composer 设计

## 为什么不能只有一个 Prompt 输入框

影视生成用户通常会表达创作意图，例如：

> 雨夜地铁站里，女孩捡起一台仍在录像的旧摄像机，镜头慢慢推近屏幕。

这是一段合格的创作描述，但不同生成模式需要把它整理成不同的模型输入：

- 文生图需要主体、环境、构图、景别、光线和材质。
- 图生图需要明确保留项、修改项和参考图约束。
- 文生视频需要连续动作、时间顺序、环境变化和镜头运动。
- 图生视频需要把图片作为首帧，避免重复静态外观，重点描述之后发生的运动。
- 首尾帧需要描述从图片1到图片2之间的单向过渡。

因此产品应区分：

1. 用户填写的创作描述。
2. Provider 最终接收的模型提示词。

## 执行顺序

```text
创作描述
  ↓
读取生成模式
  ↓
读取连接节点与本地输入素材清单
  ↓
生成确定性规则草稿
  ↓
尝试 Agent Prompt Composer
  ├─ 成功：使用 Agent 优化结果
  └─ 失败/未配置：使用规则草稿
  ↓
调用图片或视频 Provider
  ↓
保存描述、草稿、最终 Prompt、来源和输出
```

Agent 不是生成媒体的必要条件。媒体 Provider 的 API Key 才负责真实图片或视频调用；Agent 只负责提升描述到 Prompt 的转换质量。

## 输入数据

Prompt Composer 接收：

```ts
{
  operation,
  mediaType,
  description,
  promptGuidance,
  promptMode,
  negativePrompt,
  inputNodeIds,
  inputUrls,
  parameters,
  projectContext
}
```

其中：

- `description`：用户想生成什么，必填。
- `promptGuidance`：风格、连续性、禁用内容等补充要求。
- `inputNodeIds`：连接到任务节点的画布素材。
- `inputUrls`：HTTPS 地址或本地 data URI。
- `parameters`：画幅、质量、时长、帧率、强度等请求参数。

## 素材编号

输入素材按提交顺序固定编号：

```text
图片1
图片2
视频1
```

Prompt Composer 只能使用输入清单中存在的编号，不能虚构“图片3”，也不能擅自重排首帧和尾帧。

## 参数与 Prompt 分离

以下内容主要作为 API 参数发送，不应在 Prompt 中重复堆砌：

- 画幅或尺寸
- 分辨率
- 时长
- 帧率
- 候选数
- Seed
- 输出格式
- Provider 私有参数

Prompt 重点表达可见内容、动作、镜头和一致性约束。

## 规则草稿

规则草稿由代码确定性生成，保证：

- Agent Provider 未配置时仍可用。
- Agent 返回非 JSON 或请求失败时可回退。
- 同一描述和上下文可以获得可追踪的基础版本。
- 调试时可以区分“规则问题”和“Agent 改写问题”。

模式示例：

### 文生图

```text
生成一张全新的单帧画面，明确主体、环境、构图、景别、机位、光线、色彩与材质。
创作目标：……
参考约束：人物卡、场景卡和分镜信息……
补充要求：……
```

### 图生视频

```text
以图片1作为首帧和人物外观约束。
重点描述首帧之后发生的动作、环境运动和镜头运动，不重复静态外观。
创作目标：……
参考约束：……
```

### 首尾帧生视频

```text
以图片1为首帧、图片2为尾帧。
描述两帧之间单向、连续、可见的动作过程和镜头位移，自然到达尾帧。
```

## Agent 输出契约

Agent 必须返回 JSON：

```json
{
  "prompt": "最终模型提示词",
  "negativePrompt": "负面约束",
  "notes": ["整理说明"]
}
```

返回为空、非 JSON、请求失败或未配置 Agent 时，Worker 使用规则草稿。

## 手动模式

高级用户可选择 `promptMode: manual`：

- `description` 仍然保留，用于生成记录和后续分析。
- `prompt` 直接作为最终模型提示词。
- Prompt Composer 不改写用户 Prompt。

## 输出记录

结果节点保存：

```text
description
rule draftPrompt
finalPrompt
promptSource: agent | rule-fallback | manual
promptInputHash
promptNotes
negativePrompt
inputNodeIds
inputAssetIds
inputUrls
parameters
provider
model
externalJobId
```

这样可以回答：

- 这张图最初是怎样描述的？
- Agent 对规则草稿做了什么改写？
- 使用了哪些参考图？
- 使用哪个 Provider 和模型？
- 相同输入重新生成时为什么结果不同？

## 本地素材策略

开发版允许小型本地文件转为 data URI：

- 单文件前端限制 10MB。
- API 请求体限制 32MB。
- OpenAI-compatible 图片编辑可把 data URI 转换为 multipart 文件。
- Runway 图生视频可直接接收图片 data URI。

这只用于开发验证。生产环境应使用对象存储和预签名上传，避免把大文件长期保存在画布 JSON、任务记录和 PostgreSQL 中。

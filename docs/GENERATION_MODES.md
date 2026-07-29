# 图片与视频生成模式

本文说明 CineWeave 中不同生成模式的真实输入差异。它们不是同一个按钮的不同名称，而是不同的数据契约、参数组合和 Provider 调用。

## 四种主要模式

| 模式 | 必需输入 | 提示词重点 | 典型输出 |
|---|---|---|---|
| 文生图 | 文字 | 主体、环境、构图、镜头、光线、风格 | 图片候选 |
| 图生图 | 一张或多张图片 + 文字 | 保留项、修改项、输入保真度、修改强度 | 图片变体或编辑结果 |
| 文生视频 | 文字 | 动作过程、镜头运动、节奏、时长、声音 | 独立视频镜头 |
| 图生视频 | 首帧或参考图 + 文字 | 人物怎么动、环境怎么动、镜头怎么动 | 受图片约束的视频镜头 |

### 文生图

画布连接可以是：

```text
剧本 / 分镜 / Prompt → 文生图任务 → 图片候选 V1 / V2 / V3
```

核心字段：

- `prompt`
- `negativePrompt`
- `model`
- `ratio` 或 `size`
- `quality`
- `variants`
- `seed`
- `background`
- `outputFormat`

文生图不需要输入图片。参考图一旦成为必要条件，就应切换为图生图或多参考图模式。

### 图生图

画布连接：

```text
图片 / 人物资产 / 场景资产 / 分镜图 → 图生图任务 → 图片候选
```

额外字段：

- `inputAssetIds` 或 `inputUrls`
- `strength`：允许改变原图的幅度
- `inputFidelity`：是否优先保留输入图身份和细节
- `preserveComposition`：是否尽量保持原构图
- 局部重绘还需要 `maskAssetId`

图生图任务没有输入素材时，前端禁止提交。

### 文生视频

画布连接：

```text
分镜 / 视频 Prompt → 文生视频任务 → 视频候选
```

核心字段：

- `prompt`
- `model`
- `ratio`
- `durationSeconds`
- `resolution`
- `fps`
- `cameraMotion`
- `generateAudio`
- `loop`

视频提示词不能只堆静态画面名词，还应说明动作随时间如何发生。

### 图生视频

画布连接：

```text
图片候选 / 参考图 / 分镜图 → 图生视频任务 → 视频候选
```

额外字段：

- 首帧图片
- `motionStrength`
- 人物动作
- 环境运动
- 镜头运动
- 时长和分辨率

图生视频的提示词应重点描述运动，不必机械重复输入图已经表达清楚的静态信息。

## 高级模式

### 首尾帧生视频

需要两张图片，连接顺序代表首帧和尾帧：

```text
首帧图片 ─┐
           ├→ 首尾帧任务 → 视频候选
尾帧图片 ─┘
```

部分 Provider 通过关键帧对象表达，部分 Provider 需要专用端点。

### 多参考图生图

同时引用人物、服装、场景、道具和风格。后续需要在连线上补充引用角色：

- character
- scene
- style
- composition
- prop

### 局部重绘

必须同时具备原图和遮罩。遮罩与原图尺寸需要一致，具体透明/黑白语义由 Provider Adapter 归一化。

### 视频延长

某些 Provider 不能只依赖导出的 MP4，需要原始生成任务 ID。因此输出节点必须保存：

- `provider`
- `externalJobId`
- `previewUrl`
- 原始模型和参数

## Provider 配置

模型设置分成四个互不混用的配置：

- `agent`：剧本 Agent 和 Skills
- `image`：OpenAI-compatible 图片生成与编辑
- `runway`：Runway 异步图片/视频任务
- `luma`：Luma 图片、视频和关键帧任务

API Key 分别加密保存，图片任务不会自动借用 Agent Key，视频任务也不会误用图片 Provider。

## 当前 Adapter 状态

### OpenAI-compatible 图片

- 文生图：`/images/generations`
- 图生图与编辑：multipart `/images/edits`
- 输入图片必须是可获取的文件或对象存储 URL

### Runway

- 文生视频
- 图生视频
- 文/参考图生图
- 视频转视频
- 异步任务轮询

具体模型支持的画幅、时长和输入形式仍由 Runway 当前模型决定。

### Luma

- 文生图
- 图片参考生图
- 文生视频
- 首帧图生视频
- 首尾关键帧生视频
- 异步生成状态轮询

视频延长需要保存原始 Luma generation ID。

## 尚未完成的基础设施

目前画布可以携带 `inputUrls` 和 `inputAssetIds`，但正式上线还需要完整的媒体上传链路：

1. 前端请求预签名上传地址。
2. 浏览器把图片或视频直接上传到 S3、OSS、COS 或 MinIO。
3. 后端创建 `assets` 记录并保存哈希和元数据。
4. 任务提交时把对象地址转换为 Provider 可访问的短时 URL。
5. 生成结果下载并转存到自己的对象存储，避免第三方临时链接过期。

没有完成这条链路前，图生图和图生视频只能使用已经具备 HTTPS `previewUrl` 的输入素材。不要把这一阶段描述成完整生产可用。

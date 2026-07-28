import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { StudioNodeData, StudioNodeKind, StudioNodeStatus } from "@/lib/studio-types";

const kindLabels: Record<StudioNodeKind, string> = {
  idea: "创意",
  script: "剧本",
  character: "角色资产",
  scene: "场景资产",
  shot: "镜头",
  generation: "生成任务",
  review: "镜头验收",
  timeline: "时间线",
};

const statusLabels: Record<StudioNodeStatus, string> = {
  draft: "草稿",
  ready: "可执行",
  running: "运行中",
  "needs-review": "待验收",
  approved: "已确认",
  blocked: "已阻塞",
};

export function StudioNodeCard({ data, selected }: NodeProps) {
  const nodeData = data as StudioNodeData;

  return (
    <article className={`studio-node ${selected ? "selected" : ""}`}>
      <Handle type="target" position={Position.Left} />
      <div className="node-heading">
        <span className="node-kind">{kindLabels[nodeData.kind]}</span>
        <span className={`node-status ${nodeData.status}`}>{statusLabels[nodeData.status]}</span>
      </div>
      <h3>{nodeData.label}</h3>
      <p>{nodeData.summary}</p>
      {typeof nodeData.progress === "number" ? (
        <div className="node-progress" aria-label={`进度 ${nodeData.progress}%`}>
          <span style={{ width: `${nodeData.progress}%` }} />
        </div>
      ) : null}
      <div className="node-meta">
        <span>{nodeData.version ?? "未版本化"}</span>
        <span>打开详情</span>
      </div>
      <Handle type="source" position={Position.Right} />
    </article>
  );
}

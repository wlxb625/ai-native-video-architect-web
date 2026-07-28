"use client";

import { useCallback, useMemo, useState } from "react";
import {
  addEdge,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Connection,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { initialEdges, initialNodes } from "@/lib/demo-project";
import type { StudioNode, StudioNodeData, StudioNodeKind, StudioView } from "@/lib/studio-types";
import { StudioNodeCard } from "./studio-node-card";

const nodeTypes = {
  idea: StudioNodeCard,
  script: StudioNodeCard,
  character: StudioNodeCard,
  scene: StudioNodeCard,
  shot: StudioNodeCard,
  generation: StudioNodeCard,
  review: StudioNodeCard,
  timeline: StudioNodeCard,
} as NodeTypes;

const creativeKinds = new Set<StudioNodeKind>(["idea", "script", "character", "scene"]);
const productionKinds = new Set<StudioNodeKind>(["shot", "generation", "review", "timeline"]);

const newNodeDefaults: Record<StudioNodeKind, Pick<StudioNodeData, "label" | "summary" | "status">> = {
  idea: { label: "新创意", summary: "记录核心概念、主题或一个关键画面。", status: "draft" },
  script: { label: "新剧本节点", summary: "写入场景动作、对白和退出状态。", status: "draft" },
  character: { label: "新角色资产", summary: "建立角色身份、造型和状态参考。", status: "draft" },
  scene: { label: "新场景资产", summary: "建立空间、灯光和材质连续性。", status: "draft" },
  shot: { label: "新镜头", summary: "设置构图、动作、时长和控制帧。", status: "draft" },
  generation: { label: "新生成任务", summary: "等待选择模型和输入素材。", status: "draft" },
  review: { label: "新验收节点", summary: "检查身份、动作、灯光和可剪辑性。", status: "draft" },
  timeline: { label: "新时间线", summary: "汇总已通过镜头并组织输出。", status: "draft" },
};

interface StudioCanvasProps {
  view: StudioView;
  onViewChange: (view: StudioView) => void;
  onNodeSelect: (node: StudioNode | null) => void;
  createRequest: { kind: StudioNodeKind; nonce: number } | null;
}

export function StudioCanvas({ view, onViewChange, onNodeSelect, createRequest }: StudioCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<StudioNode>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [handledNonce, setHandledNonce] = useState(0);

  if (createRequest && createRequest.nonce !== handledNonce) {
    const { kind, nonce } = createRequest;
    const defaults = newNodeDefaults[kind];
    const nextNode: StudioNode = {
      id: `${kind}-${Date.now()}`,
      type: kind,
      position: { x: 260 + nodes.length * 36, y: 120 + (nodes.length % 4) * 120 },
      data: { kind, ...defaults, version: "V01" },
    };
    setHandledNonce(nonce);
    setNodes((current) => [...current, nextNode]);
  }

  const onConnect = useCallback(
    (connection: Connection) => setEdges((current) => addEdge({ ...connection, animated: true }, current)),
    [setEdges],
  );

  const visibleNodes = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        hidden:
          view === "creative"
            ? !creativeKinds.has(node.data.kind)
            : view === "production"
              ? !productionKinds.has(node.data.kind)
              : false,
      })),
    [nodes, view],
  );

  return (
    <main className="canvas-stage">
      <div className="canvas-toolbar view-switch" aria-label="画布视图">
        {(["all", "creative", "production"] as StudioView[]).map((item) => (
          <button
            className={`view-button ${view === item ? "active" : ""}`}
            key={item}
            onClick={() => onViewChange(item)}
            type="button"
          >
            {item === "all" ? "全部" : item === "creative" ? "创作" : "生产"}
          </button>
        ))}
      </div>
      <ReactFlow
        nodes={visibleNodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => onNodeSelect(node as StudioNode)}
        onPaneClick={() => onNodeSelect(null)}
        fitView
        minZoom={0.25}
        maxZoom={1.8}
        deleteKeyCode={["Backspace", "Delete"]}
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1.1} color="rgba(255,255,255,0.10)" />
        <MiniMap pannable zoomable nodeColor="#7868d8" maskColor="rgba(7,8,12,0.72)" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </main>
  );
}

import type { Edge, Node } from "@xyflow/react";

export type StudioNodeKind =
  | "idea"
  | "script"
  | "character"
  | "scene"
  | "shot"
  | "generation"
  | "review"
  | "timeline";

export type StudioNodeStatus =
  | "draft"
  | "ready"
  | "running"
  | "needs-review"
  | "approved"
  | "blocked";

export type StudioNodeData = Record<string, unknown> & {
  label: string;
  summary: string;
  kind: StudioNodeKind;
  status: StudioNodeStatus;
  progress?: number;
  version?: string;
  details?: Record<string, string>;
};

export type StudioNode = Node<StudioNodeData, StudioNodeKind>;
export type StudioEdge = Edge;
export type StudioView = "all" | "creative" | "production";

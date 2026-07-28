import { create } from 'zustand';
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type Viewport,
} from '@xyflow/react';
import { api } from './api';

interface StudioState {
  projectId: string | null;
  version: number;
  nodes: Node[];
  edges: Edge[];
  viewport: Viewport;
  dirty: boolean;
  saving: boolean;
  conflict: boolean;
  setProject: (
    projectId: string,
    snapshot: { version: number; nodes: Node[]; edges: Edge[]; viewport: Viewport },
  ) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (
    type: string,
    position: { x: number; y: number },
    data?: Record<string, unknown>,
  ) => string;
  updateNode: (id: string, patch: Record<string, unknown>) => void;
  deleteNode: (id: string) => void;
  setViewport: (viewport: Viewport) => void;
  save: () => Promise<void>;
}

const createId = () => crypto.randomUUID();

export const useStudio = create<StudioState>((set, get) => ({
  projectId: null,
  version: 0,
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  dirty: false,
  saving: false,
  conflict: false,

  setProject: (projectId, snapshot) =>
    set({ projectId, ...snapshot, dirty: false, conflict: false }),

  onNodesChange: (changes) =>
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes),
      dirty: true,
    })),

  onEdgesChange: (changes) =>
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
      dirty: true,
    })),

  onConnect: (connection) =>
    set((state) => ({
      edges: addEdge(
        {
          ...connection,
          id: `edge-${createId()}`,
          type: 'smoothstep',
          data: { relation: 'generation-input' },
        },
        state.edges,
      ),
      dirty: true,
    })),

  addNode: (type, position, data = {}) => {
    const nodeId = `node-${createId()}`;
    set((state) => ({
      nodes: [
        ...state.nodes,
        {
          id: nodeId,
          type,
          position,
          data: {
            status: 'draft',
            ...data,
          },
        },
      ],
      dirty: true,
    }));
    return nodeId;
  },

  updateNode: (nodeId, patch) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...patch } }
          : node,
      ),
      dirty: true,
    })),

  deleteNode: (nodeId) =>
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== nodeId),
      edges: state.edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId,
      ),
      dirty: true,
    })),

  setViewport: (viewport) => set({ viewport, dirty: true }),

  save: async () => {
    const state = get();
    if (!state.projectId || !state.dirty || state.saving) {
      return;
    }

    set({ saving: true });
    try {
      const result = await api.saveCanvas(state.projectId, {
        version: state.version,
        viewport: state.viewport,
        nodes: state.nodes as never,
        edges: state.edges as never,
      });
      set({
        version: result.version,
        dirty: false,
        saving: false,
        conflict: false,
      });
    } catch (error: unknown) {
      const status =
        typeof error === 'object' && error !== null && 'status' in error
          ? Number((error as { status?: number }).status)
          : undefined;
      set({ saving: false, conflict: status === 409 });
      throw error;
    }
  },
}));

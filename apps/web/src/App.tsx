import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  type Node,
  type ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Bot,
  ChevronDown,
  CircleHelp,
  Cloud,
  Film,
  Image as ImageIcon,
  Layers3,
  Plus,
  Search,
  Settings2,
  Sparkles,
  Upload,
} from 'lucide-react';
import type { CanvasSnapshot } from '@cineweave/contracts';
import { api, setAccessToken } from './api';
import { useStudio } from './store';
import { StudioNode } from './components/StudioNode';
import { ContextMenu } from './components/ContextMenu';
import { Inspector } from './components/Inspector';
import { AuthScreen } from './components/AuthScreen';
import { AssetShelf } from './components/AssetShelf';
import { AgentPanel, type AgentSkillId } from './components/AgentPanel';

const nodeTypes = {
  script: StudioNode,
  analysis: StudioNode,
  character: StudioNode,
  scene: StudioNode,
  referenceImage: StudioNode,
  storyboard: StudioNode,
  imageGen: StudioNode,
  imageOutput: StudioNode,
  videoGen: StudioNode,
  videoOutput: StudioNode,
  promptPack: StudioNode,
  note: StudioNode,
  group: StudioNode,
};

const rainStation =
  'linear-gradient(165deg, rgba(10,16,24,.05), rgba(7,9,14,.9)), linear-gradient(8deg, #111722 0 38%, #536170 39% 40%, #151c27 41% 65%, #2f4051 66% 68%, #0a0e15 69%)';
const cameraCloseup =
  'radial-gradient(circle at 56% 48%, #718294 0 6%, #111925 7% 17%, transparent 18%), linear-gradient(135deg, rgba(88,103,119,.8), rgba(12,17,24,.98))';
const corridorShot =
  'linear-gradient(90deg, rgba(195,215,224,.12), transparent 18% 80%, rgba(126,153,168,.1)), linear-gradient(155deg, #293641, #101821 58%, #06090e)';

const demoSnapshot: CanvasSnapshot = {
  version: 0,
  viewport: { x: 38, y: 88, zoom: 0.78 },
  nodes: [
    {
      id: 'script-main',
      type: 'script',
      position: { x: 40, y: 70 },
      data: {
        title: '《雨夜入站》第一场',
        summary: '末班地铁站，林澈捡到一台仍在录制的旧摄像机。',
        content:
          '广播提示末班车即将进站。林澈弯腰捡起摄像机，屏幕里却提前出现了“下一站”的空月台。',
        status: 'ready',
      },
    },
    {
      id: 'character-lin',
      type: 'character',
      position: { x: 420, y: -80 },
      data: {
        title: '林澈 · 一致性角色卡',
        summary: '克制、警觉；并不寻找真相，只想确认姐姐是否仍活着。',
        previewStyle:
          'linear-gradient(145deg, rgba(61,78,99,.35), rgba(12,17,25,.96)), radial-gradient(circle at 48% 26%, #bdc7cf 0 8%, #566371 9% 20%, transparent 21%)',
        lockedTraits: '黑色齐肩短发，深灰风衣，右耳银色耳钉，疲惫但克制。',
        status: 'ready',
      },
    },
    {
      id: 'scene-station',
      type: 'scene',
      position: { x: 420, y: 260 },
      data: {
        title: '末班地铁站',
        summary: '冷白灯、积水反光、远处风压；避免直接追逐。',
        previewStyle: rainStation,
        status: 'ready',
      },
    },
    {
      id: 'shot-01',
      type: 'storyboard',
      position: { x: 820, y: 10 },
      data: {
        title: '镜头 01 · 摄像机异常',
        shotNumber: '01',
        summary: '特写。屏幕先出现下一站，现实广播随后才响起。',
        prompt:
          '旧摄像机屏幕特写，潮湿冷白地铁站，屏幕中的空月台比现实提前一秒，克制现实主义，浅景深',
        previewStyle: cameraCloseup,
        duration: '4s',
        ratio: '16:9',
        status: 'ready',
      },
    },
    {
      id: 'image-gen-01',
      type: 'imageGen',
      position: { x: 1220, y: -40 },
      data: {
        title: '镜头 01 · 图片候选',
        summary: '引用林澈、地铁站和旧摄像机三项资产。',
        prompt:
          '旧摄像机屏幕特写，冷灰现实主义，潮湿反光，屏幕中的空月台提前出现，电影摄影，细腻颗粒',
        negativePrompt: '文字，水印，额外手指，身份漂移，过度霓虹',
        model: 'Flux Adapter',
        ratio: '16:9',
        variants: '4',
        status: 'ready',
      },
    },
    {
      id: 'image-output-01',
      type: 'imageOutput',
      position: { x: 1610, y: -120 },
      data: {
        title: '图片候选 V3',
        summary: '已采用为视频首帧。',
        previewStyle: cameraCloseup,
        version: 'V3',
        model: 'Flux Adapter',
        ratio: '16:9',
        status: 'generated',
      },
    },
    {
      id: 'video-gen-01',
      type: 'videoGen',
      position: { x: 1990, y: -40 },
      data: {
        title: '首帧生视频',
        summary: '屏幕闪烁后，现实广播响起；镜头缓慢推近。',
        prompt:
          'camera slowly pushes in, screen flickers once, subtle handheld breathing, no sudden character movement',
        model: 'Seedance Adapter',
        ratio: '16:9',
        duration: '5s',
        status: 'ready',
      },
    },
    {
      id: 'video-output-01',
      type: 'videoOutput',
      position: { x: 2380, y: -120 },
      data: {
        title: '视频候选 V2',
        summary: '运镜稳定，屏幕闪烁时间正确。',
        previewStyle: corridorShot,
        duration: '5s',
        ratio: '16:9',
        model: 'Seedance Adapter',
        status: 'generated',
      },
    },
    {
      id: 'analysis-01',
      type: 'analysis',
      position: { x: 820, y: 360 },
      data: {
        title: '剧本诊断 · 开场',
        summary: '开场物件钩子清晰，但女主主动行为仍可提前。',
        items: [
          '让林澈先删除一段姐姐的旧语音，再捡到摄像机。',
          '将异常限制为“提前一秒”，便于后续视觉规则统一。',
          '第一场控制在 4 个镜头内，避免空间连续性成本。',
        ],
        status: 'generated',
      },
    },
  ],
  edges: [
    { id: 'e1', source: 'script-main', target: 'character-lin', type: 'smoothstep', data: {} },
    { id: 'e2', source: 'script-main', target: 'scene-station', type: 'smoothstep', data: {} },
    { id: 'e3', source: 'character-lin', target: 'shot-01', type: 'smoothstep', data: {} },
    { id: 'e4', source: 'scene-station', target: 'shot-01', type: 'smoothstep', data: {} },
    { id: 'e5', source: 'shot-01', target: 'image-gen-01', type: 'smoothstep', data: {} },
    { id: 'e6', source: 'image-gen-01', target: 'image-output-01', type: 'smoothstep', data: {} },
    { id: 'e7', source: 'image-output-01', target: 'video-gen-01', type: 'smoothstep', data: {} },
    { id: 'e8', source: 'video-gen-01', target: 'video-output-01', type: 'smoothstep', data: {} },
    { id: 'e9', source: 'script-main', target: 'analysis-01', type: 'smoothstep', data: {} },
  ],
};

type Project = { id: string; title: string };
type MenuState = {
  x: number;
  y: number;
  flow: { x: number; y: number };
  targetId?: string;
  targetType?: string;
};

function defaultNodeData(type: string): Record<string, unknown> {
  const defaults: Record<string, Record<string, unknown>> = {
    script: {
      title: '新剧本',
      summary: '输入故事梗概或粘贴剧本文本。',
      content: '',
    },
    character: {
      title: '新人物',
      summary: '补充外貌、服装、性格和禁止变化项。',
      lockedTraits: '',
    },
    scene: {
      title: '新场景',
      summary: '补充空间、时间、光线和关键道具。',
    },
    referenceImage: {
      title: '参考图',
      summary: '上传图片，或绑定资产库中的素材。',
    },
    storyboard: {
      title: '新分镜',
      summary: '描述景别、机位、动作和镜头运动。',
      shotNumber: 'NEW',
      ratio: '16:9',
    },
    imageGen: {
      title: '图片生成',
      summary: '连接分镜和参考素材后生成候选图片。',
      model: 'Image Provider',
      ratio: '16:9',
      variants: '4',
      prompt: '',
      negativePrompt: '',
    },
    videoGen: {
      title: '视频生成',
      summary: '连接首帧、尾帧或参考视频后生成候选。',
      model: 'Video Provider',
      ratio: '16:9',
      duration: '5s',
      prompt: '',
      negativePrompt: '',
    },
    analysis: {
      title: 'Agent 分析',
      summary: '结构化分析结果。',
      content: '',
    },
  };
  return defaults[type] ?? { title: '新节点', summary: '填写内容。' };
}

export default function App() {
  const studio = useStudio();
  const [authState, setAuthState] = useState<'checking' | 'required' | 'ready'>('checking');
  const [ready, setReady] = useState(false);
  const [selectedId, setSelectedId] = useState<string>();
  const [menu, setMenu] = useState<MenuState>();
  const [projectTitle, setProjectTitle] = useState('雾港计划');
  const [agentOpen, setAgentOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const reactFlowRef = useRef<ReactFlowInstance | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  const selected = useMemo(
    () => studio.nodes.find((node) => node.id === selectedId),
    [selectedId, studio.nodes],
  );

  const loadWorkspace = async () => {
    const projectsResponse = (await api.projects()) as { projects: Project[] };
    let project = projectsResponse.projects[0];
    if (!project) {
      const created = (await api.createProject('雾港计划')) as { project: Project };
      project = created.project;
    }
    setProjectTitle(project.title);
    const snapshot = await api.canvas(project.id);
    studio.setProject(project.id, snapshot as never);
    setReady(true);
    setAuthState('ready');
  };

  useEffect(() => {
    void (async () => {
      try {
        const auth = await api.refresh();
        setAccessToken(auth.accessToken);
        await loadWorkspace();
      } catch {
        setAuthState('required');
      }
    })();
  }, []);

  useEffect(() => {
    if (!studio.dirty || !studio.projectId || studio.projectId === 'demo-project') {
      return;
    }
    const timer = window.setTimeout(() => {
      void studio.save().catch(() => undefined);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [studio.nodes, studio.edges, studio.viewport, studio.dirty]);

  const reload = async () => {
    if (!studio.projectId || studio.projectId === 'demo-project') {
      return;
    }
    const snapshot = await api.canvas(studio.projectId);
    studio.setProject(studio.projectId, snapshot as never);
  };

  const viewportCenter = () => {
    const rect = canvasRef.current?.getBoundingClientRect();
    const screen = rect
      ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
      : { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    return reactFlowRef.current?.screenToFlowPosition(screen) ?? { x: 0, y: 0 };
  };

  const addNode = (
    type: string,
    position = viewportCenter(),
    data: Record<string, unknown> = {},
  ) => {
    const id = studio.addNode(type, position, {
      ...defaultNodeData(type),
      ...data,
    });
    setSelectedId(id);
    return id;
  };

  const addConnectedNode = (
    source: Node,
    type: string,
    data: Record<string, unknown> = {},
  ) => {
    const id = addNode(
      type,
      { x: source.position.x + 410, y: source.position.y },
      data,
    );
    studio.onConnect({
      source: source.id,
      target: id,
      sourceHandle: null,
      targetHandle: null,
    });
    return id;
  };

  const runAgent = async (skillId: AgentSkillId, instruction: string) => {
    if (!studio.projectId) {
      return;
    }
    setBusy(true);
    try {
      if (studio.projectId === 'demo-project') {
        const source = selected ?? studio.nodes.find((node) => node.type === 'script');
        const base = source?.position ?? viewportCenter();
        const analysisId = addNode(
          skillId === 'storyboard-planner' ? 'storyboard' : 'analysis',
          { x: base.x + 420, y: base.y + 300 },
          skillId === 'storyboard-planner'
            ? {
                title: 'Agent 分镜 · 镜头 02',
                shotNumber: '02',
                summary: '中近景。林澈抬头，广播内容与屏幕字幕完全一致。',
                prompt: '林澈抬头看向站台尽头，冷白灯，微弱风压，克制表情，中近景',
                previewStyle: corridorShot,
                status: 'generated',
              }
            : {
                title: 'Agent 分析 · 可执行修改',
                summary: instruction,
                items: [
                  '明确异常规则：画面永远比现实提前一秒。',
                  '让林澈在第一场完成一次主动选择，而不是只被动观察。',
                  '将复杂追逐替换为声音、反光和屏幕延迟，降低一致性风险。',
                ],
                content:
                  '结论：当前开场钩子成立，但人物目标需要更早出现。建议把姐姐的旧语音放在捡到摄像机之前。',
                status: 'generated',
              },
        );
        if (source) {
          studio.onConnect({
            source: source.id,
            target: analysisId,
            sourceHandle: null,
            targetHandle: null,
          });
        }
        setAgentOpen(false);
        return;
      }

      const response = await api.runSkill(studio.projectId, {
        skillId,
        instruction,
        sourceNodeIds: selected ? [selected.id] : [],
      });
      await api.streamRunEvents(response.run.id, (event) => {
        if (event.event === 'done') {
          void reload();
        }
      });
      setAgentOpen(false);
    } finally {
      setBusy(false);
    }
  };

  const runMediaGeneration = async (
    mediaType: 'image' | 'video',
    source = selected,
  ) => {
    if (!studio.projectId) {
      return;
    }

    setBusy(true);
    try {
      let generator = source;
      const requiredType = mediaType === 'image' ? 'imageGen' : 'videoGen';
      if (!generator || generator.type !== requiredType) {
        if (source) {
          const id = addConnectedNode(source, requiredType, {
            title: mediaType === 'image' ? '图片生成任务' : '视频生成任务',
            prompt: String(source.data.prompt ?? source.data.summary ?? ''),
            status: 'running',
          });
          generator = useStudio.getState().nodes.find((node) => node.id === id);
        } else {
          const id = addNode(requiredType, viewportCenter(), { status: 'running' });
          generator = useStudio.getState().nodes.find((node) => node.id === id);
        }
      } else {
        studio.updateNode(generator.id, { status: 'running' });
      }

      if (!generator) {
        return;
      }

      if (studio.projectId === 'demo-project') {
        const outputType = mediaType === 'image' ? 'imageOutput' : 'videoOutput';
        const outputId = addConnectedNode(generator, outputType, {
          title: mediaType === 'image' ? '图片候选 V1' : '视频候选 V1',
          summary:
            mediaType === 'image'
              ? '演示候选已生成，可继续生成变体或作为视频首帧。'
              : '演示视频已生成，可提取尾帧或继续延长。',
          previewStyle: mediaType === 'image' ? cameraCloseup : corridorShot,
          model: String(generator.data.model ?? 'Provider Adapter'),
          ratio: String(generator.data.ratio ?? '16:9'),
          duration: String(generator.data.duration ?? '5s'),
          version: 'V1',
          status: 'generated',
        });
        studio.updateNode(generator.id, { status: 'ready' });
        setSelectedId(outputId);
        return;
      }

      await useStudio.getState().save();
      const response = await api.generateMedia(studio.projectId, {
        nodeId: generator.id,
        mediaType,
        operation: mediaType === 'image' ? 'text-to-image' : 'image-to-video',
        prompt: String(generator.data.prompt ?? generator.data.summary ?? '生成媒体候选'),
        negativePrompt: String(generator.data.negativePrompt ?? ''),
        model: String(generator.data.model ?? ''),
        inputAssetIds: [],
        parameters: {
          ratio: generator.data.ratio ?? '16:9',
          duration: generator.data.duration,
          variants: generator.data.variants,
        },
      });
      await api.streamRunEvents(response.run.id, (event) => {
        if (event.event === 'done') {
          void reload();
        }
      });
    } finally {
      setBusy(false);
    }
  };

  if (authState === 'checking') {
    return (
      <div className="boot-screen">
        <div className="boot-orb" />
        <span>正在恢复安全会话…</span>
      </div>
    );
  }

  if (authState === 'required') {
    return (
      <AuthScreen
        onAuthenticated={() => void loadWorkspace().catch(() => setAuthState('required'))}
        onDemo={() => {
          studio.setProject('demo-project', demoSnapshot as never);
          setReady(true);
          setAuthState('ready');
        }}
      />
    );
  }

  const syncStatus = studio.conflict
    ? '版本冲突 · 重新载入'
    : studio.saving
      ? '保存中…'
      : studio.dirty
        ? '待保存'
        : '已同步';

  return (
    <div className="app-shell media-studio-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">
            <Film size={18} />
          </div>
          <span>CineWeave</span>
          <b>Media Studio</b>
        </div>

        <div className="project-switcher">
          <span className="project-dot" />
          <div>
            <small>当前项目</small>
            <strong>{projectTitle}</strong>
          </div>
          <ChevronDown size={15} />
        </div>

        <div className="top-actions">
          <button>
            <Search size={16} />
            <span>搜索素材</span>
          </button>
          <button
            className={`sync-state ${studio.conflict ? 'danger' : ''}`}
            onClick={() => studio.conflict && void reload()}
          >
            <Cloud size={15} />
            {syncStatus}
          </button>
          <button className="icon-button">
            <CircleHelp size={17} />
          </button>
          <button className="icon-button">
            <Settings2 size={17} />
          </button>
          <div className="avatar">CW</div>
        </div>
      </header>

      <AssetShelf onCreate={(type, data) => addNode(type, viewportCenter(), data)} />

      <main className="workspace">
        <div className="canvas-head media-canvas-head">
          <div>
            <span className="eyebrow">GENERATIVE MEDIA CANVAS</span>
            <h1>影视生成画布</h1>
            <p>素材关系在前台可见，Agent 与 Skills 在后台执行。</p>
          </div>
          <div className="canvas-actions">
            <button>
              <Upload size={15} /> 上传素材
            </button>
            <button onClick={() => addNode('imageGen')}>
              <ImageIcon size={15} /> 生图
            </button>
            <button onClick={() => addNode('videoGen')}>
              <Film size={15} /> 生视频
            </button>
            <button className="primary" onClick={() => setAgentOpen(true)}>
              <Bot size={16} /> AI 导演
            </button>
          </div>
        </div>

        <div
          className="canvas-frame"
          ref={canvasRef}
          onContextMenu={(event) => {
            event.preventDefault();
            const bounds = event.currentTarget.getBoundingClientRect();
            setMenu({
              x: event.clientX - bounds.left,
              y: event.clientY - bounds.top,
              flow:
                reactFlowRef.current?.screenToFlowPosition({
                  x: event.clientX,
                  y: event.clientY,
                }) ?? { x: 0, y: 0 },
            });
          }}
        >
          {ready && (
            <ReactFlow
              nodes={studio.nodes}
              edges={studio.edges}
              nodeTypes={nodeTypes}
              onInit={(instance) => {
                reactFlowRef.current = instance;
              }}
              onNodesChange={studio.onNodesChange}
              onEdgesChange={studio.onEdgesChange}
              onConnect={studio.onConnect}
              onNodeClick={(_, node) => setSelectedId(node.id)}
              onNodeContextMenu={(event, node) => {
                event.preventDefault();
                event.stopPropagation();
                setSelectedId(node.id);
                const bounds = canvasRef.current?.getBoundingClientRect();
                setMenu({
                  x: bounds ? event.clientX - bounds.left : event.clientX,
                  y: bounds ? event.clientY - bounds.top : event.clientY,
                  flow: node.position,
                  targetId: node.id,
                  targetType: node.type,
                });
              }}
              onPaneClick={() => setSelectedId(undefined)}
              onMoveEnd={(_, viewport) => studio.setViewport(viewport)}
              defaultViewport={studio.viewport}
              minZoom={0.12}
              maxZoom={2.2}
              selectionOnDrag
              panOnScroll
              panOnDrag={[1]}
              fitView
            >
              <Background variant={BackgroundVariant.Dots} gap={24} size={1.1} />
              <MiniMap pannable zoomable nodeStrokeWidth={3} />
              <Controls showInteractive={false} />
            </ReactFlow>
          )}

          <div className="canvas-mode-pill">
            <Layers3 size={13} /> 素材血缘模式
          </div>

          <div className="task-strip">
            <span><i className="task-dot image" />图片任务 1</span>
            <span><i className="task-dot video" />视频任务 0</span>
            <span><i className="task-dot agent" />Agent 运行 0</span>
            <b>所有输出均保留版本</b>
          </div>

          {menu && (
            <ContextMenu
              x={menu.x}
              y={menu.y}
              targetType={menu.targetType}
              onClose={() => setMenu(undefined)}
              onAdd={(type) => {
                const source = menu.targetId
                  ? studio.nodes.find((node) => node.id === menu.targetId)
                  : undefined;
                if (source) {
                  addConnectedNode(source, type);
                } else {
                  addNode(type, menu.flow);
                }
                setMenu(undefined);
              }}
              onAgent={() => {
                setAgentOpen(true);
                setMenu(undefined);
              }}
              onGenerate={(type) => {
                const source = menu.targetId
                  ? studio.nodes.find((node) => node.id === menu.targetId)
                  : selected;
                if (source) {
                  const id = addConnectedNode(source, type, {
                    prompt: String(source.data.prompt ?? source.data.summary ?? ''),
                  });
                  setSelectedId(id);
                } else {
                  addNode(type, menu.flow);
                }
                setMenu(undefined);
              }}
            />
          )}
        </div>
      </main>

      <Inspector
        node={selected}
        onUpdate={(patch) => selected && studio.updateNode(selected.id, patch)}
        onGenerate={(mediaType) =>
          void runMediaGeneration(
            mediaType ?? (selected?.type?.startsWith('video') ? 'video' : 'image'),
          )
        }
        onOpenAgent={() => setAgentOpen(true)}
      />

      <AgentPanel
        open={agentOpen}
        busy={busy}
        onClose={() => setAgentOpen(false)}
        onRun={(skillId, instruction) => void runAgent(skillId, instruction)}
      />

      <button
        className="floating-agent-button"
        onClick={() => setAgentOpen(true)}
        title="打开 AI 导演"
      >
        <Sparkles size={17} />
        <span>AI 导演</span>
      </button>

      <button
        className="floating-create-button"
        onClick={() => addNode('imageGen')}
        title="创建生成任务"
      >
        <Plus size={18} />
      </button>
    </div>
  );
}

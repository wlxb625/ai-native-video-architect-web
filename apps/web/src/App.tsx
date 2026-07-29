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
import { Bot, ChevronDown, Cloud, Film, Layers3, Sparkles } from 'lucide-react';
import type { CanvasSnapshot, MediaGenerationOperation } from '@cineweave/contracts';
import { api, setAccessToken } from './api';
import { useStudio } from './store';
import { StudioNode } from './components/StudioNode';
import { ContextMenu } from './components/ContextMenu';
import { Inspector } from './components/Inspector';
import { AuthScreen } from './components/AuthScreen';
import { AssetShelf } from './components/AssetShelf';
import { AgentPanel, type AgentSkillId } from './components/AgentPanel';
import { GenerationModeBar } from './components/GenerationModeBar';
import { HoverEdgePanel } from './components/HoverEdgePanel';
import {
  getGenerationMode,
  isImageLikeNode,
  isVideoLikeNode,
} from './generationModes';

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
  viewport: { x: 10, y: 80, zoom: 0.78 },
  nodes: [
    {
      id: 'script-main',
      type: 'script',
      position: { x: 20, y: 90 },
      data: {
        title: '《雨夜入站》第一场',
        summary: '末班地铁站，林澈捡到一台仍在录制的旧摄像机。',
        content: '广播提示末班车即将进站。林澈弯腰捡起摄像机，屏幕里却提前出现了下一站的空月台。',
        status: 'ready',
      },
    },
    {
      id: 'character-lin',
      type: 'character',
      position: { x: 430, y: -80 },
      data: {
        title: '林澈 · 一致性角色卡',
        summary: '克制、警觉；只想确认姐姐是否仍活着。',
        lockedTraits: '黑色齐肩短发，深灰风衣，右耳银色耳钉，疲惫但克制。',
        status: 'ready',
      },
    },
    {
      id: 'scene-station',
      type: 'scene',
      position: { x: 430, y: 320 },
      data: {
        title: '末班地铁站',
        summary: '冷白灯、积水反光、远处风压，空间安静。',
        previewStyle: rainStation,
        status: 'ready',
      },
    },
    {
      id: 'shot-01',
      type: 'storyboard',
      position: { x: 840, y: 40 },
      data: {
        title: '镜头 01 · 摄像机异常',
        shotNumber: '01',
        summary: '特写。屏幕先出现下一站，现实广播随后才响起。',
        prompt: '旧摄像机屏幕特写，潮湿冷白地铁站，屏幕中的空月台比现实提前一秒。',
        previewStyle: cameraCloseup,
        ratio: '16:9',
        status: 'ready',
      },
    },
    {
      id: 'image-gen-01',
      type: 'imageGen',
      position: { x: 1260, y: 40 },
      data: {
        operation: 'text-to-image',
        title: '镜头 01 · 文生图',
        summary: '用自然语言描述画面，系统自动整理模型提示词。',
        description: '雨夜末班地铁站，短发女孩双手捧着旧摄像机，屏幕显示空月台，手部与屏幕为画面焦点，冷白灯反射在潮湿地面。',
        promptMode: 'auto',
        promptGuidance: '现实主义、克制、低饱和，避免过度霓虹。',
        prompt: '',
        provider: 'image',
        model: 'gpt-image-1',
        ratio: '16:9',
        variants: 1,
        quality: 'standard',
        outputFormat: 'webp',
        status: 'ready',
      },
    },
    {
      id: 'image-output-01',
      type: 'imageOutput',
      position: { x: 1700, y: 40 },
      data: {
        title: '图片候选 V1 · 演示素材',
        summary: '演示画面，不是外部图片模型的真实返回结果。',
        description: '雨夜地铁站里的旧摄像机屏幕特写。',
        finalPrompt: '以冷灰现实主义表现潮湿末班地铁站，旧摄像机屏幕为视觉中心，屏幕中空月台提前出现，浅景深，克制电影照明。',
        promptSource: 'rule-fallback',
        previewStyle: cameraCloseup,
        version: 'V1',
        ratio: '16:9',
        status: 'generated',
      },
    },
    {
      id: 'video-gen-01',
      type: 'videoGen',
      position: { x: 2140, y: 40 },
      data: {
        operation: 'image-to-video',
        title: '图片 V1 · 图生视频',
        summary: '连接首帧后描述接下来的动作和运镜。',
        description: '从当前首帧开始，屏幕闪烁一次，女孩的手指轻轻收紧，远处列车风吹动她的发梢，镜头缓慢推近屏幕。',
        promptMode: 'auto',
        promptGuidance: '动作幅度小，保持人物与摄像机外观稳定。',
        prompt: '',
        provider: 'runway',
        model: 'gen4.5',
        ratio: '16:9',
        durationSeconds: 5,
        resolution: '720p',
        fps: 24,
        motionStrength: 0.45,
        cameraMotion: '缓慢推近',
        inlineInputUrls: [],
        status: 'ready',
      },
    },
    {
      id: 'video-output-01',
      type: 'videoOutput',
      position: { x: 2580, y: 40 },
      data: {
        title: '视频候选 V1 · 演示素材',
        summary: '演示预览，不是视频 Provider 的真实返回结果。',
        previewStyle: corridorShot,
        durationSeconds: 5,
        ratio: '16:9',
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

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isMediaReference(value: string): boolean {
  return /^https:\/\//i.test(value) || /^data:(image|video)\/[a-z0-9.+-]+;base64,/i.test(value);
}

function rulePreview(operation: MediaGenerationOperation, description: string, guidance: string, inputCount: number) {
  const reference = inputCount > 0
    ? operation === 'first-last-frame-video'
      ? '以图片1为首帧、图片2为尾帧，'
      : operation.includes('video') && operation !== 'text-to-video'
        ? '参考输入素材，'
        : '参考图片1，'
    : '';
  const modeRule: Partial<Record<MediaGenerationOperation, string>> = {
    'text-to-image': '生成一张全新的单帧画面，明确主体、环境、构图、景别、光线和质感。',
    'image-to-image': '保留输入图的人物身份与主要构图，只修改描述中指定的内容。',
    'multi-reference-image': '综合人物、场景和风格参考，生成统一的新画面。',
    inpaint: '只修改指定区域，其余画面保持不变并自然衔接。',
    'text-to-video': '生成连续短镜头，描述可见动作链、环境变化和镜头运动。',
    'image-to-video': '把图片1作为首帧，重点描述首帧之后的动作与运镜。',
    'first-last-frame-video': '描述两帧之间单向、连续且可见的过渡过程。',
    'video-extend': '从原视频结束状态继续，保持动作方向、光线和运镜连续。',
  };
  return [reference + (modeRule[operation] ?? '根据描述生成媒体内容。'), `创作目标：${description}`, guidance ? `补充要求：${guidance}` : '']
    .filter(Boolean)
    .join('\n');
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

  const inputNodes = useMemo(() => {
    if (!selected) return [];
    const sourceIds = studio.edges.filter((edge) => edge.target === selected.id).map((edge) => edge.source);
    return studio.nodes.filter((node) => sourceIds.includes(node.id));
  }, [selected, studio.edges, studio.nodes]);

  const renderedNodes = useMemo(() => studio.nodes.map((node) => {
    if (node.type !== 'imageGen' && node.type !== 'videoGen') return node;
    const connected = studio.edges.filter((edge) => edge.target === node.id).length;
    const inline = Array.isArray(node.data.inlineInputUrls) ? node.data.inlineInputUrls.length : 0;
    return { ...node, data: { ...node.data, inputCount: connected + inline } };
  }), [studio.nodes, studio.edges]);

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
    if (!studio.dirty || !studio.projectId || studio.projectId === 'demo-project') return;
    const timer = window.setTimeout(() => void studio.save().catch(() => undefined), 900);
    return () => window.clearTimeout(timer);
  }, [studio.nodes, studio.edges, studio.viewport, studio.dirty]);

  const reload = async () => {
    if (!studio.projectId || studio.projectId === 'demo-project') return;
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

  const addNode = (type: string, position = viewportCenter(), data: Record<string, unknown> = {}) => {
    const id = studio.addNode(type, position, { title: '新节点', summary: '', ...data });
    setSelectedId(id);
    return id;
  };

  const addConnectedNode = (source: Node, type: string, data: Record<string, unknown> = {}) => {
    const id = addNode(type, { x: source.position.x + 430, y: source.position.y }, data);
    studio.onConnect({ source: source.id, target: id, sourceHandle: null, targetHandle: null });
    return id;
  };

  const createGenerationMode = (operation: MediaGenerationOperation, source = selected) => {
    const mode = getGenerationMode(operation);
    const sourceIsCompatible = source && (
      mode.inputKind === 'image' || mode.inputKind === 'two-images'
        ? isImageLikeNode(source.type)
        : mode.inputKind === 'video'
          ? isVideoLikeNode(source.type)
          : false
    );
    const inheritedDescription = source
      ? String(source.data.description ?? source.data.summary ?? source.data.prompt ?? '')
      : '';
    const data = {
      ...mode.defaults,
      description: inheritedDescription,
      promptMode: 'auto',
      prompt: '',
    };
    const id = sourceIsCompatible
      ? addConnectedNode(source, mode.nodeType, data)
      : addNode(mode.nodeType, viewportCenter(), data);
    setSelectedId(id);
    return id;
  };

  const runAgent = async (skillId: AgentSkillId, instruction: string) => {
    if (!studio.projectId) return;
    setBusy(true);
    try {
      if (studio.projectId === 'demo-project') {
        const source = selected ?? studio.nodes.find((node) => node.type === 'script');
        const base = source?.position ?? viewportCenter();
        const analysisId = addNode(
          skillId === 'storyboard-planner' ? 'storyboard' : 'analysis',
          { x: base.x + 430, y: base.y + 300 },
          skillId === 'storyboard-planner'
            ? {
                title: 'Agent 分镜 · 镜头 02',
                shotNumber: '02',
                summary: '中近景。林澈抬头，广播内容与屏幕字幕完全一致。',
                prompt: '林澈抬头看向站台尽头，冷白灯，微弱风压，中近景。',
                previewStyle: corridorShot,
                status: 'generated',
              }
            : {
                title: 'Agent 分析 · 演示结果',
                summary: instruction,
                items: [
                  '明确异常规则：画面永远比现实提前一秒。',
                  '让林澈在第一场完成一次主动选择。',
                  '用声音、反光和屏幕延迟代替复杂追逐。',
                ],
                status: 'generated',
              },
        );
        if (source) studio.onConnect({ source: source.id, target: analysisId, sourceHandle: null, targetHandle: null });
        setAgentOpen(false);
        return;
      }
      const response = await api.runSkill(studio.projectId, {
        skillId,
        instruction,
        sourceNodeIds: selected ? [selected.id] : [],
      });
      await api.streamRunEvents(response.run.id, (event) => {
        if (event.event === 'done') void reload();
      });
      setAgentOpen(false);
    } finally {
      setBusy(false);
    }
  };

  const runMediaGeneration = async (source = selected) => {
    if (!studio.projectId || !source) return;

    if (source.type === 'imageOutput' || source.type === 'referenceImage') {
      createGenerationMode('image-to-image', source);
      return;
    }
    if (source.type === 'videoOutput') {
      createGenerationMode('video-extend', source);
      return;
    }
    if (source.type !== 'imageGen' && source.type !== 'videoGen') return;

    const generator = source;
    const mode = getGenerationMode(generator.data.operation);
    const description = String(generator.data.description ?? '').trim();
    const promptMode = String(generator.data.promptMode ?? 'auto') as 'auto' | 'manual';
    const manualPrompt = String(generator.data.prompt ?? '').trim();
    if (!description) {
      window.alert('请先填写“想生成什么”。系统会根据这段描述整理最终提示词。');
      return;
    }
    if (promptMode === 'manual' && !manualPrompt) {
      window.alert('当前是手动 Prompt 模式，请填写最终模型提示词。');
      return;
    }

    const current = useStudio.getState();
    const incomingIds = current.edges.filter((edge) => edge.target === generator.id).map((edge) => edge.source);
    const incoming = current.nodes.filter((node) => incomingIds.includes(node.id));
    const inputAssetIds = incoming.map((node) => node.data.assetId).filter(isUuid);
    const connectedUrls = incoming
      .map((node) => String(node.data.previewUrl ?? ''))
      .filter(isMediaReference);
    const inlineUrls = Array.isArray(generator.data.inlineInputUrls)
      ? generator.data.inlineInputUrls.filter((value): value is string => typeof value === 'string' && isMediaReference(value))
      : [];
    const inputUrls = [...connectedUrls, ...inlineUrls];
    const required = mode.inputKind === 'two-images' ? 2 : mode.inputKind === 'none' ? 0 : 1;
    const realInputCount = inputAssetIds.length + inputUrls.length;

    if (studio.projectId !== 'demo-project' && realInputCount < required) {
      window.alert(`${mode.title}需要真实图片或视频。请在右侧参数面板直接上传本地素材，或连接带有可访问地址的结果节点。`);
      return;
    }

    setBusy(true);
    studio.updateNode(generator.id, { status: 'running' });
    try {
      if (studio.projectId === 'demo-project') {
        const compiled = promptMode === 'manual'
          ? manualPrompt
          : rulePreview(
              mode.id,
              description,
              String(generator.data.promptGuidance ?? ''),
              Math.max(incoming.length, inlineUrls.length),
            );
        const outputType = mode.mediaType === 'image' ? 'imageOutput' : 'videoOutput';
        const outputId = addConnectedNode(generator, outputType, {
          title: `${mode.title} · 描述编译预览`,
          summary: '演示模式只展示描述如何变成模型提示词，不会调用外部模型。',
          description,
          draftPrompt: compiled,
          finalPrompt: compiled,
          prompt: compiled,
          promptSource: promptMode === 'manual' ? 'manual' : 'rule-fallback',
          promptNotes: ['登录并配置媒体 Provider 后才会产生真实图片或视频。'],
          previewStyle: mode.mediaType === 'image' ? cameraCloseup : corridorShot,
          operation: mode.id,
          model: String(generator.data.model ?? 'Provider Adapter'),
          ratio: String(generator.data.ratio ?? '16:9'),
          durationSeconds: Number(generator.data.durationSeconds ?? 5),
          version: 'V1',
          status: 'generated',
        });
        studio.updateNode(generator.id, { status: 'ready', draftPrompt: compiled, finalPrompt: compiled, promptSource: promptMode === 'manual' ? 'manual' : 'rule-fallback' });
        setSelectedId(outputId);
        return;
      }

      await useStudio.getState().save();
      const response = await api.generateMedia(studio.projectId, {
        nodeId: generator.id,
        mediaType: mode.mediaType,
        operation: mode.id,
        description,
        promptMode,
        promptGuidance: String(generator.data.promptGuidance ?? ''),
        prompt: manualPrompt,
        negativePrompt: String(generator.data.negativePrompt ?? ''),
        provider: String(generator.data.provider ?? '') || undefined,
        model: String(generator.data.model ?? '') || undefined,
        inputNodeIds: incoming.map((node) => node.id),
        inputAssetIds,
        inputUrls,
        parameters: {
          ratio: generator.data.ratio as never,
          size: generator.data.size as string | undefined,
          resolution: generator.data.resolution as never,
          quality: generator.data.quality as never,
          variants: Number(generator.data.variants ?? 1),
          seed: Number(generator.data.seed ?? 0),
          background: generator.data.background as never,
          outputFormat: generator.data.outputFormat as never,
          strength: Number(generator.data.strength ?? 0.55),
          inputFidelity: generator.data.inputFidelity as never,
          preserveComposition: Boolean(generator.data.preserveComposition ?? true),
          durationSeconds: Number(generator.data.durationSeconds ?? 5),
          fps: Number(generator.data.fps ?? 24),
          motionStrength: Number(generator.data.motionStrength ?? 0.45),
          cameraMotion: String(generator.data.cameraMotion ?? ''),
          generateAudio: Boolean(generator.data.generateAudio ?? false),
          loop: Boolean(generator.data.loop ?? false),
          providerParameters: {},
        },
      });
      await api.streamRunEvents(response.run.id, (event) => {
        if (event.event === 'done') void reload();
      });
    } finally {
      setBusy(false);
      studio.updateNode(generator.id, { status: 'ready' });
    }
  };

  if (authState === 'checking') {
    return <div className="boot-screen"><div className="boot-orb" /><span>正在恢复安全会话…</span></div>;
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
    ? '版本冲突'
    : studio.saving
      ? '保存中…'
      : studio.dirty
        ? '待保存'
        : '已同步';

  return (
    <div className="app-shell media-studio-shell canvas-first-shell">
      <header className="topbar compact-topbar">
        <div className="brand">
          <div className="brand-mark"><Film size={18} /></div>
          <span>CineWeave</span>
          <b>Generation Studio</b>
        </div>
        <div className="project-switcher">
          <span className="project-dot" />
          <div><small>当前项目</small><strong>{projectTitle}</strong></div>
          <ChevronDown size={15} />
        </div>
        <div className="topbar-version">DESCRIPTION COMPOSER V5</div>
        <div className="top-actions">
          <button
            className={`sync-state ${studio.conflict ? 'danger' : ''}`}
            onClick={() => studio.conflict && void reload()}
          >
            <Cloud size={15} />{syncStatus}
          </button>
          <button className="primary-action" onClick={() => setAgentOpen(true)}>
            <Bot size={15} />AI 导演
          </button>
        </div>
      </header>

      <main className="workspace canvas-first-workspace">
        <div
          className="canvas-frame canvas-first-frame"
          ref={canvasRef}
          onContextMenu={(event) => {
            event.preventDefault();
            const bounds = event.currentTarget.getBoundingClientRect();
            setMenu({
              x: event.clientX - bounds.left,
              y: event.clientY - bounds.top,
              flow: reactFlowRef.current?.screenToFlowPosition({ x: event.clientX, y: event.clientY }) ?? { x: 0, y: 0 },
            });
          }}
        >
          {ready && (
            <ReactFlow
              nodes={renderedNodes}
              edges={studio.edges}
              nodeTypes={nodeTypes}
              onInit={(instance) => { reactFlowRef.current = instance; }}
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

          <GenerationModeBar onCreate={(operation) => createGenerationMode(operation)} />
          <div className="canvas-mode-pill"><Layers3 size={13} /> 描述 → Prompt → 生成结果</div>
          <div className="task-strip compact-task-strip">
            <span><i className="task-dot image" />文生图 / 图生图</span>
            <span><i className="task-dot video" />文生视频 / 图生视频</span>
            <span><i className="task-dot agent" />Prompt Composer</span>
            <b>先写创作描述，不要求用户会写模型 Prompt</b>
          </div>

          {menu && (
            <ContextMenu
              x={menu.x}
              y={menu.y}
              targetType={menu.targetType}
              onClose={() => setMenu(undefined)}
              onAdd={(type) => {
                const source = menu.targetId ? studio.nodes.find((node) => node.id === menu.targetId) : undefined;
                if (source) addConnectedNode(source, type);
                else addNode(type, menu.flow, { title: type === 'script' ? '新剧本' : '新素材' });
                setMenu(undefined);
              }}
              onAgent={() => { setAgentOpen(true); setMenu(undefined); }}
              onGenerate={(type) => {
                const source = menu.targetId ? studio.nodes.find((node) => node.id === menu.targetId) : selected;
                const operation: MediaGenerationOperation = type === 'imageGen'
                  ? source && isImageLikeNode(source.type) ? 'image-to-image' : 'text-to-image'
                  : source && isImageLikeNode(source.type) ? 'image-to-video' : 'text-to-video';
                createGenerationMode(operation, source);
                setMenu(undefined);
              }}
            />
          )}
        </div>
      </main>

      <HoverEdgePanel side="left" storageKey="cineweave-assets-panel" label="素材库" defaultWidth={300} minWidth={240} maxWidth={520}>
        <AssetShelf onCreate={(type, data) => addNode(type, viewportCenter(), data)} />
      </HoverEdgePanel>

      <HoverEdgePanel side="right" storageKey="cineweave-inspector-panel" label="描述与参数" defaultWidth={430} minWidth={350} maxWidth={720}>
        <Inspector
          node={selected}
          inputNodes={inputNodes}
          onUpdate={(patch) => selected && studio.updateNode(selected.id, patch)}
          onGenerate={() => void runMediaGeneration()}
          onOpenAgent={() => setAgentOpen(true)}
        />
      </HoverEdgePanel>

      <AgentPanel
        open={agentOpen}
        busy={busy}
        onClose={() => setAgentOpen(false)}
        onRun={(skillId, instruction) => void runAgent(skillId, instruction)}
      />

      <button className="floating-agent-button" onClick={() => setAgentOpen(true)} title="打开 AI 导演">
        <Sparkles size={17} /><span>AI 导演</span>
      </button>
    </div>
  );
}

import {
  Aperture,
  BookOpenText,
  Bot,
  CheckCircle2,
  Clapperboard,
  FileText,
  Film,
  Image as ImageIcon,
  LoaderCircle,
  MessageSquareText,
  Play,
  Sparkles,
  UserRound,
  WandSparkles,
} from 'lucide-react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

const labels: Record<string, string> = {
  script: '剧本',
  analysis: 'Agent 分析',
  character: '人物资产',
  scene: '场景资产',
  referenceImage: '参考图',
  storyboard: '分镜',
  imageGen: '生图任务',
  imageOutput: '图片结果',
  videoGen: '生视频任务',
  videoOutput: '视频结果',
  promptPack: '提示词包',
  note: '便签',
};

const icons: Record<string, typeof FileText> = {
  script: BookOpenText,
  analysis: Bot,
  character: UserRound,
  scene: Aperture,
  referenceImage: ImageIcon,
  storyboard: Clapperboard,
  imageGen: WandSparkles,
  imageOutput: ImageIcon,
  videoGen: Film,
  videoOutput: Play,
  promptPack: MessageSquareText,
  note: FileText,
};

function MediaPreview({ type, data }: { type: string; data: Record<string, unknown> }) {
  const previewUrl = String(data.previewUrl ?? '');
  const previewStyle = String(data.previewStyle ?? '');
  const status = String(data.status ?? 'draft');

  if (type === 'script') {
    return (
      <div className="script-preview">
        <span>SCENE 01 · INT · NIGHT</span>
        <p>
          {String(
            data.content ??
              data.summary ??
              '输入故事梗概，交给 Agent 生成或分析剧本。',
          )}
        </p>
      </div>
    );
  }

  if (type === 'analysis' || type === 'promptPack') {
    const issues = Array.isArray(data.items) ? data.items.slice(0, 3) : [];
    return (
      <div className="analysis-preview">
        <div>
          <Bot size={15} />
          <span>{type === 'analysis' ? '结构化分析结果' : '模型适配提示词'}</span>
        </div>
        {issues.length > 0 ? (
          issues.map((item, index) => <p key={index}>• {String(item)}</p>)
        ) : (
          <p>{String(data.summary ?? 'Agent 输出会在这里形成可编辑节点。')}</p>
        )}
      </div>
    );
  }

  if (type === 'imageGen' || type === 'videoGen') {
    return (
      <div className={`generation-preview ${status}`}>
        {status === 'running' ? (
          <LoaderCircle className="spin" size={24} />
        ) : (
          <Sparkles size={24} />
        )}
        <strong>{status === 'running' ? '正在生成' : '等待生成'}</strong>
        <span>
          {String(
            data.model ??
              (type === 'imageGen' ? 'Image Provider' : 'Video Provider'),
          )}
        </span>
        <div className="generation-progress">
          <i style={{ width: status === 'running' ? '54%' : '8%' }} />
        </div>
      </div>
    );
  }

  if (type === 'videoOutput') {
    return (
      <div
        className="media-preview video-preview"
        style={
          previewUrl
            ? { backgroundImage: `url(${previewUrl})` }
            : { backgroundImage: previewStyle || undefined }
        }
      >
        <button className="video-play" type="button">
          <Play size={20} fill="currentColor" />
        </button>
        <span>{String(data.duration ?? '5s')} · {String(data.ratio ?? '16:9')}</span>
      </div>
    );
  }

  if (
    type === 'imageOutput' ||
    type === 'referenceImage' ||
    type === 'character' ||
    type === 'scene' ||
    type === 'storyboard'
  ) {
    return (
      <div
        className={`media-preview ${type}-preview`}
        style={
          previewUrl
            ? { backgroundImage: `url(${previewUrl})` }
            : { backgroundImage: previewStyle || undefined }
        }
      >
        {type === 'storyboard' && (
          <span className="shot-number">SHOT {String(data.shotNumber ?? '01')}</span>
        )}
        {type === 'imageOutput' && (
          <span className="adopted-badge">
            <CheckCircle2 size={12} /> 候选 {String(data.version ?? 'V1')}
          </span>
        )}
        {!previewUrl && !previewStyle && <ImageIcon size={25} />}
      </div>
    );
  }

  return null;
}

export function StudioNode({ id, type, data, selected }: NodeProps) {
  const nodeType = type ?? 'note';
  const nodeData = data as Record<string, unknown>;
  const Icon = icons[nodeType] ?? FileText;
  const status = String(nodeData.status ?? 'draft');

  return (
    <div className={`studio-node media-node node-${nodeType} ${selected ? 'is-selected' : ''}`}>
      <Handle type="target" position={Position.Left} className="node-handle" />

      <div className="media-node-head">
        <div>
          <span className="node-icon">
            <Icon size={14} />
          </span>
          <span>{labels[nodeType] ?? '创作节点'}</span>
        </div>
        <span className={`node-status ${status}`}>
          {status === 'running'
            ? '生成中'
            : status === 'ready' || status === 'generated'
              ? '已就绪'
              : '草稿'}
        </span>
      </div>

      <MediaPreview type={nodeType} data={nodeData} />

      <div className="media-node-copy">
        <strong>{String(nodeData.title ?? '未命名')}</strong>
        <p>
          {String(
            nodeData.summary ??
              nodeData.prompt ??
              '选择节点后可在右侧编辑参数。',
          )}
        </p>
      </div>

      <div className="media-node-meta">
        <span>{String(nodeData.model ?? nodeData.duration ?? 'CineWeave')}</span>
        <span>#{id.slice(-5)}</span>
      </div>

      <Handle type="source" position={Position.Right} className="node-handle" />
    </div>
  );
}

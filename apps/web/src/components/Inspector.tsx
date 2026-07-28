import {
  Bot,
  Film,
  Image as ImageIcon,
  Layers3,
  Play,
  Settings2,
  WandSparkles,
} from 'lucide-react';
import type { Node } from '@xyflow/react';

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label>
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

export function Inspector({
  node,
  onUpdate,
  onGenerate,
  onOpenAgent,
}: {
  node?: Node;
  onUpdate: (patch: Record<string, unknown>) => void;
  onGenerate: (mediaType?: 'image' | 'video') => void;
  onOpenAgent: () => void;
}) {
  if (!node) {
    return (
      <aside className="inspector">
        <div className="inspector-empty">
          <div className="empty-orb" />
          <h3>选择一项创作素材</h3>
          <p>图片、视频、分镜、剧本和人物资产的参数都会显示在这里。</p>
          <button onClick={onOpenAgent}>
            <Bot size={15} /> 打开 AI 导演
          </button>
        </div>
      </aside>
    );
  }

  const type = String(node.type ?? 'note');
  const data = node.data as Record<string, unknown>;
  const isGeneration = type === 'imageGen' || type === 'videoGen';
  const isMediaOutput = type === 'imageOutput' || type === 'videoOutput';
  const isScriptLike = ['script', 'analysis', 'storyboard', 'promptPack'].includes(type);

  return (
    <aside className="inspector">
      <div className="inspector-head">
        <div>
          <span>CREATIVE INSPECTOR</span>
          <h2>{String(data.title ?? '未命名')}</h2>
        </div>
        <span className="pill">{type}</span>
      </div>

      <div className="inspector-section-title">
        <Layers3 size={14} /> 基础信息
      </div>
      <label>
        标题
        <input
          value={String(data.title ?? '')}
          onChange={(event) => onUpdate({ title: event.target.value })}
        />
      </label>
      <label>
        描述
        <textarea
          rows={4}
          value={String(data.summary ?? '')}
          onChange={(event) => onUpdate({ summary: event.target.value })}
        />
      </label>

      {(isGeneration || isMediaOutput || type === 'storyboard') && (
        <>
          <div className="inspector-section-title">
            <Settings2 size={14} /> 生成参数
          </div>
          <label>
            正向提示词
            <textarea
              rows={7}
              value={String(data.prompt ?? '')}
              onChange={(event) => onUpdate({ prompt: event.target.value })}
              placeholder="主体、环境、构图、光线、动作和镜头语言"
            />
          </label>
          <label>
            负面提示词
            <textarea
              rows={3}
              value={String(data.negativePrompt ?? '')}
              onChange={(event) => onUpdate({ negativePrompt: event.target.value })}
              placeholder="身份漂移、额外肢体、文字、水印……"
            />
          </label>
          <SelectField
            label="模型"
            value={String(
              data.model ?? (type.startsWith('video') ? 'Video Provider' : 'Image Provider'),
            )}
            options={
              type.startsWith('video')
                ? ['Video Provider', 'Seedance Adapter', 'Runway Adapter', 'Kling Adapter']
                : ['Image Provider', 'Flux Adapter', 'SDXL Adapter', 'OpenAI Image Adapter']
            }
            onChange={(model) => onUpdate({ model })}
          />
          <div className="inspector-grid">
            <SelectField
              label="画幅"
              value={String(data.ratio ?? '16:9')}
              options={['16:9', '9:16', '1:1', '4:3', '3:2']}
              onChange={(ratio) => onUpdate({ ratio })}
            />
            <SelectField
              label={type.startsWith('video') ? '时长' : '候选数'}
              value={String(
                type.startsWith('video') ? data.duration ?? '5s' : data.variants ?? '4',
              )}
              options={type.startsWith('video') ? ['3s', '5s', '8s', '10s'] : ['1', '2', '4', '6']}
              onChange={(value) =>
                onUpdate(type.startsWith('video') ? { duration: value } : { variants: value })
              }
            />
          </div>
        </>
      )}

      {isScriptLike && (
        <>
          <div className="inspector-section-title">
            <Bot size={14} /> Agent 上下文
          </div>
          <label>
            正文 / 分析结果
            <textarea
              rows={12}
              value={String(data.content ?? data.summary ?? '')}
              onChange={(event) => onUpdate({ content: event.target.value })}
            />
          </label>
          <button className="secondary-action" onClick={onOpenAgent}>
            <Bot size={16} /> 选择 Skill 继续分析
          </button>
        </>
      )}

      {type === 'character' && (
        <>
          <div className="inspector-section-title">
            <ImageIcon size={14} /> 一致性锁定
          </div>
          <label>
            禁止变化项
            <textarea
              rows={5}
              value={String(data.lockedTraits ?? '')}
              onChange={(event) => onUpdate({ lockedTraits: event.target.value })}
              placeholder="发型、服装、五官、年龄感、配饰……"
            />
          </label>
        </>
      )}

      {isGeneration && (
        <button
          className="generate-button"
          onClick={() => onGenerate(type === 'videoGen' ? 'video' : 'image')}
        >
          {type === 'videoGen' ? <Film size={17} /> : <WandSparkles size={17} />}
          <span>{type === 'videoGen' ? '加入视频生成队列' : '加入图片生成队列'}</span>
        </button>
      )}

      {isMediaOutput && (
        <button className="generate-button" onClick={() => onGenerate(type === 'videoOutput' ? 'video' : 'image')}>
          {type === 'videoOutput' ? <Play size={17} /> : <WandSparkles size={17} />}
          <span>{type === 'videoOutput' ? '延长 / 创建新版本' : '生成变体 / 创建新版本'}</span>
        </button>
      )}

      <div className="security-note">
        <strong>生成血缘可追溯</strong>
        <span>输入素材、提示词、模型参数和结果版本都保存到服务端项目中。</span>
      </div>
    </aside>
  );
}

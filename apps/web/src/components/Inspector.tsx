import {
  Bot,
  FileText,
  Film,
  Image as ImageIcon,
  Layers3,
  Link2,
  Play,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Upload,
  WandSparkles,
  X,
} from 'lucide-react';
import type { Node } from '@xyflow/react';
import type { MediaGenerationOperation } from '@cineweave/contracts';
import { ProviderSettings } from './ProviderSettings';
import { generationModes, getGenerationMode } from '../generationModes';

interface InspectorProps {
  node?: Node;
  inputNodes?: Node[];
  onUpdate: (patch: Record<string, unknown>) => void;
  onGenerate: () => void;
  onOpenAgent: () => void;
}

type Option = string | { value: string; label: string };

function SelectField({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
}) {
  return (
    <label>
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => {
          const item = typeof option === 'string' ? { value: option, label: option } : option;
          return <option key={item.value} value={item.value}>{item.label}</option>;
        })}
      </select>
    </label>
  );
}

function NumberField({ label, value, min, max, step = 1, onChange }: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label>
      {label}
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function ToggleField({ label, checked, description, onChange }: {
  label: string;
  checked: boolean;
  description?: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="toggle-field">
      <span><strong>{label}</strong>{description && <small>{description}</small>}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <i />
    </label>
  );
}

function providerOptions(mediaType: 'image' | 'video'): Option[] {
  return mediaType === 'image'
    ? [
        { value: 'image', label: '图片 Provider · OpenAI-compatible' },
        { value: 'runway', label: 'Runway · 图片生成' },
        { value: 'luma', label: 'Luma · Photon 图片' },
      ]
    : [
        { value: 'runway', label: 'Runway · 视频任务' },
        { value: 'luma', label: 'Luma · Ray 视频' },
      ];
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('读取文件失败'));
    reader.readAsDataURL(file);
  });
}

function LocalMediaInputs({
  inputKind,
  urls,
  onChange,
}: {
  inputKind: 'image' | 'two-images' | 'video';
  urls: string[];
  onChange: (urls: string[]) => void;
}) {
  const maxFiles = inputKind === 'two-images' ? 2 : inputKind === 'image' ? 9 : 1;
  const accept = inputKind === 'video' ? 'video/mp4,video/webm' : 'image/png,image/jpeg,image/webp';
  const label = inputKind === 'two-images'
    ? '上传首帧 / 尾帧'
    : inputKind === 'video'
      ? '上传输入视频'
      : '上传参考图片';

  const addFiles = async (files: FileList | null) => {
    if (!files) return;
    const selected = Array.from(files).slice(0, Math.max(0, maxFiles - urls.length));
    const tooLarge = selected.find((file) => file.size > 10 * 1024 * 1024);
    if (tooLarge) {
      window.alert(`${tooLarge.name} 超过 10MB。当前开发版使用 data URI，请先压缩素材。`);
      return;
    }
    const encoded = await Promise.all(selected.map(readFileAsDataUrl));
    onChange([...urls, ...encoded].slice(0, maxFiles));
  };

  return (
    <div className="local-media-inputs">
      <div className="local-media-head">
        <div>
          <strong>{label}</strong>
          <small>可直接从本机选择，不需要先上传到外部图床</small>
        </div>
        <label className={`local-upload-button ${urls.length >= maxFiles ? 'is-disabled' : ''}`}>
          <Upload size={14} />选择文件
          <input
            type="file"
            accept={accept}
            multiple={maxFiles > 1}
            disabled={urls.length >= maxFiles}
            onChange={(event) => {
              void addFiles(event.target.files);
              event.currentTarget.value = '';
            }}
          />
        </label>
      </div>
      {urls.length > 0 && (
        <div className="local-media-grid">
          {urls.map((url, index) => (
            <div className="local-media-card" key={`${url.slice(0, 48)}-${index}`}>
              {url.startsWith('data:video/') ? (
                <video src={url} muted />
              ) : (
                <img src={url} alt={`输入素材 ${index + 1}`} />
              )}
              <span>{inputKind === 'two-images' ? (index === 0 ? '首帧' : '尾帧') : `素材 ${index + 1}`}</span>
              <button
                type="button"
                onClick={() => onChange(urls.filter((_, itemIndex) => itemIndex !== index))}
                title="移除素材"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PromptComposerFields({
  data,
  mode,
  onUpdate,
}: {
  data: Record<string, unknown>;
  mode: ReturnType<typeof getGenerationMode>;
  onUpdate: (patch: Record<string, unknown>) => void;
}) {
  const promptMode = String(data.promptMode ?? 'auto');
  const description = String(data.description ?? '');
  const finalPrompt = String(data.finalPrompt ?? '');
  const draftPrompt = String(data.draftPrompt ?? '');
  const promptSource = String(data.promptSource ?? '');

  return (
    <>
      <div className="inspector-section-title"><FileText size={14} /> 生成内容描述</div>
      <label className="description-field">
        想生成什么 <b>必填</b>
        <textarea
          rows={7}
          value={description}
          onChange={(event) => onUpdate({ description: event.target.value })}
          placeholder={mode.exampleDescription}
        />
        <small>{mode.descriptionHint}</small>
      </label>
      <button
        type="button"
        className="example-description-button"
        onClick={() => onUpdate({ description: mode.exampleDescription })}
      >
        使用示例描述
      </button>

      <div className="prompt-mode-switch" role="group" aria-label="提示词生成方式">
        <button
          type="button"
          className={promptMode === 'auto' ? 'is-active' : ''}
          onClick={() => onUpdate({ promptMode: 'auto' })}
        >
          <Sparkles size={14} />自动整理提示词
        </button>
        <button
          type="button"
          className={promptMode === 'manual' ? 'is-active' : ''}
          onClick={() => onUpdate({ promptMode: 'manual' })}
        >
          手动最终 Prompt
        </button>
      </div>

      {promptMode === 'auto' ? (
        <>
          <div className="composer-explainer">
            <Sparkles size={16} />
            <div>
              <strong>Prompt Composer</strong>
              <p>先根据描述、生成模式和连接素材形成规则草稿，再由 Agent 优化。没有 Agent Key 时仍使用规则草稿调用媒体模型。</p>
            </div>
          </div>
          <label>
            给提示词整理器的补充要求（可选）
            <textarea
              rows={3}
              value={String(data.promptGuidance ?? '')}
              onChange={(event) => onUpdate({ promptGuidance: event.target.value })}
              placeholder="例如：保持现实主义，不使用过度霓虹；镜头动作尽量克制。"
            />
          </label>
        </>
      ) : (
        <label>
          最终模型提示词 <b>必填</b>
          <textarea
            rows={9}
            value={String(data.prompt ?? '')}
            onChange={(event) => onUpdate({ prompt: event.target.value })}
            placeholder={mode.promptHint}
          />
        </label>
      )}

      {(finalPrompt || draftPrompt) && (
        <details className="compiled-prompt" open>
          <summary>查看本次编译后的模型提示词</summary>
          <div className="compiled-prompt-meta">
            来源：{promptSource === 'agent' ? 'Agent 优化' : promptSource === 'manual' ? '手动填写' : '规则草稿'}
          </div>
          <pre>{finalPrompt || draftPrompt}</pre>
        </details>
      )}
    </>
  );
}

function GenerationFields({ node, inputNodes, onUpdate, onGenerate }: {
  node: Node;
  inputNodes: Node[];
  onUpdate: (patch: Record<string, unknown>) => void;
  onGenerate: () => void;
}) {
  const type = String(node.type);
  const data = node.data as Record<string, unknown>;
  const operation = String(
    data.operation ?? (type === 'videoGen' ? 'text-to-video' : 'text-to-image'),
  ) as MediaGenerationOperation;
  const mode = getGenerationMode(operation);
  const compatibleModes = generationModes.filter((item) => item.nodeType === type);
  const inlineInputUrls = Array.isArray(data.inlineInputUrls)
    ? data.inlineInputUrls.filter((value): value is string => typeof value === 'string')
    : [];
  const requiredInputs = mode.inputKind === 'two-images' ? 2 : mode.inputKind === 'none' ? 0 : 1;
  const availableInputCount = inputNodes.length + inlineInputUrls.length;
  const hasEnoughInputs = availableInputCount >= requiredInputs;
  const hasDescription = String(data.description ?? '').trim().length > 0;
  const canGenerate = hasEnoughInputs && hasDescription && (String(data.promptMode ?? 'auto') !== 'manual' || String(data.prompt ?? '').trim().length > 0);

  return (
    <>
      <div className="inspector-section-title"><SlidersHorizontal size={14} /> 生成方式</div>
      <SelectField
        label="模式"
        value={mode.id}
        options={compatibleModes.map((item) => ({ value: item.id, label: item.title }))}
        onChange={(value) => {
          const next = getGenerationMode(value);
          onUpdate({ ...next.defaults, operation: next.id });
        }}
      />
      <div className={`mode-explainer mode-${mode.mediaType}`}>
        <strong>{mode.title}</strong>
        <p>{mode.description}</p>
      </div>

      <PromptComposerFields data={data} mode={mode} onUpdate={onUpdate} />

      {requiredInputs > 0 && (
        <>
          <div className="inspector-section-title"><Link2 size={14} /> 输入素材</div>
          <div className={`generation-input-status ${hasEnoughInputs ? 'is-ready' : 'is-missing'}`}>
            <Link2 size={15} />
            <div>
              <strong>{hasEnoughInputs ? '输入素材已准备' : '还缺少真实输入素材'}</strong>
              <span>
                {mode.inputKind === 'two-images'
                  ? `需要首帧和尾帧，当前 ${availableInputCount}/2`
                  : mode.inputKind === 'video'
                    ? `需要一个视频，当前 ${availableInputCount}/1`
                    : `需要至少一张图片，当前 ${availableInputCount}/1`}
              </span>
            </div>
          </div>
          <LocalMediaInputs
            inputKind={mode.inputKind as 'image' | 'two-images' | 'video'}
            urls={inlineInputUrls}
            onChange={(urls) => onUpdate({ inlineInputUrls: urls })}
          />
          {inputNodes.length > 0 && (
            <div className="connected-input-list">
              <strong>画布连接素材</strong>
              {inputNodes.map((input, index) => (
                <span key={input.id}>{index + 1}. {String(input.data.title ?? input.type ?? '素材')}</span>
              ))}
            </div>
          )}
        </>
      )}

      <div className="inspector-section-title"><Settings2 size={14} /> 模型与请求参数</div>
      <SelectField
        label="调用哪个 Provider 配置"
        value={String(data.provider ?? (mode.mediaType === 'image' ? 'image' : 'runway'))}
        options={providerOptions(mode.mediaType)}
        onChange={(provider) => onUpdate({ provider })}
      />
      <label>
        模型 ID
        <input
          value={String(data.model ?? '')}
          onChange={(event) => onUpdate({ model: event.target.value })}
          placeholder="所选 Provider 支持的真实模型名称"
        />
      </label>
      <label>
        负面约束（可选）
        <textarea
          rows={3}
          value={String(data.negativePrompt ?? '')}
          onChange={(event) => onUpdate({ negativePrompt: event.target.value })}
          placeholder="身份漂移、额外肢体、文字、水印、画面抖动……"
        />
      </label>

      <div className="inspector-grid">
        <SelectField
          label="画幅"
          value={String(data.ratio ?? '16:9')}
          options={['16:9', '9:16', '1:1', '4:3', '3:4', '21:9']}
          onChange={(ratio) => onUpdate({ ratio })}
        />
        {mode.mediaType === 'image' ? (
          <NumberField label="候选数" value={Number(data.variants ?? 1)} min={1} max={8} onChange={(variants) => onUpdate({ variants })} />
        ) : (
          <NumberField label="时长（秒）" value={Number(data.durationSeconds ?? 5)} min={2} max={20} onChange={(durationSeconds) => onUpdate({ durationSeconds })} />
        )}
      </div>

      {mode.mediaType === 'image' ? (
        <>
          <div className="inspector-grid">
            <SelectField label="质量" value={String(data.quality ?? 'standard')} options={['draft', 'standard', 'high']} onChange={(quality) => onUpdate({ quality })} />
            <SelectField label="输出格式" value={String(data.outputFormat ?? 'webp')} options={['webp', 'png', 'jpeg']} onChange={(outputFormat) => onUpdate({ outputFormat })} />
          </div>
          {['image-to-image', 'inpaint', 'outpaint'].includes(operation) && (
            <>
              <NumberField label={`修改强度 ${Number(data.strength ?? 0.55).toFixed(2)}`} value={Number(data.strength ?? 0.55)} min={0} max={1} step={0.05} onChange={(strength) => onUpdate({ strength })} />
              <SelectField
                label="输入图保真"
                value={String(data.inputFidelity ?? 'high')}
                options={[
                  { value: 'high', label: '高：优先保留人物和细节' },
                  { value: 'low', label: '低：允许更大幅度重绘' },
                ]}
                onChange={(inputFidelity) => onUpdate({ inputFidelity })}
              />
              <ToggleField label="保持原构图" description="尽量不改变镜头位置和主体布局" checked={Boolean(data.preserveComposition ?? true)} onChange={(preserveComposition) => onUpdate({ preserveComposition })} />
            </>
          )}
          <NumberField label="Seed（0 为随机）" value={Number(data.seed ?? 0)} min={0} max={4294967295} onChange={(seed) => onUpdate({ seed })} />
        </>
      ) : (
        <>
          <div className="inspector-grid">
            <SelectField label="分辨率" value={String(data.resolution ?? '720p')} options={['540p', '720p', '1080p', '4k']} onChange={(resolution) => onUpdate({ resolution })} />
            <SelectField label="帧率" value={String(data.fps ?? 24)} options={['24', '30', '60']} onChange={(fps) => onUpdate({ fps: Number(fps) })} />
          </div>
          <label>
            镜头运动
            <input value={String(data.cameraMotion ?? '')} onChange={(event) => onUpdate({ cameraMotion: event.target.value })} placeholder="静态、缓慢推近、左环绕、手持跟拍……" />
          </label>
          {operation !== 'text-to-video' && (
            <NumberField label={`运动强度 ${Number(data.motionStrength ?? 0.45).toFixed(2)}`} value={Number(data.motionStrength ?? 0.45)} min={0} max={1} step={0.05} onChange={(motionStrength) => onUpdate({ motionStrength })} />
          )}
          <ToggleField label="请求生成音频" description="仅在当前视频 Provider 支持时生效" checked={Boolean(data.generateAudio ?? false)} onChange={(generateAudio) => onUpdate({ generateAudio })} />
          <ToggleField label="循环视频" description="让结束状态尽量回到开头" checked={Boolean(data.loop ?? false)} onChange={(loop) => onUpdate({ loop })} />
        </>
      )}

      <button className="generate-button" disabled={!canGenerate} onClick={onGenerate}>
        {mode.mediaType === 'video' ? <Film size={17} /> : <WandSparkles size={17} />}
        <span>
          {!hasDescription
            ? '先填写生成内容描述'
            : !hasEnoughInputs
              ? '先连接或上传所需素材'
              : String(data.promptMode ?? 'auto') === 'manual' && !String(data.prompt ?? '').trim()
                ? '先填写最终 Prompt'
                : `整理提示词并生成${mode.mediaType === 'image' ? '图片' : '视频'}`}
        </span>
      </button>
    </>
  );
}

function MediaOutputAudit({ data }: { data: Record<string, unknown> }) {
  const description = String(data.description ?? '');
  const finalPrompt = String(data.finalPrompt ?? data.prompt ?? '');
  const promptSource = String(data.promptSource ?? '');
  if (!description && !finalPrompt) return null;
  return (
    <div className="media-output-audit">
      <div className="inspector-section-title"><Sparkles size={14} /> 生成记录</div>
      {description && <><strong>原始创作描述</strong><p>{description}</p></>}
      {finalPrompt && (
        <details>
          <summary>最终模型提示词</summary>
          <pre>{finalPrompt}</pre>
        </details>
      )}
      {promptSource && <small>提示词来源：{promptSource === 'agent' ? 'Agent 优化' : promptSource === 'manual' ? '手动填写' : '规则草稿'}</small>}
    </div>
  );
}

export function Inspector({ node, inputNodes = [], onUpdate, onGenerate, onOpenAgent }: InspectorProps) {
  if (!node) {
    return (
      <div className="inspector">
        <div className="inspector-empty">
          <div className="empty-orb" />
          <h3>选择生成任务</h3>
          <p>先描述想生成的内容，再由 Prompt Composer 整理为模型提示词。</p>
          <button onClick={onOpenAgent}><Bot size={15} /> 打开 AI 导演</button>
        </div>
        <ProviderSettings />
      </div>
    );
  }

  const type = String(node.type ?? 'note');
  const data = node.data as Record<string, unknown>;
  const isGeneration = type === 'imageGen' || type === 'videoGen';
  const isMediaOutput = type === 'imageOutput' || type === 'videoOutput';
  const isScriptLike = ['script', 'analysis', 'storyboard', 'promptPack'].includes(type);

  return (
    <div className="inspector">
      <div className="inspector-head">
        <div><span>参数与输入</span><h2>{String(data.title ?? '未命名')}</h2></div>
        <span className="pill">{type}</span>
      </div>
      <div className="inspector-section-title"><Layers3 size={14} /> 基础信息</div>
      <label>
        标题
        <input value={String(data.title ?? '')} onChange={(event) => onUpdate({ title: event.target.value })} />
      </label>
      {!isGeneration && (
        <label>
          描述
          <textarea rows={3} value={String(data.summary ?? '')} onChange={(event) => onUpdate({ summary: event.target.value })} />
        </label>
      )}

      {isGeneration && <GenerationFields node={node} inputNodes={inputNodes} onUpdate={onUpdate} onGenerate={onGenerate} />}

      {isScriptLike && (
        <>
          <div className="inspector-section-title"><Bot size={14} /> Agent 上下文</div>
          <label>
            正文 / 分析结果
            <textarea rows={12} value={String(data.content ?? data.summary ?? '')} onChange={(event) => onUpdate({ content: event.target.value })} />
          </label>
          <button className="secondary-action" onClick={onOpenAgent}><Bot size={16} /> 选择 Skill 继续分析</button>
        </>
      )}

      {type === 'character' && (
        <>
          <div className="inspector-section-title"><ImageIcon size={14} /> 一致性锁定</div>
          <label>
            禁止变化项
            <textarea rows={5} value={String(data.lockedTraits ?? '')} onChange={(event) => onUpdate({ lockedTraits: event.target.value })} placeholder="发型、服装、五官、年龄感、配饰……" />
          </label>
        </>
      )}

      {isMediaOutput && (
        <>
          <MediaOutputAudit data={data} />
          <button className="generate-button" onClick={onGenerate}>
            {type === 'videoOutput' ? <Play size={17} /> : <WandSparkles size={17} />}
            <span>{type === 'videoOutput' ? '创建视频延长任务' : '基于结果创建图生图任务'}</span>
          </button>
        </>
      )}

      <ProviderSettings />
      <div className="security-note">
        <strong>描述、提示词与生成血缘可追溯</strong>
        <span>服务端会保存原始描述、规则草稿、最终提示词、输入素材、模型参数和输出版本。</span>
      </div>
    </div>
  );
}

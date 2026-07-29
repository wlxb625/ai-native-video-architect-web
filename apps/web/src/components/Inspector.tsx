import {
  Bot,
  Film,
  Image as ImageIcon,
  Layers3,
  Link2,
  Play,
  Settings2,
  SlidersHorizontal,
  WandSparkles,
} from 'lucide-react';
import type { Node } from '@xyflow/react';
import type { MediaGenerationOperation } from '@cineweave/contracts';
import { ProviderSettings } from './ProviderSettings';
import { generationModes, getGenerationMode } from '../generationModes';

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

function GenerationFields({
  node,
  inputNodes,
  onUpdate,
  onGenerate,
}: {
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
  const requiredInputs = mode.inputKind === 'two-images' ? 2 : mode.inputKind === 'none' ? 0 : 1;
  const hasEnoughInputs = inputNodes.length >= requiredInputs;

  return (
    <>
      <div className="inspector-section-title"><SlidersHorizontal size={14} /> 生成模式</div>
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
        <small>{mode.promptHint}</small>
      </div>

      {requiredInputs > 0 && (
        <div className={`generation-input-status ${hasEnoughInputs ? 'is-ready' : 'is-missing'}`}>
          <Link2 size={15} />
          <div>
            <strong>{hasEnoughInputs ? '输入素材已连接' : '还缺少输入素材'}</strong>
            <span>
              {mode.inputKind === 'two-images'
                ? `需要首帧和尾帧两张图片，当前 ${inputNodes.length}/2`
                : mode.inputKind === 'video'
                  ? `需要一个视频结果，当前 ${inputNodes.length}/1`
                  : `需要至少一张图片，当前 ${inputNodes.length}/1`}
            </span>
          </div>
        </div>
      )}

      <div className="inspector-section-title"><Settings2 size={14} /> Provider、提示词与模型</div>
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
          placeholder="必须是所选 Provider 支持的模型名称"
        />
      </label>
      <label>
        {mode.mediaType === 'video' ? '动作与镜头提示词' : '画面提示词'}
        <textarea
          rows={7}
          value={String(data.prompt ?? '')}
          onChange={(event) => onUpdate({ prompt: event.target.value })}
          placeholder={mode.promptHint}
        />
      </label>
      <label>
        负面提示词
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
          <NumberField
            label="候选数"
            value={Number(data.variants ?? 4)}
            min={1}
            max={8}
            onChange={(variants) => onUpdate({ variants })}
          />
        ) : (
          <NumberField
            label="时长（秒）"
            value={Number(data.durationSeconds ?? 5)}
            min={2}
            max={20}
            onChange={(durationSeconds) => onUpdate({ durationSeconds })}
          />
        )}
      </div>

      {mode.mediaType === 'image' ? (
        <>
          <div className="inspector-grid">
            <SelectField
              label="质量"
              value={String(data.quality ?? 'standard')}
              options={['draft', 'standard', 'high']}
              onChange={(quality) => onUpdate({ quality })}
            />
            <SelectField
              label="输出格式"
              value={String(data.outputFormat ?? 'webp')}
              options={['webp', 'png', 'jpeg']}
              onChange={(outputFormat) => onUpdate({ outputFormat })}
            />
          </div>
          {['image-to-image', 'inpaint', 'outpaint'].includes(operation) && (
            <>
              <NumberField
                label={`修改强度 ${Number(data.strength ?? 0.55).toFixed(2)}`}
                value={Number(data.strength ?? 0.55)}
                min={0}
                max={1}
                step={0.05}
                onChange={(strength) => onUpdate({ strength })}
              />
              <SelectField
                label="输入图保真"
                value={String(data.inputFidelity ?? 'high')}
                options={[
                  { value: 'high', label: '高：优先保留人物和细节' },
                  { value: 'low', label: '低：允许更大幅度重绘' },
                ]}
                onChange={(inputFidelity) => onUpdate({ inputFidelity })}
              />
              <ToggleField
                label="保持原构图"
                description="尽量不改变镜头位置和主体布局"
                checked={Boolean(data.preserveComposition ?? true)}
                onChange={(preserveComposition) => onUpdate({ preserveComposition })}
              />
            </>
          )}
          <NumberField
            label="Seed（0 为随机）"
            value={Number(data.seed ?? 0)}
            min={0}
            max={4294967295}
            onChange={(seed) => onUpdate({ seed })}
          />
        </>
      ) : (
        <>
          <div className="inspector-grid">
            <SelectField
              label="分辨率"
              value={String(data.resolution ?? '720p')}
              options={['540p', '720p', '1080p', '4k']}
              onChange={(resolution) => onUpdate({ resolution })}
            />
            <SelectField
              label="帧率"
              value={String(data.fps ?? 24)}
              options={['24', '30', '60']}
              onChange={(fps) => onUpdate({ fps: Number(fps) })}
            />
          </div>
          <label>
            镜头运动
            <input
              value={String(data.cameraMotion ?? '')}
              onChange={(event) => onUpdate({ cameraMotion: event.target.value })}
              placeholder="静态、缓慢推近、左环绕、手持跟拍……"
            />
          </label>
          {operation !== 'text-to-video' && (
            <NumberField
              label={`运动强度 ${Number(data.motionStrength ?? 0.45).toFixed(2)}`}
              value={Number(data.motionStrength ?? 0.45)}
              min={0}
              max={1}
              step={0.05}
              onChange={(motionStrength) => onUpdate({ motionStrength })}
            />
          )}
          <ToggleField
            label="请求生成音频"
            description="仅在当前视频 Provider 支持时生效"
            checked={Boolean(data.generateAudio ?? false)}
            onChange={(generateAudio) => onUpdate({ generateAudio })}
          />
          <ToggleField
            label="循环视频"
            description="让结束状态尽量回到开头"
            checked={Boolean(data.loop ?? false)}
            onChange={(loop) => onUpdate({ loop })}
          />
        </>
      )}

      <button className="generate-button" disabled={!hasEnoughInputs} onClick={onGenerate}>
        {mode.mediaType === 'video' ? <Film size={17} /> : <WandSparkles size={17} />}
        <span>{hasEnoughInputs ? `提交${mode.title}任务` : '先连接所需输入素材'}</span>
      </button>
    </>
  );
}

export function Inspector({ node, inputNodes = [], onUpdate, onGenerate, onOpenAgent }: {
  node?: Node;
  inputNodes?: Node[];
  onUpdate: (patch: Record<string, unknown>) => void;
  onGenerate: () => void;
  onOpenAgent: () => void;
}) {
  if (!node) {
    return (
      <div className="inspector">
        <div className="inspector-empty">
          <div className="empty-orb" />
          <h3>选择一项创作素材</h3>
          <p>四种主要生成方式会显示不同的输入要求和参数。</p>
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
      <label>
        描述
        <textarea rows={3} value={String(data.summary ?? '')} onChange={(event) => onUpdate({ summary: event.target.value })} />
      </label>

      {isGeneration && (
        <GenerationFields node={node} inputNodes={inputNodes} onUpdate={onUpdate} onGenerate={onGenerate} />
      )}

      {isScriptLike && (
        <>
          <div className="inspector-section-title"><Bot size={14} /> Agent 上下文</div>
          <label>
            正文 / 分析结果
            <textarea
              rows={12}
              value={String(data.content ?? data.summary ?? '')}
              onChange={(event) => onUpdate({ content: event.target.value })}
            />
          </label>
          <button className="secondary-action" onClick={onOpenAgent}><Bot size={16} /> 选择 Skill 继续分析</button>
        </>
      )}

      {type === 'character' && (
        <>
          <div className="inspector-section-title"><ImageIcon size={14} /> 一致性锁定</div>
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

      {isMediaOutput && (
        <button className="generate-button" onClick={onGenerate}>
          {type === 'videoOutput' ? <Play size={17} /> : <WandSparkles size={17} />}
          <span>{type === 'videoOutput' ? '创建视频延长任务' : '创建图生图任务'}</span>
        </button>
      )}

      <ProviderSettings />
      <div className="security-note">
        <strong>输入与生成血缘可追溯</strong>
        <span>任务会保存模式、Provider、输入素材、提示词、模型参数和输出版本。</span>
      </div>
    </div>
  );
}

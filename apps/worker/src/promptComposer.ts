import { createHash } from 'node:crypto';
import type { MediaGenerationRunInput } from '@cineweave/contracts';

export interface PromptComposerContext {
  nodes: Array<{ id?: string; type?: string; data?: Record<string, unknown> }>;
  assets: Array<Record<string, unknown>>;
}

export interface PromptComposition {
  description: string;
  draftPrompt: string;
  finalPrompt: string;
  negativePrompt: string;
  promptSource: 'manual' | 'agent' | 'rule-fallback';
  inputHash: string;
  notes: string[];
}

export type PromptModelCaller = (input: {
  system: string;
  prompt: string;
}) => Promise<Record<string, unknown> | null>;

function text(value: unknown): string {
  return String(value ?? '').trim();
}

function selectedContext(input: MediaGenerationRunInput, context: PromptComposerContext) {
  const ids = new Set(input.inputNodeIds ?? []);
  const nodes = context.nodes
    .filter((node) => !ids.size || (node.id && ids.has(node.id)))
    .slice(0, 12)
    .map((node, index) => ({
      reference: `${node.type === 'videoOutput' ? '视频' : '图片'}${index + 1}`,
      type: node.type,
      title: text(node.data?.title),
      summary: text(node.data?.summary),
      lockedTraits: text(node.data?.lockedTraits),
      prompt: text(node.data?.prompt),
      finalPrompt: text(node.data?.finalPrompt),
    }));
  return nodes;
}

function contextClauses(input: MediaGenerationRunInput, context: PromptComposerContext): string[] {
  const nodes = selectedContext(input, context);
  const clauses: string[] = [];
  for (const node of nodes) {
    const details = [node.title, node.summary, node.lockedTraits].filter(Boolean).join('；');
    if (details) clauses.push(`${node.reference}：${details}`);
  }
  return clauses;
}

function modeInstruction(input: MediaGenerationRunInput): string {
  const p = input.parameters;
  const camera = text(p.cameraMotion);
  switch (input.operation) {
    case 'text-to-image':
      return '根据文字描述生成一张全新的单帧画面，明确主体、环境、构图、景别、机位、光线、色彩与材质。';
    case 'image-to-image':
      return `以图片1为视觉基础，保留人物身份、主体结构和合理构图，只按描述修改指定内容。修改强度约 ${p.strength ?? 0.55}。`;
    case 'multi-reference-image':
      return '综合多张参考图：优先保持人物身份、服装、场景结构和风格一致，生成新的统一画面。';
    case 'inpaint':
      return '仅重绘遮罩区域，未遮罩区域保持不变，补全区域的透视、光线和材质必须自然衔接。';
    case 'outpaint':
      return '扩展原图画面边界，保持原主体、视角、透视、光线和风格连续。';
    case 'text-to-video':
      return `生成一个连续短镜头。重点描述主体动作链、环境变化、时间节奏和镜头运动${camera ? `（${camera}）` : ''}，不要只描述静态画面。`;
    case 'image-to-video':
      return `以图片1作为首帧和人物外观约束。重点描述首帧之后发生的动作、环境运动和镜头运动${camera ? `（${camera}）` : ''}，不要重复静态外观。`;
    case 'first-last-frame-video':
      return `以图片1为首帧、图片2为尾帧，描述两帧之间单向、连续、可见的动作过程和镜头位移${camera ? `（${camera}）` : ''}，自然到达尾帧。`;
    case 'video-to-video':
      return '以视频1为动作和时间结构基础，按描述修改风格或局部内容，同时保持运动连续。';
    case 'video-extend':
      return '从视频1结束状态继续向后生成，人物、动作方向、光线、空间和镜头速度必须连续。';
    case 'upscale':
      return '提升输入画面的清晰度与细节，不改变人物身份、构图、文字和关键物体。';
    default:
      return '根据创作描述和输入素材生成媒体内容。';
  }
}

export function buildRuleDraft(
  input: MediaGenerationRunInput,
  context: PromptComposerContext,
): string {
  const clauses = contextClauses(input, context);
  const requestOnly = [
    input.parameters.ratio ? `画幅 ${input.parameters.ratio}` : '',
    input.mediaType === 'video' && input.parameters.durationSeconds
      ? `时长 ${input.parameters.durationSeconds} 秒`
      : '',
  ].filter(Boolean);
  return [
    modeInstruction(input),
    `创作目标：${input.description}`,
    clauses.length ? `参考约束：${clauses.join('；')}` : '',
    input.promptGuidance ? `补充要求：${input.promptGuidance}` : '',
    requestOnly.length ? `构图适配：${requestOnly.join('，')}。` : '',
  ].filter(Boolean).join('\n');
}

function composerSystem(input: MediaGenerationRunInput): string {
  const kind = input.mediaType === 'image' ? '图片' : '视频';
  return [
    `你是 CineWeave 的${kind}生成提示词撰写器。`,
    '把用户的创作描述、输入素材约束和规则草稿改写成可直接提交给生成模型的最终提示词。',
    '只使用上下文中已有的图片1、图片2、视频1等引用，不得虚构素材编号。',
    input.mediaType === 'video'
      ? '视频提示词必须描述可见的动作过程、镜头运动、环境变化和时间顺序；避免只写静态画面。'
      : '图片提示词必须描述主体、环境、构图、景别、机位、光线、色彩、材质和一致性约束。',
    '比例、分辨率、时长、帧率、候选数、Seed 等由 API 参数单独发送，不要堆进提示词。',
    '不要解释推理过程。返回 JSON：{"prompt":"...","negativePrompt":"...","notes":["..."]}。',
  ].join('\n');
}

function taskPayload(
  input: MediaGenerationRunInput,
  context: PromptComposerContext,
  draftPrompt: string,
): string {
  return JSON.stringify({
    operation: input.operation,
    mediaType: input.mediaType,
    description: input.description,
    promptGuidance: input.promptGuidance,
    ruleDraft: draftPrompt,
    inputManifest: selectedContext(input, context),
    userNegativePrompt: input.negativePrompt,
  }, null, 2);
}

function hashInputs(input: MediaGenerationRunInput, context: PromptComposerContext): string {
  return createHash('sha256')
    .update(JSON.stringify({
      operation: input.operation,
      description: input.description,
      promptGuidance: input.promptGuidance,
      promptMode: input.promptMode,
      prompt: input.prompt,
      negativePrompt: input.negativePrompt,
      inputNodeIds: input.inputNodeIds,
      inputUrls: input.inputUrls.map((value) => value.startsWith('data:') ? value.slice(0, 96) : value),
      parameters: input.parameters,
      context: selectedContext(input, context),
    }))
    .digest('hex');
}

export async function composeGenerationPrompt(
  input: MediaGenerationRunInput,
  context: PromptComposerContext,
  callModel: PromptModelCaller,
): Promise<PromptComposition> {
  const draftPrompt = buildRuleDraft(input, context);
  const inputHash = hashInputs(input, context);

  if (input.promptMode === 'manual') {
    return {
      description: input.description,
      draftPrompt,
      finalPrompt: input.prompt,
      negativePrompt: input.negativePrompt,
      promptSource: 'manual',
      inputHash,
      notes: ['使用用户手动填写的最终模型提示词。'],
    };
  }

  try {
    const result = await callModel({
      system: composerSystem(input),
      prompt: taskPayload(input, context, draftPrompt),
    });
    const finalPrompt = text(result?.prompt);
    if (finalPrompt) {
      return {
        description: input.description,
        draftPrompt,
        finalPrompt,
        negativePrompt: text(result?.negativePrompt) || input.negativePrompt,
        promptSource: 'agent',
        inputHash,
        notes: Array.isArray(result?.notes) ? result.notes.map(text).filter(Boolean) : [],
      };
    }
  } catch {
    // A deterministic draft remains available when the Agent provider is unavailable.
  }

  return {
    description: input.description,
    draftPrompt,
    finalPrompt: draftPrompt,
    negativePrompt: input.negativePrompt,
    promptSource: 'rule-fallback',
    inputHash,
    notes: ['Agent Prompt Composer 不可用，已使用规则草稿继续生成。'],
  };
}

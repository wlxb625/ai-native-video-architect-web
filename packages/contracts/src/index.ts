import { z } from 'zod';

export const MEDIA_NODE_TYPES = [
  'script',
  'analysis',
  'character',
  'scene',
  'referenceImage',
  'storyboard',
  'imageGen',
  'imageOutput',
  'videoGen',
  'videoOutput',
  'promptPack',
  'note',
  'group',
] as const;

export const AGENT_SKILL_IDS = [
  'script-writer',
  'script-doctor',
  'scene-breakdown',
  'character-bible',
  'storyboard-planner',
  'continuity-checker',
  'prompt-engineer',
] as const;

export const MEDIA_GENERATION_OPERATIONS = [
  'text-to-image',
  'image-to-image',
  'multi-reference-image',
  'inpaint',
  'outpaint',
  'text-to-video',
  'image-to-video',
  'first-last-frame-video',
  'video-to-video',
  'video-extend',
  'upscale',
] as const;

export const nodePositionSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
});

export const canvasNodeSchema = z.object({
  id: z.string().min(1).max(120),
  type: z.enum(MEDIA_NODE_TYPES),
  position: nodePositionSchema,
  width: z.number().positive().max(2400).optional(),
  height: z.number().positive().max(2400).optional(),
  data: z.record(z.string(), z.unknown()).default({}),
});

export const canvasEdgeSchema = z.object({
  id: z.string().min(1).max(120),
  source: z.string().min(1).max(120),
  target: z.string().min(1).max(120),
  type: z.string().max(64).default('smoothstep'),
  data: z.record(z.string(), z.unknown()).default({}),
});

export const viewportSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
  zoom: z.number().min(0.05).max(4),
});

export const canvasSnapshotSchema = z.object({
  version: z.number().int().nonnegative(),
  viewport: viewportSchema,
  nodes: z.array(canvasNodeSchema).max(5000),
  edges: z.array(canvasEdgeSchema).max(10000),
});

export const registerSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(10).max(128),
  displayName: z.string().trim().min(1).max(80),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
});

export const createProjectSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(1000).default(''),
});

export const nextStepRunSchema = z.object({
  sourceNodeId: z.string().min(1).max(120),
  instruction: z.string().trim().min(1).max(4000),
  targetType: z.enum(MEDIA_NODE_TYPES).optional(),
});

export const agentSkillRunSchema = z.object({
  skillId: z.enum(AGENT_SKILL_IDS),
  instruction: z.string().trim().min(1).max(12000),
  sourceNodeIds: z.array(z.string().min(1).max(120)).max(80).default([]),
});

export const generationParametersSchema = z.object({
  ratio: z.enum(['16:9', '9:16', '1:1', '4:3', '3:4', '21:9']).optional(),
  size: z.string().trim().max(64).optional(),
  resolution: z.enum(['540p', '720p', '1080p', '4k']).optional(),
  quality: z.enum(['draft', 'standard', 'high']).optional(),
  variants: z.number().int().min(1).max(8).optional(),
  seed: z.number().int().min(0).max(4294967295).optional(),
  background: z.enum(['auto', 'opaque', 'transparent']).optional(),
  outputFormat: z.enum(['png', 'jpeg', 'webp']).optional(),
  strength: z.number().min(0).max(1).optional(),
  inputFidelity: z.enum(['low', 'high']).optional(),
  preserveComposition: z.boolean().optional(),
  durationSeconds: z.number().int().min(2).max(20).optional(),
  fps: z.number().int().min(12).max(60).optional(),
  motionStrength: z.number().min(0).max(1).optional(),
  cameraMotion: z.string().trim().max(240).optional(),
  generateAudio: z.boolean().optional(),
  loop: z.boolean().optional(),
  endFrameAssetId: z.string().uuid().optional(),
  maskAssetId: z.string().uuid().optional(),
  providerParameters: z.record(z.string(), z.unknown()).default({}),
}).default({ providerParameters: {} });

const mediaInputReferenceSchema = z.string().max(16_000_000).refine(
  (value) => /^https:\/\//i.test(value) || /^data:(image|video)\/[a-z0-9.+-]+;base64,/i.test(value),
  '输入素材必须是 HTTPS 地址或图片/视频 data URI',
);

export const mediaGenerationRunSchema = z.object({
  nodeId: z.string().min(1).max(120),
  mediaType: z.enum(['image', 'video']),
  operation: z.enum(MEDIA_GENERATION_OPERATIONS),
  description: z.string().trim().min(1, '请先填写创作描述').max(12000),
  promptMode: z.enum(['auto', 'manual']).default('auto'),
  promptGuidance: z.string().trim().max(6000).default(''),
  prompt: z.string().trim().max(12000).default(''),
  negativePrompt: z.string().max(6000).default(''),
  provider: z.string().trim().max(64).optional(),
  model: z.string().trim().max(200).optional(),
  inputNodeIds: z.array(z.string().min(1).max(120)).max(32).default([]),
  inputAssetIds: z.array(z.string().uuid()).max(16).default([]),
  inputUrls: z.array(mediaInputReferenceSchema).max(16).default([]),
  parameters: generationParametersSchema,
}).superRefine((input, context) => {
  const imageOperations = new Set([
    'text-to-image',
    'image-to-image',
    'multi-reference-image',
    'inpaint',
    'outpaint',
    'upscale',
  ]);
  const videoOperations = new Set([
    'text-to-video',
    'image-to-video',
    'first-last-frame-video',
    'video-to-video',
    'video-extend',
  ]);
  if (imageOperations.has(input.operation) && input.mediaType !== 'image') {
    context.addIssue({ code: 'custom', path: ['mediaType'], message: '该操作必须生成图片' });
  }
  if (videoOperations.has(input.operation) && input.mediaType !== 'video') {
    context.addIssue({ code: 'custom', path: ['mediaType'], message: '该操作必须生成视频' });
  }
  if (input.promptMode === 'manual' && !input.prompt) {
    context.addIssue({ code: 'custom', path: ['prompt'], message: '手动模式必须填写最终模型提示词' });
  }
  const inputCount = input.inputAssetIds.length + input.inputUrls.length;
  const needsOneInput = [
    'image-to-image',
    'multi-reference-image',
    'inpaint',
    'outpaint',
    'image-to-video',
    'video-to-video',
    'video-extend',
    'upscale',
  ];
  if (needsOneInput.includes(input.operation) && inputCount < 1) {
    context.addIssue({ code: 'custom', path: ['inputUrls'], message: '该模式至少需要一个真实输入素材' });
  }
  if (input.operation === 'first-last-frame-video' && inputCount < 2) {
    context.addIssue({ code: 'custom', path: ['inputUrls'], message: '首尾帧生视频需要两张真实输入图片' });
  }
});

export const providerCredentialSchema = z.object({
  provider: z.string().trim().min(1).max(64),
  apiKey: z.string().min(8).max(4096),
  baseUrl: z.string().url().max(2048),
  model: z.string().trim().min(1).max(200),
});

export type CanvasSnapshot = z.infer<typeof canvasSnapshotSchema>;
export type CanvasNodeInput = z.infer<typeof canvasNodeSchema>;
export type CanvasEdgeInput = z.infer<typeof canvasEdgeSchema>;
export type AgentSkillRunInput = z.infer<typeof agentSkillRunSchema>;
export type MediaGenerationRunInput = z.infer<typeof mediaGenerationRunSchema>;
export type MediaGenerationOperation = typeof MEDIA_GENERATION_OPERATIONS[number];
export type GenerationParameters = z.infer<typeof generationParametersSchema>;

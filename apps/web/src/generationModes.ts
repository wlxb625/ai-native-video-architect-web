import type { MediaGenerationOperation } from '@cineweave/contracts';

export interface GenerationModeDefinition {
  id: MediaGenerationOperation;
  title: string;
  shortTitle: string;
  description: string;
  mediaType: 'image' | 'video';
  nodeType: 'imageGen' | 'videoGen';
  inputKind: 'none' | 'image' | 'two-images' | 'video';
  primary: boolean;
  promptHint: string;
  defaults: Record<string, unknown>;
}

export const generationModes: GenerationModeDefinition[] = [
  {
    id: 'text-to-image',
    title: '文生图',
    shortTitle: '文生图',
    description: '只用文字描述创建新画面，适合概念图、角色定妆、场景和分镜首稿。',
    mediaType: 'image',
    nodeType: 'imageGen',
    inputKind: 'none',
    primary: true,
    promptHint: '描述主体、环境、构图、镜头、光线、质感和画幅。',
    defaults: {
      operation: 'text-to-image',
      title: '文生图任务',
      summary: '从文字提示词生成一个或多个图片候选。',
      ratio: '16:9',
      quality: 'standard',
      variants: 4,
      background: 'auto',
      outputFormat: 'webp',
      model: 'Image Provider',
    },
  },
  {
    id: 'image-to-image',
    title: '图生图',
    shortTitle: '图生图',
    description: '基于输入图片修改内容或风格，通过强度决定保留原图的程度。',
    mediaType: 'image',
    nodeType: 'imageGen',
    inputKind: 'image',
    primary: true,
    promptHint: '说明要保留什么、修改什么，以及希望得到的风格和构图。',
    defaults: {
      operation: 'image-to-image',
      title: '图生图任务',
      summary: '需要连接一张图片；强度越低越接近原图。',
      ratio: '16:9',
      strength: 0.55,
      inputFidelity: 'high',
      preserveComposition: true,
      variants: 4,
      model: 'Image Provider',
    },
  },
  {
    id: 'text-to-video',
    title: '文生视频',
    shortTitle: '文生视频',
    description: '从文字直接生成镜头，重点描述主体动作、环境变化、镜头运动和时间节奏。',
    mediaType: 'video',
    nodeType: 'videoGen',
    inputKind: 'none',
    primary: true,
    promptHint: '描述画面、动作过程、镜头运动、节奏、声音需求和禁止变化。',
    defaults: {
      operation: 'text-to-video',
      title: '文生视频任务',
      summary: '无需首帧，模型根据文字创建完整短镜头。',
      ratio: '16:9',
      durationSeconds: 5,
      resolution: '720p',
      fps: 24,
      cameraMotion: '静态机位',
      generateAudio: false,
      model: 'Video Provider',
    },
  },
  {
    id: 'image-to-video',
    title: '图生视频',
    shortTitle: '图生视频',
    description: '把一张图片作为首帧或视觉约束，主要控制角色动作、环境运动和运镜。',
    mediaType: 'video',
    nodeType: 'videoGen',
    inputKind: 'image',
    primary: true,
    promptHint: '不要重复描述静态画面，重点写谁怎么动、镜头怎么动、环境如何变化。',
    defaults: {
      operation: 'image-to-video',
      title: '图生视频任务',
      summary: '需要连接一张图片作为首帧或视觉参考。',
      ratio: '16:9',
      durationSeconds: 5,
      resolution: '720p',
      fps: 24,
      motionStrength: 0.45,
      cameraMotion: '缓慢推近',
      generateAudio: false,
      model: 'Video Provider',
    },
  },
  {
    id: 'first-last-frame-video',
    title: '首尾帧生视频',
    shortTitle: '首尾帧',
    description: '使用两张图片规定镜头开始和结束状态，让模型补全中间运动。',
    mediaType: 'video',
    nodeType: 'videoGen',
    inputKind: 'two-images',
    primary: false,
    promptHint: '描述从首帧到尾帧之间发生的动作、转场和镜头运动。',
    defaults: {
      operation: 'first-last-frame-video',
      title: '首尾帧生视频',
      summary: '需要依次连接首帧和尾帧两张图片。',
      ratio: '16:9',
      durationSeconds: 5,
      resolution: '720p',
      fps: 24,
      motionStrength: 0.5,
      model: 'Video Provider',
    },
  },
  {
    id: 'multi-reference-image',
    title: '多参考图生图',
    shortTitle: '多参考图',
    description: '同时引用人物、服装、场景和风格图，生成新的统一画面。',
    mediaType: 'image',
    nodeType: 'imageGen',
    inputKind: 'image',
    primary: false,
    promptHint: '说明每张参考图承担人物、场景、服装还是风格作用。',
    defaults: {
      operation: 'multi-reference-image',
      title: '多参考图生图',
      summary: '可连接多张图片并分别赋予角色、场景或风格用途。',
      ratio: '16:9',
      inputFidelity: 'high',
      variants: 4,
      model: 'Image Provider',
    },
  },
  {
    id: 'inpaint',
    title: '局部重绘',
    shortTitle: '局部重绘',
    description: '输入原图和遮罩，只重新生成指定区域。',
    mediaType: 'image',
    nodeType: 'imageGen',
    inputKind: 'image',
    primary: false,
    promptHint: '只描述遮罩区域需要出现的内容，并说明边缘和光线如何衔接。',
    defaults: {
      operation: 'inpaint',
      title: '局部重绘',
      summary: '需要原图和遮罩素材。',
      ratio: '16:9',
      strength: 0.75,
      inputFidelity: 'high',
      variants: 2,
      model: 'Image Provider',
    },
  },
  {
    id: 'video-extend',
    title: '视频延长',
    shortTitle: '视频延长',
    description: '基于已有视频继续向后或向前生成新的片段。',
    mediaType: 'video',
    nodeType: 'videoGen',
    inputKind: 'video',
    primary: false,
    promptHint: '描述原视频结束后继续发生的动作，并保持人物、光线和运镜连续。',
    defaults: {
      operation: 'video-extend',
      title: '视频延长任务',
      summary: '需要连接一个已经生成的视频结果。',
      durationSeconds: 5,
      resolution: '720p',
      model: 'Video Provider',
    },
  },
];

export function getGenerationMode(operation?: unknown): GenerationModeDefinition {
  return generationModes.find((mode) => mode.id === operation) ?? generationModes[0];
}

export function isImageLikeNode(type?: string): boolean {
  return ['referenceImage', 'imageOutput', 'character', 'scene', 'storyboard'].includes(type ?? '');
}

export function isVideoLikeNode(type?: string): boolean {
  return type === 'videoOutput';
}

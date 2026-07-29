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
  descriptionHint: string;
  promptHint: string;
  exampleDescription: string;
  defaults: Record<string, unknown>;
}

const promptDefaults = {
  description: '',
  promptMode: 'auto',
  promptGuidance: '',
  prompt: '',
  negativePrompt: '',
  inlineInputUrls: [],
};

export const generationModes: GenerationModeDefinition[] = [
  {
    id: 'text-to-image',
    title: '文生图',
    shortTitle: '文生图',
    description: '用户描述想要的画面，Prompt Composer 自动整理为模型提示词。',
    mediaType: 'image',
    nodeType: 'imageGen',
    inputKind: 'none',
    primary: true,
    descriptionHint: '用自然语言说清楚画面里有什么、发生在哪里、镜头看起来怎样。不需要会写专业 Prompt。',
    promptHint: '最终模型提示词由系统根据描述、角色卡、场景卡和分镜自动生成。',
    exampleDescription: '雨夜末班地铁站，一名穿深灰风衣的短发女孩捡起旧摄像机，屏幕中出现空月台，画面克制、现实主义。',
    defaults: {
      ...promptDefaults,
      operation: 'text-to-image',
      title: '文生图任务',
      summary: '先描述想生成的画面，系统自动整理提示词并调用图片模型。',
      provider: 'image',
      model: 'gpt-image-1',
      ratio: '16:9',
      quality: 'standard',
      variants: 1,
      background: 'auto',
      outputFormat: 'webp',
    },
  },
  {
    id: 'image-to-image',
    title: '图生图',
    shortTitle: '图生图',
    description: '上传或连接参考图，再描述哪些内容保留、哪些内容修改。',
    mediaType: 'image',
    nodeType: 'imageGen',
    inputKind: 'image',
    primary: true,
    descriptionHint: '重点写“保留什么”和“改成什么”，例如保留人物五官和构图，只把白天改成雨夜。',
    promptHint: 'Composer 会把参考图身份、构图与修改目标写成编辑提示词。',
    exampleDescription: '保留女孩的脸、发型、风衣和原构图，把场景改成雨夜地铁站，地面有冷白灯反光，减少霓虹感。',
    defaults: {
      ...promptDefaults,
      operation: 'image-to-image',
      title: '图生图任务',
      summary: '连接或上传一张图片，再描述保留项与修改目标。',
      provider: 'image',
      model: 'gpt-image-1',
      ratio: '16:9',
      strength: 0.55,
      inputFidelity: 'high',
      preserveComposition: true,
      variants: 1,
      quality: 'standard',
      outputFormat: 'webp',
    },
  },
  {
    id: 'text-to-video',
    title: '文生视频',
    shortTitle: '文生视频',
    description: '描述一个连续短镜头，系统自动补齐动作链、运镜与时间顺序。',
    mediaType: 'video',
    nodeType: 'videoGen',
    inputKind: 'none',
    primary: true,
    descriptionHint: '描述谁先做什么、随后发生什么、镜头怎样移动。不要只写一张静态画面。',
    promptHint: 'Composer 会把静态场景说明改写为可执行的动态过程。',
    exampleDescription: '女孩弯腰捡起旧摄像机，屏幕闪烁一次，她缓慢抬头看向站台尽头，镜头从手部特写平稳推到中近景。',
    defaults: {
      ...promptDefaults,
      operation: 'text-to-video',
      title: '文生视频任务',
      summary: '描述连续动作和运镜，系统整理后调用视频模型。',
      provider: 'runway',
      model: 'gen4.5',
      ratio: '16:9',
      durationSeconds: 5,
      resolution: '720p',
      fps: 24,
      cameraMotion: '缓慢推近',
      generateAudio: false,
    },
  },
  {
    id: 'image-to-video',
    title: '图生视频',
    shortTitle: '图生视频',
    description: '把图片作为首帧与人物外观约束，再描述画面接下来如何运动。',
    mediaType: 'video',
    nodeType: 'videoGen',
    inputKind: 'image',
    primary: true,
    descriptionHint: '不要重复图片中已有的静态外观，重点说接下来谁怎么动、镜头怎么动、环境如何变化。',
    promptHint: 'Composer 会引用图片1作为首帧，并把描述整理为动作与镜头提示词。',
    exampleDescription: '从当前画面开始，摄像机屏幕短暂闪烁，女孩的手指轻轻收紧，镜头缓慢推近屏幕，远处列车风吹动她的发梢。',
    defaults: {
      ...promptDefaults,
      operation: 'image-to-video',
      title: '图生视频任务',
      summary: '连接或上传一张图片作为首帧，再描述后续动作。',
      provider: 'runway',
      model: 'gen4.5',
      ratio: '16:9',
      durationSeconds: 5,
      resolution: '720p',
      fps: 24,
      motionStrength: 0.45,
      cameraMotion: '缓慢推近',
      generateAudio: false,
    },
  },
  {
    id: 'first-last-frame-video',
    title: '首尾帧生视频',
    shortTitle: '首尾帧',
    description: '上传或连接首帧和尾帧，描述二者之间发生的连续过渡。',
    mediaType: 'video',
    nodeType: 'videoGen',
    inputKind: 'two-images',
    primary: false,
    descriptionHint: '描述从首帧走向尾帧的单向动作链和镜头位移，不要只重复两张图的内容。',
    promptHint: 'Composer 会按图片1为首帧、图片2为尾帧生成过渡描述。',
    exampleDescription: '镜头沿女孩肩后缓慢向右移动，她抬起摄像机对准空月台，画面自然过渡到尾帧中的正面中景。',
    defaults: {
      ...promptDefaults,
      operation: 'first-last-frame-video',
      title: '首尾帧生视频',
      summary: '需要两张图片和一段描述二者之间过程的文字。',
      provider: 'luma',
      model: 'ray-2',
      ratio: '16:9',
      durationSeconds: 5,
      resolution: '720p',
      fps: 24,
      motionStrength: 0.5,
      cameraMotion: '平稳横移',
    },
  },
  {
    id: 'multi-reference-image',
    title: '多参考图生图',
    shortTitle: '多参考图',
    description: '同时使用人物、服装、场景和风格参考图生成统一画面。',
    mediaType: 'image',
    nodeType: 'imageGen',
    inputKind: 'image',
    primary: false,
    descriptionHint: '说明每张图承担什么作用，以及最终画面要发生什么。',
    promptHint: 'Composer 会按图片编号建立人物、场景、道具和风格引用。',
    exampleDescription: '使用图片1的人物造型、图片2的地铁站结构和图片3的冷灰摄影风格，生成女孩在闸机旁查看摄像机的中景。',
    defaults: {
      ...promptDefaults,
      operation: 'multi-reference-image',
      title: '多参考图生图',
      summary: '连接或上传多张参考图，并说明每张图的用途。',
      provider: 'image',
      model: 'gpt-image-1',
      ratio: '16:9',
      inputFidelity: 'high',
      variants: 1,
      quality: 'standard',
      outputFormat: 'webp',
    },
  },
  {
    id: 'inpaint',
    title: '局部重绘',
    shortTitle: '局部重绘',
    description: '输入原图与遮罩，描述遮罩区域应该替换成什么。',
    mediaType: 'image',
    nodeType: 'imageGen',
    inputKind: 'image',
    primary: false,
    descriptionHint: '只描述需要重绘的区域，并说明边缘、光线和透视如何与原图衔接。',
    promptHint: '正式遮罩上传仍需 Provider 支持；描述会先被整理成局部编辑提示词。',
    exampleDescription: '只把摄像机屏幕中的内容改为空月台，保持手部、机身、背景和光线完全不变。',
    defaults: {
      ...promptDefaults,
      operation: 'inpaint',
      title: '局部重绘',
      summary: '上传原图并描述需要替换的区域。',
      provider: 'image',
      model: 'gpt-image-1',
      ratio: '16:9',
      strength: 0.75,
      inputFidelity: 'high',
      variants: 1,
      quality: 'standard',
      outputFormat: 'webp',
    },
  },
  {
    id: 'video-extend',
    title: '视频延长',
    shortTitle: '视频延长',
    description: '从已有视频结束状态继续生成下一段连续动作。',
    mediaType: 'video',
    nodeType: 'videoGen',
    inputKind: 'video',
    primary: false,
    descriptionHint: '描述原视频结束后继续发生什么，动作方向、光线和运镜要保持连续。',
    promptHint: '部分平台还需要原始 generation ID，而不只是视频文件。',
    exampleDescription: '列车驶过后站台重新安静下来，女孩放下摄像机向前走两步，镜头继续从侧后方平稳跟拍。',
    defaults: {
      ...promptDefaults,
      operation: 'video-extend',
      title: '视频延长任务',
      summary: '连接视频结果并描述接下来发生的动作。',
      provider: 'luma',
      model: 'ray-2',
      durationSeconds: 5,
      resolution: '720p',
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

export const SKILL_IDS = [
  'script-writer',
  'script-doctor',
  'scene-breakdown',
  'character-bible',
  'storyboard-planner',
  'continuity-checker',
  'prompt-engineer',
] as const;

export type SkillId = (typeof SKILL_IDS)[number];

export interface AgentSkillDefinition {
  id: SkillId;
  title: string;
  description: string;
  category: 'writing' | 'analysis' | 'production';
  outputNodeType: 'script' | 'analysis' | 'character' | 'scene' | 'storyboard' | 'promptPack';
  systemPrompt: string;
  outputContract: string;
}

export const agentSkills: AgentSkillDefinition[] = [
  {
    id: 'script-writer',
    title: '剧本生成',
    description: '根据故事目标、人物和篇幅生成结构化影视剧本。',
    category: 'writing',
    outputNodeType: 'script',
    systemPrompt:
      '你是一名影视编剧。生成适合 AI 影像制作的结构化剧本，减少难以稳定生成的大规模群演、复杂肢体冲突和连续空间跳跃。',
    outputContract:
      '{title, logline, synopsis, scenes:[{sceneNumber, location, time, characters, action, dialogue, emotion, visualFocus}]}',
  },
  {
    id: 'script-doctor',
    title: '剧本诊断',
    description: '检查人物动机、冲突、节奏、逻辑和 AI 视频实现难度。',
    category: 'analysis',
    outputNodeType: 'analysis',
    systemPrompt:
      '你是一名剧本医生。指出具体问题并给出可执行修改方案，不要空泛评价。特别评估开场吸引力、人物动机、冲突递进、信息重复、转折可信度和 AI 视频制作风险。',
    outputContract:
      '{score, summary, strengths:string[], issues:[{severity, category, evidence, suggestion}], revisedOutline:string[]}',
  },
  {
    id: 'scene-breakdown',
    title: '场次拆解',
    description: '把剧本拆成地点、人物、动作、道具和连续性要求。',
    category: 'production',
    outputNodeType: 'scene',
    systemPrompt:
      '你是一名影视制片与场记。将剧本拆成可以直接进入分镜和生成环节的场次清单。',
    outputContract:
      '{scenes:[{sceneNumber, location, time, characters, action, dialogue, props, emotion, continuity, generationRisks}]}',
  },
  {
    id: 'character-bible',
    title: '人物设定提取',
    description: '形成可用于跨镜头一致性控制的人物资产卡。',
    category: 'production',
    outputNodeType: 'character',
    systemPrompt:
      '你是一名角色视觉开发师。提取稳定、可复用、可生图的人物设定，并明确禁止变化项。',
    outputContract:
      '{characters:[{name, age, genderPresentation, appearance, hairstyle, wardrobe, personality, motivation, expressionRange, lockedTraits, imagePrompt}]}',
  },
  {
    id: 'storyboard-planner',
    title: '分镜规划',
    description: '按场次生成镜头、景别、机位、动作、运镜和时长。',
    category: 'production',
    outputNodeType: 'storyboard',
    systemPrompt:
      '你是一名分镜导演。把内容拆成适合 AI 图像和视频生成的单一明确镜头，优先稳定构图、短动作和清晰主体。',
    outputContract:
      '{shots:[{shotNumber, sceneNumber, framing, cameraAngle, composition, subjectAction, expression, cameraMovement, durationSeconds, imagePrompt, videoPrompt, continuityNotes}]}',
  },
  {
    id: 'continuity-checker',
    title: '连续性检查',
    description: '检查服装、发型、道具、光线、站位、时间和轴线。',
    category: 'analysis',
    outputNodeType: 'analysis',
    systemPrompt:
      '你是一名场记和连续性审查员。逐项比对人物、场景、时间、道具、光线、站位和镜头轴线。',
    outputContract:
      '{passed, checks:[{category, status, evidence, fix}], lockedFacts:string[]}',
  },
  {
    id: 'prompt-engineer',
    title: '模型提示词',
    description: '按生图或生视频模型生成适配后的提示词包。',
    category: 'production',
    outputNodeType: 'promptPack',
    systemPrompt:
      '你是一名多模型提示词工程师。根据目标模型、参考素材和镜头任务生成可直接调用的提示词与负面约束，不使用一套提示词硬套所有模型。',
    outputContract:
      '{model, taskType, positivePrompt, negativePrompt, motionPrompt, cameraPrompt, consistencyConstraints, parameters}',
  },
];

const skillById = new Map(agentSkills.map((skill) => [skill.id, skill]));

export function getAgentSkill(skillId: string): AgentSkillDefinition {
  const skill = skillById.get(skillId as SkillId);
  if (!skill) {
    throw new Error(`Unknown agent skill: ${skillId}`);
  }
  return skill;
}

export function buildSkillPrompt(
  skillId: string,
  instruction: string,
  context: unknown,
): string {
  const skill = getAgentSkill(skillId);
  return [
    skill.systemPrompt,
    '',
    `输出必须是 JSON，符合以下结构：${skill.outputContract}`,
    '',
    `用户要求：${instruction}`,
    '',
    `项目上下文：${JSON.stringify(context).slice(0, 24000)}`,
  ].join('\n');
}

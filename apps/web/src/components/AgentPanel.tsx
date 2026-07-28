import {
  Bot,
  CheckCircle2,
  ChevronRight,
  LoaderCircle,
  Sparkles,
  WandSparkles,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';

const skills = [
  {
    id: 'script-writer',
    title: '剧本生成',
    description: '从故事目标生成结构化剧本',
  },
  {
    id: 'script-doctor',
    title: '剧本诊断',
    description: '检查动机、冲突、节奏和实现难度',
  },
  {
    id: 'scene-breakdown',
    title: '场次拆解',
    description: '提取地点、人物、道具和连续性',
  },
  {
    id: 'character-bible',
    title: '人物设定',
    description: '建立跨镜头一致的人物资产卡',
  },
  {
    id: 'storyboard-planner',
    title: '分镜规划',
    description: '生成景别、机位、动作和运镜',
  },
  {
    id: 'continuity-checker',
    title: '连续性检查',
    description: '检查服装、道具、光线和站位',
  },
  {
    id: 'prompt-engineer',
    title: '模型提示词',
    description: '按目标模型生成图像或视频提示词',
  },
] as const;

export type AgentSkillId = (typeof skills)[number]['id'];

export function AgentPanel({
  open,
  busy,
  onClose,
  onRun,
}: {
  open: boolean;
  busy: boolean;
  onClose: () => void;
  onRun: (skillId: AgentSkillId, instruction: string) => void;
}) {
  const [skillId, setSkillId] = useState<AgentSkillId>('script-doctor');
  const [instruction, setInstruction] = useState(
    '分析当前剧本的开场吸引力、人物动机、冲突递进和 AI 视频实现难度，并给出可直接修改的建议。',
  );
  const current = useMemo(
    () => skills.find((skill) => skill.id === skillId) ?? skills[0],
    [skillId],
  );

  if (!open) {
    return null;
  }

  return (
    <aside className="agent-panel">
      <div className="agent-panel-head">
        <div className="agent-avatar">
          <Bot size={18} />
        </div>
        <div>
          <span>DIRECTOR AGENT</span>
          <h2>AI 导演</h2>
        </div>
        <button onClick={onClose} aria-label="关闭 Agent 面板">
          <X size={17} />
        </button>
      </div>

      <div className="agent-context">
        <Sparkles size={15} />
        <div>
          <strong>读取当前画布上下文</strong>
          <span>剧本、人物、场景、参考图和已选镜头</span>
        </div>
        <CheckCircle2 size={15} />
      </div>

      <div className="agent-section-title">选择 Skill</div>
      <div className="skill-list">
        {skills.map((skill) => (
          <button
            key={skill.id}
            className={skill.id === skillId ? 'active' : ''}
            onClick={() => setSkillId(skill.id)}
          >
            <div>
              <strong>{skill.title}</strong>
              <span>{skill.description}</span>
            </div>
            <ChevronRight size={15} />
          </button>
        ))}
      </div>

      <div className="agent-instruction">
        <div>
          <span>执行要求</span>
          <b>{current.title}</b>
        </div>
        <textarea
          rows={6}
          value={instruction}
          onChange={(event) => setInstruction(event.target.value)}
        />
      </div>

      <button
        className="agent-run"
        disabled={busy || !instruction.trim()}
        onClick={() => onRun(skillId, instruction.trim())}
      >
        {busy ? (
          <LoaderCircle className="spin" size={17} />
        ) : (
          <WandSparkles size={17} />
        )}
        {busy ? 'Agent 正在调用 Skills…' : '运行并写回画布'}
      </button>

      <div className="agent-boundary">
        Agent 会先生成结构化结果；涉及批量建节点或发起媒体生成时，保留可追溯的任务记录。
      </div>
    </aside>
  );
}

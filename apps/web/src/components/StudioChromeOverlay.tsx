import {
  Bot,
  CheckCircle2,
  Clock3,
  Film,
  Image as ImageIcon,
  ListChecks,
  MessageCircleMore,
  Play,
  Send,
  Sparkles,
  WandSparkles,
} from 'lucide-react';
import { generatedAssets } from '../generatedAssets';
import './StudioChromeOverlay.css';

const stages = ['画布', '剧本', '角色', '场景', '分镜', '素材库'];

const skills = [
  ['剧本分析大师', '结构与冲突'],
  ['分镜规划师', '景别与运镜'],
  ['角色设定师', '人物一致性'],
  ['提示词工程师', '模型适配'],
];

const shots = [
  { id: '01', title: '开场', duration: '6s', image: generatedAssets.sceneRainAlley },
  { id: '02', title: '跟随', duration: '5s', image: generatedAssets.characterMale },
  { id: '03', title: '异常', duration: '4s', image: generatedAssets.characterFemale },
  { id: '04', title: '反应', duration: '3s', image: generatedAssets.sceneRainAlley },
];

function clickExisting(selector: string) {
  document.querySelector<HTMLButtonElement>(selector)?.click();
}

export function StudioChromeOverlay() {
  return (
    <div className="studio-chrome-overlay">
      <nav className="studio-stage-nav" aria-label="项目阶段">
        <span className="studio-version-badge">LIGHT STUDIO V3</span>
        {stages.map((stage, index) => (
          <button key={stage} className={index === 0 ? 'active' : ''} type="button">
            {stage}
          </button>
        ))}
      </nav>

      <section className="production-dock" aria-label="AI 导演与任务工作区">
        <aside className="dock-skills">
          <div className="dock-section-head">
            <span><Sparkles size={14} /> AI 导演 Skills</span>
            <small>读取当前画布</small>
          </div>
          <div className="dock-skill-list">
            {skills.map(([title, subtitle], index) => (
              <button
                key={title}
                type="button"
                className={index === 1 ? 'active' : ''}
                onClick={() => clickExisting('.floating-agent-button')}
              >
                <span className="skill-avatar"><Bot size={13} /></span>
                <span><strong>{title}</strong><small>{subtitle}</small></span>
              </button>
            ))}
          </div>
        </aside>

        <div className="dock-director">
          <div className="dock-tabs">
            <button type="button" className="active"><MessageCircleMore size={14} /> 对话</button>
            <button type="button"><Clock3 size={14} /> 执行历史</button>
          </div>
          <div className="director-message">
            <span className="director-avatar"><Bot size={15} /></span>
            <div>
              <strong>导演助手</strong>
              <p>已读取剧本、人物、场景和分镜。当前可继续拆镜头、优化提示词或检查人物连续性。</p>
            </div>
          </div>
          <div className="director-suggestions">
            <button type="button" onClick={() => clickExisting('.floating-agent-button')}>继续生成下一镜头</button>
            <button type="button" onClick={() => clickExisting('.floating-agent-button')}>优化当前提示词</button>
            <button type="button" onClick={() => clickExisting('.floating-agent-button')}>检查连续性</button>
          </div>
          <button className="director-input" type="button" onClick={() => clickExisting('.floating-agent-button')}>
            <span>告诉导演你的需求…</span><Send size={15} />
          </button>
        </div>

        <aside className="dock-queue">
          <div className="dock-section-head">
            <span><ListChecks size={14} /> 任务队列</span>
            <small>3 个任务</small>
          </div>
          <div className="queue-item">
            <span className="queue-icon image"><ImageIcon size={14} /></span>
            <span><strong>AI 生图 · 镜头 04</strong><small>生成 4 个候选</small></span>
            <em>60%</em>
          </div>
          <div className="queue-item">
            <span className="queue-icon video"><Film size={14} /></span>
            <span><strong>首尾帧生视频</strong><small>等待图片结果</small></span>
            <em>等待</em>
          </div>
          <div className="queue-item done">
            <span className="queue-icon agent"><WandSparkles size={14} /></span>
            <span><strong>分镜规划</strong><small>已写回画布</small></span>
            <CheckCircle2 size={15} />
          </div>
        </aside>

        <div className="shot-timeline">
          <div className="timeline-title"><Film size={14} /><span>分镜时间线</span><small>共 12 个镜头</small></div>
          <div className="timeline-cards">
            {shots.map((shot, index) => (
              <button key={shot.id} type="button" className={index === 2 ? 'active' : ''}>
                <span className="timeline-thumb" style={{ backgroundImage: `url(${shot.image})` }}>
                  {index === 2 && <Play size={14} fill="currentColor" />}
                </span>
                <span><strong>{shot.id} {shot.title}</strong><small>{shot.duration}</small></span>
              </button>
            ))}
            <button className="timeline-add" type="button" onClick={() => clickExisting('.floating-create-button')}>
              <span>＋</span><small>添加镜头</small>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

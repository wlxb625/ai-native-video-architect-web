import {
  Aperture,
  BookOpenText,
  Clapperboard,
  Film,
  Image as ImageIcon,
  Sparkles,
  Upload,
  UserRound,
  WandSparkles,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

const canvasItems = [
  ['script', '添加剧本', BookOpenText],
  ['character', '添加人物资产', UserRound],
  ['scene', '添加场景资产', Aperture],
  ['referenceImage', '添加参考图', ImageIcon],
  ['storyboard', '添加分镜', Clapperboard],
  ['imageGen', '文生图 / 图生图', WandSparkles],
  ['videoGen', '图生视频 / 文生视频', Film],
] as const;

export function ContextMenu({
  x,
  y,
  targetType,
  onAdd,
  onAgent,
  onGenerate,
  onClose,
}: {
  x: number;
  y: number;
  targetType?: string;
  onAdd: (type: string) => void;
  onAgent: () => void;
  onGenerate: (type: 'imageGen' | 'videoGen') => void;
  onClose: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const isImage = ['referenceImage', 'imageOutput', 'character', 'scene', 'storyboard'].includes(
    targetType ?? '',
  );
  const isScript = ['script', 'analysis', 'storyboard'].includes(targetType ?? '');

  return (
    <>
      <motion.button
        className="context-menu-backdrop"
        aria-label="关闭菜单"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />
      <motion.div
        className="context-menu"
        style={{ left: x, top: y }}
        initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: -5 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 520, damping: 38 }}
      >
        <div className="context-title">
          {targetType ? '基于当前素材' : '在此处创建'}
        </div>

        {!targetType &&
          canvasItems.map(([type, label, Icon], index) => (
            <motion.button
              type="button"
              key={type}
              onClick={() => onAdd(type)}
              initial={reduceMotion ? false : { opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.018 }}
            >
              <Icon size={15} />
              <span>{label}</span>
            </motion.button>
          ))}

        {targetType && (
          <>
            <button onClick={onAgent}>
              <Sparkles size={15} />
              <span>{isScript ? '让 Agent 分析 / 拆解' : '让 Agent 读取此素材'}</span>
            </button>
            {isImage && (
              <button onClick={() => onGenerate('imageGen')}>
                <WandSparkles size={15} />
                <span>生成图片变体</span>
              </button>
            )}
            {isImage && (
              <button onClick={() => onGenerate('videoGen')}>
                <Film size={15} />
                <span>以此生成视频</span>
              </button>
            )}
            {targetType === 'videoOutput' && (
              <button onClick={() => onGenerate('videoGen')}>
                <Film size={15} />
                <span>延长或重新生成</span>
              </button>
            )}
          </>
        )}

        <div className="context-separator" />
        <button onClick={() => onAdd('referenceImage')}>
          <Upload size={15} />
          <span>上传图片或视频</span>
        </button>
        <button className="context-primary" onClick={onAgent}>
          <Sparkles size={15} />
          <span>打开 AI 导演</span>
          <kbd>A</kbd>
        </button>
      </motion.div>
    </>
  );
}

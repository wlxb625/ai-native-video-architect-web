import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ChevronDown,
  Film,
  Images,
  Image as ImageIcon,
  Sparkles,
  WandSparkles,
} from 'lucide-react';
import { useState } from 'react';
import type { MediaGenerationOperation } from '@cineweave/contracts';
import { generationModes } from '../generationModes';

const iconFor = (operation: MediaGenerationOperation) => {
  if (operation === 'text-to-image') return WandSparkles;
  if (operation === 'image-to-image' || operation === 'multi-reference-image') return Images;
  if (operation === 'text-to-video') return Film;
  if (operation === 'image-to-video' || operation === 'first-last-frame-video') return Sparkles;
  return ImageIcon;
};

export function GenerationModeBar({
  onCreate,
}: {
  onCreate: (operation: MediaGenerationOperation) => void;
}) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const primary = generationModes.filter((mode) => mode.primary);
  const advanced = generationModes.filter((mode) => !mode.primary);

  return (
    <div className="generation-mode-bar" aria-label="生成模式">
      <div className="generation-mode-label">
        <span>核心生成</span>
        <small>选择真实输入模式</small>
      </div>
      <div className="generation-mode-items">
        {primary.map((mode) => {
          const Icon = iconFor(mode.id);
          return (
            <button
              key={mode.id}
              className={`generation-mode-button mode-${mode.mediaType}`}
              type="button"
              onClick={() => onCreate(mode.id)}
              title={mode.description}
            >
              <Icon size={16} />
              <span>
                <strong>{mode.shortTitle}</strong>
                <small>{mode.inputKind === 'none' ? '无需输入素材' : '需要图片输入'}</small>
              </span>
            </button>
          );
        })}
        <div className="generation-advanced-wrap">
          <button
            type="button"
            className="generation-advanced-trigger"
            onClick={() => setAdvancedOpen((value) => !value)}
            aria-expanded={advancedOpen}
          >
            更多模式 <ChevronDown size={14} className={advancedOpen ? 'is-open' : ''} />
          </button>
          <AnimatePresence>
            {advancedOpen && (
              <motion.div
                className="generation-advanced-menu"
                initial={reduceMotion ? false : { opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.16 }}
              >
                {advanced.map((mode) => {
                  const Icon = iconFor(mode.id);
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => {
                        onCreate(mode.id);
                        setAdvancedOpen(false);
                      }}
                    >
                      <Icon size={15} />
                      <span>
                        <strong>{mode.title}</strong>
                        <small>{mode.description}</small>
                      </span>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

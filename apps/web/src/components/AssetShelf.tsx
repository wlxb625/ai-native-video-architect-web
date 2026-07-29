import {
  Aperture,
  Box,
  Image as ImageIcon,
  Plus,
  Search,
  Upload,
  UserRound,
} from 'lucide-react';
import { LayoutGroup, motion, useReducedMotion } from 'motion/react';
import { useMemo, useState } from 'react';
import { generatedAssets } from '../generatedAssets';

export interface AssetShelfItem {
  id: string;
  kind: 'character' | 'scene' | 'reference' | 'prop';
  title: string;
  subtitle: string;
  preview?: string;
}

const demoAssets: AssetShelfItem[] = [
  {
    id: 'asset-lin-che',
    kind: 'character',
    title: '林澈',
    subtitle: '主角 · 锁定造型',
    preview: generatedAssets.characterFemale,
  },
  {
    id: 'asset-chen-mo',
    kind: 'character',
    title: '陈默',
    subtitle: '失踪调查员 · 参考造型',
    preview: generatedAssets.characterMale,
  },
  {
    id: 'asset-station',
    kind: 'scene',
    title: '雨夜地下通道',
    subtitle: '冷雨 · 反光 · 空镜',
    preview: generatedAssets.sceneRainAlley,
  },
  {
    id: 'asset-camera',
    kind: 'prop',
    title: '旧摄像机',
    subtitle: '关键道具 · 时间异常',
    preview: generatedAssets.shotNeonDialogue,
  },
  {
    id: 'asset-style',
    kind: 'reference',
    title: '克制现实主义',
    subtitle: '低饱和 · 实景光源',
    preview: generatedAssets.shotNeonDialogue,
  },
];

const tabs = [
  ['all', '全部'],
  ['character', '人物'],
  ['scene', '场景'],
  ['reference', '参考'],
  ['prop', '道具'],
] as const;

const kindIcon = {
  character: UserRound,
  scene: Aperture,
  reference: ImageIcon,
  prop: Box,
};

export function AssetShelf({
  onCreate,
}: {
  onCreate: (type: string, data?: Record<string, unknown>) => void;
}) {
  const reduceMotion = useReducedMotion();
  const [activeKind, setActiveKind] = useState<(typeof tabs)[number][0]>('all');
  const [query, setQuery] = useState('');

  const visibleAssets = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return demoAssets.filter((asset) => {
      const matchesKind = activeKind === 'all' || asset.kind === activeKind;
      const matchesQuery =
        !keyword || `${asset.title} ${asset.subtitle}`.toLowerCase().includes(keyword);
      return matchesKind && matchesQuery;
    });
  }, [activeKind, query]);

  return (
    <aside className="asset-shelf">
      <div className="asset-shelf-head">
        <div>
          <span>MEDIA BIN</span>
          <h2>项目素材</h2>
        </div>
        <button className="asset-add" title="上传素材" aria-label="上传素材">
          <Upload size={15} />
        </button>
      </div>

      <div className="asset-search">
        <Search size={14} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索人物、场景、参考图"
        />
      </div>

      <LayoutGroup id="asset-tabs">
        <div className="asset-tabs">
          {tabs.map(([id, label]) => (
            <button
              type="button"
              key={id}
              className={activeKind === id ? 'active' : ''}
              onClick={() => setActiveKind(id)}
            >
              {activeKind === id && (
                <motion.span
                  className="asset-tab-indicator"
                  layoutId="asset-tab-indicator"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
              <span>{label}</span>
            </button>
          ))}
        </div>
      </LayoutGroup>

      <motion.div className="asset-list" layoutScroll>
        {visibleAssets.map((asset, index) => {
          const Icon = kindIcon[asset.kind];
          return (
            <motion.button
              layout="position"
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduceMotion ? 0 : index * 0.035, duration: 0.2 }}
              whileHover={reduceMotion ? undefined : { x: 3 }}
              key={asset.id}
              className="asset-card"
              onDoubleClick={() =>
                onCreate(
                  asset.kind === 'reference' || asset.kind === 'prop'
                    ? 'referenceImage'
                    : asset.kind,
                  {
                    title: asset.title,
                    summary: asset.subtitle,
                    previewUrl: asset.preview,
                    assetId: asset.id,
                    status: 'ready',
                  },
                )
              }
            >
              <div
                className="asset-thumb"
                style={{ backgroundImage: asset.preview ? `url(${asset.preview})` : undefined }}
              >
                {!asset.preview && <Icon size={15} />}
                <span className="asset-kind-icon"><Icon size={12} /></span>
              </div>
              <div>
                <strong>{asset.title}</strong>
                <span>{asset.subtitle}</span>
              </div>
            </motion.button>
          );
        })}

        {visibleAssets.length === 0 && (
          <div className="asset-empty">
            <Search size={17} />
            <span>没有匹配的素材</span>
          </div>
        )}
      </motion.div>

      <button
        className="asset-create"
        onClick={() =>
          onCreate('referenceImage', {
            title: '新参考图',
            summary: '上传图片或拖入画布。',
          })
        }
      >
        <Plus size={15} />
        添加资产
      </button>

      <div className="asset-tip">双击素材可添加到画布 · 拖拽接入将在下一阶段开放</div>
    </aside>
  );
}

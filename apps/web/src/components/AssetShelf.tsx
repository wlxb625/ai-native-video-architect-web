import {
  Aperture,
  Box,
  Image as ImageIcon,
  Plus,
  Search,
  Upload,
  UserRound,
} from 'lucide-react';

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
    preview:
      'linear-gradient(145deg, rgba(64,87,116,.35), rgba(13,18,28,.96)), radial-gradient(circle at 42% 28%, #b5c4d4 0 7%, #596879 8% 18%, transparent 19%)',
  },
  {
    id: 'asset-station',
    kind: 'scene',
    title: '末班地铁站',
    subtitle: '冷白灯 · 雨夜',
    preview:
      'linear-gradient(160deg, rgba(16,25,37,.1), rgba(8,10,16,.86)), linear-gradient(12deg, #111721 0 38%, #33404d 39% 42%, #10151d 43% 100%)',
  },
  {
    id: 'asset-camera',
    kind: 'prop',
    title: '旧摄像机',
    subtitle: '关键道具',
    preview:
      'radial-gradient(circle at 55% 48%, #536170 0 8%, #111923 9% 20%, transparent 21%), linear-gradient(135deg, #323b47, #10151d)',
  },
  {
    id: 'asset-style',
    kind: 'reference',
    title: '冷灰现实主义',
    subtitle: '全局视觉风格',
    preview:
      'linear-gradient(120deg, rgba(120,136,155,.32), transparent 45%), linear-gradient(160deg, #26313d, #0b0f15 68%)',
  },
];

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
  return (
    <aside className="asset-shelf">
      <div className="asset-shelf-head">
        <div>
          <span>PROJECT ASSETS</span>
          <h2>资产库</h2>
        </div>
        <button className="asset-add" title="上传素材">
          <Upload size={15} />
        </button>
      </div>

      <div className="asset-search">
        <Search size={14} />
        <input placeholder="搜索人物、场景、参考图" />
      </div>

      <div className="asset-tabs">
        <button className="active">全部</button>
        <button>人物</button>
        <button>场景</button>
        <button>参考</button>
      </div>

      <div className="asset-list">
        {demoAssets.map((asset) => {
          const Icon = kindIcon[asset.kind];
          return (
            <button
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
                    previewStyle: asset.preview,
                    assetId: asset.id,
                    status: 'ready',
                  },
                )
              }
            >
              <div
                className="asset-thumb"
                style={{ backgroundImage: asset.preview }}
              >
                <Icon size={15} />
              </div>
              <div>
                <strong>{asset.title}</strong>
                <span>{asset.subtitle}</span>
              </div>
            </button>
          );
        })}
      </div>

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

      <div className="asset-tip">双击资产可添加到当前画布</div>
    </aside>
  );
}

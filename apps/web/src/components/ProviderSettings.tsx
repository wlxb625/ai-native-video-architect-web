import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  Bot,
  CheckCircle2,
  ChevronDown,
  Film,
  Image as ImageIcon,
  KeyRound,
  LoaderCircle,
  ServerCog,
  Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { api, type ProviderSummary } from '../api';
import './ProviderSettings.css';

const providerProfiles = [
  {
    id: 'agent',
    label: 'Agent',
    description: '剧本与 Skills',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-5.6',
    icon: Bot,
  },
  {
    id: 'image',
    label: '图片',
    description: '文生图与图生图',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-image-1',
    icon: ImageIcon,
  },
  {
    id: 'runway',
    label: 'Runway',
    description: '文生与图生视频',
    baseUrl: 'https://api.dev.runwayml.com',
    model: 'gen4.5',
    icon: Film,
  },
  {
    id: 'luma',
    label: 'Luma',
    description: '关键帧与视频',
    baseUrl: 'https://api.lumalabs.ai',
    model: 'ray-2',
    icon: Film,
  },
] as const;

type ProviderProfileId = typeof providerProfiles[number]['id'];

export function ProviderSettings() {
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [providers, setProviders] = useState<ProviderSummary[]>([]);
  const [activeId, setActiveId] = useState<ProviderProfileId>('agent');
  const [baseUrl, setBaseUrl] = useState(providerProfiles[0].baseUrl);
  const [model, setModel] = useState(providerProfiles[0].model);
  const [apiKey, setApiKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const profile = useMemo(
    () => providerProfiles.find((item) => item.id === activeId) ?? providerProfiles[0],
    [activeId],
  );
  const saved = providers.find((item) => item.provider === activeId);
  const configuredCount = providerProfiles.filter((item) =>
    providers.some((provider) => provider.provider === item.id),
  ).length;

  const applyProfile = (
    id: ProviderProfileId,
    items = providers,
  ) => {
    const next = providerProfiles.find((item) => item.id === id) ?? providerProfiles[0];
    const current = items.find((item) => item.provider === id);
    setActiveId(id);
    setBaseUrl(current?.base_url ?? next.baseUrl);
    setModel(current?.model ?? next.model);
    setApiKey('');
    setMessage('');
    setError('');
  };

  const loadProviders = async () => {
    setError('');
    try {
      const response = await api.providers();
      setProviders(response.providers);
      applyProfile(activeId, response.providers);
      setLoaded(true);
    } catch (cause) {
      setLoaded(true);
      setError(
        cause instanceof Error
          ? cause.message
          : '无法读取模型配置。演示模式不会保存 API Key。',
      );
    }
  };

  useEffect(() => {
    if (open && !loaded) void loadProviders();
  }, [open, loaded]);

  const save = async () => {
    if (!apiKey.trim()) {
      setError('保存或更新配置时必须重新输入 API Key。');
      return;
    }
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await api.saveProvider(activeId, {
        apiKey: apiKey.trim(),
        baseUrl: baseUrl.trim(),
        model: model.trim(),
      });
      setApiKey('');
      setMessage(`${profile.label} Provider 已加密保存。`);
      const response = await api.providers();
      setProviders(response.providers);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '保存失败');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await api.deleteProvider(activeId);
      setProviders((items) => items.filter((item) => item.provider !== activeId));
      setMessage(`${profile.label} 配置已删除。`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '删除失败');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="provider-settings">
      <button
        type="button"
        className="provider-settings-trigger"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span className="provider-settings-icon"><ServerCog size={15} /></span>
        <span>
          <strong>模型与媒体 API</strong>
          <small>{configuredCount > 0 ? `已配置 ${configuredCount}/4` : '分别连接 Agent、图片和视频服务'}</small>
        </span>
        {configuredCount > 0 && <CheckCircle2 className="provider-ok" size={15} />}
        <ChevronDown className={open ? 'is-open' : ''} size={15} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="provider-settings-body"
            initial={reduceMotion ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="provider-profile-tabs">
              {providerProfiles.map((item) => {
                const Icon = item.icon;
                const isConfigured = providers.some((provider) => provider.provider === item.id);
                return (
                  <button
                    type="button"
                    key={item.id}
                    className={activeId === item.id ? 'active' : ''}
                    onClick={() => applyProfile(item.id)}
                  >
                    <Icon size={13} />
                    <span><strong>{item.label}</strong><small>{item.description}</small></span>
                    {isConfigured && <i />}
                  </button>
                );
              })}
            </div>

            <div className="provider-mode-note">
              <strong>{profile.label}</strong>
              <span>
                {activeId === 'agent' && '仅供剧本 Agent 与 Skills 调用。'}
                {activeId === 'image' && '处理文生图、图生图、多参考图和局部重绘。'}
                {activeId === 'runway' && '使用异步任务接口处理文生视频和图生视频。'}
                {activeId === 'luma' && '使用关键帧处理图生视频和首尾帧生视频。'}
              </span>
            </div>

            <label>
              API Base URL
              <input
                value={baseUrl}
                onChange={(event) => setBaseUrl(event.target.value)}
                placeholder="https://provider.example"
              />
            </label>
            <label>
              默认模型 ID
              <input
                value={model}
                onChange={(event) => setModel(event.target.value)}
                placeholder="provider-model-id"
              />
            </label>
            <label>
              API Key
              <div className="provider-key-field">
                <KeyRound size={14} />
                <input
                  type="password"
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                  autoComplete="new-password"
                  placeholder={saved ? '重新输入后更新' : '仅发送到你的后端'}
                />
              </div>
            </label>

            {message && <div className="provider-message success">{message}</div>}
            {error && <div className="provider-message error">{error}</div>}

            <div className="provider-actions">
              {saved && (
                <button type="button" className="provider-delete" disabled={busy} onClick={remove}>
                  <Trash2 size={14} />删除
                </button>
              )}
              <button
                type="button"
                className="provider-save"
                disabled={busy || !baseUrl.trim() || !model.trim()}
                onClick={save}
              >
                {busy && <LoaderCircle className="spin" size={14} />}
                {saved ? '更新配置' : '保存配置'}
              </button>
            </div>

            <p className="provider-boundary">
              不同 Provider 的密钥彼此隔离；浏览器不保存明文。正式部署仍需 TLS、KMS 和请求出口限制。
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

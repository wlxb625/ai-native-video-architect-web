import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  CheckCircle2,
  ChevronDown,
  KeyRound,
  LoaderCircle,
  ServerCog,
  Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { api, type ProviderSummary } from '../api';

const providerPresets = [
  {
    id: 'llm',
    label: '剧本与 Agent',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-5.6',
  },
  {
    id: 'image',
    label: '图片生成',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-image-1',
  },
  {
    id: 'video',
    label: '视频生成',
    baseUrl: 'https://your-video-provider.example/v1',
    model: 'your-video-model',
  },
] as const;

export function ProviderSettings() {
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [providers, setProviders] = useState<ProviderSummary[]>([]);
  const [provider, setProvider] = useState('llm');
  const [baseUrl, setBaseUrl] = useState(providerPresets[0].baseUrl);
  const [model, setModel] = useState(providerPresets[0].model);
  const [apiKey, setApiKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const currentPreset = useMemo(
    () => providerPresets.find((item) => item.id === provider) ?? providerPresets[0],
    [provider],
  );

  const loadProviders = async () => {
    setError('');
    try {
      const response = await api.providers();
      setProviders(response.providers);
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
    if (open && !loaded) {
      void loadProviders();
    }
  }, [open, loaded]);

  const selectPreset = (id: string) => {
    const preset = providerPresets.find((item) => item.id === id) ?? providerPresets[0];
    setProvider(preset.id);
    const saved = providers.find((item) => item.provider === preset.id);
    setBaseUrl(saved?.base_url ?? preset.baseUrl);
    setModel(saved?.model ?? preset.model);
    setApiKey('');
    setMessage('');
    setError('');
  };

  const save = async () => {
    if (!apiKey.trim()) {
      setError('保存或更新配置时必须重新输入 API Key。');
      return;
    }
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await api.saveProvider(provider, {
        apiKey: apiKey.trim(),
        baseUrl: baseUrl.trim(),
        model: model.trim(),
      });
      setApiKey('');
      setMessage('配置已加密保存到服务端。');
      await loadProviders();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '保存失败');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    setError('');
    try {
      await api.deleteProvider(provider);
      setProviders((items) => items.filter((item) => item.provider !== provider));
      setMessage('配置已删除。');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '删除失败');
    } finally {
      setBusy(false);
    }
  };

  const configured = providers.some((item) => item.provider === provider);

  return (
    <section className="provider-settings">
      <button
        type="button"
        className="provider-settings-trigger"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span className="provider-settings-icon">
          <ServerCog size={15} />
        </span>
        <span>
          <strong>模型 API</strong>
          <small>{configured ? `${currentPreset.label}已配置` : '连接真实生成服务'}</small>
        </span>
        {configured && <CheckCircle2 className="provider-ok" size={15} />}
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
            <div className="provider-kind-tabs">
              {providerPresets.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={provider === item.id ? 'active' : ''}
                  onClick={() => selectPreset(item.id)}
                >
                  {item.label}
                  {providers.some((saved) => saved.provider === item.id) && <i />}
                </button>
              ))}
            </div>

            <label>
              API Base URL
              <input
                value={baseUrl}
                onChange={(event) => setBaseUrl(event.target.value)}
                placeholder="https://provider.example/v1"
              />
            </label>
            <label>
              模型名称
              <input
                value={model}
                onChange={(event) => setModel(event.target.value)}
                placeholder="model-id"
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
                  placeholder={configured ? '重新输入后更新' : '仅发送到你的后端'}
                />
              </div>
            </label>

            {message && <div className="provider-message success">{message}</div>}
            {error && <div className="provider-message error">{error}</div>}

            <div className="provider-actions">
              {configured && (
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
                {configured ? '更新配置' : '保存配置'}
              </button>
            </div>

            <p className="provider-boundary">
              浏览器不会保存密钥。服务端使用 AES-256-GCM 加密；正式部署仍应启用 TLS 和 KMS。
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

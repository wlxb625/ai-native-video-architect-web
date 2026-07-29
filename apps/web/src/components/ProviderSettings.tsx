import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  CheckCircle2,
  ChevronDown,
  KeyRound,
  LoaderCircle,
  ServerCog,
  Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, type ProviderSummary } from '../api';
import './ProviderSettings.css';

const ACTIVE_PROVIDER = 'gateway';

export function ProviderSettings() {
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState<ProviderSummary>();
  const [baseUrl, setBaseUrl] = useState('https://api.openai.com/v1');
  const [model, setModel] = useState('gpt-5.6');
  const [apiKey, setApiKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadProvider = async () => {
    setError('');
    try {
      const response = await api.providers();
      const current = response.providers.find((item) => item.provider === ACTIVE_PROVIDER);
      setSaved(current);
      if (current) {
        setBaseUrl(current.base_url);
        setModel(current.model);
      }
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
      void loadProvider();
    }
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
      await api.saveProvider(ACTIVE_PROVIDER, {
        apiKey: apiKey.trim(),
        baseUrl: baseUrl.trim(),
        model: model.trim(),
      });
      setApiKey('');
      setMessage('统一模型网关已加密保存到服务端。');
      await loadProvider();
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
      await api.deleteProvider(ACTIVE_PROVIDER);
      setSaved(undefined);
      setMessage('配置已删除。');
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
        <span className="provider-settings-icon">
          <ServerCog size={15} />
        </span>
        <span>
          <strong>统一模型网关</strong>
          <small>{saved ? `${saved.model} 已配置` : '连接真实 Agent 与媒体生成'}</small>
        </span>
        {saved && <CheckCircle2 className="provider-ok" size={15} />}
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
            <div className="provider-mode-note">
              当前 Worker 使用一个 OpenAI-compatible 网关；生图和视频节点可以覆盖模型名称。独立 Provider 将在 Adapter 层接入。
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
              Agent 默认模型
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
              浏览器不会保存密钥。服务端使用 AES-256-GCM 加密；正式部署仍应启用 TLS 和 KMS。
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

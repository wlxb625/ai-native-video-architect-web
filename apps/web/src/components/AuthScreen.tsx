import { motion, useReducedMotion } from 'motion/react';
import { Film, LockKeyhole, Sparkles } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { api, setAccessToken } from '../api';
import { generatedAssets } from '../generatedAssets';

export function AuthScreen({
  onAuthenticated,
  onDemo,
}: {
  onAuthenticated: (user: unknown) => void;
  onDemo: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result =
        mode === 'login'
          ? await api.login(email, password)
          : await api.register(email, password, name);
      setAccessToken(result.accessToken);
      onAuthenticated(result.user);
    } catch (cause: unknown) {
      const typed = cause as { body?: { error?: string }; message?: string };
      setError(
        typed.body?.error === 'INVALID_CREDENTIALS'
          ? '邮箱或密码不正确'
          : typed.message ?? '登录失败',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-story">
        <div className="auth-brand">
          <span><Film size={19} /></span>
          CineWeave <b>Media Studio</b>
        </div>

        <div className="auth-copy">
          <small>AI CINEMA WORKSPACE</small>
          <h1>从剧本到镜头，<br />在同一张画布完成。</h1>
          <p>
            Agent 调用 Skills 拆解剧本，人物与场景资产保持一致，图片和视频生成结果保留完整版本血缘。
          </p>
          <div className="auth-points">
            <div>
              <Sparkles size={16} />
              <span><b>Agent + Skills</b><small>剧本生成、诊断、分镜和连续性检查</small></span>
            </div>
            <div>
              <LockKeyhole size={16} />
              <span><b>密钥留在服务端</b><small>浏览器不存储模型 API Key</small></span>
            </div>
          </div>
        </div>

        <div className="auth-media-stage" aria-hidden="true">
          {[generatedAssets.sceneRainAlley, generatedAssets.characterFemale, generatedAssets.shotNeonDialogue].map((src, index) => (
            <motion.div
              key={src.slice(-16)}
              className={`auth-media-frame frame-${index + 1}`}
              initial={reduceMotion ? false : { opacity: 0, y: 20, rotate: index - 1 }}
              animate={{ opacity: 1, y: 0, rotate: (index - 1) * 2.2 }}
              transition={{ delay: 0.12 + index * 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              style={{ backgroundImage: `url(${src})` }}
            />
          ))}
          <div className="auth-media-caption">SCENE 01 · RAIN PLATFORM · 16:9</div>
        </div>
      </section>

      <section className="auth-panel">
        <motion.form
          onSubmit={submit}
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="auth-tabs">
            <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>登录</button>
            <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>创建账户</button>
          </div>
          <h2>{mode === 'login' ? '继续当前项目' : '建立你的创作空间'}</h2>
          <p>{mode === 'login' ? '画布数据和生成记录会从服务器恢复。' : '创建账户后再配置剧本、生图和视频模型 API。'}</p>
          {mode === 'register' && (
            <label>
              显示名称
              <input value={name} onChange={(event) => setName(event.target.value)} required placeholder="你的名字或工作室" />
            </label>
          )}
          <label>
            邮箱
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="name@example.com" />
          </label>
          <label>
            密码
            <input type="password" minLength={mode === 'register' ? 10 : 1} value={password} onChange={(event) => setPassword(event.target.value)} required placeholder="••••••••••" />
          </label>
          {error && <div className="auth-error">{error}</div>}
          <button className="auth-submit" disabled={busy}>{busy ? '正在验证…' : mode === 'login' ? '进入工作台' : '创建并进入'}</button>
          <button className="auth-demo" type="button" onClick={onDemo}>先查看交互演示</button>
          <div className="auth-foot">真实生图、生视频和 Agent 执行需要登录后配置 API；演示模式不产生费用。</div>
        </motion.form>
      </section>
    </div>
  );
}

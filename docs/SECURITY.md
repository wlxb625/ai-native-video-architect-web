# 安全设计

## 身份与会话

- 密码使用 Argon2id 哈希。
- Access Token 默认 15 分钟，只保存在前端内存。
- Refresh Token 为随机高熵值，数据库只存 SHA-256 摘要。
- Refresh Cookie 使用 `HttpOnly`、`SameSite=Strict`；生产必须启用 `Secure`。
- 刷新时进行令牌轮换，旧会话立即吊销。

## 数据权限

每个项目访问都通过 `owner_id` 校验。不能仅依赖前端隐藏按钮。画布保存、生成任务和事件流都会再次验证项目归属。

## 模型密钥

- API Key 不进入画布 JSON，也不会返回浏览器。
- 服务端使用 AES-256-GCM 加密，IV 与认证标签独立保存。
- 主密钥来自部署环境，不能提交 Git。
- 生产环境应使用 KMS/Vault，并执行密钥版本轮换。

## API 防护

- Zod 请求校验与请求体大小限制。
- CORS 白名单、Helmet、全局和登录接口限流。
- 自定义 Provider URL 在生产要求 HTTPS，并拒绝 localhost；生产还应通过固定出口代理阻断私网 SSRF 与 DNS rebinding。
- SQL 全部参数化。
- SSE 连接同样验证资源归属。

## 仍需部署方完成

TLS、数据库备份恢复演练、对象存储防病毒扫描、云 IAM 最小权限、日志脱敏、告警、依赖漏洞扫描和渗透测试不可能仅靠源码自动保证。

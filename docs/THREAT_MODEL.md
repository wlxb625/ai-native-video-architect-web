# 简化威胁模型

| 威胁 | 当前控制 | 仍需加强 |
|---|---|---|
| 账户撞库 | Argon2id、登录限流 | MFA、异常登录检测 |
| Token 被窃取 | 短期 Access Token、HttpOnly Refresh Cookie、轮换 | CSP、设备会话管理 |
| 越权访问项目 | 服务端 owner 校验 | 团队 RBAC/ABAC |
| API Key 泄露 | AES-GCM、密钥不下发 | KMS、定期轮换、审计告警 |
| 并发覆盖画布 | 版本号与事务锁 | CRDT/OT 实时协作 |
| Worker 重复执行 | SKIP LOCKED、幂等持久化设计 | 租约续期、死信队列 |
| Prompt/资产恶意输入 | 长度限制、模型输出结构校验 | 内容安全与文件扫描 |
| Provider SSRF | HTTPS/localhost 拒绝 | 出口代理、DNS/IP 二次校验 |

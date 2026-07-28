# 实现状态

## 已在源码中实现

- React/XYFlow 无限画布、节点右键菜单、连线、多选、检查器与自动保存。
- 注册、登录、刷新令牌轮换、退出与当前用户接口。
- 项目创建/读取、画布读取/事务保存、版本冲突检测。
- Provider 密钥加密保存；Worker 可解密并调用 OpenAI-compatible 网关。
- PostgreSQL 任务队列、Graph Run 领取、事件记录、SSE 推送与结果回写。
- GraphEngineering v1alpha1 风格 Graph IR、兼容执行器及可选原生 Runtime 动态加载。
- Docker Compose、数据库迁移、安全文档和 CI 配置。

## 尚未实现

- 对象存储上传、病毒扫描和素材转码。
- 团队成员、细粒度 RBAC、实时多人 CRDT 协作。
- KMS/Vault 对接、MFA、计费、配额和管理后台。
- 完整的模型供应商配置界面；当前已有后端 API 与 Worker 使用逻辑。
- 生产级分布式租约续期、死信队列和全链路遥测。

这些部分不是被 Mock 成“已完成”，而是明确留作后续阶段。

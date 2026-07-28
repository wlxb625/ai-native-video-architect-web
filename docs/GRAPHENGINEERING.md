# GraphEngineering 接入

上游仓库：`reacher-z/GraphEngineering`。

## 默认模式：compatible

`packages/graph-runtime` 实现 GraphEngineering v1alpha1 风格 Graph IR 的兼容执行：

- DAG 依赖判断
- 有界并发
- 节点重试与超时
- 节点/运行事件
- 命名输出收敛

默认模式便于工程独立启动，但它不是上游全部能力的替代品。

## 原生模式：native

```bash
npm run graph:setup
```

然后修改：

```env
GRAPH_ENGINEERING_MODE=native
GRAPH_ENGINEERING_RUNTIME_PATH=vendor/GraphEngineering/packages/runtime/dist/index.js
```

Worker 会动态加载上游 `runGraph`。由于上游仍是 alpha，升级前应跑类型检查、图定义验证和端到端任务测试。

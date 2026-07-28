# REST API

## Auth

- `POST /v1/auth/register`
- `POST /v1/auth/login`
- `POST /v1/auth/refresh`
- `POST /v1/auth/logout`
- `GET /v1/auth/me`

## Projects & Canvas

- `GET /v1/projects`
- `POST /v1/projects`
- `GET /v1/projects/:projectId`
- `GET /v1/projects/:projectId/canvas`
- `PUT /v1/projects/:projectId/canvas`

画布保存请求必须携带当前 `version`。冲突返回 409，前端不得静默覆盖服务器版本。

## Graph runs

- `POST /v1/projects/:projectId/runs/next-step`
- `GET /v1/runs/:runId`
- `GET /v1/runs/:runId/events`（SSE）

## Provider credentials

- `GET /v1/providers`
- `PUT /v1/providers/:provider`
- `DELETE /v1/providers/:provider`

读取接口只返回 provider、base URL、model 和 key version，不返回密钥内容。

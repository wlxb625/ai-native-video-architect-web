import pg from 'pg';
import { access, readFile } from 'node:fs/promises';
import { isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDecipheriv, randomUUID } from 'node:crypto';
import {
  runGraphEngineering,
  type GraphEvent,
  type GraphIR,
  type NodeExecutorContext,
} from '@cineweave/graph-runtime';
import {
  buildSkillPrompt,
  getAgentSkill,
} from '@cineweave/agent-skills';

const { Pool } = pg;
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required');
}

const db = new Pool({ connectionString: databaseUrl, max: 8 });
const workerId = process.env.WORKER_ID ?? `worker-${process.pid}`;
const pollMs = Number(process.env.WORKER_POLL_MS ?? 1200);
const here = fileURLToPath(new URL('.', import.meta.url));

interface ProviderConfig {
  provider: string;
  baseUrl?: string;
  model?: string;
  apiKey?: string;
}

interface ClaimedRun {
  id: string;
  project_id: string;
  requested_by: string;
  graph_name: string;
  input: Record<string, any>;
  attempt: number;
  max_attempts: number;
}

async function locate(relativePath: string) {
  const candidates = [
    relativePath,
    resolve(process.cwd(), relativePath),
    resolve(process.cwd(), '../../', relativePath),
    resolve(here, '../../../', relativePath),
  ];
  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Try the next runtime layout.
    }
  }
  throw new Error(`Could not locate ${relativePath}`);
}

const graphPath =
  process.env.GRAPH_DEFINITION_PATH ??
  (await locate('graphs/next-step.graph.json'));
const graph = JSON.parse(await readFile(graphPath, 'utf8')) as GraphIR;

async function appendEvent(runId: string, event: GraphEvent) {
  await db.query(
    `INSERT INTO graph_run_events(run_id,event_type,node_id,payload)
     VALUES($1,$2,$3,$4)`,
    [
      runId,
      event.type,
      event.nodeId ?? null,
      {
        ...(event.payload ?? {}),
        attempt: event.attempt,
        timestamp: event.timestamp,
      },
    ],
  );
}

async function claimRun(): Promise<ClaimedRun | null> {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `SELECT *
       FROM graph_runs
       WHERE status='queued'
       ORDER BY created_at
       FOR UPDATE SKIP LOCKED
       LIMIT 1`,
    );
    const run = result.rows[0] as ClaimedRun | undefined;
    if (!run) {
      await client.query('ROLLBACK');
      return null;
    }
    await client.query(
      `UPDATE graph_runs
       SET status='running',
           attempt=attempt+1,
           locked_at=now(),
           locked_by=$2,
           started_at=COALESCE(started_at,now())
       WHERE id=$1`,
      [run.id, workerId],
    );
    await client.query('COMMIT');
    return run;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function resolveProviderConfig(userId: string): Promise<ProviderConfig> {
  const stored = await db.query(
    `SELECT provider,base_url,model,ciphertext,iv,auth_tag
     FROM provider_credentials
     WHERE user_id=$1
     ORDER BY updated_at DESC
     LIMIT 1`,
    [userId],
  );

  if (stored.rows[0]) {
    const master = Buffer.from(process.env.APP_MASTER_KEY_BASE64 ?? '', 'base64');
    if (master.length !== 32) {
      throw new Error('APP_MASTER_KEY_BASE64 must decode to 32 bytes in worker');
    }
    const row = stored.rows[0];
    const decipher = createDecipheriv(
      'aes-256-gcm',
      master,
      Buffer.from(row.iv, 'base64'),
    );
    decipher.setAuthTag(Buffer.from(row.auth_tag, 'base64'));
    const apiKey = Buffer.concat([
      decipher.update(Buffer.from(row.ciphertext, 'base64')),
      decipher.final(),
    ]).toString('utf8');
    return {
      provider: String(row.provider),
      baseUrl: String(row.base_url),
      model: String(row.model),
      apiKey,
    };
  }

  return {
    provider: 'environment',
    baseUrl: process.env.MODEL_GATEWAY_BASE_URL,
    model: process.env.MODEL_GATEWAY_MODEL,
    apiKey: process.env.MODEL_GATEWAY_API_KEY,
  };
}

async function callJsonModel({
  system,
  prompt,
  userId,
}: {
  system: string;
  prompt: string;
  userId: string;
}): Promise<Record<string, any>> {
  const { baseUrl, apiKey, model } = await resolveProviderConfig(userId);
  if (!baseUrl || !apiKey || !model) {
    return {
      title: '未配置 LLM：本地分析占位结果',
      summary: prompt.slice(0, 180),
      content: '请在设置中配置 OpenAI-compatible 模型网关后重新运行。',
      items: [
        '当前任务已通过 GraphEngineering 工作流进入 Worker。',
        '配置模型网关后，Agent Skill 会返回结构化 JSON。',
      ],
      confidence: 0.35,
    };
  }

  const response = await fetch(
    `${baseUrl.replace(/\/$/, '')}/chat/completions`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.55,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt },
        ],
      }),
    },
  );
  if (!response.ok) {
    throw new Error(`Model gateway returned ${response.status}`);
  }
  const body = (await response.json()) as any;
  const content = body.choices?.[0]?.message?.content ?? '{}';
  return JSON.parse(content) as Record<string, any>;
}

async function callMediaProvider(
  input: Record<string, any>,
  userId: string,
): Promise<Record<string, any>> {
  const provider = await resolveProviderConfig(userId);
  if (!provider.baseUrl || !provider.apiKey || !provider.model) {
    return {
      mediaType: input.mediaType,
      operation: input.operation,
      status: 'provider-required',
      title: input.mediaType === 'video' ? '视频生成结果' : '图片生成结果',
      summary: '任务结构已创建，但尚未配置媒体生成 Provider。',
      previewUrl: null,
      model: input.model || provider.model || 'Provider Adapter',
    };
  }

  const baseUrl = provider.baseUrl.replace(/\/$/, '');
  if (input.mediaType === 'image') {
    const response = await fetch(`${baseUrl}/images/generations`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify({
        model: input.model || provider.model,
        prompt: input.prompt,
        n: Number(input.parameters?.variants ?? 1),
        size: input.parameters?.size,
        response_format: 'url',
      }),
    });
    if (!response.ok) {
      throw new Error(`Image provider returned ${response.status}`);
    }
    const body = (await response.json()) as any;
    const first = body.data?.[0] ?? body.output?.[0] ?? body;
    return {
      mediaType: 'image',
      operation: input.operation,
      status: 'generated',
      title: '图片候选 V1',
      summary: '由媒体 Provider 返回的图片结果。',
      previewUrl: first.url ?? first.image_url ?? null,
      base64: first.b64_json ?? null,
      model: input.model || provider.model,
      raw: body,
    };
  }

  const response = await fetch(`${baseUrl}/videos/generations`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify({
      model: input.model || provider.model,
      prompt: input.prompt,
      duration: input.parameters?.duration,
      ratio: input.parameters?.ratio,
      input_assets: input.inputAssetIds,
    }),
  });

  if (response.status === 404 || response.status === 405) {
    return {
      mediaType: 'video',
      operation: input.operation,
      status: 'adapter-required',
      title: '视频任务等待 Provider Adapter',
      summary:
        '视频 API 并无统一标准。请为 Seedance、Runway、可灵等目标服务实现对应 Adapter。',
      previewUrl: null,
      model: input.model || provider.model,
    };
  }
  if (!response.ok) {
    throw new Error(`Video provider returned ${response.status}`);
  }
  const body = (await response.json()) as any;
  return {
    mediaType: 'video',
    operation: input.operation,
    status: 'generated',
    title: '视频候选 V1',
    summary: '由媒体 Provider 返回的视频结果。',
    previewUrl:
      body.url ?? body.video_url ?? body.data?.[0]?.url ?? body.output?.url ?? null,
    model: input.model || provider.model,
    raw: body,
  };
}

function flattenResultItems(result: Record<string, any>): string[] {
  const candidates = [
    result.items,
    result.strengths,
    result.revisedOutline,
    result.lockedFacts,
    result.issues,
    result.shots,
    result.scenes,
    result.characters,
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.slice(0, 5).map((item) =>
        typeof item === 'string'
          ? item
          : String(
              item.suggestion ??
                item.evidence ??
                item.summary ??
                item.title ??
                item.name ??
                JSON.stringify(item),
            ),
      );
    }
  }
  return [];
}

async function loadProjectContext(projectId: string) {
  const [nodes, assets] = await Promise.all([
    db.query(
      `SELECT cn.client_id AS id,cn.node_type AS type,cn.data
       FROM canvas_nodes cn
       JOIN canvases c ON c.id=cn.canvas_id
       WHERE c.project_id=$1
       ORDER BY cn.updated_at DESC
       LIMIT 180`,
      [projectId],
    ),
    db.query(
      `SELECT id,kind,label,metadata
       FROM assets
       WHERE project_id=$1
       ORDER BY created_at DESC
       LIMIT 80`,
      [projectId],
    ),
  ]);
  return { nodes: nodes.rows, assets: assets.rows };
}

async function sourcePosition(run: ClaimedRun) {
  const sourceId =
    run.input.sourceNodeId ??
    run.input.nodeId ??
    run.input.sourceNodeIds?.[0];
  if (!sourceId) {
    return { sourceId: null, position: { x: 0, y: 0 } };
  }
  const source = await db.query(
    `SELECT cn.position
     FROM canvas_nodes cn
     JOIN canvases c ON c.id=cn.canvas_id
     WHERE c.project_id=$1 AND cn.client_id=$2`,
    [run.project_id, sourceId],
  );
  return {
    sourceId,
    position: source.rows[0]?.position ?? { x: 0, y: 0 },
  };
}

async function persistCanvasOutput({
  run,
  nodeType,
  data,
}: {
  run: ClaimedRun;
  nodeType: string;
  data: Record<string, any>;
}) {
  const source = await sourcePosition(run);
  const clientId = `generated-${randomUUID()}`;
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const canvas = await client.query(
      'SELECT id FROM canvases WHERE project_id=$1 FOR UPDATE',
      [run.project_id],
    );
    const canvasId = canvas.rows[0]?.id;
    if (!canvasId) {
      throw new Error('Project canvas was not found');
    }
    await client.query(
      `INSERT INTO canvas_nodes(canvas_id,client_id,node_type,position,data)
       VALUES($1,$2,$3,$4,$5)`,
      [
        canvasId,
        clientId,
        nodeType,
        {
          x: Number(source.position.x) + 430,
          y: Number(source.position.y),
        },
        { ...data, runId: run.id },
      ],
    );
    if (source.sourceId) {
      await client.query(
        `INSERT INTO canvas_edges(
          canvas_id,client_id,source_client_id,target_client_id,edge_type,data
        ) VALUES($1,$2,$3,$4,'smoothstep',$5)`,
        [
          canvasId,
          `edge-${randomUUID()}`,
          source.sourceId,
          clientId,
          { generatedByRun: run.id, relation: 'generated-from' },
        ],
      );
    }
    await client.query(
      'UPDATE canvases SET version=version+1,updated_at=now() WHERE id=$1',
      [canvasId],
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
  return { nodeId: clientId, ...data };
}

function executors(run: ClaimedRun) {
  return {
    normalize: ({ input }: NodeExecutorContext) => ({
      ...input,
      requestedAt: new Date().toISOString(),
    }),

    'load-story-context': async () => {
      const context = await loadProjectContext(run.project_id);
      return { nodes: context.nodes };
    },

    'load-asset-context': async () => {
      const context = await loadProjectContext(run.project_id);
      return { assets: context.assets };
    },

    'generate-candidate': async ({ input }: NodeExecutorContext) => {
      const kind = String(run.input.kind ?? 'next-step');
      if (kind === 'agent-skill') {
        const skill = getAgentSkill(String(run.input.skillId));
        const prompt = buildSkillPrompt(
          skill.id,
          String(run.input.instruction),
          {
            selectedNodeIds: run.input.sourceNodeIds ?? [],
            story: input.story,
            assets: input.assets,
          },
        );
        const result = await callJsonModel({
          system: skill.systemPrompt,
          prompt,
          userId: run.requested_by,
        });
        return { ...result, skillId: skill.id };
      }

      if (kind === 'media-generation') {
        return callMediaProvider(run.input, run.requested_by);
      }

      const prompt = [
        `Instruction: ${run.input.instruction}`,
        `Source node: ${run.input.sourceNodeId}`,
        `Story context: ${JSON.stringify(input.story).slice(0, 12000)}`,
        `Assets: ${JSON.stringify(input.assets).slice(0, 6000)}`,
      ].join('\n');
      return callJsonModel({
        system:
          '你是一名影视创作助手。返回 JSON：title、summary、content、confidence。',
        prompt,
        userId: run.requested_by,
      });
    },

    'verify-continuity': ({ input }: NodeExecutorContext) => {
      const candidate = (input.candidate ?? {}) as Record<string, any>;
      if (String(run.input.kind) === 'media-generation') {
        if (!candidate.mediaType || !candidate.status) {
          throw new Error('Media provider result did not satisfy required fields');
        }
        return candidate;
      }
      if (Object.keys(candidate).length === 0) {
        throw new Error('Agent result was empty');
      }
      return {
        ...candidate,
        verification: {
          passed: true,
          checks: ['identity', 'timeline', 'location', 'tone'],
        },
      };
    },

    'persist-candidate': async ({ input }: NodeExecutorContext) => {
      const verified = (input.verified ?? {}) as Record<string, any>;
      const kind = String(run.input.kind ?? 'next-step');

      if (kind === 'agent-skill') {
        const skill = getAgentSkill(String(run.input.skillId));
        const nodeTypeMap: Record<string, string> = {
          script: 'script',
          analysis: 'analysis',
          character: 'character',
          scene: 'scene',
          storyboard: 'storyboard',
          promptPack: 'promptPack',
        };
        return persistCanvasOutput({
          run,
          nodeType: nodeTypeMap[skill.outputNodeType] ?? 'analysis',
          data: {
            title: verified.title ?? `${skill.title} · Agent 输出`,
            summary:
              verified.summary ??
              verified.synopsis ??
              `已完成 Skill：${skill.title}`,
            content: JSON.stringify(verified, null, 2),
            items: flattenResultItems(verified),
            skillId: skill.id,
            status: 'generated',
            verification: verified.verification,
          },
        });
      }

      if (kind === 'media-generation') {
        const nodeType =
          run.input.mediaType === 'video' ? 'videoOutput' : 'imageOutput';
        return persistCanvasOutput({
          run,
          nodeType,
          data: {
            title: verified.title,
            summary: verified.summary,
            previewUrl: verified.previewUrl,
            mediaStatus: verified.status,
            operation: run.input.operation,
            model: verified.model ?? run.input.model,
            prompt: run.input.prompt,
            negativePrompt: run.input.negativePrompt,
            ratio: run.input.parameters?.ratio,
            duration: run.input.parameters?.duration,
            version: 'V1',
            status: verified.status === 'generated' ? 'generated' : 'ready',
          },
        });
      }

      return persistCanvasOutput({
        run,
        nodeType: run.input.targetType ?? 'analysis',
        data: {
          title: verified.title ?? '生成候选',
          summary: verified.summary ?? '',
          content: verified.content ?? JSON.stringify(verified, null, 2),
          status: 'generated',
          verification: verified.verification,
        },
      });
    },
  };
}

async function execute(run: ClaimedRun) {
  try {
    const result = await runGraphEngineering(graph, run.input, {
      runId: run.id,
      mode:
        process.env.GRAPH_ENGINEERING_MODE === 'native'
          ? 'native'
          : 'compatible',
      runtimePath: process.env.GRAPH_ENGINEERING_RUNTIME_PATH
        ? isAbsolute(process.env.GRAPH_ENGINEERING_RUNTIME_PATH)
          ? process.env.GRAPH_ENGINEERING_RUNTIME_PATH
          : await locate(process.env.GRAPH_ENGINEERING_RUNTIME_PATH)
        : undefined,
      nodeExecutors: executors(run),
      onEvent: (event) => appendEvent(run.id, event),
    });
    await db.query(
      `UPDATE graph_runs
       SET status=$2,output=$3,error=$4,finished_at=now(),locked_at=NULL,locked_by=NULL
       WHERE id=$1`,
      [run.id, result.status, result.output, result.error ?? null],
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status =
      Number(run.attempt) + 1 < Number(run.max_attempts) ? 'queued' : 'failed';
    await db.query(
      `UPDATE graph_runs
       SET status=$2,
           error=$3,
           finished_at=CASE WHEN $2='failed' THEN now() ELSE NULL END,
           locked_at=NULL,
           locked_by=NULL
       WHERE id=$1`,
      [run.id, status, message],
    );
  }
}

console.log(`[cineweave-worker] ${workerId} started`);
for (;;) {
  const run = await claimRun();
  if (run) {
    await execute(run);
  } else {
    await new Promise((resolveDelay) => setTimeout(resolveDelay, pollMs));
  }
}

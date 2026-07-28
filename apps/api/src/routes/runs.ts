import type { FastifyInstance } from 'fastify';
import {
  agentSkillRunSchema,
  mediaGenerationRunSchema,
  nextStepRunSchema,
} from '@cineweave/contracts';
import { requireAuth, assertProjectOwner } from '../auth.js';
import { db } from '../db.js';
import { audit } from '../audit.js';

async function queueRun({
  projectId,
  userId,
  graphName,
  graphVersion,
  input,
}: {
  projectId: string;
  userId: string;
  graphName: string;
  graphVersion: string;
  input: Record<string, unknown>;
}) {
  const result = await db.query(
    `INSERT INTO graph_runs(
      project_id,
      requested_by,
      graph_name,
      graph_version,
      input
    ) VALUES($1,$2,$3,$4,$5)
    RETURNING id,status,graph_name,created_at`,
    [projectId, userId, graphName, graphVersion, input],
  );
  return result.rows[0];
}

export async function runRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  app.post('/projects/:projectId/runs/next-step', async (request: any, reply) => {
    const { projectId } = request.params;
    await assertProjectOwner(request.authUser.id, projectId);
    const input = nextStepRunSchema.parse(request.body);
    const run = await queueRun({
      projectId,
      userId: request.authUser.id,
      graphName: 'cineweave-next-step',
      graphVersion: '1.0.0',
      input: { projectId, kind: 'next-step', ...input },
    });
    await audit({
      actorUserId: request.authUser.id,
      projectId,
      action: 'graph_run.queued',
      targetType: 'graph_run',
      targetId: run.id,
      ip: request.ip,
      metadata: { graphName: run.graph_name, sourceNodeId: input.sourceNodeId },
    });
    return reply.code(202).send({ run });
  });

  app.post('/projects/:projectId/agent/skills/run', async (request: any, reply) => {
    const { projectId } = request.params;
    await assertProjectOwner(request.authUser.id, projectId);
    const input = agentSkillRunSchema.parse(request.body);
    const run = await queueRun({
      projectId,
      userId: request.authUser.id,
      graphName: 'cineweave-agent-skill',
      graphVersion: '1.0.0',
      input: { projectId, kind: 'agent-skill', ...input },
    });
    await audit({
      actorUserId: request.authUser.id,
      projectId,
      action: 'agent_skill.queued',
      targetType: 'graph_run',
      targetId: run.id,
      ip: request.ip,
      metadata: { skillId: input.skillId, sourceNodeIds: input.sourceNodeIds },
    });
    return reply.code(202).send({ run });
  });

  app.post('/projects/:projectId/generations', async (request: any, reply) => {
    const { projectId } = request.params;
    await assertProjectOwner(request.authUser.id, projectId);
    const input = mediaGenerationRunSchema.parse(request.body);
    const run = await queueRun({
      projectId,
      userId: request.authUser.id,
      graphName: 'cineweave-media-generation',
      graphVersion: '1.0.0',
      input: { projectId, kind: 'media-generation', ...input },
    });
    await audit({
      actorUserId: request.authUser.id,
      projectId,
      action: 'media_generation.queued',
      targetType: 'graph_run',
      targetId: run.id,
      ip: request.ip,
      metadata: {
        mediaType: input.mediaType,
        operation: input.operation,
        nodeId: input.nodeId,
      },
    });
    return reply.code(202).send({ run });
  });

  app.get('/runs/:runId', async (request: any, reply) => {
    const result = await db.query(
      `SELECT gr.*
       FROM graph_runs gr
       JOIN projects p ON p.id=gr.project_id
       WHERE gr.id=$1 AND p.owner_id=$2`,
      [request.params.runId, request.authUser.id],
    );
    if (!result.rows[0]) {
      return reply.code(404).send({ error: 'RUN_NOT_FOUND' });
    }
    return { run: result.rows[0] };
  });

  app.get('/runs/:runId/events', async (request: any, reply) => {
    const runResult = await db.query(
      `SELECT gr.id
       FROM graph_runs gr
       JOIN projects p ON p.id=gr.project_id
       WHERE gr.id=$1 AND p.owner_id=$2`,
      [request.params.runId, request.authUser.id],
    );
    if (!runResult.rows[0]) {
      return reply.code(404).send({ error: 'RUN_NOT_FOUND' });
    }

    reply.hijack();
    reply.raw.writeHead(200, {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache',
      connection: 'keep-alive',
      'x-accel-buffering': 'no',
    });

    let sequence = Number(request.query?.after ?? 0);
    let closed = false;
    request.raw.on('close', () => {
      closed = true;
    });

    const timer = setInterval(async () => {
      if (closed) {
        clearInterval(timer);
        return;
      }

      const events = await db.query(
        `SELECT sequence,event_type,node_id,payload,created_at
         FROM graph_run_events
         WHERE run_id=$1 AND sequence>$2
         ORDER BY sequence
         LIMIT 100`,
        [request.params.runId, sequence],
      );
      for (const event of events.rows) {
        sequence = Number(event.sequence);
        reply.raw.write(
          `id: ${sequence}\nevent: ${event.event_type}\ndata: ${JSON.stringify(event)}\n\n`,
        );
      }

      const status = await db.query(
        'SELECT status FROM graph_runs WHERE id=$1',
        [request.params.runId],
      );
      if (['succeeded', 'failed', 'cancelled'].includes(status.rows[0]?.status)) {
        reply.raw.write(
          `event: done\ndata: ${JSON.stringify({ status: status.rows[0].status })}\n\n`,
        );
        clearInterval(timer);
        reply.raw.end();
      }
    }, 750);
  });
}

import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import { ZodError } from 'zod';
import { config, allowedOrigins } from './config.js';
import { registerAuthHook } from './auth.js';
import { authRoutes } from './routes/auth.js';
import { projectRoutes } from './routes/projects.js';
import { canvasRoutes } from './routes/canvas.js';
import { providerRoutes } from './routes/providers.js';
import { runRoutes } from './routes/runs.js';
import { healthRoutes } from './routes/health.js';

const app = Fastify({
  logger: { level: config.LOG_LEVEL },
  // Development preview supports small local images/videos encoded as data URIs.
  // Production deployments should switch to object storage and lower this limit.
  bodyLimit: 32 * 1024 * 1024,
  trustProxy: true,
});

await app.register(helmet, { contentSecurityPolicy: false });
await app.register(cors, {
  credentials: true,
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) callback(null, true);
    else callback(new Error('Origin not allowed'), false);
  },
});
await app.register(cookie);
await app.register(jwt, { secret: config.ACCESS_TOKEN_SECRET });
await app.register(rateLimit, { max: 300, timeWindow: '1 minute' });
registerAuthHook(app);
await app.register(healthRoutes);
await app.register(authRoutes, { prefix: '/v1/auth' });
await app.register(projectRoutes, { prefix: '/v1/projects' });
await app.register(canvasRoutes, { prefix: '/v1/projects' });
await app.register(providerRoutes, { prefix: '/v1/providers' });
await app.register(runRoutes, { prefix: '/v1' });

app.setErrorHandler((error: any, _request, reply) => {
  if (error instanceof ZodError) {
    return reply.code(400).send({ error: 'VALIDATION_ERROR', issues: error.issues });
  }
  const statusCode = Number(error.statusCode ?? 500);
  if (statusCode >= 500) app.log.error(error);
  return reply.code(statusCode).send({
    error: error.code ?? (statusCode >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR'),
    message: statusCode >= 500 ? 'Unexpected server error' : error.message,
  });
});

await app.listen({ port: config.API_PORT, host: '0.0.0.0' });

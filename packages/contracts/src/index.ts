import { z } from 'zod';
export const nodePositionSchema = z.object({ x: z.number().finite(), y: z.number().finite() });
export const canvasNodeSchema = z.object({
  id: z.string().min(1).max(120),
  type: z.enum(['story','character','reference','asset','generation','output','group']),
  position: nodePositionSchema,
  width: z.number().positive().max(2000).optional(),
  height: z.number().positive().max(2000).optional(),
  data: z.record(z.string(), z.unknown()).default({}),
});
export const canvasEdgeSchema = z.object({
  id: z.string().min(1).max(120), source: z.string().min(1).max(120), target: z.string().min(1).max(120),
  type: z.string().max(64).default('smoothstep'), data: z.record(z.string(), z.unknown()).default({}),
});
export const viewportSchema = z.object({x:z.number().finite(),y:z.number().finite(),zoom:z.number().min(0.05).max(4)});
export const canvasSnapshotSchema = z.object({version:z.number().int().nonnegative(),viewport:viewportSchema,nodes:z.array(canvasNodeSchema).max(5000),edges:z.array(canvasEdgeSchema).max(10000)});
export const registerSchema = z.object({email:z.string().email().max(320),password:z.string().min(10).max(128),displayName:z.string().trim().min(1).max(80)});
export const loginSchema = z.object({email:z.string().email(),password:z.string().min(1).max(128)});
export const createProjectSchema = z.object({title:z.string().trim().min(1).max(120),description:z.string().trim().max(1000).default('')});
export const nextStepRunSchema = z.object({sourceNodeId:z.string().min(1).max(120),instruction:z.string().trim().min(1).max(4000),targetType:z.enum(['story','character','reference','asset','generation','output']).optional()});
export const providerCredentialSchema = z.object({provider:z.string().trim().min(1).max(64),apiKey:z.string().min(8).max(4096),baseUrl:z.string().url().max(2048),model:z.string().trim().min(1).max(200)});
export type CanvasSnapshot=z.infer<typeof canvasSnapshotSchema>;
export type CanvasNodeInput=z.infer<typeof canvasNodeSchema>;
export type CanvasEdgeInput=z.infer<typeof canvasEdgeSchema>;

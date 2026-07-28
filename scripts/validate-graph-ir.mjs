#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
const path = process.argv[2];
if (!path) throw new Error('Usage: validate-graph-ir.mjs <graph.json>');
const graph = JSON.parse(await readFile(path, 'utf8'));
const ids = new Set(graph.nodes?.map((node) => node.id));
if (!graph.apiVersion?.includes('graphengineering')) throw new Error('Invalid apiVersion');
if (!Array.isArray(graph.nodes) || graph.nodes.length === 0) throw new Error('Graph needs nodes');
for (const edge of graph.edges ?? []) {
  if (!ids.has(edge.from?.node) || !ids.has(edge.to?.node)) throw new Error(`Edge ${edge.id} references an unknown node`);
}
console.log(`Valid Graph IR: ${graph.metadata?.name ?? path} (${ids.size} nodes)`);

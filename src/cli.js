#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { startApp } from './app.js';
import { discover, OpenAIModel, ScriptedModel } from './discovery.js';
import { replay } from './replay.js';
import { openRuntime } from './runtime.js';
import { RunLogger } from './logger.js';
import { HandoffController } from './handoff.js';

const args = Object.fromEntries(process.argv.slice(3).map(x => x.split('=', 2)));
const command = process.argv[2]; const baseUrl = args.url || 'http://127.0.0.1:4173';
if (command === 'app') { await startApp(Number(args.port || 4173)); console.log(`Legacy proxy listening at ${baseUrl}`); }
else if (command === 'discover') {
  const runtime = await openRuntime({ headless: args.headed !== 'true' }); const runId = `discover-${Date.now()}`; const logger = new RunLogger(args.log || `run/${runId}.jsonl`, runId);
  try { const model = args.model === 'openai' ? new OpenAIModel() : new ScriptedModel(); const artifact = await discover({ goal: args.goal || 'Look up member 12345 and read the savings balance', baseUrl, inputs: { memberId: args.member || '12345' }, ...runtime, logger, model }); fs.mkdirSync(path.dirname(args.out || 'run/capability.json'), { recursive: true }); fs.writeFileSync(args.out || 'run/capability.json', JSON.stringify(artifact, null, 2)); console.log(JSON.stringify({ status: 'success', artifact: args.out || 'run/capability.json' }, null, 2)); } finally { await runtime.browser.close(); }
} else if (command === 'replay') {
  const artifact = JSON.parse(fs.readFileSync(args.artifact || 'run/capability.json')); const runtime = await openRuntime({ headless: args.headed !== 'true' }); const runId = `replay-${Date.now()}`; const logger = new RunLogger(args.log || `run/${runId}.jsonl`, runId);
  try { const output = await replay({ artifact, inputs: { memberId: args.member || '12345' }, ...runtime, logger, handoff: new HandoffController({ autoResume: true }), evidenceDir: args.evidence || 'run' }); console.log(JSON.stringify(output, null, 2)); process.exitCode = output.status === 'failure' ? 1 : 0; } finally { await runtime.browser.close(); }
} else { console.error('Usage: node src/cli.js app|discover|replay [key=value]'); process.exitCode = 2; }

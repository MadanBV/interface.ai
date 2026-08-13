import fs from 'node:fs';
import { startApp } from './app.js';
import { discover, ScriptedModel } from './discovery.js';
import { replay } from './replay.js';
import { openRuntime } from './runtime.js';
import { RunLogger } from './logger.js';
import { HandoffController } from './handoff.js';

fs.mkdirSync('evidence', { recursive: true }); const server = await startApp();
try {
  let runtime = await openRuntime(); const discoveryLog = new RunLogger('evidence/discovery.jsonl', 'discovery-demo');
  const artifact = await discover({ goal: 'Look up member 12345 and read their savings balance', baseUrl: 'http://127.0.0.1:4173', inputs: { memberId: '12345' }, ...runtime, logger: discoveryLog, model: new ScriptedModel() });
  fs.writeFileSync('evidence/member-balance.capability.json', JSON.stringify(artifact, null, 2)); await runtime.surface.screenshot('evidence/discovery-success.png'); await runtime.browser.close();
  runtime = await openRuntime(); const success = await replay({ artifact, inputs: { memberId: '12345' }, ...runtime, logger: new RunLogger('evidence/replay-success.jsonl', 'replay-success-demo'), handoff: new HandoffController({ autoResume: true }), evidenceDir: 'evidence' }); await runtime.surface.screenshot('evidence/replay-success.png'); fs.writeFileSync('evidence/replay-success.result.json', JSON.stringify(success, null, 2)); await runtime.browser.close();
  runtime = await openRuntime(); const notFound = await replay({ artifact, inputs: { memberId: '99999' }, ...runtime, logger: new RunLogger('evidence/replay-not-found.jsonl', 'replay-not-found-demo'), handoff: new HandoffController({ autoResume: true }), evidenceDir: 'evidence' }); await runtime.surface.screenshot('evidence/replay-not-found.png'); fs.writeFileSync('evidence/replay-not-found.result.json', JSON.stringify(notFound, null, 2)); await runtime.browser.close();
  const broken = structuredClone(artifact); broken.steps[1].target = { primary: { role: 'textbox', name: 'Missing legacy control' } };
  runtime = await openRuntime(); const hardFailure = await replay({ artifact: broken, inputs: { memberId: '12345' }, ...runtime, logger: new RunLogger('evidence/replay-handoff.jsonl', 'replay-handoff-demo'), handoff: new HandoffController({ autoResume: true }), evidenceDir: 'evidence' }); fs.writeFileSync('evidence/replay-handoff.result.json', JSON.stringify(hardFailure, null, 2)); await runtime.browser.close();
  console.log(JSON.stringify({ discovery: 'success', replay: success, exceptionalReplay: notFound, hardFailure }, null, 2));
} finally { server.close(); }

import fs from 'node:fs';
import path from 'node:path';
import { bind, validateArtifact } from './schema.js';
import { PolicyViolation } from './policy.js';

const result = (status, fields) => ({ status, ...fields });
export async function replay({ artifact, inputs, surface, policy, logger, handoff, evidenceDir, approved = false }) {
  validateArtifact(artifact); const outputs = {}; let recovered = 0;
  for (const [name, spec] of Object.entries(artifact.contract.inputs)) {
    const value = inputs[name]; if (value == null || (spec.pattern && !new RegExp(spec.pattern).test(String(value)))) return result('failure', { error: { code: 'INVALID_INPUT', stepId: null, expected: spec, observed: typeof value } });
  }
  for (const step of artifact.steps) {
    logger.emit('step_started', { stepId: step.id, action: step.action.type });
    try {
      policy.checkAction(step.action, approved);
      if (step.action.type === 'navigate') { policy.checkNavigation(step.action.url); await surface.page.goto(step.action.url); }
      else {
        const { loc, spec } = await surface.resolve(step.target); logger.emit('locator_resolved', { stepId: step.id, locator: spec });
        if (step.action.type === 'fill') await loc.fill(bind(step.action.value, inputs));
        if (step.action.type === 'click') await loc.click();
        if (step.action.type === 'extract') outputs[step.action.output] = (await loc.innerText()).trim();
      }
      if (step.wait?.state === 'networkidle') await surface.page.waitForLoadState('networkidle', { timeout: step.wait.timeoutMs });
      for (const outcome of artifact.outcomes) {
        const detector = surface.locator(outcome.detector); if (await detector.count()) { const observed = await detector.first().innerText(); logger.emit('business_outcome', { code: outcome.code, stepId: step.id }); return result('business_outcome', { outcome: { code: outcome.code, observed }, outputs: {} }); }
      }
      if (step.checkpoint) await (await surface.resolve({ primary: step.checkpoint.locator })).loc.waitFor({ state: 'visible' });
      logger.emit('step_completed', { stepId: step.id });
    } catch (error) {
      const screenshot = path.join(evidenceDir, `failure-${step.id}.png`); fs.mkdirSync(evidenceDir, { recursive: true }); await surface.screenshot(screenshot).catch(() => {});
      const details = { code: error instanceof PolicyViolation ? 'POLICY_BLOCKED' : 'STEP_FAILED', stepId: step.id, expected: step.target || step.action, observed: error.message, screenshot };
      logger.emit('step_failed', details); await handoff?.request(details); return result('failure', { error: details, handoff: handoff?.history || [] });
    }
  }
  try { await surface.page.getByText(artifact.checkpoint.text, { exact: false }).waitFor({ state: 'visible', timeout: 2000 }); }
  catch (error) { return result('failure', { error: { code: 'CHECKPOINT_FAILED', expected: artifact.checkpoint, observed: error.message } }); }
  logger.emit('run_completed', { outputs, recoveredConditions: recovered }); return result('success', { outputs, recoveredConditions: recovered });
}

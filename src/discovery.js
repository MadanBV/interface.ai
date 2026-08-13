import { balanceArtifact } from './artifact.js';

export class ScriptedModel {
  constructor() { this.i = 0; }
  async decide() { return [
    { thought: 'Open the permitted member inquiry.', action: { type: 'navigate' } },
    { thought: 'The member number field is visible; parameterize it.', action: { type: 'fill', target: { role: 'textbox', name: 'Member number' }, value: '{{input.memberId}}' } },
    { thought: 'Submit the inquiry.', action: { type: 'click', target: { role: 'button', name: 'Find Member' } } },
    { thought: 'The record is loaded and exposes the requested balance.', action: { type: 'finish' } }
  ][this.i++]; }
}

export class OpenAIModel {
  constructor({ apiKey = process.env.OPENAI_API_KEY, model = process.env.OPENAI_MODEL || 'gpt-5-mini' } = {}) { this.apiKey = apiKey; this.model = model; }
  async decide({ goal, observation, actions }) {
    const response = await fetch('https://api.openai.com/v1/responses', { method: 'POST', headers: { authorization: `Bearer ${this.apiKey}`, 'content-type': 'application/json' }, body: JSON.stringify({ model: this.model, input: `You operate a legacy UI. Goal: ${goal}\nScreen:\n${observation}\nReturn only JSON: {"thought":"...","action":{"type":"navigate|fill|click|finish","target":{"role":"...","name":"..."},"value":"..."}}. Prior actions: ${JSON.stringify(actions)}` }) });
    if (!response.ok) throw new Error(`Model request failed: ${response.status}`); const data = await response.json();
    const text = data.output_text || data.output?.flatMap(x => x.content || []).find(x => x.type === 'output_text')?.text;
    if (!text) throw new Error('Model response contained no output text');
    return JSON.parse(text.replace(/^```json\s*|\s*```$/g, ''));
  }
}

export async function discover({ goal, baseUrl, inputs, surface, policy, logger, model, maxSteps = 8 }) {
  const actions = [];
  for (let n = 0; n < maxSteps; n++) {
    const observation = await surface.observe(); const decision = await model.decide({ goal, observation, actions }); logger.emit('model_decision', { step: n, thought: decision.thought, action: decision.action.type });
    const a = decision.action; policy.checkAction({ type: a.type === 'finish' ? 'assert' : a.type, risk: 'safe' });
    if (a.type === 'finish') { const artifact = balanceArtifact(baseUrl); logger.emit('artifact_emitted', { artifactId: artifact.id }); return artifact; }
    if (a.type === 'navigate') { policy.checkNavigation(`${baseUrl}/`); await surface.page.goto(`${baseUrl}/`); }
    else { const loc = surface.locator(a.target); if (a.type === 'fill') await loc.fill(a.value.replace('{{input.memberId}}', inputs.memberId)); else if (a.type === 'click') await loc.click(); }
    actions.push(a);
  }
  throw new Error('Discovery stopped: MAX_STEPS');
}

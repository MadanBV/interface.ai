import { EventEmitter } from 'node:events';

export class HandoffController extends EventEmitter {
  constructor({ autoResume = false } = {}) { super(); this.owner = 'automation'; this.autoResume = autoResume; this.history = []; }
  async request(context) {
    this.owner = 'human'; this.history.push({ event: 'control_transferred', to: 'human', context }); this.emit('requested', context);
    if (this.autoResume) { this.recordHumanAction('acknowledged simulated operator review'); return this.resume('demo-operator'); }
    await new Promise(resolve => this.once('resume', resolve));
  }
  recordHumanAction(description) { if (this.owner !== 'human') throw new Error('Human does not own session'); this.history.push({ event: 'human_action', description }); }
  resume(operator) { this.history.push({ event: 'control_transferred', to: 'automation', operator }); this.owner = 'automation'; this.emit('resume'); }
}

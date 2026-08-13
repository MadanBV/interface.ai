export class PolicyViolation extends Error { constructor(message, details) { super(message); this.name = 'PolicyViolation'; this.details = details; } }

export class Policy {
  constructor(config) { this.config = config; }
  checkNavigation(url) {
    const u = new URL(url);
    if (!this.config.origins.includes(u.origin)) throw new PolicyViolation(`Origin not allowed: ${u.origin}`, { url });
    if (!this.config.routes.some(r => new RegExp(r).test(u.pathname))) throw new PolicyViolation(`Route not allowed: ${u.pathname}`, { url });
  }
  checkAction(action, approved = false) {
    if (!this.config.actions.includes(action.type)) throw new PolicyViolation(`Action not allowed: ${action.type}`, { action });
    if (action.risk === 'irreversible' && !approved) throw new PolicyViolation('Irreversible action requires human approval', { action, requiresApproval: true });
  }
}

export const localPolicy = {
  origins: ['http://127.0.0.1:4173'],
  routes: ['^/$', '^/member(?:/.*)?$'],
  actions: ['navigate', 'click', 'fill', 'extract', 'assert']
};

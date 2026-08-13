export function balanceArtifact(baseUrl = 'http://127.0.0.1:4173') {
  return {
    schemaVersion: '1.0', id: 'meridian.member-savings.lookup.v1', name: 'Look up member savings balance',
    description: 'Finds a member and returns the displayed savings balance. Read-only.',
    approval: { state: 'draft', reviewedBy: null },
    contract: {
      inputs: { memberId: { type: 'string', pattern: '^\\d{5}$', sensitive: true } },
      outputs: { balance: { type: 'string', description: 'Currency as displayed by the core' } }
    },
    target: { surface: 'browser', appFamily: 'meridian-core', entrypoint: `${baseUrl}/`, tenantBindings: {} },
    policy: { risk: 'read_only', permittedRoutes: ['/', '/member'] },
    steps: [
      { id: 'open', action: { type: 'navigate', url: `${baseUrl}/`, risk: 'safe' }, checkpoint: { kind: 'visible', locator: { role: 'textbox', name: 'Member number' } } },
      { id: 'enter-member', action: { type: 'fill', value: '{{input.memberId}}', risk: 'safe' }, target: { primary: { role: 'textbox', name: 'Member number' }, fallbacks: [{ label: 'Member number' }] } },
      { id: 'search', action: { type: 'click', risk: 'safe' }, target: { primary: { role: 'button', name: 'Find Member' }, fallbacks: [{ text: 'Find Member' }] }, wait: { state: 'networkidle', timeoutMs: 3000 } },
      { id: 'read-balance', action: { type: 'extract', output: 'balance', risk: 'safe' }, target: { primary: { labelText: 'Savings balance', relation: 'table-cell' }, fallbacks: [{ css: '[data-field="savings-balance"]' }] } }
    ],
    outcomes: [{ code: 'MEMBER_NOT_FOUND', kind: 'business', detector: { role: 'alert', text: 'MEMBER_NOT_FOUND' } }],
    recoveries: [{ code: 'TRANSIENT_LOAD', attempts: 2, backoffMs: 150 }],
    checkpoint: { kind: 'visible_text', text: 'Member record loaded' },
    metadata: { discoveredBy: 'llm', createdAt: new Date().toISOString() }
  };
}

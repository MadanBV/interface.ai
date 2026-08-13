export class BrowserSurface {
  constructor(page, policy) { this.page = page; this.policy = policy; }
  async observe() {
    return await this.page.locator('body').innerText({ timeout: 2000 });
  }
  locator(spec) {
    if (spec.role) return this.page.getByRole(spec.role, spec.name ? { name: spec.name } : {}).filter(spec.text ? { hasText: spec.text } : {});
    if (spec.label) return this.page.getByLabel(spec.label);
    if (spec.text) return this.page.getByText(spec.text, { exact: false });
    if (spec.css) return this.page.locator(spec.css);
    if (spec.labelText && spec.relation === 'table-cell') return this.page.locator('tr', { has: this.page.getByText(spec.labelText, { exact: true }) }).locator('td');
    throw new Error(`Unsupported locator: ${JSON.stringify(spec)}`);
  }
  async resolve(target) {
    const choices = [target.primary, ...(target.fallbacks || [])];
    for (const spec of choices) { const loc = this.locator(spec); if (await loc.count() === 1) return { loc, spec }; }
    throw new Error(`No unique locator matched: ${JSON.stringify(choices)}`);
  }
  async screenshot(file) { await this.page.screenshot({ path: file, fullPage: true }); }
}

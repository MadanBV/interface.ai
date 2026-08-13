import { chromium } from 'playwright';
import { BrowserSurface } from './surface.js';
import { Policy, localPolicy } from './policy.js';

export async function openRuntime({ headless = true } = {}) {
  const browser = await chromium.launch({ headless }); const context = await browser.newContext(); const page = await context.newPage();
  return { browser, page, surface: new BrowserSurface(page, new Policy(localPolicy)), policy: new Policy(localPolicy) };
}

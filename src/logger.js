import fs from 'node:fs';
import path from 'node:path';
import { redact } from './redact.js';

export class RunLogger {
  constructor(file, runId) {
    this.file = file;
    this.runId = runId;
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, '');
  }
  emit(event, data = {}) {
    const record = redact({ ts: new Date().toISOString(), runId: this.runId, event, ...data });
    fs.appendFileSync(this.file, JSON.stringify(record) + '\n');
    return record;
  }
}

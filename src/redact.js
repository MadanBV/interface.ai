const SENSITIVE_KEYS = /password|secret|token|authorization|cookie|ssn|account.?number/i;
const patterns = [
  [/(bearer\s+)[\w.-]+/gi, '$1[REDACTED]'],
  [/\b\d{3}-\d{2}-\d{4}\b/g, '[REDACTED_SSN]'],
  [/\b(?:\d[ -]*?){12,19}\b/g, '[REDACTED_NUMBER]']
];

export function redact(value) {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object') return Object.fromEntries(
    Object.entries(value).map(([k, v]) => [k, SENSITIVE_KEYS.test(k) ? '[REDACTED]' : redact(v)])
  );
  if (typeof value !== 'string') return value;
  return patterns.reduce((s, [pattern, replacement]) => s.replace(pattern, replacement), value);
}

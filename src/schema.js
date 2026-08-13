export const artifactSchemaVersion = '1.0';

export function validateArtifact(a) {
  const required = ['schemaVersion', 'id', 'name', 'contract', 'target', 'steps', 'outcomes', 'checkpoint'];
  for (const key of required) if (a[key] == null) throw new Error(`Artifact missing ${key}`);
  if (a.schemaVersion !== artifactSchemaVersion) throw new Error(`Unsupported schemaVersion ${a.schemaVersion}`);
  if (!Array.isArray(a.steps) || !a.steps.length) throw new Error('Artifact steps must be non-empty');
  for (const [name, spec] of Object.entries(a.contract.inputs || {})) if (!['string', 'number', 'boolean'].includes(spec.type)) throw new Error(`Invalid input type for ${name}`);
  return a;
}

export function bind(template, inputs) {
  return typeof template === 'string' ? template.replace(/\{\{input\.([\w-]+)\}\}/g, (_, k) => {
    if (!(k in inputs)) throw new Error(`Missing input: ${k}`); return String(inputs[k]);
  }) : template;
}

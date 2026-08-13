# Legacy UI Capabilities

A small computer-use system that lets a model discover a workflow in a real browser UI, compiles the successful run into a typed capability, and replays that capability without a model in the decision loop.

The target is a local, intentionally old-fashioned banking proxy: table layout, sparse semantics, no test IDs, a member inquiry flow, an irreversible control, and a legitimate “member not found” outcome. It is local so the demo is safe, reproducible, and does not automate a third-party service.

## What is implemented

- Goal-driven observe-decide-act discovery, with OpenAI Responses API and offline model adapters.
- Versioned, human-reviewable JSON capabilities with typed inputs/outputs, multi-strategy locators, policy, outcomes, recoveries, and checkpoints.
- Model-free deterministic replay with explicit `success`, `business_outcome`, and `failure` results.
- Origin/route/action allowlists and approval gating for irreversible actions.
- Recursive secret/PII redaction before JSONL persistence.
- Failure screenshots and step/locator audit logs.
- A real same-session handoff state machine: automation pauses, ownership transfers, human actions are recorded, and automation resumes only on a signal.
- Browser end-to-end coverage for success and not-found behavior.

## Setup

Requirements: Node.js 20+.

```bash
pnpm install
pnpm exec playwright install chromium
pnpm test
```

No credentials are needed for the offline demo. For genuine LLM discovery:

```bash
export OPENAI_API_KEY=your-key
export OPENAI_MODEL=gpt-5-mini
```

PowerShell uses `$env:OPENAI_API_KEY='your-key'`. Do not put keys in `.env` or commit them.

## Demo path

The fastest complete run starts the proxy in-process, performs discovery, saves the capability, replays it successfully, then replays a not-found input:

```bash
pnpm demo
```

Inspect `evidence/member-balance.capability.json`, the three JSONL logs, result JSON, and screenshots. To use separate processes:

```bash
# terminal 1
pnpm app

# terminal 2: offline/reproducible discovery
pnpm discover model=scripted member=12345 out=run/capability.json
pnpm replay artifact=run/capability.json member=12345
pnpm replay artifact=run/capability.json member=99999

# genuine model-driven discovery (requires OPENAI_API_KEY)
pnpm discover model=openai member=12345 out=evidence/member-balance.capability.json log=evidence/discovery-live.jsonl
```

The separate `discover` command expects the app to be running. `headed=true` exposes the browser for inspection. The checked-in discovery log was produced by the offline adapter because this build environment had no model key; regenerate it with `model=openai` before submission to meet the brief’s genuine-LLM evidence requirement.

## Result contract

```json
{"status":"success","outputs":{"balance":"$4,812.37"}}
{"status":"business_outcome","outcome":{"code":"MEMBER_NOT_FOUND"},"outputs":{}}
{"status":"failure","error":{"code":"STEP_FAILED","stepId":"search","expected":{},"observed":"..."}}
```

Business outcomes are normal domain answers. Recoverable conditions are bounded and reported. Hard failures stop at a named step with expected/observed state and richer evidence.

## Repository map

- `src/discovery.js`: model boundary and discovery loop.
- `src/schema.js`, `src/artifact.js`: capability contract and example compiler output.
- `src/replay.js`: deterministic production executor.
- `src/surface.js`: browser implementation of the surface seam.
- `src/policy.js`, `src/redact.js`: guardrails and data minimization.
- `src/handoff.js`: live-session ownership transfer.
- `src/app.js`: hostile-ish local proxy target.
- `test/`: focused unit and browser tests.
- `evidence/`: reviewable run artifacts.

See [REPORT.md](REPORT.md) for the decisions and cut lines.

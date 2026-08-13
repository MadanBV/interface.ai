# Architecture

The system has four deliberate boundaries: `Model` decides only during discovery; `Surface` observes and acts on a live UI; a compiler emits a capability; `Replay` interprets that capability without a model. Policy wraps every navigation and action rather than relying on the model prompt. Logging receives already-structured events and redacts again at the persistence boundary.

The implementation is one Node process because queues and distributed control do not improve this vertical slice. Playwright is the concrete browser surface, but steps use control intent (`role`, accessible name, label relationships) rather than Playwright selectors. A future accessibility-tree or desktop adapter can implement the same observe/resolve/act seam. The local proxy intentionally resembles a legacy servicing screen and keeps the demo ethical and deterministic.

Discovery uses an iterative observation plus constrained JSON decision. `OpenAIModel` is the live provider; `ScriptedModel` exercises the identical loop without network access. The model transcript is not the production artifact. On success, the compiler emits a curated, parameterized capability whose contract is smaller and safer than arbitrary discovered actions.

# Artifact schema

The JSON artifact is both agent contract and executable review unit. `schemaVersion` gates interpretation; stable `id` identifies the capability; `contract` declares typed parameters and outputs; `target` identifies surface/app family/entry point; `policy` states risk; ordered `steps` contain action, robust target, bounded wait, and optional local checkpoint. Global `outcomes` describe domain answers and the terminal `checkpoint` proves completion. Approval and provenance metadata support governance without changing execution semantics.

Locators are ordered strategies. The primary locator captures semantic intent (role/name or label-to-cell relationship); fallbacks handle vendor variants. Replay accepts a strategy only when it resolves uniquely, preventing a “best guess” click. Inputs are placeholders, never recorded values. Tenant bindings are an explicit overlay seam rather than copied artifacts.

# Determinism & error handling

Replay is a finite interpreter: validate inputs, enforce policy, resolve exactly one target, act, wait on a declared state, check known outcomes, extract declared outputs, then verify the terminal checkpoint. There is no LLM call or open-ended retry. Same artifact plus same surface state and inputs follows the same branches.

The result union separates three meanings. `success` returns typed outputs. `business_outcome` returns a recognized domain code such as `MEMBER_NOT_FOUND`; this is not an infrastructure error. `failure` includes code, step ID, expected target/state, observed error, and screenshot path. Known transient recovery is declared and bounded in the artifact; the prototype records the recovery contract but deliberately implements only deterministic waits, so it reports rather than conceals unresolved slowness. Runtime UI drift appears as a non-unique/missing locator or failed checkpoint.

# Heterogeneity & multi-tenant

The artifact describes control intent while the `Surface` owns mechanics. A legacy-web adapter could combine accessibility, text geometry, frames, and image anchors. A desktop adapter could resolve the same role/name strategies through UI Automation and act via OS input. Coordinates would be last-resort, surface-specific fallback data with display prerequisites.

Capabilities belong to an `appFamily`, not a tenant. Tenant overlays bind entry points and narrowly override locator strategies for vendor version/configuration. Replay telemetry can cluster failures by app version; a canary suite validates an approved artifact across representative variants. Overrides remain reviewable diffs, and incompatible versions fork the artifact rather than accreting unsafe fallbacks.

# Escalation & handoff

Missing/ambiguous controls, blocked policy actions, failed checkpoints, and exhausted recovery create an intervention containing goal/capability, step, reason, and screenshot. `HandoffController` is a real ownership state machine around the same Playwright page: automation changes owner to `human` and awaits a resume event; operator actions are appended to the same audit history; only an identified resume transfers ownership back. The demo auto-acknowledges to remain non-interactive, while the class supports a real console signal.

Production would expose the existing browser through a streamed view/input channel and authorize leases with expiry. The key invariant stays: one owner at a time, one unchanged session, explicit transfer events, and no silent automation while a person controls it.

# Safety

Policy checks are code, not prompt text: exact allowed origins, regex routes, allowed action kinds, and risk labels. Irreversible actions require explicit approval. Artifacts store parameter names, not runtime member data. Logs recursively redact sensitive keys, bearer tokens, SSNs, and long account/card-like numbers before disk. Secrets stay in process environment and screenshots are failure-only by default.

Limits: screenshots can still contain displayed PII, so a real deployment needs encrypted short-retention evidence storage, access controls, OCR/image redaction, and tenant isolation. Model observations also require a provider/data-residency agreement and pre-send minimization. The prototype demonstrates enforcement seams, not a claim of regulatory compliance.

# Cuts

I cut a polished operator console, desktop implementation, encrypted evidence store, artifact signing/migrations, and fleet infrastructure. Bounded transient recovery is represented but not fully executed. The local UI is intentionally small. Most importantly, this environment had no model key, so checked-in discovery evidence uses the offline adapter; a genuine LLM discovery must be regenerated with the documented command before submission.

Next I would add a tiny operator WebSocket console, signed approved artifacts, executable retry/dismiss recovery clauses, screenshot redaction, and a second tenant variant to test overlay reuse. Those deepen the load-bearing seams without adding premature scaling machinery.

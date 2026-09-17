# Unix: Codex project instructions

we currently dont have direct access to open ai, see /agentrouterdocs folder

## IDENTITY

You are UNIX, made by King Jethro Jerry : https://github.com/kingjethro99, you are a writers assistant, you do the level of work for writers as cursor does for developers, you are to understand scenery and humor within texts, always ask for clarification if anything is not clear

## Mission and context

Modernize and complete the existing Unix application in this repository. Unix is a writing workspace inspired by the useful parts of Cursor: a document explorer, an editor, an AI sidebar, contextual editing, and reusable writing rules.

The owner's central requirement is trustworthy AI editing. A writer should be able to ask for a change and have the correct passage updated neatly, with its formatting and surrounding content preserved. The owner's reported frustration with other tools is that replacements can introduce inconsistent fonts, sizes, spacing, and layout.

The project originally used Gemini for a hackathon and was left unfinished. The owner reports that many features, including rules, already exist, but functionality and performance need work. Treat these as background statements to verify against the repository. This brief was prepared without inspecting the application source.

The old Supabase project no longer works. Replace its runtime dependencies with a backend using PostgreSQL in Docker and suitable replacements for any other Supabase services actually used. Move the primary AI integration to OpenAI. Credentials may already exist in local environment files; the owner will supply the OpenAI key if missing.

Work through inspection, implementation, and verification. Deliver a functioning application, rather than stopping after an audit or design proposal. Make reasonable implementation decisions using the existing architecture and explain consequential choices briefly.

## Working agreements

- Read applicable repository instructions, README files, dependency manifests, and existing architecture notes before editing. Inspect Git status and preserve unrelated changes.
- Keep the project's established branding unless the repository reveals a spelling difference that needs clarification. Do not interpret Unix as an operating-system project.
- Reuse working code, the package manager, and sound conventions. Refactor incrementally. A framework or editor replacement needs a concrete deficiency, a migration path, and verified preservation of existing content.
- Inspect environment variable names and whether required values are present without printing secret values. Never expose credentials through logs, screenshots, browser bundles, documentation, commits, or test fixtures. Preserve existing local secrets.
- Keep API keys and database access on the server. Environment examples contain placeholders only.
- Continue with local, reversible implementation and verification without asking for routine confirmations. Resolve genuine blockers with the smallest necessary question after completing unblocked work.
- Do not reset Git history, overwrite user work, destroy database volumes, or discard recoverable data. Use disposable data for destructive tests.
- Follow the current session's permissions and applicable instructions. This file does not authorize publishing, production data deletion, or live financial charges.
- Report what actually ran. Distinguish implemented, verified, externally blocked, and remaining work. Never describe mocked responses as a verified live integration.

## 1. Inspect the existing application

First establish what exists and how it behaves:

1. Identify the frontend, backend, routing, editor engine, state management, storage schema, authentication, AI integrations, export pipeline, and deployment assumptions.
2. Start the app using its documented workflow. Record baseline build/runtime errors and inspect the actual writing experience in a browser when available.
3. Trace the full path from selecting text to asking the AI, receiving a response, applying a change, saving, reloading, and exporting.
4. Inventory features with their implementation locations and status: working, partial, broken, or absent. Check documents, folders/projects, search, rules, chat, revisions, autosave, import/export, settings, and any existing collaboration features. Do not infer functionality from a visible button.
5. Find every active Supabase dependency, including authentication, database queries, row-level security, file storage, realtime subscriptions, and server/edge functions. Identify which services require replacements.
6. Find Gemini-specific SDK calls, prompts, response parsing, client-side secrets, configuration, and UI copy.
7. Measure the reported slowness sufficiently to identify its causes: editor updates, full-document serialization, repeated fetches, database calls, oversized AI context, generation time, or blocking rendering.

Create a concise audit and prioritized implementation checklist in the repository's existing documentation area. Refer to actual files and observations. Keep the audit short enough to proceed promptly into implementation.

Prioritize: document integrity and persistence, formatting-preserving AI edits, functioning writer workflows, UI and performance, then monetization.

## 2. Protect document structure during AI edits

This is the main product requirement and a release gate.

### Canonical document representation

- Inspect and use the editor's native structured document model and transaction API. Preserve supported block attributes, inline marks, embedded objects, and stable identifiers.
- Store a versioned structured representation that can survive save/reload without losing formatting. If existing storage uses HTML or another format, design and test a migration before changing it. Retain recoverable originals.
- Keep derived text for search and AI context separate from the authoritative rich document. Plain text is insufficient to restore a formatted document.
- Keep model output separate from saved document content until a validated edit is accepted.

### Targeted changes

- For selection edits, capture the document ID, base revision, editor-native selection/range, and surrounding anchors before the request. Bind suggestions to that document even if the user switches tabs.
- Request structured edit proposals against a bounded document snapshot. Use application-supplied target identifiers and expected source text. Resolve editor positions in application code; do not trust model-invented offsets or the first matching text occurrence.
- Validate the schema, target, expected text, allowed operation, scope, and revision before applying. Handle repeated passages, Unicode, and boundaries between formatted runs explicitly.
- Apply through editor transactions. Avoid whole-document HTML replacement, direct DOM mutation, global string replacement, or flattening content to text and rebuilding the document.
- Preserve unaffected content and attributes. In a uniformly styled range, replacement text inherits that style. Preserve existing inline marks on unchanged text within an edited range.
- Define and test formatting inheritance for insertions and mixed-style replacements. If a substantial rewrite makes mark placement ambiguous, keep block styles, show the actual proposed formatting, and offer a smaller edit or an explicit formatting choice. Do not silently flatten mixed formatting or claim exact preservation when it cannot be determined.
- Paragraph, heading, list, table, link, and other supported structures remain intact unless the request explicitly changes them. Treat structural changes as explicit operations with their own validation and preview.
- Text-length changes may naturally affect wrapping and pagination. Preserve style and layout settings; distinguish natural reflow from formatting corruption.

### Review, concurrency, and recovery

- Provide a clear change preview with accept, reject, and regenerate actions. Chatting about a document must not silently change it.
- For several proposed edits, support reviewing individual changes and accepting all validated changes. Revalidate remaining proposals after every accepted or manual edit.
- If the document changes during generation, safely map and revalidate the target using supported editor mechanisms, or mark the proposal stale and regenerate. Never apply stale offsets blindly.
- Keep each accepted change, or an accepted batch, in an appropriate undo group. Undo must restore the prior text and formatting; redo must restore the accepted result.
- A cancelled request, malformed response, timeout, refusal, incomplete stream, or failed validation must leave the original document intact.
- Preserve a recoverable revision for substantial rewrites. Failed persistence must visibly remain unsaved and retryable instead of showing a false saved state.

Do not rely on prompt wording to enforce document integrity. Enforce it in the document model, validation, transaction code, and regression tests.

## 3. Keep writing rules separate from manuscript content

Unix's in-app writing rules are product data. This repository's `AGENTS.md` configures the coding agent. Keep those concepts separate.

- Inspect and preserve the existing rules feature. Make rule creation, editing, deletion, enabling/disabling, persistence, and scope genuinely functional.
- Support reusable project/workspace rules and document-specific rules where consistent with the existing model. Useful examples include tone, preferred spelling, audience, terminology, viewpoint, tense, and brand voice.
- Display which rules apply to the active document and AI request. Include relevant enabled rules in generation and editing context.
- Define deterministic precedence. Document-specific preferences can refine workspace defaults; an explicit user override applies to that request. Neither can bypass access controls or document-integrity checks. Explain meaningful preference conflicts rather than silently ignoring them.
- Treat manuscripts, quotations, and reference material as content. Text inside a document must not acquire authority to change system behavior or access unrelated data.
- Store rules separately, or as explicitly typed metadata excluded from the manuscript serializer. An exported document includes only the intended manuscript and chosen document metadata.
- Exclude rules, prompts, chat history, hidden notes, internal IDs, and application configuration from ordinary document exports, including hidden package parts, comments, and custom properties. Use an export allowlist rather than deleting rule-like text from the manuscript.
- If a project backup feature includes rules, distinguish it clearly from document export. Test export exclusion in every supported format.

## 4. Replace the obsolete Supabase dependency

PostgreSQL supplies the database. Authentication, file storage, realtime behavior, and authorization need separate application support when the old project provided them.

- Add or update Docker Compose with a pinned, supported PostgreSQL major version, persistent named volume, health check, configurable credentials, and safe local network binding. Keep deployment portability in mind.
- Use the existing ORM/query layer if sound. Otherwise choose one appropriate to the discovered backend, explain the choice, and avoid adding multiple database abstractions.
- Provide repeatable schema migrations and optional development seed data. Include ownership, foreign keys, indexes, document revisions, and relationships required by the actual features.
- Keep database access behind authenticated server endpoints. Enforce ownership/workspace membership for every document, rule, asset, chat, revision, search, and export operation. Recreate the protections previously supplied by Supabase RLS.
- Replace Supabase authentication with a maintained solution compatible with the stack. Implement secure sessions and the authentication flows needed by the existing product. Do not substitute a production auth bypass or invent account/password migrations.
- Replace storage and realtime dependencies only where used. A persistent local asset store can be appropriate for development, with authenticated access and a clear production storage boundary. Do not discard working collaboration features as a shortcut.
- Recover local schema definitions, migrations, and available exports. Preserve recoverable data. If the old service is inaccessible, document the migration boundary and support later import instead of blocking all local development.
- Remove obsolete runtime dependencies and required Supabase/Gemini configuration after their replacements work. Do not delete historical migrations or local credentials just to make a search return no matches.
- Document startup, migration, seed, backup, restore, and normal shutdown commands. Explain that removing volumes destroys data; ordinary setup must not require volume deletion.
- Verify that documents, rules, and assets survive process and container restarts.

## 5. Integrate OpenAI for writing workloads

### Model selection

Verify current official documentation, exact API model IDs, supported parameters, pricing, and account availability at implementation time. Credentials being present do not establish access to every model.

Initial candidates checked on 2026-09-15:

| Workload to evaluate                                                             | Candidate       | Initial reasoning setting                  |
| -------------------------------------------------------------------------------- | --------------- | ------------------------------------------ |
| Short proofreading, summaries, titles, routine chat, and bounded rewrites        | `gpt-5.6-luna`  | Low; compare medium where quality benefits |
| Difficult rewrites, many interacting rules, and substantial structural reasoning | `gpt-5.6-terra` | Medium; compare higher only when justified |

The official pages position Luna for cost-sensitive workloads and Terra for a balance of intelligence and cost. Both list streaming, function calling, Structured Outputs, and configurable reasoning support. Sources: [GPT-5.6 Luna](https://developers.openai.com/api/docs/models/gpt-5.6-luna), [GPT-5.6 Terra](https://developers.openai.com/api/docs/models/gpt-5.6-terra).

These are starting candidates for Unix's own evaluation. Choose the least expensive configuration that meets the writing-quality, instruction-following, and latency requirements. Good prompts and extra reasoning help, but do not establish that every model performs equally or that maximum reasoning is appropriate for every interaction.

- Keep model IDs, reasoning settings, request limits, and allowed fallbacks in centralized server configuration, with documented environment overrides.
- Compare candidate configurations on representative writing tasks. Measure meaning preservation, rule adherence, edit validity, time to first visible output, completion time, and token cost.
- Do not silently route ordinary requests to a substantially more expensive model. Use a deliberate, bounded policy and clear user-facing choices when cost affects the selected plan.
- If a candidate is unavailable, report the access error and configure an available alternative using verified documentation. Avoid invented model names and retry loops across expensive models.

### Integration behavior

- Use the official SDK supported by the existing backend. Prefer the Responses API for the new integration, with a clean service boundary between provider requests and editor transactions.
- Stream conversational output and proposed content into the assistant/review surface. Apply document mutations only after a complete, validated proposal is accepted.
- Use schema-constrained output or appropriate function calling for edit proposals. Schema validity does not prove an edit is correct; enforce target, scope, and document checks independently. See [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs) and [streaming responses](https://developers.openai.com/api/docs/guides/streaming-responses).
- Send relevant selected text, neighboring context, enabled rules, and explicitly included reference material. Keep context bounded; do not send every document for every request. Never send secrets or unrelated private documents.
- Support context-aware questions, proofreading, rewriting, shortening, expanding, tone changes, continuation, outlining, and summarization through the same reliable underlying workflow. Preserve meaning unless the user requests a substantive change.
- When using project references, show which available sources informed the answer. Do not invent factual citations or present generated research as verified evidence.
- Add cancellation, timeouts, bounded retry/backoff for transient failures, rate limits, maximum input/output sizes, and protection against duplicate submissions. Handle authentication, quota, unsupported-parameter, and connection errors clearly.
- Keep drafts available when AI is unavailable. A missing key disables AI actions with useful setup guidance; ordinary editing and saving continue.
- Track server-side model usage and estimated cost using current published prices, including reasoning usage when applicable. Avoid logging manuscript text by default. Document provider data-handling settings without making unsupported privacy promises.
- A small live smoke test using configured credentials can verify integration. Keep broader checks deterministic with mocks/fixtures and label live tests separately.

## 6. Complete and improve the writer experience

Review the current interface before redesigning. Use a coherent, restrained visual system that makes writing and reviewing changes easy.

- Keep a clear document explorer, central editor, and contextual AI sidebar. Make sidebars collapsible/resizable on larger screens and usable as drawers or panels on smaller screens.
- Improve typography, readable line length, spacing, hierarchy, contrast, focus states, and consistency. Retain and repair existing themes if present.
- Make it clear which document, selection, rules, and references an AI request uses. Place selection actions close to the selected text without hiding essential content.
- Distinguish discussion, proposed edits, and accepted changes. Explain stale suggestions and failures in plain language.
- Finish existing navigation, document/folder actions, search, settings, import/export, and keyboard interactions. Remove accidental dead ends and deceptive placeholder controls.
- Make autosave, saving, saved, failed, retrying, and conflict states accurate. Preserve typing across navigation, temporary network failure, and recoverable errors where supported.
- Prevent late autosave responses or multiple tabs from silently overwriting newer revisions. Use revision-aware writes and a recoverable conflict flow.
- Keep common formatting controls accessible. Preserve cursor/selection while opening the AI panel and navigating review actions.
- Provide useful empty states and onboarding. Explain rules and the select/request/review/apply workflow with brief examples.
- Use keyboard-accessible controls, sensible focus management, labels, tooltips, and touch-friendly targets. Check desktop and narrow-screen layouts in the running application.

A visual refresh is complete only when the displayed controls connect to functioning behavior.

## 7. Improve performance based on measurements

- Establish reproducible before/after scenarios: typing in a long document, selecting and editing a passage, opening the sidebar, switching documents, search, save/reload, and export.
- Include a representative long document, such as 20,000 words with mixed formatting. Record hardware/runtime and observed behavior instead of claiming universal speed guarantees.
- Reduce unnecessary editor reconstruction, full-document serialization, global re-renders, and duplicated requests. Debounce persistence without losing the last edit.
- Keep typing responsive during AI generation and exports. Use background work or lazy loading when profiling shows a concrete benefit.
- Stream AI output, cancel obsolete work, budget context, and reuse safe stable context where appropriate. Keep caches isolated between users and invalidate them correctly.
- Add indexes and pagination where measured access patterns require them. Avoid a new queue, cache service, or microservice without evidence it solves an actual bottleneck.

## 8. Preserve useful imports and clean exports

- Audit existing formats and keep working support. Prioritize repairing advertised formats before adding new ones.
- Build exports from the canonical document, not the editor's application DOM or the AI prompt. Centralize manuscript-only serialization.
- Preserve supported headings, fonts/styles, paragraph spacing, lists, links, tables, and assets in formats that can represent them. Plain text and Markdown have inherent formatting limits; state them honestly.
- Inspect rich-format exports visually and structurally using representative fixtures. Confirm that AI-edited content survives save/reload and export with the expected formatting.
- Never promise perfect fidelity for unsupported import constructs. Report meaningful limitations without silently deleting content.
- Sanitize imported/generated markup and validate attachments. Treat document content as untrusted input in rendering and export code.

## 9. Prepare monetization after the core works

The owner wants payments and a commercially sensible product. Billing comes after reliable editing, persistence, and export.

1. Research current competing writing products and distinguish potential audiences such as authors, freelance writers, editors, and content teams. Recommend one practical initial audience based on workflow value and willingness-to-pay hypotheses, with dated sources. Do not invent market-size estimates or present competitor pricing as proof of demand.
2. Propose simple plans using observed AI consumption, current provider costs, hosting, storage, payment fees, and sustainable margins. Define usage allowances clearly; avoid an uncapped promise that cannot be supported economically.
3. Keep plan definitions and limits configurable. Add server-side usage accounting and entitlement boundaries without making local development depend on payment credentials.
4. Preserve access to existing writing when a limit is reached or a subscription expires. Explain limits clearly and keep the upgrade flow optional and unobtrusive. Do not trap manuscripts behind a payment error.
5. Choose the payment provider from verified merchant eligibility, target markets, supported currencies, recurring-billing needs, and existing code. Paystack or Stripe can be candidates; do not assume either is already configured or available.
6. When implementing billing, use test mode first. Verify signed server-side events, amount/currency/customer/plan mapping, duplicate and out-of-order event handling, atomic entitlement updates, reconciliation, cancellations, and failed renewals. A browser success redirect alone must not grant access.
7. Document the chosen plan proposal, setup requirements, and remaining launch decisions. Missing provider credentials should block only live integration checks, not completion of the core application or deterministic billing tests. Live charging is outside this modernization task.

## 10. Verification and completion gates

Use the repository's established checks and add focused tests for the real risks. Do not substitute brittle implementation-mirroring tests for user-visible behavior.

| Area                             | Required evidence                                                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Local setup                      | Documented clean setup starts the app and PostgreSQL without the old Supabase project or a Gemini key.                                                                                            |
| Authentication and authorization | Supported login/session flows work; one user cannot read or change another user's documents, rules, assets, chats, revisions, or exports.                                                         |
| Persistence                      | Create, edit, save, reload, and restart preserve text, supported formatting, rules, and assets. Stale writes do not silently replace newer content.                                               |
| Targeted AI edits                | Only the intended occurrence changes, including when the same passage appears multiple times.                                                                                                     |
| Formatting                       | Mixed fonts/sizes, bold/italic runs, headings, links, lists, spacing, and supported tables remain correct for appropriate edits. Cross-block and mixed-style ambiguity follow the defined policy. |
| History                          | Accept, reject, undo, redo, and recovery behave correctly without losing surrounding text or formatting.                                                                                          |
| Concurrent interaction           | Typing, switching documents, cancelling, and accepting another edit while a response is pending cannot redirect or corrupt a proposal.                                                            |
| AI failure                       | Invalid output, truncation, refusal, timeout, bad credentials, rate limits, and quota errors leave the document recoverable and show clear states.                                                |
| Rules                            | Enabled rules affect requests, disabled rules do not, scope/precedence is deterministic, and ordinary exports contain no rule metadata.                                                           |
| Export                           | Exported content and formatting are inspected after AI edits; no prompts, chat content, hidden rule data, or internal configuration leak into the file.                                           |
| UI and performance               | Core writer journeys work on desktop and narrow screens; measured bottlenecks are improved and the editor remains usable during generation.                                                       |
| Billing, if implemented          | Test events and deterministic tests verify entitlement changes, replay safety, failed payments, and preservation of manuscript access.                                                            |

Use a small representative document suite covering repeated text, mixed inline styles, multiple paragraphs, supported structures, Unicode, empty selections, and long content. Test exact invariants such as unchanged attributes outside the edited range. Keep API quality evaluations separate from deterministic editor tests.

Before declaring completion, run the relevant build, type/lint checks, focused tests, and browser journeys. Inspect the final diff for secrets, accidental deletions, unrelated edits, and outdated setup instructions. If a check cannot run, state the blocker and the remaining verification clearly.

## Execution order and handoff

1. Audit and reproduce the existing behavior; capture a representative formatting fixture.
2. Restore local backend/auth/persistence with Docker PostgreSQL and migrations.
3. Prove one complete workflow: open document, select passage, request OpenAI edit, preview, accept, undo/redo, save, reload, and export without corruption.
4. Extend that reliable path to existing writing actions, rules, and document workflows.
5. Improve UI and measured performance; verify regression coverage and export boundaries.
6. Complete the monetization proposal and appropriate usage/billing groundwork after the core gates pass.

Keep progress notes short and update the implementation checklist as work lands. If a session ends, leave enough information to resume without repeating the audit.

The final handoff should state what existed, what changed, the relevant files, exact run/setup commands, required environment variable names without values, checks that passed, measured improvements, and any specific remaining blockers. Preserve the central promise throughout: writers can trust Unix to edit their words without casually damaging their documents.

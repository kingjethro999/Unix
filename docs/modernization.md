# Unix modernization audit

Last updated: 2026-09-16.

## Verified baseline

- The product used Next.js 16 and React 19 with a handwritten external workspace store.
- The visible editor was a controlled textarea even though Tiptap was installed. Manuscripts were effectively plain strings, so focused replacements could not preserve editor-native marks or structure.
- The old assistant could replace the first matching string or return a whole file. Requests were not bound to the selected document revision, which made repeated passages, tab switches, and concurrent typing unsafe.
- Authentication, persistence, sharing, wiki data, analysis results, realtime events, and presence depended on an inaccessible hosted project. The landing page rendered, but authenticated workflows did not.
- Writing rules were stored in a manuscript page named `.unixrc`, so a normal bulk export could include internal product data.
- PDF and DOCX existed with limited conversion. EPUB was advertised despite throwing at runtime.
- A cold development request to `/` took 10.423 seconds including compilation. A warm request took about 0.78 seconds. The textarea also split lines and serialized the whole document on every keystroke.
- Repository history is damaged because one object under `.git/objects` is empty. `git status` and HEAD-based diffs cannot be trusted; no history repair or reset was attempted.

## Implemented

- [x] Pinned PostgreSQL in Docker with loopback binding, health check, persistent volume, numbered idempotent migrations, backup, restore, and safe-stop documentation.
- [x] Added owned workspaces, secure sessions, memberships, versioned structured documents, revisions, writing rules, chat, usage, private assets, and explicit read-only shares.
- [x] Replaced the textarea with Tiptap and made versioned Tiptap JSON authoritative.
- [x] Added revision-aware debounced saving, local draft recovery, visible failures, and stale-write conflict handling.
- [x] Bound focused proposals to document ID, base revision, native positions, exact source text, and context anchors; accept uses an editor transaction and remains undoable.
- [x] Added deterministic mixed-mark validation, repeated-passage and Unicode regression tests, and non-mutating error paths.
- [x] Moved rules into separate workspace/document records, added CRUD and enable controls, included enabled rules in requests, and excluded them from exports by construction.
- [x] Added capability-labelled writing modes with centralized server configuration and schema-constrained Responses output.
- [x] Added explicit image generation requests, authenticated image storage, document insertion, and image upload by picker, paste, or drop.
- [x] Replaced dead authentication, document, sharing, and asset paths with PostgreSQL-backed server actions and endpoints.
- [x] Removed obsolete hosted-database clients, packages, runtime helpers, migration residue, and dead wiki/analysis controls.
- [x] Updated landing content to describe functioning behavior rather than provider names or unfinished controls.

## Verification boundary

Deterministic editing, persistence, authorization, export boundaries, image upload, and browser journeys can run locally. Live writing and image-generation smoke tests require valid `AI_API_KEY`, `AI_BASE_URL`, and account access to the configured server-side models. A missing key disables only assistant actions.

Commercial billing remains intentionally out of runtime scope until measured usage and a merchant account can support safe entitlements. Manuscript access must remain available when future usage limits are reached.

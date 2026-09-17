# Unix

Unix is a structured writing workspace with a document explorer, rich editor, reusable writing rules, contextual assistance, reviewable edits, revision-aware saving, private image assets, and manuscript exports.

## Local setup

Requirements: Node.js 22 or newer, vlt, Docker, and Docker Compose.

1. Copy `.env.example` to `.env` and replace the local database password if the machine is shared.
2. Start the database: `docker-compose up -d postgres`
3. Apply later migrations to an existing database volume:
   `for file in db/migrations/*.sql; do docker exec -i unix_postgres_1 psql -U unix -d unix < "$file"; done`
4. Install packages: `vlt install`
5. Start Unix: `vlt run dev`
6. Open `http://localhost:3000`, create an account, and create a workspace.

## Desktop application

Unix also ships as an Electron desktop application. The desktop app opens a focused Unix welcome screen and sign-in flow; the public landing page remains a web-only route.

```bash
vlt run desktop:dev       # opens the desktop app against the local development server
vlt run desktop:build:linux   # creates Linux AppImage and Debian packages in release/
vlt run desktop:build:windows # creates the Windows installer in release/
vlt run desktop:build:mac     # creates macOS disk image and archive in release/
```

For a hosted Unix installation, package with its public app URL: `UNIX_DESKTOP_URL=https://your-unix.example vlt run desktop:build`. The shell opens that deployment directly. Without this value, the desktop package starts the bundled Unix server for a self-hosted PostgreSQL setup. Set `UNIX_DOWNLOAD_WINDOWS_URL`, `UNIX_DOWNLOAD_MAC_URL`, and `UNIX_DOWNLOAD_LINUX_URL` on the hosted web application to publish the matching installer links on `/download`.

Open documents are cached on the device as structured Tiptap data. If connectivity drops while a document is open, edits remain local, the status bar says `Saved locally · offline`, and Unix retries the revision-aware save after reconnection. Writing assistance requires a connection. The first opening of an uncached workspace still requires the local server and database to be available.

The database binds to `127.0.0.1:5433` by default. Set `POSTGRES_PORT` and update `DATABASE_URL` together to use another port. Numbered migrations run automatically only when Docker initializes a new `unix_postgres_data` volume; applying every migration again is safe because each uses `IF NOT EXISTS`.

## Server environment

- `DATABASE_URL`: PostgreSQL connection string.
- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_PORT`: local container settings.
- `AI_API_KEY`, `AI_BASE_URL`: server-only credentials for a Responses-compatible endpoint.
- `AI_FAST_MODEL`, `AI_REASONING_MODEL`, `AI_RESEARCH_MODEL`, `AI_LOGIC_MODEL`: optional server-side mode overrides.
- `AI_IMAGE_MODEL`: optional image generation override.
- `AI_TIMEOUT_MS`, `AI_IMAGE_TIMEOUT_MS`, `AI_MAX_OUTPUT_TOKENS`: request limits.
- `UPLOAD_DIR`: persistent asset directory; defaults to `data/uploads`.

If assistance is not configured, writing, saving, rules, assets, sharing, and export remain available. No AI or database credential is sent to browser code.

## Document integrity

Tiptap JSON is authoritative and derived plain text is stored separately for search and bounded context. Saves include the expected revision, and successful writes preserve the prior document in `document_revisions`.

An edit proposal records the document, revision, native range, expected text, and neighboring anchors. Unix revalidates these before applying an editor transaction. Proposals do not change the manuscript until accepted. Uniform formatting is inherited; substantial mixed-style rewrites are rejected as ambiguous.

Writing rules are separate records. Workspace rules apply first, document rules refine them, and the explicit request supplies the request-level preference. Export receives an allowlisted document shape, so rules, prompts, chat, internal IDs, and configuration are excluded.

Uploaded and generated images are stored outside the public directory and served only after an access check. For production, set `UPLOAD_DIR` to durable storage or replace the local adapter with authenticated object storage.

## Database operations

- Start: `docker-compose up -d postgres`
- Status: `docker-compose ps`
- Logs: `docker-compose logs postgres`
- Safe stop: `docker-compose stop postgres`
- Backup: `docker exec unix_postgres_1 pg_dump -U unix -d unix -Fc > unix.backup`
- Restore into the target database: `docker exec -i unix_postgres_1 pg_restore -U unix -d unix --clean --if-exists < unix.backup`

The named volume preserves data across restarts. `docker-compose down -v` destroys that data and is not part of ordinary setup.

## Verification

- Type check: `vlt exec tsc -- --noEmit`
- Integrity tests: `vlt run test`
- Browser tests: `vlt run test:e2e`
- Production build: `vlt run build`
- Lint: `vlt run lint`

See [docs/modernization.md](docs/modernization.md) for verified scope, measurements, and remaining boundaries.

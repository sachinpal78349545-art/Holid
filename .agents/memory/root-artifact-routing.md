---
name: Root artifact routing
description: Preview behavior when multiple imported web artifacts share the root path
---

When importing an existing web app, avoid leaving multiple independent web artifacts registered on `/` unless they are intentionally kept in sync.

**Why:** The shared preview proxy can select a stopped or scaffolded root service, producing a blank page or 502 even when the intended app's Vite server is healthy.

**How to apply:** Prefer one root artifact for the app. If an import creates a second root artifact, stop the duplicate or make both serve the same source before verifying the preview.
---
name: copilot-instructions
description: >
  Repository-wide guidance for the Quanta AI Trading Terminal. Use when the user asks about
  setup, build, run, deploy, tests, or repository conventions.
applyTo: "src/**,backend/**,docs/**,package.json,README.md"
---

# Quanta Workspace Instructions

- Purpose: Provide short, authoritative answers about how to run, build, test, and deploy this repo.

- Quick-start (dev)
  - Frontend:
    - Install deps: `npm install`
    - Dev (Next): `npm run dev`
    - Legacy Vite dev: `npm run vite:dev`
  - Backend:
    - Install deps: `pip install -r backend/requirements.txt` or see `backend/requirements.txt`
    - Start server: `uvicorn server:app --reload --port 8000` (runs the API proxy)
  - Environment:
    - Create a `.env` in repo root with `GEMINI_API_KEY=your_key_here`

- Build & Deploy
  - Build frontend: `npm run build`
  - Start prod: `npm run start`
  - Deploy hosting (if configured): `firebase deploy --only hosting` (project-specific)

- Tests & Linters
  - JS/React lint/format: `npx eslint .`, `npx prettier --check .` / `npx prettier --write .`
  - Python lint: `flake8 .`
  - Tests: frontend tests (Jest), backend (pytest)

- Key docs (link, don't embed)
  - Repository overview: [README.md](../README.md)
  - Quick news reference: [docs/QUICK_REFERENCE.md](../docs/QUICK_REFERENCE.md)
  - Technical docs: [docs/ARCHITECTURE_NEWS.md](../docs/ARCHITECTURE_NEWS.md)
  - Other docs: the `docs/` directory contains feature and deployment guides — prefer linking to those files.

- Agent behavior / prompt guidance
  - When answering user questions about stocks, prefer the repo's `useChat` system prompt patterns: start with a short VERDICT (BUY/HOLD/SELL), always personalize to the user's portfolio, and include explicit numbers when recommending shares.
  - If a user asks for "how to run" or "how to deploy", reply with the exact commands above and reference [README.md](../README.md).
  - Never suggest exposing `GEMINI_API_KEY` in frontend envs; recommend server-side storage.

- Conventions & anti-patterns
  - Do not add heavy files to the instruction — link to docs using "link, don't embed".
  - Avoid global `applyTo: "**"` (too noisy). This file uses targeted globs.
  - Be careful with YAML frontmatter (quote values with colons and avoid tabs).

- Example prompts
  - "How do I run the app locally?"
  - "What commands build and deploy the frontend?"
  - "Where is the backend server and how do I start it?"
  - "Summarize the docs about stock-specific news."

- Next steps / suggested customizations
  - Add a short `.github/prompts/run.prompt.md` with common run/build prompts for contributors.
  - Create an agent for release/deploy with hooks that run `npm run build` and `firebase deploy`.

# TL;DR-ify

Lightweight tool to summarize text, files, and links. Live at [dvy9.github.io/tldrify](https://dvy9.github.io/tldrify).

## Features

- Summarize text, files, or URLs
- Adjustable style & length (100-500 words)
- Models: Gemini 2.5 Flash, Gemini 2.0 Flash, GPT-5 Nano
- Local storage via IndexedDB
- File uploads up to 5 MiB (PDF, Word, Excel/CSV, PPT, EPUB, images, TXT/MD, HTML/XML/JSON)
- Abuse protection via Turnstile

## Tech Stack

### Frontend - Vite + React (TS), Tailwind v4 (Origin UI)

- Hash-based routing (`#/new`, `#/s/:id`)
- IndexedDB (`idb`) for summaries, settings, metadata

### Backend - FastAPI

- Gemini API (OpenAI-compatible SDK)
- `markitdown` for file to markdown conversion
- OpenAPI docs at `/docs`

### Deployments

- Frontend: GitHub Pages
- Backend: OCI Container Instance

## Dev Setup

### Requirements

- Node.js 20+ with `corepack` enabled
- Python 3.12+
- Gemini API Key, Jina API Key, Turnstile Site & Secret Keys

### Frontend

```sh
cd frontend
cp .env.example .env
pnpm install
pnpm dev
```

### Backend

```sh
cd backend
cp .env.example .env
uv sync
uv run --env-file=.env uvicorn main:app --reload
```

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend docs: [http://localhost:8000/docs](http://localhost:8000/docs)

## API

### POST `/summarize`

`multipart/form-data` with fields:

- `message` (string, text or URL)
- `settings` (JSON: `{ model, writingStyle, mode, maxWords }`)
- `file` (optional, ≤ 5 MiB)

#### Response

```json
{ "title": "string", "answer": "string" }
```

## License

Proprietary / Unlicensed. Contact author for reuse.

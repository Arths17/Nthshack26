Deploying the FastAPI backend (GEMINI_API_KEY handling)
-----------------------------------------------------

Local development

- Create a `.env.local` file in the repo root (this file is gitignored):

  GEMINI_API_KEY=your_real_gemini_key_here
  VITE_API_URL=http://localhost:8000

- Run the backend locally:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend.py/requirements.txt
uvicorn backend.py.server:app --reload --port 8000
```

Vercel

- Use a Vercel Serverless Function (convert the FastAPI app or create a small Node/Python server). In the Vercel project settings → Environment Variables, add `GEMINI_API_KEY` with your key and set appropriate scopes (Preview, Production).

Render / Heroku / Fly / Cloud Run

- Add `GEMINI_API_KEY` in the service's environment variables section. Do NOT commit the key.

Google Cloud (Cloud Run / Secret Manager)

- Recommended: store the key in Secret Manager and grant the Cloud Run service account access. Or set as Cloud Run env var.

Important

- Rotate the key immediately if it was shared in public chat.
- Never place `GEMINI_API_KEY` in frontend env (no `VITE_` prefix). The backend reads `GEMINI_API_KEY` directly from process env.

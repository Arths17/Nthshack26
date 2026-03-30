Vercel deployment checklist
--------------------------

1) Required environment variables (Project Settings → Environment Variables):
   - `GEMINI_API_KEY` — your Gemini / generative model key (server-only).
   - `ALLOWED_ORIGINS` — comma-separated frontend origins (e.g. `https://your-project.vercel.app`).
   - (Optional) `VERCEL_URL` is provided by Vercel automatically at runtime — no action needed.

2) Python serverless requirements
   - Vercel will install packages from `backend/requirements.txt` automatically for Python functions.
   - Ensure `yfinance`, `pandas`, and `google-generativeai` are present (they are listed already).

3) Build & routes
   - The FastAPI app is exposed via `api/index.py` and should be picked up by Vercel as the ASGI app.
   - Frontend requests use the same origin (`/api/stock/...`) and CORS is handled by the backend.

4) After setting env vars, redeploy
   - Deploy from Vercel dashboard or run `vercel --prod`.

5) Test the deployed API
   - Curl the deployed endpoint (replace `your-project.vercel.app`):
     ```bash
     curl -sS "https://your-project.vercel.app/api/stock/NVDA?timeframe=3M" | jq .
     ```

6) Troubleshooting
   - If you see CORS errors, confirm `ALLOWED_ORIGINS` includes `https://your-project.vercel.app` or rely on `VERCEL_URL` which is added automatically by the backend change.
   - If the endpoint returns 500, check Vercel Function logs for missing deps or `GEMINI_API_KEY` not set.

Security and Secrets Handling
=============================

1) Rotate any API key you pasted in public chat immediately. Treat any key shared in chat as compromised.

2) Never embed secrets in client-side code. The frontend runs in users' browsers — secrets must stay on a server.

3) Current setup
- The frontend calls `/api/*` endpoints. The FastAPI backend at `backend.py/server.py` reads `GEMINI_API_KEY` from environment variables and uses it to call the Gemini API. This keeps the key server-side.

4) Deployment recommendations
- If you deploy the backend to a host (Vercel Serverless, Render, Fly, Heroku, Google Cloud Run), add `GEMINI_API_KEY` in the host's environment settings (not in repo).
- If you deploy only a client to Firebase Hosting, host the backend separately and configure `VITE_API_URL` in Firebase Hosting rewrites or in the frontend environment variables.
- For Google Cloud, prefer Secret Manager or Cloud Run environment variables; for Firebase Functions use `firebase functions:config:set` or Secret Manager.

5) Local development
- Create a `.env.local` (ignored by git) with:

  GEMINI_API_KEY=your_real_key_here
  VITE_API_URL=http://localhost:8000

- Do NOT commit `.env.local` or copy real keys into `.env.example`.

6) If you accidentally committed a secret
- Rotate (revoke) the exposed key immediately and issue a new key.
- Remove the secret from the repository and add it to `.gitignore`. Use `git filter-repo` or `git filter-branch` to scrub history if necessary.

7) Access control and logs
- Ensure server logs do not print secrets. The backend uses `genai.configure(api_key=GEMINI_API_KEY)` and will not log the key; review any `print` or `logger` calls.

If you want, I can:
- Rotate the todo list to include backend deployment steps for your chosen provider.
- Add a small example `server/README.md` showing how to set `GEMINI_API_KEY` on Render/Vercel/Cloud Run.

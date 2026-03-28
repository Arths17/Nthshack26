# Supabase Integration Setup Guide

This guide walks you through completing the Supabase integration for the Quanta trading terminal.

## ✅ What's Already Done

1. **Supabase Client** — `src/api/supabase.js` configured with your project credentials
2. **Authentication Hooks** — Signup/login functions integrated
3. **Auth Context** — Global auth state management in `src/contexts/AuthContext.jsx`
4. **Portfolio Persistence** — `usePortfolioSupabase.js` for Supabase-backed portfolio management
5. **Alerts System** — `useAlertsSupabase.js` for price/portfolio alerts
6. **Database Schema** — `supabase_schema.sql` ready to be applied
7. **LoginPage Updated** — Now uses Supabase auth instead of localStorage

## 📋 Next Steps

### 1. Create Database Schema

Run the SQL in your Supabase SQL Editor:

1. Go to https://app.supabase.com → Your Project
2. Click **SQL Editor** in the sidebar
3. Click **New Query**
4. Copy and paste the entire contents of `supabase_schema.sql`
5. Click **Run**

This creates tables:
- `user_profiles` — User data and cash balance
- `portfolios` — Current stock positions per user
- `trades` — Trade history with timestamps
- `alerts` — Price and alert preferences

All tables have Row Level Security (RLS) enabled so users can only see their own data.

### 2. Enable Email Authentication

1. Go to **Authentication** → **Providers** in Supabase dashboard
2. Enable **Email** if not already enabled
3. Configure email settings under **Email Templates**

### 3. Update App.jsx to Use Supabase Portfolio Hook

Replace the current `usePortfolio` hook with `usePortfolioSupabase`:

```jsx
// In App.jsx, change:
import { usePortfolio } from "./hooks/usePortfolio";
// To:
import { usePortfolioSupabase } from "./hooks/usePortfolioSupabase";

// And use:
const { user, cash, pos, log, buy, sell, loading, error, isHydrated } = usePortfolioSupabase();
```

### 4. Wrap App with AuthProvider

In your `main.jsx` or app entry point:

```jsx
import { AuthProvider } from "./contexts/AuthContext";

ReactDOM.render(
  <AuthProvider>
    <App />
  </AuthProvider>,
  document.getElementById("root")
);
```

### 5. Update LoginPage Integration

The LoginPage now returns user ID. Make sure your App.jsx handles it:

```jsx
const [user, setUser] = useState(() => getSession());

function handleLogin(userData) {
  setUser(userData);
  localStorage.setItem("quanta:session", JSON.stringify(userData));
}
```

### 6. Test the Integration

1. Clear localStorage: Open DevTools → Application → Local Storage → Delete all Quanta entries
2. Start the app: `npm run dev`
3. Try signing up with a new account
4. Check Supabase **Authentication** → **Users** to see your new user
5. Buy/sell stocks and verify trades appear in `trades` table
6. Refresh the page — portfolio should persist from Supabase

## 🔄 Real-Time Features

The hooks include real-time subscriptions. As you trade, other connected users will see updates in real-time.

To disable realtime (for performance):
```jsx
// In usePortfolioSupabase.js, comment out:
// const subscription = supabase.from("portfolios").on("*", ...).subscribe();
```

## 🚨 Common Issues

### "Missing environment variables"
- Make sure `.env.local` has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Restart dev server after adding env vars

### "RLS policy violation"
- Check that Supabase RLS policies are enabled on all tables
- Run the schema SQL again to recreate policies

### "useAuth must be used within AuthProvider"
- Make sure your app is wrapped with `<AuthProvider>` in main.jsx

### Can't create account
- Check Supabase **Email Settings** under Authentication
- Some restrictions may apply if using free tier

## 📚 File Reference

| File | Purpose |
|------|---------|
| `src/api/supabase.js` | Supabase client initialization and auth functions |
| `src/contexts/AuthContext.jsx` | Global auth state with useAuth() hook |
| `src/hooks/usePortfolioSupabase.js` | Portfolio management with Supabase persistence |
| `src/hooks/useAlertsSupabase.js` | Price/portfolio alerts management |
| `supabase_schema.sql` | Database schema (run once in SQL Editor) |
| `src/pages/LoginPage.jsx` | Updated to use Supabase authentication |

## 🔐 Security Notes

- All tables have RLS enabled — users can only access their own data
- Supabase handles password hashing and secure authentication
- Anon key is safe to expose in the frontend (read the Supabase docs)
- Secret API keys stay server-side only

## 🚀 Next Improvements

After setup is complete, consider:

1. **Email verification** — Require email confirmation before account is active
2. **Forgot password** — Add password reset flow
3. **Risk metrics** — Calculate Sharpe ratio, max drawdown in database
4. **Webhook notifications** — Send email when alerts trigger
5. **Admin dashboard** — Monitor all users' activity (requires service role)

---

**Questions?** Check [Supabase docs](https://supabase.com/docs) or Supabase SQL editor for schema validation.

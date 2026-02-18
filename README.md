# Smart Bookmark App

A full-stack bookmark manager built with **Next.js 14 (App Router)**, **Supabase** (Auth, Database, Realtime), and **Tailwind CSS**. Deployed on Vercel.

## Features

- **Google OAuth only** — No email/password sign-up
- **Private bookmarks** — Each user can only see their own bookmarks (Row Level Security)
- **Real-time sync** — Bookmarks update instantly across open tabs without page refresh
- **Add & Delete** — Simple UI to add (URL + title) and delete bookmarks
- **Deployed on Vercel** — Live and accessible URL

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Auth | Supabase Auth (Google OAuth) |
| Database | Supabase PostgreSQL |
| Realtime | Supabase Realtime (postgres_changes) |
| Styling | Tailwind CSS |
| Deployment | Vercel |

---

## Local Setup Guide

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) account (free tier works)
- A [Vercel](https://vercel.com) account (free tier works)
- A Google Cloud project (for OAuth)

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/smart-bookmark-app.git
cd smart-bookmark-app
npm install
```

---

### Step 2: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Wait for the project to be ready.
3. Go to **Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

### Step 3: Set Up the Database

1. In your Supabase project, go to **SQL Editor**.
2. Paste and run the contents of `supabase-schema.sql` (included in this repo).

This will:
- Create the `bookmarks` table
- Enable Row Level Security with proper policies
- Enable Realtime for the table

---

### Step 4: Configure Google OAuth in Supabase

1. Go to your [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (or use an existing one).
3. Go to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client IDs**.
4. Set **Application type** to **Web application**.
5. Add **Authorized redirect URIs**:
   - `https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback`
6. Copy the **Client ID** and **Client Secret**.
7. In Supabase, go to **Authentication → Providers → Google**.
8. Enable Google and paste the Client ID and Client Secret.
9. Save.

---

### Step 5: Configure Environment Variables

Copy the example file:

```bash
cp .env.local.example .env.local
```

Fill in your values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

---

### Step 6: Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Note:** For Google OAuth to work locally, you may need to add `http://localhost:3000/auth/callback` as an authorized redirect URI in your Google OAuth credentials AND in Supabase under Authentication → URL Configuration → Redirect URLs.

---

### Step 7: Deploy to Vercel

1. Push your code to a public GitHub repository.
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import your repo.
3. In the **Environment Variables** section, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy.
5. Copy your Vercel deployment URL (e.g., `https://smart-bookmark-app.vercel.app`).
6. Add it to Supabase **Authentication → URL Configuration → Site URL**.
7. Add `https://your-vercel-url.vercel.app/auth/callback` to **Redirect URLs**.
8. Add the Vercel URL to your Google OAuth **Authorized redirect URIs** as well (the Supabase one already handles it, but good to verify).

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Login page (/)
│   ├── globals.css
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts        # OAuth callback handler
│   └── dashboard/
│       ├── layout.tsx          # Auth guard
│       └── page.tsx            # Main dashboard (server component)
├── components/
│   ├── LoginButton.tsx         # Google OAuth trigger
│   ├── LogoutButton.tsx        # Sign out
│   ├── BookmarkManager.tsx     # Real-time subscription + state
│   ├── AddBookmarkForm.tsx     # Add bookmark form
│   └── BookmarkCard.tsx        # Individual bookmark display
├── lib/
│   └── supabase/
│       ├── client.ts           # Browser client
│       ├── server.ts           # Server client (RSC/Route Handlers)
│       └── middleware.ts       # Session refresh + route protection
├── middleware.ts               # Next.js middleware
└── types/
    └── bookmark.ts             # TypeScript types
```

---

## How Real-Time Works

The `BookmarkManager` client component subscribes to Supabase Realtime using `postgres_changes`. It listens for `INSERT` and `DELETE` events filtered by `user_id`, so only relevant changes trigger state updates. This means if you open two browser tabs and add a bookmark in one, it instantly appears in the other — no polling or page refresh needed.

```typescript
supabase
  .channel("bookmarks-realtime")
  .on("postgres_changes", {
    event: "INSERT",
    schema: "public",
    table: "bookmarks",
    filter: `user_id=eq.${userId}`,
  }, (payload) => {
    setBookmarks((prev) => [payload.new as Bookmark, ...prev]);
  })
  .subscribe();
```

---

## Problems Encountered & Solutions

### 1. Cookie handling in Next.js App Router with Supabase
**Problem:** The standard Supabase client doesn't work in Server Components because it can't access cookies.  
**Solution:** Used `@supabase/ssr` which provides `createServerClient` and `createBrowserClient` with proper cookie adapters for both server and client contexts.

### 2. Real-time not working initially
**Problem:** Postgres changes weren't being broadcast.  
**Solution:** Had to explicitly add the `bookmarks` table to the `supabase_realtime` publication via SQL (`ALTER PUBLICATION supabase_realtime ADD TABLE public.bookmarks`).

### 3. OAuth redirect mismatch on local development
**Problem:** Google OAuth callback was failing locally.  
**Solution:** Added `http://localhost:3000/auth/callback` to both Supabase Redirect URLs and Google Cloud Console Authorized redirect URIs.

### 4. RLS blocking inserts
**Problem:** After enabling RLS, inserts failed even for the authenticated user.  
**Solution:** Created explicit `INSERT` policy with `WITH CHECK (auth.uid() = user_id)` in addition to the `SELECT` policy.

### 5. Session not persisting across page navigations
**Problem:** Users were getting logged out on navigation.  
**Solution:** Added Next.js middleware using `@supabase/ssr`'s `updateSession` to refresh the session cookie on every request.

---

## License

MIT

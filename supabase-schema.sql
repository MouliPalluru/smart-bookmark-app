-- ============================================================
-- Smart Bookmark App - Supabase Schema
-- Run this in your Supabase SQL Editor (supabase.com/dashboard)
-- ============================================================

-- 1. Create the bookmarks table
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Enable Row Level Security
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies: Users can only access their own bookmarks

-- Allow users to read their own bookmarks
CREATE POLICY "Users can view their own bookmarks"
  ON public.bookmarks
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own bookmarks
CREATE POLICY "Users can insert their own bookmarks"
  ON public.bookmarks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own bookmarks
CREATE POLICY "Users can delete their own bookmarks"
  ON public.bookmarks
  FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Create index for faster queries
CREATE INDEX IF NOT EXISTS bookmarks_user_id_idx ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS bookmarks_created_at_idx ON public.bookmarks(created_at DESC);

-- 5. Enable Realtime for the bookmarks table
-- (Do this in Supabase Dashboard: Database > Replication > supabase_realtime publication > Add table > bookmarks)
-- Or run:
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookmarks;

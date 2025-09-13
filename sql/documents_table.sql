-- Run this in Supabase SQL editor

-- 1) Documents table (per-user metadata)
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  path text not null,            -- storage path "userId/timestamp_filename.pdf"
  size_bytes bigint not null,
  created_at timestamp with time zone default now()
);

alter table public.documents enable row level security;

-- Allow users to read only their rows
create policy "documents_read_own"
on public.documents
for select
using (auth.uid() = user_id);

-- Allow users to insert for themselves
create policy "documents_insert_own"
on public.documents
for insert
with check (auth.uid() = user_id);

-- Wiki Entries Table
-- Run this in your Supabase SQL Editor

create table if not exists wiki_entries (
  id uuid primary key default gen_random_uuid(),
  folder_id uuid references folders(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  type text not null check (type in ('character', 'location', 'timeline', 'lore', 'item')),
  name text not null,
  description text default '',
  metadata jsonb default '{}',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table wiki_entries enable row level security;

-- RLS Policies
create policy "Users can view their own wiki entries"
  on wiki_entries for select
  using (auth.uid() = user_id);

create policy "Users can create their own wiki entries"
  on wiki_entries for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own wiki entries"
  on wiki_entries for update
  using (auth.uid() = user_id);

create policy "Users can delete their own wiki entries"
  on wiki_entries for delete
  using (auth.uid() = user_id);

-- Index for faster lookups
create index if not exists wiki_entries_folder_id_idx on wiki_entries(folder_id);
create index if not exists wiki_entries_user_id_idx on wiki_entries(user_id);
create index if not exists wiki_entries_type_idx on wiki_entries(type);

-- Analysis Results Table (for future AI Analysis features)
create table if not exists analysis_results (
  id uuid primary key default gen_random_uuid(),
  folder_id uuid references folders(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  type text not null check (type in ('plot_holes', 'character_voice', 'pacing')),
  results jsonb not null default '{}',
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table analysis_results enable row level security;

-- RLS Policies
create policy "Users can view their own analysis results"
  on analysis_results for select
  using (auth.uid() = user_id);

create policy "Users can create their own analysis results"
  on analysis_results for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own analysis results"
  on analysis_results for delete
  using (auth.uid() = user_id);

-- Index for faster lookups
create index if not exists analysis_results_folder_id_idx on analysis_results(folder_id);
create index if not exists analysis_results_user_id_idx on analysis_results(user_id);

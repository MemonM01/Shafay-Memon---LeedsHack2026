-- Create the event_messages table if not exists (matching user's provided schema)
create table if not exists public.event_messages (
  id bigserial primary key,
  event_id bigint not null, -- Using bigint to match events.id type
  profile_id uuid not null,
  content text not null,
  created_at timestamp with time zone default now(),
  edited_at timestamp with time zone null,

  constraint event_messages_event_id_fkey
    foreign key (event_id)
    references public.events (id)
    on delete cascade,

  constraint event_messages_profile_id_fkey
    foreign key (profile_id)
    references public.profiles (id)
    on delete cascade
);

-- RLS Policies
alter table public.event_messages enable row level security;

-- Anyone logged in can read messages for an event
do $$ begin
    create policy "Anyone can read event messages" on public.event_messages
    for select using (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;

-- Logged in users can send messages
do $$ begin
    create policy "Authenticated users can insert messages" on public.event_messages
    for insert with check (auth.uid() = profile_id);
exception when duplicate_object then null; end $$;

-- Users can delete their own messages
do $$ begin
    create policy "Users can delete their own messages" on public.event_messages
    for delete using (auth.uid() = profile_id);
exception when duplicate_object then null; end $$;

-- Realtime enrichment
alter publication supabase_realtime add table event_messages;

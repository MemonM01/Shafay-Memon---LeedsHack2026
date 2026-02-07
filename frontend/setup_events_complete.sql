-- 1. Create the event_attendees table
create table if not exists public.event_attendees (
    event_id bigint references public.events(id) on delete cascade,
    profile_id uuid references public.profiles(id) on delete cascade,
    joined_at timestamptz default now(),
    primary key (event_id, profile_id)
);

-- 2. Create the tags table
create table if not exists public.tags (
    name text primary key
);

-- 3. Create the event_tags join table
create table if not exists public.event_tags (
    event_id bigint references public.events(id) on delete cascade,
    tag_name text references public.tags(name) on delete cascade,
    primary key (event_id, tag_name)
);

-- Enable RLS
alter table public.event_attendees enable row level security;
alter table public.tags enable row level security;
alter table public.event_tags enable row level security;

-- Policies for event_attendees
do $$ begin
    create policy "Anyone can view attendees" on public.event_attendees for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
    create policy "Users can join events" on public.event_attendees for insert with check (auth.uid() = profile_id);
exception when duplicate_object then null; end $$;

do $$ begin
    create policy "Users can leave events" on public.event_attendees for delete using (auth.uid() = profile_id);
exception when duplicate_object then null; end $$;

-- Policies for tags
do $$ begin
    create policy "Anyone can view tags" on public.tags for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
    create policy "Users can insert tags" on public.tags for insert with check (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;

-- Policies for event_tags
do $$ begin
    create policy "Anyone can view event_tags" on public.event_tags for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
    create policy "Users can insert event_tags" on public.event_tags for insert with check (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;


-- 4. Unified function to fetch events with proximity, attendees, and tags
-- This function no longer depends on a 'tags' column on the 'events' table.
create or replace function public.get_events_with_interest(
  lat float,
  lng float,
  radius_meters float
)
returns table (
    id bigint,
    name text,
    description text,
    location text,
    latitude float,
    longitude float,
    event_time timestamptz,
    image_url text,
    owner_id uuid,
    tags text[],
    interest_count bigint,
    user_interested boolean
)
language sql
security definer
as $$
  select 
    e.id,
    e.name,
    e.description,
    e.location,
    e.latitude,
    e.longitude,
    e.timestamp as event_time,
    e.image_url,
    e.owner_id,
    -- Aggregate tags from the separate join table
    coalesce(
        (select array_agg(tag_name) from public.event_tags where event_id = e.id),
        '{}'
    ) as tags,
    -- Count attendees
    (select count(*) from public.event_attendees where event_id = e.id) as interest_count,
    -- Check user attendance
    exists(
        select 1 from public.event_attendees 
        where event_id = e.id and profile_id = auth.uid()
    ) as user_interested
  from public.events e
  where (
    6371000 * acos(
      least(1.0, greatest(-1.0, 
        cos(radians(lat)) * cos(radians(e.latitude)) * cos(radians(e.longitude) - radians(lng)) +
        sin(radians(lat)) * sin(radians(e.latitude))
      ))
    )
  ) <= radius_meters;
$$;

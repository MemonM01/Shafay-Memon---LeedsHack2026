-- Update profiles table if it exists
do $$ begin
    alter table public.profiles rename column avatar_url to profile_picture_url;
exception when undefined_column then null; end $$;

-- 1. Create the profile_tags table
create table if not exists public.profile_tags (
    profile_id uuid references public.profiles(id) on delete cascade,
    tag_name text,
    primary key (profile_id, tag_name)
);

-- Enable RLS
alter table public.profile_tags enable row level security;

-- Policies for profile_tags
do $$ begin
    create policy "Anyone can view profile tags" on public.profile_tags for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
    create policy "Users can manage their own profile tags" on public.profile_tags 
    for all using (auth.uid() = profile_id);
exception when duplicate_object then null; end $$;

-- Create user_settings table for storing dashboard preferences
create table if not exists public.user_settings (
    id uuid not null default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    settings jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    primary key (id),
    unique (user_id)
);

-- RLS Policies
alter table public.user_settings enable row level security;

create policy "Users can view their own settings"
    on public.user_settings for select
    using (auth.uid() = user_id);

create policy "Users can insert their own settings"
    on public.user_settings for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own settings"
    on public.user_settings for update
    using (auth.uid() = user_id);

-- Function to update updated_at
create trigger handle_updated_at_user_settings
    before update on public.user_settings
    for each row
    execute function public.handle_updated_at();

-- Add RPC to easily upsert settings
create or replace function upsert_user_setting(
    key_name text, 
    value_data jsonb
)
returns void as $$
declare
    current_settings jsonb;
begin
    -- Get current settings or default to empty object
    select settings into current_settings from public.user_settings where user_id = auth.uid();
    if current_settings is null then
        current_settings := '{}'::jsonb;
    end if;

    -- Update or insert
    insert into public.user_settings (user_id, settings)
    values (auth.uid(), jsonb_set(current_settings, array[key_name], value_data))
    on conflict (user_id) 
    do update set 
        settings = jsonb_set(user_settings.settings, array[key_name], value_data),
        updated_at = now();
end;
$$ language plpgsql security definer;

-- Create table for storing smart notification rules
create table if not exists public.notification_rules (
    id uuid not null default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    
    -- Target: What are we watching?
    target_type text not null check (target_type in ('column', 'row')), 
    target_id text not null, -- ID of the column (e.g. 'vencimento') or the specific row (service_id)
    
    -- Trigger: When do we alert?
    trigger_type text not null check (trigger_type in ('date', 'status')),
    trigger_config jsonb not null default '{}'::jsonb, 
    -- Date Example: { "offset": -7, "time": "09:00" } (7 days before)
    -- Status Example: { "from": "any", "to": "Concluído" }
    
    -- Config
    channels text[] not null default array['app'], -- ['app', 'email', 'whatsapp']
    active boolean not null default true,
    last_triggered_at timestamp with time zone,
    
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),

    primary key (id)
);

-- Enable RLS
alter table public.notification_rules enable row level security;

-- Policies
create policy "Users can manage their own rules"
    on public.notification_rules
    for all
    to authenticated
    using (user_id = auth.uid());

-- Indexes for performance (Workers will query active rules often)
create index if not exists idx_notification_rules_active on public.notification_rules(active) where active = true;
create index if not exists idx_notification_rules_trigger on public.notification_rules(trigger_type, target_type);

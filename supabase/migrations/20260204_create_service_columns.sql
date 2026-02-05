-- Create service_columns table for dynamic column definitions
create table if not exists public.service_columns (
    id uuid default gen_random_uuid() primary key,
    service_id uuid references public.services(id) on delete cascade not null,
    name text not null,
    type text not null check (type in ('text', 'date', 'currency', 'number')),
    "order" integer not null default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create index for faster lookups
create index if not exists service_columns_service_id_idx on public.service_columns(service_id);

-- Enable RLS
alter table public.service_columns enable row level security;

-- Simplified Policies: Only service owners can manage columns
-- This ensures import works without complex permission checks
create policy "Users can view columns for their services"
    on public.service_columns for select
    using (
        exists (
            select 1 from public.services
            where services.id = service_columns.service_id
            and services.owner_id = auth.uid()
        )
    );

create policy "Service owners can insert columns"
    on public.service_columns for insert
    with check (
        exists (
            select 1 from public.services
            where services.id = service_columns.service_id
            and services.owner_id = auth.uid()
        )
    );

create policy "Service owners can update columns"
    on public.service_columns for update
    using (
        exists (
            select 1 from public.services
            where services.id = service_columns.service_id
            and services.owner_id = auth.uid()
        )
    );

create policy "Service owners can delete columns"
    on public.service_columns for delete
    using (
        exists (
            select 1 from public.services
            where services.id = service_columns.service_id
            and services.owner_id = auth.uid()
        )
    );

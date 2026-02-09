-- Create table_blocks for multi-table support within a single service
-- This allows a service to display multiple tables with their own titles and columns

create table if not exists public.table_blocks (
    id uuid default gen_random_uuid() primary key,
    service_id uuid references public.services(id) on delete cascade not null,
    title text not null default '',
    "order" integer not null default 0,
    columns jsonb not null default '[]'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add table_block_id to items table to associate items with specific table blocks
alter table public.items 
add column if not exists table_block_id uuid references public.table_blocks(id) on delete cascade;

-- Create indexes for performance
create index if not exists table_blocks_service_id_idx on public.table_blocks(service_id);
create index if not exists items_table_block_id_idx on public.items(table_block_id);

-- Enable Row Level Security
alter table public.table_blocks enable row level security;

-- RLS Policies for table_blocks (mirror service_columns policies)
create policy "Users can view table blocks for their services"
    on public.table_blocks for select
    using (
        exists (
            select 1 from public.services
            where services.id = table_blocks.service_id
            and services.owner_id = auth.uid()
        )
    );

create policy "Service owners can insert table blocks"
    on public.table_blocks for insert
    with check (
        exists (
            select 1 from public.services
            where services.id = table_blocks.service_id
            and services.owner_id = auth.uid()
        )
    );

create policy "Service owners can update table blocks"
    on public.table_blocks for update
    using (
        exists (
            select 1 from public.services
            where services.id = table_blocks.service_id
            and services.owner_id = auth.uid()
        )
    );

create policy "Service owners can delete table blocks"
    on public.table_blocks for delete
    using (
        exists (
            select 1 from public.services
            where services.id = table_blocks.service_id
            and services.owner_id = auth.uid()
        )
    );

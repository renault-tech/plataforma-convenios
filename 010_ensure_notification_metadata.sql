-- Add metadata column to notifications if it doesn't exist
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'notifications' and column_name = 'metadata') then
    alter table public.notifications add column metadata jsonb default '{}'::jsonb;
  end if;
end $$;

-- Add row_index column if it doesn't exist
do $$ 
begin 
    if not exists (select 1 from information_schema.columns where table_name = 'items' and column_name = 'row_index') then 
        alter table items add column row_index integer; 
    end if; 
end $$;

-- Create index if it doesn't exist
create index if not exists idx_items_row_index on items(row_index);

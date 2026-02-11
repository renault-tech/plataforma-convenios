alter table items
add column row_index integer;

create index idx_items_row_index on items(row_index);

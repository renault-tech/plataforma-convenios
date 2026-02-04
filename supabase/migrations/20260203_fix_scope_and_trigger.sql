-- Add service_id to notification_rules
alter table notification_rules 
add column if not exists service_id uuid references public.services(id) on delete cascade;

-- Update RLS Policy to allow based on service_id access? 
-- Current policy is "Users can manage their own rules" (user_id = auth.uid()). This is still valid.
-- User creates rule -> user_id is set. Service_id is just context.

-- Update the Trigger Function to use service_id context
create or replace function handle_status_change_notification()
returns trigger
security definer
as $$
declare
    rule record;
    item_service_id uuid;
begin
    -- Only proceed if status changed
    -- New Data Structure: 'items' table has 'data' jsonb column. Status is likely inside 'data'->>'status' or top level?
    -- CHECK: The previous trigger assumed 'services' table. But 'createItemAction' writes to 'items'.
    -- The user code shows `items` table.
    -- Wait, my previous trigger was `on services`. Invalid!
    -- FIX: The trigger must be on `items` table (as per actions/items.ts).
    -- AND the column `status` might be inside `data` JSONB or a real column?
    -- checking itemsTable: `col.type === "status"`. 
    -- Typically creates `data->status`.
    -- I need to verify if `items` has a `status` column or if it's in `data`.
    -- Assuming `data->>'status'` for now based on generic structure, OR `status` column if promoted.
    -- Let's assume generic `data` update.
    
    -- Getting Service ID from the item
    item_service_id := NEW.service_id;

    -- If there is a status change (check data->status or status column)
    -- Let's check both possibilities or assume 'data'->>'status' if dynamic.
    -- If the previous trigger was 'on services' and worked (or didn't error), likely the USER has 'services' as the table?
    -- BUT actions/items.ts writes to 'items'.
    -- CONTRADICTION: user said "lines expanded". ItemsTable uses `data`.
    -- `DistributionChartWidget` uses `services`.
    -- `ItemsTable` props: `data`.
    -- `useAdminDashboard` uses `services` table.
    -- Maybe `services` ARE the "Spreadsheet" AND `items` ARE the rows? Yes.
    -- "Planilha" = Service. "Item" = Row in Items table.
    -- So Trigger must be on `items` table.

    -- Comparing status change in JSONB data
    if (OLD.data->>'status') = (NEW.data->>'status') then
        return NEW;
    end if;

    -- Loop through active status rules
    for rule in 
        select * from notification_rules 
        where active = true 
        and trigger_type = 'status'
        and service_id = item_service_id -- MUST MATCH SERVICE
        and (
            (target_type = 'column' and target_id = 'status') -- Assuming column name is 'status'
            or 
            (target_type = 'row' and target_id = NEW.id::text)
        )
        and (
            (trigger_config->>'to') is null 
            or (trigger_config->>'to') = '' 
            or (trigger_config->>'to') = (NEW.data->>'status')
        )
    loop
        -- Insert Notification
        insert into notifications (
            user_id,
            type,
            title,
            message,
            link,
            read
        ) values (
            rule.user_id,
            'alert',
            'Mudança de Status',
            format('O item "%s" mudou para %s', coalesce(NEW.data->>'objeto', NEW.id::text), NEW.data->>'status'),
            format('/services/%s?highlight=%s', item_service_id, NEW.id), -- Link to Service + Highlight Item
            false
        );
        
        update notification_rules set last_triggered_at = now() where id = rule.id;
    end loop;

    return NEW;
end;
$$ language plpgsql;

-- Re-create Trigger on ITEMS table (not services)
drop trigger if exists on_service_status_change on services; -- Remove wrong one
drop trigger if exists on_item_status_change on items;

create trigger on_item_status_change
    after update on items
    for each row
    execute function handle_status_change_notification();

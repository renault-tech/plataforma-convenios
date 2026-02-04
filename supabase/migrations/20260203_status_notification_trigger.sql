-- Function to handle status changes
create or replace function handle_status_change_notification()
returns trigger
security definer
as $$
declare
    rule record;
begin
    -- Only proceed if status changed
    if OLD.status = NEW.status then
        return NEW;
    end if;

    -- Loop through active status rules
    -- We look for rules that match:
    -- 1. trigger_type = 'status'
    -- 2. target_type = 'column' OR (target_type = 'row' AND target_id = NEW.id)
    -- 3. trigger_config->>'to' matches NEW.status OR trigger_config->>'to' is null/empty (any change)
    
    for rule in 
        select * from notification_rules 
        where active = true 
        and trigger_type = 'status'
        and (
            (target_type = 'column') -- Assume column rules apply to all services for now
            or 
            (target_type = 'row' and target_id = NEW.id::text)
        )
        and (
            (trigger_config->>'to') is null 
            or (trigger_config->>'to') = '' 
            or (trigger_config->>'to') = NEW.status
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
            format('O item "%s" mudou para %s', coalesce(NEW.objeto, NEW.id::text), NEW.status),
            format('/services/%s', NEW.id),
            false
        );
        
        -- Update last_triggered_at
        update notification_rules set last_triggered_at = now() where id = rule.id;
    end loop;

    return NEW;
end;
$$ language plpgsql;

-- Trigger
drop trigger if exists on_service_status_change on services;
create trigger on_service_status_change
    after update on services
    for each row
    execute function handle_status_change_notification();


select 
    c.id, c.name, c.type, c.created_at,
    (select count(*) from chat_participants p where p.conversation_id = c.id) as participant_count,
    (select count(*) from chat_messages m where m.conversation_id = c.id) as message_count
from chat_conversations c
where 
    c.name ilike '%chat%' 
    OR c.type = 'global'
order by c.created_at desc;

-- Analyze performance of the chat access function
-- We check how costly it is to filter conversations by this function

EXPLAIN ANALYZE
SELECT count(*)
FROM chat_conversations c
WHERE c.type = 'service'
AND public.can_access_service_chat(c.context_id);

-- Also check underlying permissions query
EXPLAIN ANALYZE
SELECT 1 
FROM public.services s
WHERE s.owner_id = '00000000-0000-0000-0000-000000000000' -- Dummy UUID, will be replaced by auth.uid() in real usage
OR exists (
    SELECT 1 FROM public.service_permissions sp
    WHERE sp.service_id = s.id 
    AND sp.grantee_id = '00000000-0000-0000-0000-000000000000'
);

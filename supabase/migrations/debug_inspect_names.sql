
DO $$
DECLARE
    v_service_id uuid;
    r RECORD;
BEGIN
    SELECT id INTO v_service_id FROM services WHERE name = 'Planejamento 2026';
    
    FOR r IN SELECT name FROM service_columns WHERE service_id = v_service_id LOOP
        RAISE NOTICE 'Column: %', r.name;
    END LOOP;
END $$;

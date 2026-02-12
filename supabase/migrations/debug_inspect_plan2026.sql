
DO $$
DECLARE
    v_service_id uuid;
    v_columns_config jsonb;
BEGIN
    -- Get service ID
    SELECT id, columns_config INTO v_service_id, v_columns_config
    FROM services
    WHERE name = 'Planejamento 2026';

    RAISE NOTICE 'Service ID: %', v_service_id;
    RAISE NOTICE 'Columns Config: %', v_columns_config;

    -- Check service_columns table
    FOR v_columns_config IN 
        SELECT to_jsonb(sc) FROM service_columns sc WHERE service_id = v_service_id
    LOOP
        RAISE NOTICE 'Service Column: %', v_columns_config;
    END LOOP;
END $$;

-- Rename 'valor' column to 'responsavel' for service 'Planejamento 2026'

DO $$
DECLARE
    v_service_id uuid;
BEGIN
    -- Get service ID
    SELECT id INTO v_service_id
    FROM services
    WHERE name = 'Planejamento 2026';

    IF v_service_id IS NOT NULL THEN
        -- Update service_columns
        UPDATE service_columns
        SET name = 'responsavel'
        WHERE service_id = v_service_id AND name = 'valor';
        
        -- Also update in columns_config jsonb if present (legacy or hybrid)
        -- This logic is tricky with jsonb arrays, but let's try a simple replace if it exists
        -- UPDATE services
        -- SET columns_config = (
        --     SELECT jsonb_agg(
        --         CASE 
        --             WHEN elem->>'name' = 'valor' OR elem->>'id' = 'valor' THEN 
        --                 elem || '{"name": "responsavel", "label": "responsavel"}'::jsonb
        --             ELSE elem 
        --         END
        --     )
        --     FROM jsonb_array_elements(columns_config) elem
        -- )
        -- WHERE id = v_service_id;
        
        RAISE NOTICE 'Updated column for service %', v_service_id;
    ELSE
        RAISE NOTICE 'Service not found';
    END IF;
END $$;

-- Format headers for 'Planejamento 2026': Title Case + Rename 'valor' + Sync columns_config
-- VERSION 2: Case-Insensitive Matching

DO $$
DECLARE
    v_service_id uuid;
    v_config jsonb;
    v_new_config jsonb := '[]'::jsonb;
    v_col jsonb;
    v_name text;
    v_new_name text;
    v_label text;
BEGIN
    SELECT id, columns_config INTO v_service_id, v_config FROM services WHERE name = 'Planejamento 2026';

    IF v_service_id IS NOT NULL THEN
        RAISE NOTICE 'Updating service %', v_service_id;
        
        -- 1. Specific Rename in service_columns table: 'valor' -> 'Responsável'
        -- Use ILIKE to match 'Valor' or 'valor'
        UPDATE service_columns
        SET name = 'Responsável'
        WHERE service_id = v_service_id AND name ILIKE 'valor';

        -- 2. General Formatting for all other columns in table
        UPDATE service_columns
        SET name = initcap(replace(name, '_', ' '))
        WHERE service_id = v_service_id
          AND name != 'Responsável'
          AND name != 'row_index';
        
        -- 2b. Specific touch-ups in service_columns
        UPDATE service_columns SET name = 'Situação' WHERE service_id = v_service_id AND unaccent(name) ILIKE 'Situacao';
        UPDATE service_columns SET name = 'Secretaria Resp.' WHERE service_id = v_service_id AND unaccent(name) ILIKE 'Secretaria Resp%';
        UPDATE service_columns SET name = 'Resumo Situação' WHERE service_id = v_service_id AND unaccent(name) ILIKE 'Resumo Situacao%';
        UPDATE service_columns SET name = 'Observação' WHERE service_id = v_service_id AND (name ILIKE 'Obs' OR name ILIKE 'Observacao');

        -- 3. SPECIFIC FIX: Update columns_config JSON to match names
        IF v_config IS NOT NULL AND jsonb_array_length(v_config) > 0 THEN
            FOR v_col IN SELECT * FROM jsonb_array_elements(v_config)
            LOOP
                v_name := v_col->>'name';
                v_new_name := v_name;

                -- Rename 'valor' -> 'Responsável' (Case Insensitive)
                IF v_name ILIKE 'valor' OR (v_col->>'id') ILIKE 'valor' THEN
                    v_new_name := 'Responsável';
                ELSE
                    -- Format others: initcap + replace _ with space
                    v_new_name := initcap(replace(v_name, '_', ' '));
                END IF;

                -- Manual Fixes in JSON Name (Case Insensitive)
                IF unaccent(v_new_name) ILIKE 'Situacao' THEN v_new_name := 'Situação'; END IF;
                IF unaccent(v_new_name) ILIKE 'Secretaria Resp%' THEN v_new_name := 'Secretaria Resp.'; END IF;
                IF unaccent(v_new_name) ILIKE 'Resumo Situacao%' THEN v_new_name := 'Resumo Situação'; END IF;
                IF v_new_name ILIKE 'Obs' OR v_new_name ILIKE 'Observacao' THEN v_new_name := 'Observação'; END IF;

                -- Apply new name to object
                v_col := jsonb_set(v_col, '{name}', to_jsonb(v_new_name));
                
                -- Update label if present
                IF v_col ? 'label' THEN
                    v_col := jsonb_set(v_col, '{label}', to_jsonb(v_new_name));
                END IF;

                v_new_config := v_new_config || v_col;
            END LOOP;

            -- Update the service with new config
            UPDATE services
            SET columns_config = v_new_config
            WHERE id = v_service_id;
            
            RAISE NOTICE 'Updated columns_config JSON.';
        END IF;

        RAISE NOTICE 'Headers formatted for service %', v_service_id;
    END IF;
END $$;

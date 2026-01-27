-- Update 'Convênios' default columns if empty
UPDATE services
SET columns_config = '[
    {"id": "objeto", "type": "text", "label": "Objeto", "required": true},
    {"id": "processo_sei", "type": "text", "label": "Processo SEI", "required": false},
    {"id": "valor_total", "type": "currency", "label": "Valor Total", "required": false},
    {"id": "vencimento", "type": "date", "label": "Data de Vencimento", "required": false},
    {"id": "status", "type": "status", "label": "Status", "required": true}
]'::jsonb
WHERE slug = 'convenios' AND (columns_config IS NULL OR jsonb_array_length(columns_config) = 0);

-- Update 'Parcerias' default columns if empty
UPDATE services
SET columns_config = '[
    {"id": "entidade", "type": "text", "label": "Entidade Parceira", "required": true},
    {"id": "objeto", "type": "text", "label": "Objeto da Parceria", "required": true},
    {"id": "inicio_vigencia", "type": "date", "label": "Início Vigência", "required": false},
    {"id": "fim_vigencia", "type": "date", "label": "Fim Vigência", "required": false},
    {"id": "status", "type": "status", "label": "Status", "required": true}
]'::jsonb
WHERE slug = 'parcerias' AND (columns_config IS NULL OR jsonb_array_length(columns_config) = 0);

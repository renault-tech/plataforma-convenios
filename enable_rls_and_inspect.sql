-- 1. RE-ENABLE SECURITY (Como solicitado)
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- 2. DIAGNOSTICO DE DADOS (Vamos achar onde estão os dados)
-- Esta query mostra quantos itens existem para CADA serviço.
-- Assim saberemos se seus itens estão num serviço diferente ou se não existem.

SELECT 
    s.name as service_name, 
    s.id as service_id, 
    COUNT(i.id) as total_items
FROM services s
LEFT JOIN items i ON i.service_id = s.id
GROUP BY s.id, s.name
ORDER BY total_items DESC;

-- Se o resultado for 0 para o serviço "Contratos e aditivos", 
-- então realmente não há dados cadastrados para ele no banco.

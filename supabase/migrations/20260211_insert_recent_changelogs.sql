-- Insert Changelog entries for recent features

INSERT INTO public.changelog (title, description, category, created_at)
VALUES 
(
    'Lixeira e Proteção de Dados',
    'Adicionamos uma camada extra de segurança! Agora, ao excluir itens, eles vão para a "Lixeira" antes de serem removidos permanentemente. Além disso, criamos a função de "Safe Delete" que impede a exclusão acidental de dados críticos.',
    'improvement',
    NOW() - INTERVAL '1 day' -- Slightly backdated
),
(
    'Central de Feedback',
    'Sua opinião importa! Adicionamos um sistema de feedback dedicado. Encontrou um bug ou tem uma sugestão? Use o novo botão de feedback para nos contar diretamente pela plataforma.',
    'feature',
    NOW() - INTERVAL '2 days'
);

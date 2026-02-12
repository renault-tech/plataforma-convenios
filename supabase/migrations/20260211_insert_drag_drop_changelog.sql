-- Insert Changelog entry for Drag and Drop Columns
INSERT INTO public.changelog (title, description, category, created_at)
VALUES (
    'Reordenação de Colunas',
    'Agora você pode organizar sua tabela do jeito que preferir! Basta clicar no título da coluna e arrastar para a nova posição. A ordem é salva automaticamente.',
    'feature',
    NOW()
);

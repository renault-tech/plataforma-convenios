-- Insert Changelog entry for Alerts System
INSERT INTO public.changelog (title, description, category, created_at)
VALUES (
    'Nova Central de Alertas',
    'Gerencie todos os seus avisos em um só lugar! O novo botão "Meus Alertas" (ícone de relógio no topo) reúne notificações de vencimento e permite visualizar todas as regras configuradas em suas planilhas.',
    'feature',
    NOW()
);

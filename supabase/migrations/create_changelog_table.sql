-- Tabela para armazenar o changelog da plataforma
CREATE TABLE IF NOT EXISTS public.changelog (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    category TEXT DEFAULT 'feature' CHECK (category IN ('feature', 'bugfix', 'improvement', 'breaking'))
);

-- Enable RLS
ALTER TABLE public.changelog ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read changelog
CREATE POLICY "Anyone can read changelog"
    ON public.changelog
    FOR SELECT
    USING (true);

-- Policy: Only admins can insert/update/delete changelog
CREATE POLICY "Only admins can modify changelog"
    ON public.changelog
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_changelog_created_at ON public.changelog(created_at DESC);

-- Insert initial changelog entries
INSERT INTO public.changelog (title, description, category, created_at) VALUES
('Modo Escuro Implementado', 'Agora você pode alternar entre modo claro e escuro usando o botão deslizante ao lado do zoom.', 'feature', NOW()),
('Sidebar Recolhível', 'Clique no menu hamburguer no topo da sidebar para recolhê-la e ganhar mais espaço na tela.', 'feature', NOW()),
('Sistema de Changelog', 'Acompanhe todas as novidades e atualizações da plataforma através do menu "O que há de novo?".', 'feature', NOW());

-- 1. ADICIONAR COLUNAS NA TABELA PROFILES
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role text DEFAULT 'user' CHECK (role IN ('admin', 'user')),
ADD COLUMN IF NOT EXISTS is_super_admin boolean DEFAULT false;

-- 2. CRIAR TABELA DE LOGS DO SISTEMA
CREATE TABLE IF NOT EXISTS public.system_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    action text NOT NULL,
    details jsonb,
    created_at timestamptz DEFAULT now()
);

-- 3. HABILITAR RLS NA TABELA DE LOGS
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- 4. POLICIES PARA LOGS (Apenas Admins podem ver tudo, Users veem seus proprios logs se necessário - aqui deixarei restrito a adm)
CREATE POLICY "Admins can view all logs" 
ON public.system_logs FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND (profiles.role = 'admin' OR profiles.is_super_admin = true)
    )
);

CREATE POLICY "System can insert logs" 
ON public.system_logs FOR INSERT 
WITH CHECK (true); -- Qualquer um pode criar log (backend ou triggers)

-- 5. ATUALIZAR POLICIES DE PROFILES PARA QUE ADMINS POSSAM EDITAR OUTROS USUÁRIOS
-- (Assumindo que já existem policies, vamos criar uma nova específica para Admins)
CREATE POLICY "Admins can update other profiles" 
ON public.profiles FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND (profiles.role = 'admin' OR profiles.is_super_admin = true)
    )
);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND (profiles.role = 'admin' OR profiles.is_super_admin = true)
    )
);

-- 6. FUNÇÃO PARA SE TORNAR SUPER ADMIN (Rodar apenas uma vez manualmente ou via console)
-- Substitua 'SEU_EMAIL' pelo seu email real
-- UPDATE public.profiles SET role = 'admin', is_super_admin = true WHERE email = 'seu_email@exemplo.com';

-- 1. DROP DAS POLICIES QUE CAUSAM RECURSÃO (Loop Infinito)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update other profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all logs" ON public.system_logs;

-- 2. CRIAR FUNÇÃO SEGURA PARA CHECAR ADMIN (SECURITY DEFINER)
-- Esta função roda com permissões de "superuser" do banco, evitando o loop de RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() 
    AND (role = 'admin' OR is_super_admin = true)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RECRIAR AS POLICIES USANDO A FUNÇÃO SEGURA

-- Permitir que Admins vejam TODOS os perfis (e usuários vejam a si mesmos)
-- NOTA: Se já existir uma policy "Public profiles are viewable by everyone", esta pode ser redundante, mas garante acesso ao admin.
CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
USING (
    public.is_admin() 
    OR 
    auth.uid() = id -- Garante que o usuário sempre veja a si mesmo
);

-- Permitir que Admins editem outros perfis
CREATE POLICY "Admins can update other profiles" 
ON public.profiles FOR UPDATE
USING ( public.is_admin() );

-- Permitir que Admins vejam todos os logs
CREATE POLICY "Admins can view all logs" 
ON public.system_logs FOR SELECT 
USING ( public.is_admin() );

-- Script de Verificação de Usuário (Manual)
-- Rode este script no SQL Editor do Supabase para verificar se o usuário foi criado corretamente.

DO $$
DECLARE
    v_email text := 'EMAIL_DO_USUARIO_AQUI'; -- Substitua pelo email do usuário com problema
    v_user_id uuid;
    v_profile_exists boolean;
    v_profile_data record;
BEGIN
    -- 1. Verificar se existe na tabela de autenticação (auth.users)
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;
    
    IF v_user_id IS NULL THEN
        RAISE NOTICE 'Usuário NÃO encontrado em auth.users. O cadastro falhou ou o email está diferente.';
        RETURN;
    ELSE
        RAISE NOTICE 'Usuário encontrado em auth.users. ID: %', v_user_id;
    END IF;

    -- 2. Verificar se existe perfil público (public.profiles)
    SELECT * INTO v_profile_data FROM public.profiles WHERE id = v_user_id;
    
    IF v_profile_data IS NULL THEN
        RAISE WARNING 'CRÍTICO: Usuário existe em auth.users mas NÃO tem perfil em public.profiles. O trigger handle_new_user falhou.';
    ELSE
        RAISE NOTICE 'Perfil encontrado em public.profiles.';
        RAISE NOTICE 'Nome: %, Secretaria: %, Setor: %', v_profile_data.full_name, v_profile_data.secretaria, v_profile_data.setor;
        
        -- 3. Verificar dados extras
        IF v_profile_data.secretaria IS NULL OR v_profile_data.setor IS NULL THEN
             RAISE NOTICE 'AVISO: Secretaria ou Setor estão nulos. Isso pode ser normal se não foram preenchidos, mas verifique se deveriam estar.';
        END IF;
    END IF;

END $$;

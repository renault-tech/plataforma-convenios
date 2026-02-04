-- Force cleanup of potential conflicting policies
drop policy if exists "Admins can view all profiles" on profiles;
drop function if exists public.is_admin();

-- Create secure function to check admin status (PREVENTS RECURSION)
create or replace function public.is_admin()
returns boolean
language sql
security definer -- Runs with privileges of creator (postgres), bypassing RLS
set search_path = public -- Security best practice
as $$
  select exists (
    select 1
    from profiles
    where id = auth.uid()
    and (role = 'admin' or is_super_admin = true)
  );
$$;

-- Create the policy using the non-recursive function
create policy "Admins can view all profiles"
on profiles for select
to authenticated
using (
    is_admin()
);

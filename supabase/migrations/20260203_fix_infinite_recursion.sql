-- Create a secure function to check admin status without triggering RLS recursion
create or replace function public.is_admin()
returns boolean
language sql
security definer
as $$
  select exists (
    select 1
    from profiles
    where id = auth.uid()
    and (role = 'admin' or is_super_admin = true)
  );
$$;

-- Drop the recursive policy
drop policy if exists "Admins can view all profiles" on profiles;

-- Re-create the policy using the secure function
create policy "Admins can view all profiles"
on profiles for select
to authenticated
using (
    is_admin()
);

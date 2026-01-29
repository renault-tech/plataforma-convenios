-- Indexes to speed up RLS and filtering
create index if not exists idx_services_owner on public.services(owner_id);
create index if not exists idx_services_slug on public.services(slug);
create index if not exists idx_access_group_members_group_user on public.access_group_members(group_id, user_id);
create index if not exists idx_service_permissions_service on public.service_permissions(service_id);
create index if not exists idx_service_permissions_grantee on public.service_permissions(grantee_id);

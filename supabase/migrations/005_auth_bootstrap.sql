-- ============================================================
-- GINGA STUDIO OS — Migration 005 (bootstrap de autenticação)
-- Cria o profile automaticamente quando um usuário se cadastra
-- no Supabase Auth. O workspace fica nulo até o onboarding do dono
-- (ou é preenchido pela ação de convidar funcionário).
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role, workspace_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'membro'),
    null
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Permite que o dono crie o próprio workspace no onboarding
-- (a ação usa service_role, mas deixamos a policy consistente).
do $$ begin
  create policy "profiles_insert_self" on public.profiles
    for insert with check (id = auth.uid());
exception when duplicate_object then null; end $$;

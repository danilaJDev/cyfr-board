-- CYFR Board: full schema for Supabase SQL Editor
-- Safe to run multiple times (uses IF NOT EXISTS where possible)

create extension if not exists "uuid-ossp";

-- Enums
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('user', 'manager', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.project_status AS ENUM ('active', 'on_hold', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.project_type AS ENUM ('FITOUT', 'Maintenance', 'Other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.task_status AS ENUM ('open', 'in_progress', 'done', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.permit_status AS ENUM ('pending', 'received', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Updated at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  phone text,
  position text,
  role public.user_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Projects
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type public.project_type not null default 'FITOUT',
  status public.project_status not null default 'active',
  contract_signed_at date,
  manager_id uuid references public.profiles(id) on delete set null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_projects_updated_at on public.projects;
create trigger trg_projects_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

-- Permits
create table if not exists public.permits (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  permit_type text not null,
  status public.permit_status not null default 'pending',
  issued_at date,
  expires_at date,
  notes text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_permits_updated_at on public.permits;
create trigger trg_permits_updated_at
before update on public.permits
for each row execute function public.set_updated_at();

-- Tasks
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  notes text,
  status public.task_status not null default 'open',
  deadline date,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_tasks_updated_at on public.tasks;
create trigger trg_tasks_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

-- Task assignees
create table if not exists public.task_assignees (
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (task_id, user_id)
);

-- Attachments
create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  file_url text not null,
  file_name text not null,
  file_type text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Activity log (timeline/analytics)
create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('project', 'task', 'permit', 'attachment')),
  entity_id uuid not null,
  action text not null,
  meta jsonb not null default '{}'::jsonb,
  actor_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Helpful indexes
create index if not exists idx_projects_status on public.projects(status);
create index if not exists idx_projects_manager on public.projects(manager_id);
create index if not exists idx_tasks_project on public.tasks(project_id);
create index if not exists idx_tasks_status on public.tasks(status);
create index if not exists idx_tasks_deadline on public.tasks(deadline);
create index if not exists idx_permits_project on public.permits(project_id);
create index if not exists idx_activity_entity on public.activity_log(entity_type, entity_id);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.permits enable row level security;
alter table public.tasks enable row level security;
alter table public.task_assignees enable row level security;
alter table public.attachments enable row level security;
alter table public.activity_log enable row level security;

-- Helper functions for policies
create or replace function public.my_role()
returns public.user_role
language sql
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_manager_or_admin()
returns boolean
language sql
stable
as $$
  select coalesce(public.my_role() in ('manager', 'admin'), false);
$$;

-- Policies: profiles
DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
create policy "profiles_select_authenticated"
on public.profiles for select
to authenticated
using (true);

DROP POLICY IF EXISTS "profiles_update_self_or_admin" ON public.profiles;
create policy "profiles_update_self_or_admin"
on public.profiles for update
to authenticated
using (id = auth.uid() or public.my_role() = 'admin')
with check (id = auth.uid() or public.my_role() = 'admin');

-- Policies: projects
DROP POLICY IF EXISTS "projects_select_authenticated" ON public.projects;
create policy "projects_select_authenticated"
on public.projects for select
to authenticated
using (true);

DROP POLICY IF EXISTS "projects_insert_manager_admin" ON public.projects;
create policy "projects_insert_manager_admin"
on public.projects for insert
to authenticated
with check (
  public.is_manager_or_admin()
  and created_by = auth.uid()
);

DROP POLICY IF EXISTS "projects_update_manager_admin" ON public.projects;
create policy "projects_update_manager_admin"
on public.projects for update
to authenticated
using (public.is_manager_or_admin())
with check (public.is_manager_or_admin());

-- Policies: permits
DROP POLICY IF EXISTS "permits_select_authenticated" ON public.permits;
create policy "permits_select_authenticated"
on public.permits for select
to authenticated
using (true);

DROP POLICY IF EXISTS "permits_mutate_manager_admin" ON public.permits;
create policy "permits_mutate_manager_admin"
on public.permits for all
to authenticated
using (public.is_manager_or_admin())
with check (public.is_manager_or_admin() and created_by = auth.uid());

-- Policies: tasks
DROP POLICY IF EXISTS "tasks_select_authenticated" ON public.tasks;
create policy "tasks_select_authenticated"
on public.tasks for select
to authenticated
using (true);

DROP POLICY IF EXISTS "tasks_insert_authenticated" ON public.tasks;
create policy "tasks_insert_authenticated"
on public.tasks for insert
to authenticated
with check (created_by = auth.uid());

DROP POLICY IF EXISTS "tasks_update_assignee_or_manager" ON public.tasks;
create policy "tasks_update_assignee_or_manager"
on public.tasks for update
to authenticated
using (
  public.is_manager_or_admin()
  or exists (
    select 1 from public.task_assignees ta
    where ta.task_id = tasks.id and ta.user_id = auth.uid()
  )
)
with check (
  public.is_manager_or_admin()
  or exists (
    select 1 from public.task_assignees ta
    where ta.task_id = tasks.id and ta.user_id = auth.uid()
  )
);

-- Policies: task_assignees
DROP POLICY IF EXISTS "task_assignees_select_authenticated" ON public.task_assignees;
create policy "task_assignees_select_authenticated"
on public.task_assignees for select
to authenticated
using (true);

DROP POLICY IF EXISTS "task_assignees_mutate_manager_admin" ON public.task_assignees;
create policy "task_assignees_mutate_manager_admin"
on public.task_assignees for all
to authenticated
using (public.is_manager_or_admin())
with check (public.is_manager_or_admin());

-- Policies: attachments
DROP POLICY IF EXISTS "attachments_select_authenticated" ON public.attachments;
create policy "attachments_select_authenticated"
on public.attachments for select
to authenticated
using (true);

DROP POLICY IF EXISTS "attachments_insert_authenticated" ON public.attachments;
create policy "attachments_insert_authenticated"
on public.attachments for insert
to authenticated
with check (created_by = auth.uid() or created_by is null);

-- Policies: activity_log
DROP POLICY IF EXISTS "activity_log_select_authenticated" ON public.activity_log;
create policy "activity_log_select_authenticated"
on public.activity_log for select
to authenticated
using (true);

DROP POLICY IF EXISTS "activity_log_insert_authenticated" ON public.activity_log;
create policy "activity_log_insert_authenticated"
on public.activity_log for insert
to authenticated
with check (actor_id = auth.uid() or actor_id is null);

-- Storage bucket (attachments)
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', true)
on conflict (id) do nothing;

-- Storage RLS
DROP POLICY IF EXISTS "attachments_bucket_read" ON storage.objects;
create policy "attachments_bucket_read"
on storage.objects for select
to authenticated
using (bucket_id = 'attachments');

DROP POLICY IF EXISTS "attachments_bucket_write" ON storage.objects;
create policy "attachments_bucket_write"
on storage.objects for insert
to authenticated
with check (bucket_id = 'attachments');

-- Grant profile role manually after first login (run as needed):
-- update public.profiles set role = 'admin' where email = 'you@company.com';

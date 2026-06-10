
-- Roles enum and table
create type public.app_role as enum ('admin', 'hr', 'employee');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "users see own roles" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'hr'));
create policy "admins manage roles" on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  phone text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "authenticated read profiles" on public.profiles for select to authenticated using (true);
create policy "users update own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "users insert own profile" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "admins manage profiles" on public.profiles for all to authenticated
  using (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'hr'))
  with check (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'hr'));

-- Departments
create table public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.departments to authenticated;
grant all on public.departments to service_role;
alter table public.departments enable row level security;
create policy "auth read departments" on public.departments for select to authenticated using (true);
create policy "hr manage departments" on public.departments for all to authenticated
  using (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'hr'))
  with check (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'hr'));

-- Employees
create type public.employment_type as enum ('full_time','part_time','contract','intern');
create type public.employment_status as enum ('active','on_leave','terminated');

create table public.employees (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles(id) on delete set null,
  employee_code text not null unique,
  email text not null,
  first_name text not null,
  last_name text not null,
  job_title text,
  department_id uuid references public.departments(id) on delete set null,
  manager_id uuid references public.employees(id) on delete set null,
  employment_type public.employment_type not null default 'full_time',
  status public.employment_status not null default 'active',
  hire_date date,
  location text,
  salary numeric(12,2),
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.employees to authenticated;
grant all on public.employees to service_role;
alter table public.employees enable row level security;
create policy "auth read employees" on public.employees for select to authenticated using (true);
create policy "hr manage employees" on public.employees for all to authenticated
  using (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'hr'))
  with check (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'hr'));

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_updated before update on public.profiles
for each row execute function public.set_updated_at();
create trigger employees_updated before update on public.employees
for each row execute function public.set_updated_at();

-- On signup: create profile + default employee role
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  insert into public.user_roles (user_id, role) values (new.id, 'employee');
  return new;
end; $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

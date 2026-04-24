# Supabase setup (что вставлять в SQL Editor)

## 1) Открой Supabase SQL Editor

1. Dashboard → ваш проект → **SQL Editor**.
2. Нажми **New query**.
3. Вставь содержимое файла `supabase/schema.sql`.
4. Нажми **Run**.

Это создаст:
- таблицы `profiles`, `projects`, `permits`, `tasks`, `task_assignees`, `attachments`, `activity_log`;
- enum-типы, индексы, триггеры `updated_at`;
- авто-создание профиля при регистрации пользователя;
- RLS-политики для ролей user/manager/admin;
- storage bucket `attachments`.

## 2) Сделай первого администратора

После первой регистрации пользователя выполни:

```sql
update public.profiles
set role = 'admin'
where email = 'your-email@company.com';
```

## 3) Включи Google OAuth

Supabase → Authentication → Providers → Google:
- Enable provider
- Client ID / Client Secret
- Redirect URL взять из Supabase и добавить в Google Console.

## 4) ENV для Next.js

В `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## 5) Что уже реализовано по страницам

- `/auth/login` — вход, регистрация, Google OAuth.
- `/dashboard` — сводный дашборд.
- `/dashboard/projects` — список проектов.
- `/dashboard/projects/new` — создание проекта.
- `/dashboard/projects/[id]` — карточка проекта + permits + задачи.
- `/dashboard/projects/[id]/tasks/new` — создание задачи.
- `/dashboard/projects/[id]/tasks/[taskId]` — карточка задачи + вложения.

## 6) Добавленные в этом обновлении страницы

- `/dashboard/tasks` — все задачи по всем проектам, фильтр по статусу.
- `/dashboard/team` — команда и роли.
- `/dashboard/projects/[id]/permits/new` — добавление разрешения по проекту.

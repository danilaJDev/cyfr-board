# CYFR Board

Веб-приложение для управления проектами и задачами CYFR FITOUT L.L.C (Dubai).

## Что уже реализовано

- Аутентификация через **email/password** и **Google OAuth** (Supabase Auth).
- Ролевая модель в профиле (`profiles.role`) и защищённые маршруты через `middleware`.
- Дашборд с ключевыми показателями, статусами задач и лентой последних проектов.
- CRUD-поток по проектам и задачам (включая назначение нескольких исполнителей).
- Вложения к задачам через Supabase Storage.
- Мобильный first UI + адаптация для desktop.

## Стек

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Supabase (Auth + Postgres + Storage)

## Локальный запуск

1. Установить зависимости:
   ```bash
   npm install
   ```
2. Создать `.env.local`:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
3. Запустить dev-сервер:
   ```bash
   npm run dev
   ```

## Деплой на Vercel (бесплатный тариф)

1. Запушить репозиторий в GitHub.
2. Импортировать проект в Vercel.
3. Добавить `NEXT_PUBLIC_SUPABASE_URL` и `NEXT_PUBLIC_SUPABASE_ANON_KEY` в Environment Variables.
4. Нажать Deploy.

## Рекомендуемые следующие шаги

- Добавить полноценную RBAC-политику в Supabase RLS (admin/manager/user).
- Добавить историю изменений проекта/задачи в отдельную таблицу (`activity_log`) для таймлайна.
- Подключить графики на основе агрегированных SQL view (по дедлайнам, просрочкам, загрузке команды).

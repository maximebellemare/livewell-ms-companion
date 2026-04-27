# PR2 Supabase Auth Setup

This checklist prepares Supabase for PR2 runtime testing of native Expo auth.

## Required Auth Settings

In the Supabase dashboard:

1. Go to `Authentication > Providers`
- Enable `Email`
- Enable email/password sign-in

2. Go to `Authentication > URL Configuration`
- Add this redirect URL:
  - `livewithms://reset-password`

3. Go to `Authentication > Email Templates` / auth email settings
- Ensure password recovery emails are enabled
- Decide whether signup requires email confirmation
- If email confirmation is enabled, PR2 will treat `signUp` with no session as success and show:
  - `Check your email to confirm your account`

## Required Database Setup

Apply the SQL migration:

- [supabase/migrations/20260427_pr2_auth_profiles.sql](/Users/maximebellemare/Documents/Codex/2026-04-27/i-have-an-existing-lovable-web/supabase/migrations/20260427_pr2_auth_profiles.sql)

This migration creates:
- `public.profiles`
- `updated_at` trigger support
- auth signup trigger to auto-create a profile row
- RLS policies for reading/updating/inserting own profile

## Minimum Profiles Table Schema

The required minimum schema is:

- `user_id uuid primary key references auth.users(id)`
- `onboarding_completed boolean default false`
- `created_at timestamptz`
- `updated_at timestamptz`

## Expected Behavior After Migration

When a new user signs up through Supabase Auth:

1. A new row is inserted into `auth.users`
2. The trigger automatically inserts a matching row into `public.profiles`
3. PR2 auth guards can safely query `profiles.onboarding_completed`

## Required Expo Environment Variables

Set these exact values in your local Expo env file:

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

## Pre-Test Checklist

Before PR2 runtime testing:

1. Confirm `Email` auth is enabled
2. Confirm `livewithms://reset-password` is registered as a redirect URL
3. Apply the PR2 auth migration
4. Create a test user in Supabase Auth
5. Confirm a matching `profiles` row is automatically created
6. Add `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` locally
7. Launch the Expo app and confirm mock mode is no longer used

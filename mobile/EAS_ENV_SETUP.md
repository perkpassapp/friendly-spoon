# PerkPass Mobile EAS Environment Setup

This is the setup needed before the real iPhone build behaves like the local app.

## Why This Matters

Local simulator runs can read values from `mobile/.env`.

EAS cloud builds do **not** automatically use that local file.

If these values are missing in EAS:

- Google login may appear broken
- magic link login may fail
- live deals may not load
- billing links may not work correctly

## Required Environment Variables

Add these to the EAS `development` environment:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_WEB_BASE_URL`

For PerkPass, `EXPO_PUBLIC_WEB_BASE_URL` should be:

```bash
https://getperkpass.com
```

## Fastest Setup Flow

Run these one at a time from the `mobile` folder:

```bash
cd /Users/guestlee/perkpass/mobile
npx eas-cli env:create --environment development --name EXPO_PUBLIC_SUPABASE_URL --visibility plain
```

```bash
cd /Users/guestlee/perkpass/mobile
npx eas-cli env:create --environment development --name EXPO_PUBLIC_SUPABASE_ANON_KEY --visibility sensitive
```

```bash
cd /Users/guestlee/perkpass/mobile
npx eas-cli env:create --environment development --name EXPO_PUBLIC_WEB_BASE_URL --value "https://getperkpass.com" --visibility plain
```

When prompted:

- use the same Supabase values already stored in `mobile/.env`
- keep the anon key as `sensitive`

## Verify They Exist

After adding them:

```bash
cd /Users/guestlee/perkpass/mobile
npx eas-cli env:list --environment development
```

You should see all three variable names listed.

## When To Rebuild

After these variables are added, rebuild the real iPhone development app:

```bash
cd /Users/guestlee/perkpass/mobile
npm run build:ios:dev
```

## Production Reminder

Before TestFlight or App Store launch, repeat the same setup for the `production` environment too.

# PerkPass Mobile

This is the current PerkPass mobile app for iOS development.

The app is built with Expo SDK 55, React Native 0.83, and React 19.2. Expo keeps the path open for both iOS and Android later, while still letting us move quickly on the member experience now.

## What Exists Today

- PerkPass-branded member app shell.
- Real deals feed with demo fallback.
- Day filters and category filters matching the web experience more closely.
- Favorites that persist between sessions.
- Redemption flow with code window, cooldowns, and validation polling.
- Redemption history screen.
- Stronger Account screen with membership summary, links, and support actions.
- Supabase auth groundwork for Google + magic link sign-in.
- App icon and splash assets.
- EAS build setup for simulator, development, and production builds.

The app can still run without credentials in preview mode. When `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are set, it loads live data where available and falls back gracefully when needed.

## Setup

Create a local env file:

```bash
cp .env.example .env
```

Fill in:

```bash
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_WEB_BASE_URL=https://getperkpass.com
```

Install dependencies:

```bash
npm install
```

Start the local dev server:

```bash
npm run start:dev-client
```

Then open the PerkPass dev app in the iOS Simulator.

If you need the simulator build:

```bash
npm run build:ios:sim
```

If you want the regular Expo workflow instead:

```bash
npm run start
```

## Current Testing Reality

- The **Simulator** is the best way to test right now.
- A **real iPhone development build** will require Apple Developer approval on your account.
- Until Apple approves the enrollment, simulator testing is the safe path.

## Helpful Commands

Typecheck:

```bash
npm run typecheck
```

Start simulator/dev client flow:

```bash
npm run start:dev-client
```

Build iOS simulator app:

```bash
npm run build:ios:sim
```

Build iPhone development app after Apple approval:

```bash
npm run build:ios:dev
```

## Important Launch Docs

- [LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md)
- [EAS_ENV_SETUP.md](./EAS_ENV_SETUP.md)
- [REAL_DEVICE_TEST_CHECKLIST.md](./REAL_DEVICE_TEST_CHECKLIST.md)

## Current iOS MVP Strategy

Use the app for the member experience first, and keep acquisition/payment on the web until the App Store policy path is finalized.

Recommended first release shape:

1. Existing paid members log in and browse deals in the app.
2. The app focuses on member value: deals, favorites, redemptions, history, and account basics.
3. Membership purchase messaging stays out of the app for the first App Store pass.
4. Billing management remains available for existing members where appropriate.

This avoids rushing into Apple in-app purchase decisions while still letting PerkPass feel like a real app.

## Current Biggest Gaps

1. Verify auth fully on a real iPhone after Apple approval.
2. Test a full signed-in redemption flow end-to-end.
3. Decide whether favorites stay local-only for v1 or sync later.
4. Prepare final App Store metadata and screenshots.

## App Store Notes

Before submission, we will need:

- Apple Developer account.
- Privacy Nutrition Labels.
- Terms and Privacy links.
- TestFlight build.
- Production Supabase and web environment variables.

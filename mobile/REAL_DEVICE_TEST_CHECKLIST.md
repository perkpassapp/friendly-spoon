# PerkPass Mobile Real Device Test Checklist

Use this the moment Apple Developer approval lands and the first iPhone build is ready.

## Before You Start

- Apple Developer enrollment approved
- iPhone and Mac on the same Wi-Fi
- EAS development env vars added
- `perkpass://auth/callback` added in Supabase redirect URLs

## Build + Install

Build the real iPhone development app:

```bash
cd /Users/guestlee/perkpass/mobile
npm run build:ios:dev
```

Open the install link on the iPhone and install the PerkPass dev app.

Then start Metro on the Mac:

```bash
cd /Users/guestlee/perkpass/mobile
npm run start:dev-client
```

Open the **PerkPass** app on the iPhone.

## Test 1: App Opens Cleanly

- [ ] App launches without crash
- [ ] PerkPass icon and splash appear correctly
- [ ] Deals screen loads or login screen appears normally

## Test 2: Auth

- [ ] Continue with Google opens correctly
- [ ] Google returns into the PerkPass app
- [ ] Continue with email sends a magic link
- [ ] Magic link returns into the PerkPass app
- [ ] Signed-in member reaches the deals page
- [ ] Non-member gets a clear access-blocked state

## Test 3: Deals UX

- [ ] `Live deals now` filter works
- [ ] Weekday filters work
- [ ] Category filters work
- [ ] Logo tap returns to deals
- [ ] Favorites heart works visually
- [ ] Favorited businesses appear in `Favorites`

## Test 4: Redemption

- [ ] Open a live redeemable deal
- [ ] Code sheet opens cleanly
- [ ] Countdown runs correctly
- [ ] Long-press close works
- [ ] Expired state appears after the time window ends
- [ ] Staff validation changes the code to confirmed
- [ ] Cooldown appears after redemption
- [ ] Cooldown survives app restart
- [ ] History records the redemption

## Test 5: Account

- [ ] Account opens from the header
- [ ] Email shows correctly
- [ ] Membership status looks right
- [ ] Billing portal opens
- [ ] Support email opens
- [ ] Sign out works

## If Something Breaks

Capture:

- the exact screen
- the exact action you took
- whether you were in preview mode or signed in
- whether it was Simulator-only or real iPhone too

That makes fixes much faster.

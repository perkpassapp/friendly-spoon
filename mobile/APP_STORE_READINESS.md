# PerkPass App Store Readiness

This is the simplest honest view of where PerkPass stands for App Store launch.

## Overall Status

- Build setup: Mostly ready
- Core member app experience: Mostly ready
- Store listing assets: Not ready
- Apple policy risk: Needs review
- Submission readiness: Not ready yet

## Ready

- [x] Apple Developer account exists
- [x] Expo / EAS iOS build setup exists
- [x] iOS bundle identifier is configured
- [x] App icon exists
- [x] Splash asset exists
- [x] Member login flow exists
- [x] Deals feed exists
- [x] Favorites exist
- [x] Redemption flow exists
- [x] Redemption history exists
- [x] Account screen exists
- [x] Terms link exists in app
- [x] Privacy link exists in app
- [x] Support email exists in app

## Needs Work

- [ ] Run real end-to-end testing on a real iPhone or dedicated test device
- [ ] Verify Google sign-in on a real device
- [ ] Verify magic link sign-in on a real device
- [ ] Verify active members can access live deals
- [ ] Verify redemption creation and confirmation end-to-end
- [ ] Verify cooldown behavior after app restart
- [ ] Verify billing portal opens correctly from the app
- [ ] Verify in-app account deletion works end-to-end
- [ ] Create App Store screenshots
- [ ] Write App Store description
- [ ] Write App Store subtitle
- [ ] Choose App Store category
- [ ] Choose App Store keywords
- [ ] Fill out App Privacy answers in App Store Connect
- [ ] Confirm production environment variables for mobile
- [ ] Create a TestFlight build
- [ ] Create a production build

## Likely Blockers

- [ ] Decide App Store payment strategy for PerkPass
- [ ] Confirm whether the current web signup / Stripe flow is acceptable for App Review
- [x] Add in-app account deletion flow

## Why Payment Strategy Matters

PerkPass currently uses this mobile strategy:

- existing members sign in to use the app
- new users are sent to web signup
- billing is handled on the web with Stripe

That may or may not be acceptable to Apple depending on how App Review classifies the PerkPass membership.

Questions we need to answer before submission:

1. Is PerkPass treated like access to offline local services and discounts?
2. Or will Apple treat it like a digital subscription that must use in-app purchase?
3. If web signup stays, should the app only target existing paid members at first?

Until this is answered, App Review is the biggest launch risk.

## Missing Or Unclear In Repo

- Account deletion flow in the mobile app: Not found in repo
- Final App Store screenshots: Not found in repo
- Final App Store copy: Not found in repo
- Final privacy questionnaire answers: Not found in repo
- TestFlight submission setup: Not found in repo
- Production submission checklist: Not found in repo

## Suggested Launch Order

1. Finish simulator testing.
2. Test on a dedicated iPhone if possible.
3. Decide payment / signup policy path.
4. Add any required compliance changes.
5. Capture screenshots.
6. Create TestFlight build.
7. Do a small private test.
8. Submit to App Store review.

## Recommended Next Step

The next best step is to decide the launch model:

- Option A: Existing paid members only in the app at first
- Option B: New signups allowed in the app with current web checkout
- Option C: Add Apple in-app purchase before launch

Option A is the lowest-risk launch path from a product perspective, but it still needs Apple policy review before submission.

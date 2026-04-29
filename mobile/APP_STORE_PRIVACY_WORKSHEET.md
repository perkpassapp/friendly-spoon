# PerkPass App Privacy Worksheet

This is a practical draft for App Store Connect's privacy questionnaire.

Important:
- This is a preparation document, not legal advice.
- Final answers should be confirmed against your real production services and any analytics or crash tools you add later.

## Third Parties Observed In Repo

- Supabase
- Stripe
- Google sign-in

## Data Types Clearly Supported By Repo

### Contact Info

- Email Address
Reason:
- account login
- membership lookup
- support / billing flows

### User Content / Account Data

- Name
- Phone Number
Reason:
- member profile
- account verification

### Purchases

- Subscription / billing status
- Stripe customer and subscription IDs on backend
Reason:
- billing access
- membership status

### Usage Data

- Redemption history
- Favorites stored locally in app
Reason:
- product functionality
- account experience

## Data Not Clearly Found In Repo

- Location collection: Not found in repo
- Contacts: Not found in repo
- Health data: Not found in repo
- Photos from mobile app: Not found in repo
- Precise diagnostics / crash reporting SDK: Not found in repo
- Third-party ad tracking: Not found in repo

## Likely App Store Connect Answers To Review

### Does the app collect data?

Likely yes.

### Is data linked to the user?

Likely yes for:
- email
- name
- phone
- membership status
- redemption history

### Is data used for tracking?

Based on repo evidence: likely no.

I found no ad SDK, no cross-app tracking SDK, and no tracking-specific implementation in the mobile app.

## Likely Purpose Tags

### App Functionality

- Email
- Name
- Phone
- Membership status
- Redemption history

### Customer Support

- Email

### Purchases

- Subscription status
- Billing identifiers

## Follow-Up Checks Before Submission

- Confirm whether any analytics SDK is added before launch
- Confirm whether crash reporting is added before launch
- Confirm whether Google sign-in introduces any extra disclosed data handling you want reflected in your policy
- Confirm final privacy policy text matches the actual shipped app

## Repo References

- [mobile/App.tsx](/Users/guestlee/perkpass/mobile/App.tsx)
- [mobile/src/services/auth.ts](/Users/guestlee/perkpass/mobile/src/services/auth.ts)
- [mobile/src/services/member.ts](/Users/guestlee/perkpass/mobile/src/services/member.ts)
- [mobile/src/services/billing.ts](/Users/guestlee/perkpass/mobile/src/services/billing.ts)
- [app/privacy/page.tsx](/Users/guestlee/perkpass/app/privacy/page.tsx)

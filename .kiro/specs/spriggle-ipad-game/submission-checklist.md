# Spriggle 1.0 — App Store submission checklist

Audited against App Store Connect app `6788150764` (version 1.0, "Prepare for
Submission") and the repo at `main` on 26 Jul 2026.

## Already done in App Store Connect

- Promotional text, description (2,924 chars used), keywords
- Copyright, app icon, Game Center enabled, multiplayer compatibility row
- App Review contact details + reviewer notes (guest-play instructions — good,
  this is exactly what reviewers need for an app with optional sign-in)
- Release option set to "Automatically release after approval"
- `eas.json` → `submit.production.ios.ascAppId` = `6788150764` ✅ (the
  `6755091280` in `production-readiness.md` is stale — that doc is wrong)

## Hard blockers — cannot submit without these

### 1. Build/version mismatch

The attached build is **build 7, marketing version 0.1.0**. The App Store
version is **1.0**. Apple rejects at validation when
`CFBundleShortVersionString` doesn't match the App Store version string.

Build 7 also predates the last four merged PRs (#33–#37: sign-in layout,
onboarding tutorial, mascot clipping fix, de-flaked specs), so it isn't the app
you want to ship anyway.

Fix:

1. Decide on one version string and use it in both places. `app.json` currently
   says `1.0.0`; the ASC field says `1.0`. Set the ASC **Version** field to
   `1.0.0`.
2. `eas build -p ios --profile production`
3. `eas submit -p ios --profile production`
4. Attach the new build to version 1.0.0 in ASC.

### 2. Screenshots — none uploaded

`0 of 10 Screenshots` on every tab. The app is iPad-only
(`isTabletOnly: true`), so the **iPad 13" (2064 × 2752 or 2752 × 2064)** set is
required. Landscape orientation. Minimum 1, ideally 5–8.

Capture on an iPad Pro 13" simulator (`⌘S` in Simulator saves to Desktop at
native resolution). No iPhone screenshots needed for an iPad-only app.

### 3. Support URL — empty

Required field. Needs a real, reachable page (not a mailto:). A single static
page under `evans-software-solutions.com` with a contact email is sufficient.

### 4. Privacy Policy URL — set on the App Information page

Required for every app. Must cover what the backend stores: Apple user
identifier, Game Center player ID, display name, scores. Host it alongside the
support page.

## Verify before hitting "Add for Review"

These are on ASC pages that didn't render on direct navigation — check each
from the left sidebar:

- **App Information** — primary category set to **Games** with two subcategories
  (Puzzle + Casual fits), privacy policy URL, content rights declaration
- **Age Rating** — questionnaire completed. With no ads/UGC this lands at 4+.
  Do **not** tick "Made for Kids" / the Kids category — it locks you out of
  third-party ads and adds review scrutiny.
- **App Privacy** — data collection declared: identifiers (Apple / Game Center
  ID), coarse profile (display name), gameplay/score data. Linked to identity,
  used for app functionality. **No tracking, so no ATT prompt.**
- **App Accessibility** — Apple's accessibility nutrition labels; fill in what
  the app genuinely supports rather than over-claiming
- **Pricing and Availability** — price tier (Free) and territories selected
- **Encryption** — `ITSAppUsesNonExemptEncryption: false` is already in
  `app.json`, so no export compliance questions should appear

## Pre-flight (worth doing, not enforced by Apple)

- **Smoke-test the production backend** —
  `https://n854zrrf78.execute-api.us-east-1.amazonaws.com`: health, leaderboard
  read, authed score submit with a real Apple identity token. If the API 500s
  during review, expect a rejection under 2.1 (app completeness).
- **Manual full-loop test** on a real iPad or 13" simulator against the
  production build — onboarding → play → dig → swap → game over → local +
  global leaderboard → sign in → theme switch → kill and resume. This is the
  gap flagged in `production-readiness.md` and it's the single most likely
  source of a review rejection.
- **Apple Developer portal** — Sign in with Apple + Game Center enabled on the
  App ID (EAS handles the provisioning profile, but the capabilities have to be
  on the App ID first).
- **Game Center leaderboard** — if the app calls into a Game Center leaderboard,
  it has to exist in ASC and be attached to the version, or the tab will be
  empty for reviewers.

## After all of the above

Click **Add for Review**. ASC validates and lists anything still missing, so it
doubles as a free final check — it does not submit on its own.

First review for a new app typically takes 24–48 hours.

## Known gaps deliberately not fixed for 1.0

- Rate limiter is in-memory per Lambda container — fine at launch volume
- `e2e.yml` missing the `expo prebuild` step (per `production-readiness.md`,
  though PR #28 appears to have addressed this — worth confirming)

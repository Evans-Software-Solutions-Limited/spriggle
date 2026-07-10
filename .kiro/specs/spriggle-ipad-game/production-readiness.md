# Spriggle — Production Readiness Handoff (M5)

Status of Task 23 (App Store submission readiness). **[agent]** = done in this
PR; **[manual]** = needs Brad's Apple/AWS accounts, a Mac with Xcode, or a
device/simulator. The app is code-complete and playable after M1–M4; what
remains is native regeneration, a backend deploy, account/portal config, and
device verification — none of which can be done from this environment.

## ⚠️ Do this first — the native project is stale

M3 added two **native** modules — `expo-linear-gradient` and `expo-haptics` —
and `ios/Podfile.lock` does not contain them. The committed `ios/` project also
predates the M1–M4 JS (that's fine — JS is bundled by Metro) but it is missing
those native pods. **You must regenerate the native project before building:**

```
cd packages/mobile
rm -rf ios
bunx expo prebuild -p ios --clean
```

This regenerates a `Spriggle`-branded iOS project from `app.json` with: the
`spriggle` URL scheme, landscape-only + iPad-only lock, Game Center entitlement,
Apple Sign In, the new icon/splash, the privacy manifest, and — critically —
CocoaPods for linear-gradient + haptics. After prebuild:

- **[agent, then verify]** Confirm the generated `ios/*.xcworkspace` name is
  `Spriggle` (matches `.detoxrc.js`); if Expo sanitised it differently, update
  `.detoxrc.js`.
- **[verify]** Confirm the regenerated `Info.plist` / entitlements contain **no**
  unused sensitive capabilities (HealthKit, in-app-payments merchant, camera /
  microphone / photo-library usage strings, `aps-environment`). `app.json`
  doesn't declare them, so `--clean` should drop them.

## [agent] Done in this PR (config only — no native build performed)

- `app.json`: `version` → **1.0.0** (release marketing version; the build
  number is managed remotely by EAS via `appVersionSource: "remote"` +
  `autoIncrement`). Bundle id `com.bradleyevans96.spriggle`, display name
  "Spriggle", landscape + iPad-only + `requireFullScreen`, Apple Sign In +
  Game Center entitlement, `ITSAppUsesNonExemptEncryption: false` — all present
  and correct.
- `app.json`: added `ios.privacyManifests` with the **UserDefaults**
  required-reason API (`CA92.1`) — AsyncStorage + expo-secure-store access
  UserDefaults, which App Store review now requires a declared reason for.
- Marketing icon verified **1024×1024, no alpha** (App Store compliant).
- `eas.json`: `production` build profile exists (store distribution, production
  environment, autoIncrement) and `submit.production` has the ASC app id +
  Apple team id.
- All quality gates green across the monorepo: `prettier:check`, `lint`,
  `typecheck`, `test:unit` (97 mobile tests), and a clean `expo export`
  (Metro) bundle for iOS.

## [manual] Backend — production stage

- `bunx sst deploy --stage production` (provisions the DynamoDB table + API
  Gateway + Lambda). Note the API URL.
- **[agent, once URL known]** Set `APPLE_CLIENT_ID` (= the app bundle id /
  Services id) in the production infra env so Apple token verification works,
  and replace `eas.json` → `build.production.env.EXPO_PUBLIC_API_URL` (currently
  the placeholder **`SET_AFTER_SST_DEPLOY`**) with the deployed API URL.
- Smoke-test the deployed endpoints: health, leaderboard, and an authed score
  submit + profile with a real Apple identity token.
- Note: the rate limiter is per-container / in-memory — acceptable for launch;
  a shared store (DynamoDB/Redis) is a post-launch hardening item.

## [manual] Apple Developer / App Store Connect

- Enable **Sign in with Apple** and **Game Center** on the App ID; regenerate
  the provisioning profile.
- App Store Connect app record already has an ASC app id (`6755091280` in
  eas.json) — confirm bundle id, name, **Games** category, and complete the age
  rating questionnaire.
- Host a **Privacy Policy** + **Support URL** (required in App Store Connect).
- App Privacy declaration: identifiers (Apple / Game Center id), coarse profile
  (display name), gameplay/score data; linkage + purpose. **No tracking/ATT.**

## [manual] Verification before building

- **Detox E2E** green on the iPad simulator (first real run needs the installed
  simulator name in `.detoxrc.js`, `pod install`, Release config). Four flows:
  full game → game over → score; sign-in options → global tab; offline →
  reconnect; guest → local-only.
- **Manual full-loop smoke test** on an iPad simulator/device (this is the
  verification I could not do — all M1–M4 logic is unit/integration-tested and
  Metro-bundled, but not run on a device):
  - onboarding/how-to-play → play → **dig** (score popup + spawn animation) →
    **swap** → **game over** → local + global leaderboard
  - **iPad fit**: board fully visible + rail unclipped on 11" and 12.9" (and
    Mini); the design-frame scales to each
  - **fonts**: Fredoka/Nunito render (not the system font)
  - **theme switch** in Settings (Garden ↔ Moonlit)
  - **pause sheet** (Resume / Restart / How to play / Settings / Quit)
  - sign in (Apple) → guest
  - kill mid-run → relaunch → game **resumes**

## [manual] Build & submit

- `eas build -p ios --profile production` → `.ipa`.
- `eas submit -p ios` → App Store Connect.
- Upload screenshots for the required iPad display sizes (12.9" / 13"),
  description, keywords, promotional text; attach privacy policy + support URLs;
  submit for review.

## Deferred from M4 (not blocking submission)

- Animated JS splash screen (the native `expo-splash-screen` splash is
  configured and shows on launch).
- First-run auto-routing into the how-to-play tutorial (it's reachable from the
  pause sheet). A scripted interactive tutorial (per the prototype's
  `onboarding.js`) is a future enhancement.

Both need navigator/initial-route changes best verified on a simulator.

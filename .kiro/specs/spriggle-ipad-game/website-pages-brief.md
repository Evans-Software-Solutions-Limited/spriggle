# Brief — Spriggle privacy & support pages on evans-software-solutions

**For:** the `evans-software-solutions` React app
**Why:** App Store Connect requires a Privacy Policy URL and a Support URL
before Spriggle 1.0 can be submitted. Both are currently empty.
**Blocked by:** SPRIG-1 below. The policy cannot be written truthfully until
that is fixed.

---

## ⚠️ SPRIG-1 — fix before publishing the policy

**Apple sign-in publishes the user's email address on the public leaderboard.**

The chain, verified in the repo:

1. `packages/mobile/src/services/sync/SyncService.ts:79` — the client POSTs only
   `{ score, date }`. It never sends a display name.
2. `packages/api-utils/src/auth/multiProvider.ts:64` — the backend reads
   `email` out of the verified Apple identity token. It sets `displayName` only
   if the token carries one.
3. Apple's identity token has **no name claim**. Apple returns the user's name
   once, client-side, in the credential — never in the JWT. So `displayName` is
   always `undefined` for Apple sign-in.
4. `microservices/core/src/application/scoreService.ts:37` —
   `user.displayName ?? user.email ?? "Gardener"` therefore resolves to
   **`user.email`**.
5. That value is written as `playerName` and served by `GET /api/leaderboard`
   to every player, unauthenticated.

Net effect: sign in with Apple, post a score, and your email address — or your
Hide My Email relay address — is displayed publicly on the global leaderboard.

The client already resolves a proper display name
(`packages/mobile/src/services/auth/providers/apple.ts:22`, falling back to
`"Gardener"`) and simply doesn't send it.

**Suggested fix:** have the client send `displayName` in the `POST /api/scores`
body and have the server prefer it, validated and length-capped. Then drop the
`?? user.email` fallback entirely so an email can never reach `playerName`, and
remove the unused `EMAIL` scope from the Apple sign-in request. Backfill or
purge any existing rows whose `playerName` looks like an email.

The copy below is written **as if SPRIG-1 is fixed** — it states that email is
not collected. Publishing it before the fix would make it inaccurate.

---

## Scope

Two new public pages, plus two links in the site footer.

| Route | Purpose | Goes in ASC field |
|---|---|---|
| `/spriggle/privacy` | Privacy policy | App Information → Privacy Policy URL |
| `/spriggle/support` | Support / contact | Version page → Support URL |

Out of scope: a marketing page for Spriggle. The Marketing URL field in ASC is
optional and can stay empty.

## Requirements

1. **Both URLs must resolve on a cold, direct load.** This is the one thing that
   commonly breaks on a client-routed React SPA — the router handles
   `/spriggle/privacy` fine after an in-app click, but a fresh GET to that path
   404s unless the host rewrites unknown paths to `index.html`. Add the rewrite:
   - Netlify — `/* /index.html 200` in `_redirects`
   - Vercel — a catch-all rewrite in `vercel.json`
   - S3 + CloudFront — custom error response mapping 403/404 → `/index.html`, 200
   - nginx — `try_files $uri /index.html;`
2. **No auth, no cookie wall, no JS-gated content.** Apple's reviewer opens
   these in a plain browser. If the policy only renders after a consent banner
   is dismissed, expect a rejection.
3. Reuse the site's existing layout, header and footer components. These should
   look like part of the site, not orphan pages.
4. Set `<title>` and `<meta name="description">` per page (via whatever the site
   already uses — `react-helmet`, `document.title` in an effect, etc.).
5. Add both to the footer under a "Spriggle" or "Legal" grouping.
6. Add a visible **"Last updated"** date on the privacy page and keep it
   accurate — Apple and the ICO both care, and it's the first thing a reviewer
   checks for staleness.
7. Content lives in the component (or a colocated `.md`/`.mdx` if the site
   already has that pipeline). Don't fetch it at runtime.

## Acceptance criteria

- [ ] `https://evans-software-solutions.com/spriggle/privacy` returns 200 with
      full content on a hard refresh in a private window
- [ ] Same for `/spriggle/support`
- [ ] Both are readable on mobile down to 375px wide
- [ ] Both links present and working in the site footer
- [ ] Placeholders below (company number, registered address, support email)
      all replaced — search the diff for `[[` before merging
- [ ] Support email is a real, monitored inbox
- [ ] Both URLs pasted into App Store Connect

## Placeholders to fill

- `[[COMPANY_NUMBER]]` — Evans Software Solutions Limited company number
- `[[REGISTERED_ADDRESS]]` — registered office address
- `[[SUPPORT_EMAIL]]` — e.g. `support@evans-software-solutions.com`
- `[[LAST_UPDATED]]` — date you publish

---

# Page copy — `/spriggle/privacy`

> Title: `Spriggle — Privacy Policy | Evans Software Solutions`
> Description: `How Spriggle handles your data. No ads, no analytics, no tracking.`

---

## Spriggle Privacy Policy

**Last updated: [[LAST_UPDATED]]**

Spriggle is a match-3 gardening puzzle game for iPad, published by Evans
Software Solutions Limited ("we", "us"), a company registered in England and
Wales (company number [[COMPANY_NUMBER]]), registered office
[[REGISTERED_ADDRESS]].

This policy explains what Spriggle does with your information. The short
version: Spriggle contains no advertising, no analytics and no third-party
tracking of any kind, and you can play the entire game without giving us
anything at all.

### Playing as a guest

Spriggle can be played fully as a guest. If you choose "Play as Guest", **no
information whatsoever leaves your iPad.** Your scores, your progress and your
settings stay in the app's own storage on your device and are never sent to us.
Deleting the app deletes all of it.

Guests have access to every part of the game except the online global
leaderboard, which requires a signed-in identity so scores can be attributed.

### If you sign in

Spriggle offers two optional sign-in methods: Sign in with Apple, and Game
Center. You only need one if you want your scores on the global leaderboard.

When you sign in and submit a score, we store:

- **A player identifier.** For Sign in with Apple, this is the anonymous,
  app-specific user identifier that Apple gives us. It is not your Apple
  Account email and it cannot be used to identify you outside Spriggle. For Game
  Center, Apple manages your player identity.
- **A display name.** Taken from the name you chose to share when you signed in.
  If you shared no name, we use "Gardener".
- **Your scores**, and the date and time each game was played.

We do **not** collect or store your email address. Sign in with Apple can hide
your email from developers entirely, and Spriggle does not retain it in any
case.

### What is shown publicly

The global leaderboard is public and visible to every Spriggle player. It shows
your **display name**, your **score** and the **date** of the game. Nothing else
about you is ever shown.

If you would prefer nothing about you to be public, play as a guest — the local
leaderboard on your own device works exactly the same way and is private to you.

### Stored on your device

Spriggle keeps the following on your iPad, and only on your iPad:

- Your saved game, so an interrupted game resumes where you left off
- Your local high scores
- Your chosen theme
- If you signed in, a session token, held in the iOS Keychain

### What Spriggle does not do

- No advertising, and no advertising networks
- No analytics or usage tracking, of any kind
- No third-party trackers, SDKs or data brokers
- No IDFA, no App Tracking Transparency prompt, and no cross-app or
  cross-website tracking
- We never sell or share your information with anyone for their own purposes

### Where your data is held

Signed-in players' data is stored on Amazon Web Services in the United States
(the `us-east-1` region). This means your information is transferred outside the
UK. AWS is covered by the UK's approved transfer mechanisms, and the data
involved — an identifier, a display name and game scores — is limited by design.

### How long we keep it

We keep your player identifier, display name and scores for as long as your
Spriggle identity exists, so that your leaderboard position and profile remain
correct. If you ask us to delete your data, we remove it within 30 days.

Anything held only on your device is deleted when you delete the app.

### Your rights

Under UK data protection law you have the right to ask us for a copy of your
data, to correct it, to delete it, to restrict or object to how we use it, and
to receive it in a portable form. To exercise any of these, email
[[SUPPORT_EMAIL]] and we will respond within one month.

You can also revoke Spriggle's access at any time from your iPad, under
**Settings → your name → Sign-In & Security → Sign in with Apple**.

If you are unhappy with how we have handled your information, you can complain
to the Information Commissioner's Office at [ico.org.uk](https://ico.org.uk).

### Children

Spriggle is suitable for all ages and contains no advertising, no in-app
purchases, no chat and no user-generated content. We do not knowingly collect
information from children under 13. If you believe a child has signed in and you
want their data removed, email [[SUPPORT_EMAIL]] and we will delete it.

### Changes

If we change this policy we will update the date at the top of this page. If a
change is significant, we will say so in the app's release notes.

### Contact

Evans Software Solutions Limited
[[REGISTERED_ADDRESS]]
[[SUPPORT_EMAIL]]

---

# Page copy — `/spriggle/support`

> Title: `Spriggle — Support | Evans Software Solutions`
> Description: `Help, FAQs and contact for Spriggle, the iPad gardening puzzle.`

---

## Spriggle Support

Something not working, or just want to tell us what you think? Email
**[[SUPPORT_EMAIL]]** and we'll get back to you within a few working days.

If you're reporting a problem, it helps enormously if you can include your iPad
model, your iPadOS version, and what you were doing when it happened.

### Frequently asked

**Do I need an account to play?**
No. Tap "Play as Guest" and you get the whole game — every mechanic, and a local
leaderboard on your own device. Signing in is only needed for the online global
leaderboard.

**Why is Spriggle iPad-only?**
Spriggle's board and side rail are designed around a large landscape screen.
Squeezing that onto a phone would have meant a worse game, so we built it for
iPad properly instead.

**How do I play?**
Dig up connected groups of five or more matching plants to score. Swap adjacent
plants to set up bigger digs. Every move refills the 8×8 garden, so there's
always another play to make. The full tutorial is available any time from the
pause menu → How to play.

**Can I play offline?**
Yes. The entire game works without a connection. If you're signed in, scores you
earn offline are queued and sync to the global leaderboard automatically once
you reconnect.

**How do I change the theme?**
Pause → Settings. Spriggle ships with Garden and Moonlit.

**My score didn't appear on the global leaderboard.**
Check that you're signed in — guest scores stay local by design. If you're
signed in and connected and it still hasn't appeared after a few minutes, email
us.

**How do I delete my data?**
Email [[SUPPORT_EMAIL]] and we'll delete everything associated with your player
identity within 30 days. You can also revoke access on your iPad under
Settings → your name → Sign-In & Security → Sign in with Apple.

**Does Spriggle have ads or in-app purchases?**
No. Neither.

### Privacy

See the [Spriggle Privacy Policy](/spriggle/privacy).

---

## After the pages are live

1. App Store Connect → Spriggle → **App Information** → Privacy Policy URL →
   `https://evans-software-solutions.com/spriggle/privacy`
2. App Store Connect → Spriggle → **iOS App 1.0** → Support URL →
   `https://evans-software-solutions.com/spriggle/support`
3. Leave Marketing URL empty.
4. Confirm the **App Privacy** questionnaire matches this policy — identifiers
   and gameplay data, linked to identity, used for app functionality; **no**
   tracking; **no** email. If SPRIG-1 isn't fixed, the honest answer to the
   email question changes, which is the other reason to fix it first.

## Caveat

I'm not a lawyer and this isn't legal advice. The copy is drawn from what the
code actually does and follows the shape of a standard UK GDPR notice, but for a
company-published product it's worth a solicitor's eye before it goes live —
particularly the international transfer and retention wording.

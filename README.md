# QT Quest Punchcard

A mobile-friendly "e-punchcard" web app for F3 T-Town's **QT Quest** relay race. Runners
(individuals or relay teams) check off the 8 required QT menu items — one per stop, in
order — and every teammate sees the exact same live progress. Field Marshals get a
read-only dashboard of everyone's status.

## How it works

- Each individual or team gets a short **access code** (e.g. `AB3XQ`) and a direct link
  like `/c/AB3XQ`, generated during roster import (see below). Runners don't need to know
  or type this code — the landing page (`/`) lists every team (expand to see its
  members) and individual so people can just tap their name to open their punchcard.
- No accounts or passwords — anyone can open and update a punchcard. This is
  intentionally simple/"dummy-proof" for a casual community race, not a high-security
  system. Don't put anything truly sensitive in it.
- The 8 item categories (roller, bakery, Big Q drink, candy, pickle, chips, fruit, QT
  kitchen item) are **not** tied to a specific stop number — at each of the 8 QT stops,
  the runner/team picks any one *unused* category to eat, in QT-stop order. All 8 must
  end up different by the end.
- Teams share one punchcard. Before checking off an item, set "who's up" (the teammate
  currently running/eating) so the log records who ate what.
- Data lives in Firebase Firestore and updates in real time across every phone, with
  offline persistence so a flaky QT parking-lot WiFi won't lose a checkoff.

## Screens

- `/` — browse teams (tap to expand and pick your name) and individual participants
- `/c/:code` — the punchcard (checklist, active-runner picker, notes, trash-pickup bonus
  counter, elapsed time, DQ/tap-out controls)
- `/marshal` — Field Marshal dashboard (progress table, emergency contact/medical info,
  add a late sign-up)

## One-time setup

> **Status:** The `qt-quest` Firebase project is already created, with Firestore and
> Anonymous Auth enabled, and its config is already in `.env.local` locally. Steps 1–2
> below are done — jump to [Deploy to Vercel](#5-deploy-to-vercel) to add the same env
> vars there.

### 1. Create a Firebase project

1. Go to the [Firebase console](https://console.firebase.google.com/) → **Add project**.
2. Enable **Firestore Database** (production mode is fine).
3. Enable **Authentication → Sign-in method → Anonymous**. (Used only as a soft gate on
   emergency-contact data — see [Security notes](#security-notes) below.)
4. In **Project settings → General → Your apps**, add a Web app and copy the config
   values. If you enabled Google Analytics for the project, also copy the
   `measurementId` — the app uses it optionally (`VITE_FIREBASE_MEASUREMENT_ID`) and
   works fine without it.
5. Deploy the security rules in [`firestore.rules`](./firestore.rules) (Firestore →
   Rules tab, paste and publish — or use the Firebase CLI: `firebase deploy --only
   firestore:rules`).

### 2. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in your Firebase config values plus a
`VITE_MARSHAL_CODE` (any code you'll share with marshals only).

```
cp .env.local.example .env.local
```

### 3. Install dependencies and run locally

```
npm install
npm run dev
```

### 4. Import the roster before race day

Export your signup Google Sheet to CSV with these columns (header row required, extra
columns are ignored):

| Name | Type | Members | Code |
|------|------|---------|------|
| Loboto | individual | | |
| Team Ferrari | team | Loboto; Dorothy; Skeletor | |

- `Type`: `individual` or `team` (defaults to individual)
- `Members`: semicolon-separated teammate names (teams only) — these show up as
  tappable names under the team on the landing page
- `Code`: leave blank to auto-generate a short code, or set your own. Codes are only
  used internally for the `/c/:code` URL — runners never need to type them, since the
  landing page lets them tap their team/name directly.
- `EmergencyContact` / `MedicalNotes` columns are still supported if you want to track
  that info for the Marshal Dashboard, but are optional and can be omitted entirely.

Then:

1. In Firebase console → **Project settings → Service accounts → Generate new private
   key**. Save the downloaded file as `service-account.json` in the repo root (this file
   is gitignored — never commit it).
2. Run the import, pointing at your deployed app URL so it prints ready-to-share links:

   ```
   npm run import-roster -- path/to/roster.csv https://your-app.vercel.app
   ```

3. It prints each participant/team's code + link — copy these into your sign-up
   confirmations / Slack.

Late sign-ups after the CSV import can be added directly from the `/marshal` dashboard.

### 5. Deploy to Vercel

1. Push this repo to GitHub, then import it in [Vercel](https://vercel.com/new).
2. Framework preset: **Vite**. Build command/output are auto-detected.
3. Add the same environment variables from `.env.local` in the Vercel project settings
   (Settings → Environment Variables) — all six `VITE_FIREBASE_*` values (including
   `VITE_FIREBASE_MEASUREMENT_ID` if set) plus `VITE_MARSHAL_CODE`.
4. Deploy. Re-run the roster import with the real Vercel URL so the printed links are
   correct (or re-print links from the marshal dashboard using each code).

## Race-day quickstart

**Runners/teams:** Open your link (or go to the app and enter your code) → check off
each item as you eat it, in order, at each QT stop → don't forget your own photo/video
proof (the app doesn't store photos) → teams: set "who's up" before checking things off.

**Field Marshals:** Go to `/marshal`, enter the marshal code, and watch the live table.
Tap a row to see emergency contact/medical info and notes. Use "+ Add late sign-up" for
anyone who registers after the CSV import.

## Security notes

This app trades strict security for simplicity, appropriate for a casual community race:

- **Punchcard data** (`participants` collection) is readable/writable by anyone who has
  the access code — there's no server-side check that the requester "should" have that
  code. Codes aren't published anywhere public, so this relies on the codes staying
  reasonably private, similar to an unlisted Google Sheet link.
- **Emergency contact / medical info** (`participants_private` collection) is gated
  behind Firebase Anonymous Auth in the security rules. This is a soft speed bump, not
  real security — since the Firebase web config is public in the deployed JS bundle,
  a determined person could sign in anonymously and read it too. It's meant to keep this
  data out of casual browsing/search engines, not to withstand a targeted attack.
- **The `/marshal` dashboard** is gated by a shared code compared in the browser
  (`VITE_MARSHAL_CODE`), not enforced by Firestore rules. Anyone with the code (or who
  reads the deployed JS) could bypass the marshal login and call the same read-only
  APIs a marshal uses; there is no separate write scope tied to marshal status.

If this event grows or the stakes rise, replace both of these with real per-user
authentication (e.g. Firebase phone/email auth) and rules scoped to specific users.

## Tech stack

React + TypeScript + Vite, Firebase Firestore (+ Anonymous Auth), react-router-dom,
deployed on Vercel. `scripts/importRoster.ts` uses `firebase-admin` + `csv-parse` and
runs with `tsx` (not part of the deployed app bundle).

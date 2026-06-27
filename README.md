# BloodDonationWeb

Next.js + Firebase app for blood/food request workflows.

## Requirements

- Node.js 20+
- npm 10+
- Firebase CLI (`npm i -g firebase-tools`)

## Install

```bash
npm install
```

## Run locally

```bash
npm run dev
```

Production mode locally:

```bash
npm run build
npm run start
```

## Emulator E2E tests

These tests run against Firebase emulators (`auth`, `firestore`) and start the app with `next start`.
No production Firebase data is used.

### Smoke suite

Fast core flow check:
- register admin/user
- create request with proof
- verify request
- create chat
- send/read messages

Run:

```bash
npm run test:e2e:emulator:smoke
```

### Strict suite

Full regression suite. Includes smoke checks plus:
- legacy endpoint blocking checks (`410`)
- pagination contract checks
- proof retention after verification
- fast chat count/admin counts checks
- rate limit behavior check (`429`)

Run:

```bash
npm run test:e2e:emulator:strict
```

### Default emulator test command

```bash
npm run test:e2e:emulator
```

This currently points to the strict suite.

## Notes

- If a local dev server is already running, emulator tests are still safe because they use `next start` on port `3401`.
- On some Linux setups, Firebase emulator may print `::1` port warnings. They are non-blocking if tests pass.

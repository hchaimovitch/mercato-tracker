# Mercato Tracker

Football transfer-window tracker for the Big 5 European leagues (England, France, Germany, Italy, Spain) — dark mode, amber "breaking news" accent, multi-factor reliability scoring. Implemented from the Claude Design prototype in `project/Mercato.dc.html` (design rationale in `chats/chat1.md`).

## Structure

- `backend/` — Node/Express/TypeScript API serving seeded demo transfer data (windows, leagues, clubs, transfers, sources) and all the derived view logic (reliability tiers, corroboration, league/club rollups).
- `app/` — Expo/React Native/TypeScript mobile app (iOS/Android) that consumes the backend.
- `project/`, `chats/` — the original Claude Design handoff bundle, kept for reference.

## Running it

**Backend**

```
cd backend
npm install
npm run dev        # http://localhost:4000
```

**App**

```
cd app
npm install
npm start           # then press i / a / w, or scan the QR code with Expo Go
```

The app auto-discovers the backend on your LAN via the Expo dev server's host address. To point it at a specific URL instead (e.g. testing in a browser), set `EXPO_PUBLIC_API_URL` in `app/.env`:

```
EXPO_PUBLIC_API_URL=http://localhost:4000
```

## Notes

- Club badges are colored initials, not licensed crests (no real logos are bundled).
- "Suivis" (followed transfers) is stored locally on-device (AsyncStorage) — no account/auth system.
- Data is realistic seeded demo content (three mercato windows: Été 2026 live, Hiver 2026 and Été 2025 archived/no-rumor), not a live data feed.

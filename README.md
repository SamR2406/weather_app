# Skywatch Weather
Interactive Next.js (App Router) experience for exploring current conditions, 7‑day outlooks, and hourly previews. Visual layers react to the weather (sun, rain, snow, wind, starfield), and NASA NEO data highlights near‑earth asteroid flybys.

## Features
- City search with Open‑Meteo geocoding and forecast APIs
- Current, hourly, and 7‑day summaries with quick “demo” scenarios for offline previewing
- Animated visual layers: clouds, rain, snow, wind streaks, sun glow, night stars
- Detail drawer that adapts to the selected day with feels‑like temps, wind, humidity, and sunrise/sunset
- NASA Near‑Earth Object feed (optional) with expandable flyby details

## Quick start
Prereqs: Node 20+ and npm.

```bash
npm install
npm run dev
# app runs on http://localhost:3000
```

## Environment
Create a `.env.local` in the project root if you want live NASA flybys (server-only, not exposed to the client):
```
NASA_API_KEY=your_api_key_here
```
Add the same variable in Vercel → Project Settings → Environment Variables. The app calls NASA through a server route (`/api/neo`), so the key never reaches the browser. Without a key, the rest of the app still works and will show a notice in the flyby panel.

## Scripts
- `npm run dev` – start the dev server
- `npm run build` – production build
- `npm run start` – run the built app
- `npm run lint` – lint with ESLint/Next.js config

## Data sources
- Weather + geocoding: [Open‑Meteo](https://open-meteo.com/)
- Near‑Earth Objects: [NASA NEO Feed](https://api.nasa.gov/)

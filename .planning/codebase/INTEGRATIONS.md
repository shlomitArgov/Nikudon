# External Integrations

**Analysis Date:** 2026-07-11

## APIs & External Services

**Content Delivery:**
- Google Fonts API - Hebrew typography
  - Domain: https://fonts.googleapis.com, https://fonts.gstatic.com
  - Font: "Assistant" (weights: 400, 600, 700)
  - Used in: `index.html` (preconnect in head, CSS @import)
  - Purpose: Display Hebrew text with proper typography
  - Fallback: System sans-serif fonts if CDN unavailable

## Data Storage

**Databases:**
- None - Application uses client-side only storage

**Local Storage:**
- Browser LocalStorage - Client-side persistence for user progress
  - Stage progress tracking
  - User session data
  - Practice history (stored locally, not synchronized)

**File Storage:**
- Local filesystem only - Assets bundled in build output
- PWA Cache Storage - Offline asset caching via Service Workers
  - Workbox manages cached assets
  - Includes: JS, CSS, HTML, PNG, SVG, MP3, OGG, WOFF, WOFF2 fonts

**Caching:**
- Service Workers (Workbox) - Built-in browser caching
  - Auto-update pattern: Service worker checks for updates on each load
  - Offline-first strategy: Serves cached assets when offline
  - Cache strategy: Cache-first for static assets with network fallback

## Authentication & Identity

**Auth Provider:**
- None - Application requires no authentication
- Approach: Public, unauthenticated access for all users

## Monitoring & Observability

**Error Tracking:**
- None detected - No error tracking services integrated

**Logs:**
- Console logging only - Browser console for development
- No remote logging or observability service

**Analytics:**
- None detected - No analytics or telemetry service integrated

## CI/CD & Deployment

**Hosting:**
- Static site hosting capable (SPA)
- No backend API endpoint required
- Can deploy to: Vercel, Netlify, GitHub Pages, any static file server, or as PWA bundle
- Current deployment mechanism: Not specified

**CI Pipeline:**
- Not configured or Not detected
- Build command: `npm run build` (TypeScript + Vite build)
- Dev server: `npm run dev` (Vite dev server with HMR)
- Lint check: `npm run lint` (ESLint)

## Environment Configuration

**Required env vars:**
- None - Application has no environment-dependent configuration
- All configuration is static (hardcoded content, PWA manifest)

**Secrets location:**
- N/A - No API keys, secrets, or credentials required

**Configuration Files:**
- `vite.config.ts` - Build and PWA configuration
- `public/manifest.webmanifest` - PWA manifest (app name, icons, display mode)
- `index.html` - HTML entry point with meta tags and font loading

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## Service Worker & PWA Infrastructure

**Workbox Configuration:**
- Location: `vite.config.ts` - VitePWA plugin configuration
- Register Type: autoUpdate - Service worker checks for updates automatically
- Include Assets: favicon.ico, apple-touch-icon.png, mask-icon.svg
- Glob Patterns: `**/*.{js,css,html,ico,png,svg,mp3,ogg,woff,woff2}`
- Purpose: Enable offline-first PWA experience

**PWA Manifest:**
- Path: `public/manifest.webmanifest`
- Name: Nikudon
- Short Name: Nikudon
- Description: Teach kids Hebrew NIKUD symbols
- Display: standalone (native app appearance)
- Orientation: portrait
- Theme Color: #ffffff
- Background Color: #ffffff
- Icons: 192x192 and 512x512 PNG
- Start URL: /

**Browser Installation:**
- App is installable as a PWA on supported browsers
- Can be installed to home screen (mobile) or app drawer (desktop)
- Works offline after installation

## Content & Assets

**Static Content:**
- All lesson content (stages, nikud groups, letters) stored in TypeScript files
  - `src/content/stages.ts` - Stage definitions
  - `src/content/nikudGroups.ts` - Nikud (vowel) groups
  - `src/content/letters.ts` - Letter definitions
- No content loading from external API

**Media:**
- Audio files expected: MP3 and OGG format syllable pronunciations
- Images: SVG and PNG (logos, icons, PWA icons)
- Assets bundled with build output

---

*Integration audit: 2026-07-11*

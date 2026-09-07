# Nikudon — ניקודון

A tablet-first, icon-only Hebrew niqqud (vowel-sign) learning game for
pre-literate children ages 3–6.

Kids already recognize the Hebrew alphabet and can identify the opening sounds
of words, but can't yet read or sound out niqqud. In Nikudon a child picks a
letter, hears a recorded syllable, and taps the matching niqqud symbol — no
reading required, only universal icons (play, checkmark, X, back/home) and
sound.

**Core value:** a child who can't read should be able to play unassisted,
guided purely by sound and icons, and learn to associate niqqud symbols with
their modern Hebrew sounds.

## Tech stack

- **React 18** + **TypeScript 5** — UI and app logic
- **Vite 5** — dev server and build
- **react-router-dom 6** — client-side routing
- **vite-plugin-pwa** / Workbox — installable, offline-capable PWA
- RTL Hebrew layout (`lang="he" dir="rtl"`), tablet-first

## Prerequisites

- **Node.js 18+**
- **npm 7+**

## Getting started

```bash
npm install       # install dependencies
npm run dev       # start the dev server (http://localhost:5173)
```

Open **http://localhost:5173** on a tablet or in a desktop browser.

> **Playtesting tip:** always test on the **dev** server (`:5173`) or in an
> incognito window. The **preview** server (`:4173`) is served by the PWA
> service worker, which caches an old build and can serve stale assets.

## Scripts

| Command           | What it does                                              |
| ----------------- | -------------------------------------------------------- |
| `npm run dev`     | Vite dev server with HMR at `:5173`                      |
| `npm run build`   | Type-check (`tsc`) then build to `dist/`                 |
| `npm run preview` | Serve the production build at `:4173` (uses PWA SW)      |
| `npm run lint`    | ESLint over `.ts`/`.tsx`, zero warnings allowed          |

## How to play

1. **Home** — the menu lists each level with its niqqud shown as buttons. Tap
   each niqqud to hear its **name**. You must tap all of them before the level's
   play button unlocks (this first tap also unlocks audio in the browser).
2. **Letter picker** — the alphabet button (א־ת) lets you choose any of the 22
   non-final Hebrew consonants to drill the level with. The choice is shared
   across screens.
3. **Drill** — a sound plays automatically; tap the niqqud you hear. A correct
   tap flashes green and auto-advances; a wrong tap shows a red X. Every tap
   also plays the sound of the letter+niqqud you selected. Forward/back arrows
   let you skip or revisit trials. The 🏠 button returns to the menu after an
   icon-only confirmation.

## Project structure

```text
src/
  content/        Immutable game data (stages, niqqud groups, letters, audio manifest)
    audio/placeholder/   Placeholder .wav clips (to be replaced with real recordings)
  engine/         Pure, React-free game logic (trial generation, mastery)
  hooks/          useAudioPlayer — Web Audio playback + preloading
  context/        LetterContext — shared selected-letter state
  components/     LetterPicker
  pages/          Home, StagePlayer (each with a co-located .css)
```

See [AGENTS.md](./AGENTS.md) for architecture details and contributor
conventions.

## Audio

Pronunciation must use **real recorded native-speaker clips**, not TTS. The
clips currently in `src/content/audio/placeholder/` are macOS `say`-generated
placeholders and are meant to be swapped for real recordings before release.
Clips are keyed by filename basename:

- `<letter>-<sound>.wav` — a letter with a vowel, e.g. `ב-a.wav`
- `<name>.wav` — a niqqud's spoken name, e.g. `patach.wav`

## PWA / offline

The app is an installable PWA (`registerType: 'autoUpdate'`) and precaches its
assets, including audio, via Workbox — so it works fully offline after the first
load.

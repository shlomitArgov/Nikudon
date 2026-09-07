# AGENTS.md

Guidance for AI coding agents (and humans) working in this repo. Keep changes
consistent with the constraints below — they come from the product goal, not
just style preference.

## What this project is

Nikudon is an **icon-only, audio-driven** Hebrew niqqud game for **pre-literate
children ages 3–6**. The whole UX must be intuitable from sound and universal
icons alone — **no reading required**.

## Hard constraints (do not violate)

- **No reading in the UI.** Communicate through icons (play, ✓, ✕, 🏠, arrows)
  and audio. Avoid adding instructional text a 4-year-old can't read.
- **Real audio, not TTS.** Pronunciation clips must ultimately be native-speaker
  recordings. The current `src/content/audio/placeholder/*.wav` are macOS `say`
  placeholders to be replaced.
- **Niqqud sound-equivalence.** Never present two same-sound niqqud as competing
  distractor options in the same trial. **Kamatz Katan is excluded entirely.**
- **Tablet-first, RTL Hebrew.** Layout is `dir="rtl"`; the first flex child
  renders on the right. Preserve RTL semantics (e.g. `inset-inline-start/end`).
- **Bidi hygiene.** Mixing Hebrew (RTL) and English (LTR) inline is bug-prone.
  Don't put Hebrew-in-parentheses inside English sentences; put Hebrew on its own
  line/element, or wrap with U+2067 … U+2069 directional isolates.
- **Client-side only.** No backend; all data and logic run in the browser.

## Architecture

Layers, from data up to UI:

| Layer     | Location            | Rule                                                        |
| --------- | ------------------- | ---------------------------------------------------------- |
| Content   | `src/content/`      | Immutable `const` data + lookup helpers. Never mutate.     |
| Engine    | `src/engine/`       | **Pure, React-free.** No side effects, no DOM, no audio.   |
| Hooks     | `src/hooks/`        | React + browser APIs (Web Audio) live here, not in engine. |
| Context   | `src/context/`      | Shared state (selected letter) via React Context.          |
| Pages     | `src/pages/`        | UI, input, feedback. One component per file + co-located CSS. |
| Routing   | `src/App.tsx`       | React Router routes, wrapped in `LetterProvider`.          |

Key files:

- `content/nikudGroups.ts` — niqqud grouped by sound (`a`,`e`,`i`,`o`,`u`); each
  grapheme has a glyph, Hebrew `name`, and `audioId`. Carrier is Alef (`א`);
  helpers compose a mark onto any letter (`niqudOn`) or isolate it for display
  (`isolatedNiqud`, using a non-breaking-space carrier so bare marks render).
- `content/stages.ts` — stage/level definitions and in-scope grapheme helpers.
- `content/letters.ts` — the 22 non-final consonants (sofiot excluded).
- `content/audioAssets.ts` — audio manifest via `import.meta.glob`, keyed by
  filename basename.
- `engine/stageRunner.ts` — `generateTrial` / `checkMastery`. Pure. Options are
  drawn only from in-scope groups and are distinct sounds.
- `hooks/useAudioPlayer.ts` — singleton `AudioContext`, preloads clips, `play(key)`
  is **fail-soft (never throws)**; `unlockAudio()` resumes the context on a user
  gesture (iOS/autoplay unlock).
- `pages/StagePlayer.tsx` — the drill: navigable trial history, auto-play,
  auto-advance, letter picker, home-confirm.

## Conventions

- Components: `PascalCase.tsx`; utilities/data: `camelCase.ts`; CSS matches its
  component name and is co-located.
- Functions: `camelCase` verbs; event handlers `handle*`; booleans `is*`/`show*`;
  magic constants `UPPER_CASE`; interfaces/types `PascalCase`.
- Named exports for utilities/data; default export for components.
- Relative imports with explicit extensions; no path aliases.
- Single quotes, semicolons, trailing commas in multiline. TypeScript **strict**
  mode with `noUnusedLocals`/`noUnusedParameters` — no dead code.
- Audio access is **fail-soft**: missing clips `console.warn`, never throw or
  `alert`. Keep that contract when touching the audio path.

## Working in this repo

```bash
npm install
npm run dev      # http://localhost:5173  — playtest here (NOT :4173, stale SW)
npm run lint     # zero warnings allowed
npm run build    # tsc + vite build; run before considering a change done
```

Before finishing any change, run **`npm run build`** (type-check) and
**`npm run lint`**. Both must pass.

### Git

- `main` is protected — **branch + PR, never commit to `main`.**
- End commit messages with:
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`

### Planning workflow (GSD)

This repo uses the GSD workflow; planning artifacts live in `.planning/`. For
non-trivial work, prefer the GSD entry points (`/gsd-quick`, `/gsd-debug`,
`/gsd-execute-phase`) so planning state stays in sync. Small, explicitly
requested tweaks may be made directly.

## Adding content

- **A new niqqud/sound:** extend `nikudGroups.ts` (respect sound-equivalence and
  the Kamatz-Katan exclusion), reference it from a stage in `stages.ts`, and add
  matching audio clips.
- **Audio clips:** drop `.wav`/`.mp3` into `src/content/audio/placeholder/`, keyed
  by basename — `<letter>-<sound>.wav` for a syllable, `<name>.wav` for a niqqud
  name. The glob in `audioAssets.ts` picks them up automatically.

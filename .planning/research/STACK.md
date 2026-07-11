# Stack Research

**Domain:** Audio playback layer for a Hebrew niqqud phonics PWA (short pre-recorded syllable clips, tapped repeatedly by children ages 3-6, offline-capable via existing vite-plugin-pwa/workbox setup)
**Researched:** 2026-07-11
**Confidence:** MEDIUM-HIGH (native browser APIs and platform behavior, cross-verified across MDN, Chrome DevRel, WebKit bug tracker, npm/GitHub registry data — no single-source claims; no Context7/MCP docs tool was available in this environment, WebSearch was cross-checked per claim instead)

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Web Audio API (`AudioContext`, `decodeAudioData`, `AudioBufferSourceNode`) | Native browser API — no version, universally supported on target tablet browsers (iOS Safari 11.1+, Android Chrome/WebView) | Decode and play the ~dozens of short (letter+niqqud) syllable clips with minimal, consistent latency | This is the documented "gold standard" pattern for low-latency repeated short-clip playback. Preload once via `fetch()` + `decodeAudioData()` into an in-memory `AudioBuffer`, then create a fresh, cheap `AudioBufferSourceNode` on every tap. This sidesteps a known, still-current Safari bug where calling `.play()` more than once on the same `<audio>` element introduces a re-trigger delay — exactly the "child taps play repeatedly" scenario this app needs to handle cleanly. |
| No audio library (Howler.js, use-sound, etc.) — build a ~50-line custom `audioEngine.ts`/`useAudioPlayer` hook instead | N/A | Wrap AudioContext lifecycle, buffer cache, and play() in project-specific code | The use case is narrow: one short mono clip at a time, no spatial audio, no crossfading, no streaming, no playlists. A hand-rolled wrapper over the native API is ~50 lines, has zero third-party maintenance risk, and is easier for future contributors to reason about than a general-purpose audio library's API surface. See "What NOT to Use" for why Howler specifically is a poor fit here. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| *(none required)* | — | — | This app's audio needs (decode + play short buffers, single voice at a time) are fully covered by the native Web Audio API. Do not add a runtime audio dependency for this feature. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| ffmpeg (or any audio editor) — offline, not an npm dependency | Normalize recorded clips: trim silence, normalize loudness (e.g. `-af loudnorm`), export consistent mono MP3 at ~64-96kbps | Keeps each clip small (well under Workbox's default 2 MiB per-file precache limit) and consistent in volume so kids don't hear jarring loudness jumps between letters. Run once per clip during content authoring, not part of the build pipeline. |
| Existing `vite-plugin-pwa` (already `^0.17.4` in this repo) | Precaches built audio assets via `workbox.globPatterns` | Already configured to include `mp3,ogg` in `vite.config.ts` — no change needed to the plugin or its config shape for this feature. Just confirm every new clip file lands somewhere the existing glob covers (see Stack Patterns below). |

## Installation

```bash
# No new runtime dependencies needed — Web Audio API is built into the browser.
# Nothing to add to package.json "dependencies" for audio playback.
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|--------------------------|
| Native Web Audio API, hand-rolled hook | Howler.js (`howler` on npm) | If the app later needs spatial/3D audio, crossfading, streaming of long audio (background music), or a large sprite-based sound bank with complex sequencing — none of which apply to short single-voice syllable playback. Even then, weigh its stale maintenance status (see below) against the convenience gained. |
| Native Web Audio API | `use-sound` (React hook wrapping Howler) | If the team wants a drop-in hook API and is comfortable inheriting Howler as a transitive dependency purely for convenience. Given the tiny custom hook this app needs, this trades a few lines of code for an extra (semi-stale) dependency — not a good trade here. |
| Per-clip individual MP3 files, precached by existing Workbox `globPatterns` | Audio sprite (all clips concatenated into one file + timing JSON, e.g. via `audiosprite` npm tool) | Reconsider if/when the full 22-letter × 5-sound-group curriculum (~100+ clips) causes precache-manifest bloat, request-count concerns on very slow first-install networks, or asset management pain. Not needed for level 1 (single letter, 2 sounds) or even the near-term full curriculum size — individual files keep the `letter+niqqud → URL` data model simple and each new clip is a one-line content addition. |
| Single MP3 format per clip | Dual-format MP3 + OGG/Opus | Only relevant if targeting older/niche browsers without MP3 support. MP3's patents expired in 2017 and it is universally supported by `decodeAudioData` on every tablet browser this app targets (iOS Safari, Android Chrome/WebView) — dual-format encoding is unneeded complexity here. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|--------------|
| Howler.js (`howler` npm package) | Latest published version is 2.2.4 with no new npm release in roughly 3 years; GitHub shows minimal recent PR/issue activity despite a large install base. It's a fine, stable library, but for a long-lived educational app it's an unnecessary dependency risk when the feature need is this narrow — you'd be pulling in an unmaintained abstraction over an API you can call directly. | Native Web Audio API via a small custom hook |
| `use-sound` (or any Howler wrapper) | Thin convenience layer around Howler (~1KB) that still lazy-loads Howler itself; inherits the same maintenance-staleness concern for no functional gain over a purpose-built hook this small. | Native Web Audio API via a small custom hook |
| Plain `HTMLAudioElement` (`<audio>` / `new Audio()`) as the *primary* playback mechanism, especially with `.currentTime = 0` reset-and-replay for repeat taps | As of recent Safari versions, calling `.play()` more than once on the same `<audio>` element introduces a playback delay — a real, currently-documented WebKit issue. Safari also frequently ignores `preload="auto"` and only fetches metadata, adding first-play latency exactly when a child taps "play" for the first time on a screen. This is the opposite of the "no lag on repeated taps" requirement. | Web Audio API `AudioBufferSourceNode`, freshly created per playback from a pre-decoded `AudioBuffer` |
| Audio sprites for the current (level 1) scope | Solves an HTTP-request-count problem this app doesn't have yet (dozens of tiny files precached once at install time via Workbox, not fetched per-tap over the network) and adds a build step and indirection (offset/duration lookup table) with no current benefit. | Individual small MP3 files, one per (letter, niqqud) pair, named predictably |

## Stack Patterns by Variant

**If audio clip URLs are built dynamically from data (e.g. `` `/audio/${letterId}-${niqqudId}.mp3` `` inside `letters.ts`/`nikudGroups.ts`-driven content):**
- Put the MP3 files in `public/audio/` (not `src/assets/`), so they get stable, predictable filenames the content data files can reference by string path without importing each one individually.
- They still get picked up by the existing `workbox.globPatterns: ['**/*.{js,css,html,ico,png,svg,mp3,ogg,woff,woff2}']` in `vite.config.ts` (already includes `mp3`/`ogg`) — no config change needed, just drop files into `public/audio/`.
- Trade-off accepted knowingly: `public/` assets skip Vite's content-hash cache-busting. This is fine here because Workbox's own precache manifest (which hashes file *contents*, not filenames) is what actually drives cache invalidation and update detection for this PWA — that's a separate, already-working mechanism from Vite's `src/assets` import hashing.

**If instead each clip is referenced by an explicit `import` in a small number of places (unlikely to scale well past a handful of files, not recommended for ~dozens of data-driven clips):**
- Use `src/assets/audio/*.mp3` and import per file to get Vite's automatic content-hashed cache busting.
- Not recommended here given the data-driven (letter × niqqud-group) nature of this content — `public/audio/` with a naming convention is the better fit.

**AudioContext creation/unlock strategy (applies regardless of file location):**
- Create a single, module-level lazy `AudioContext` (or `webkitAudioContext` fallback) the first time it's needed, and call `.resume()` on it inside the handler of the very first user tap in the app session (e.g. attach a one-time `pointerdown`/`touchend` listener at the app root, or piggyback on the first letter-picker tap). Per MDN and cross-referenced implementation reports, once unlocked for the origin/session it stays usable for all subsequent programmatic playback on other screens — no need to re-unlock per screen or per clip.
- Because every play in this app *is* a direct result of a tap (play button, or a correct-answer confirmation chime triggered synchronously from the tap handler), true unsolicited autoplay is never attempted — the only real risk is the unlock happening late (first tap) rather than not at all, so make sure the first screen the child sees performs (or piggybacks on) that unlock.

**Preloading strategy for "no lag on repeated taps":**
- On stage/letter load, `Promise.all` a `fetch()` + `decodeAudioData()` for every clip the *current* trial set could need (small set — level 1 is a handful of clips per letter), caching the resulting `AudioBuffer`s in a `Map<clipId, AudioBuffer>` kept in a module-level or context-level store (not component state, to survive re-renders).
- Because Workbox has already precached the raw MP3 bytes at PWA-install time (service worker `CacheFirst` via the precache manifest), the `fetch()` calls above resolve from the service worker cache instantly, even fully offline — decoding is the only cost, and it happens once per clip, not once per tap.
- Play by creating a new `AudioBufferSourceNode` per tap (`ctx.createBufferSource()`, assign `.buffer`, `.connect(ctx.destination)`, `.start(0)`) — cheap, and lets rapid repeated taps overlap or cut cleanly without the Safari re-play delay bug described above.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|------------------|-------|
| Web Audio API | iOS Safari 11.1+, Chrome/Android WebView (all versions this project targets), existing `React 18.2.0` / `Vite 5.0.8` stack | No new build tooling or type packages needed; `AudioContext` types are part of `lib.dom.d.ts`, already available under the project's existing `tsconfig.json` (`target: ES2020`). |
| `vite-plugin-pwa@0.17.4` (existing) | Existing `workbox.globPatterns` already lists `mp3,ogg` | No plugin/version change required for this feature. Note for awareness only (not a required change): Workbox's default `maximumFileSizeToCacheInBytes` is 2 MiB *per file* — short spoken-syllable MP3s at ~64-96kbps mono are typically tens of KB, far under this, so no config bump is needed unless a future clip is unusually long. |

## Sources

- MDN Web Docs — `BaseAudioContext.decodeAudioData()`, `AudioBuffer`, Autoplay guide for media and Web Audio APIs — confidence: HIGH (official spec/vendor documentation, cross-referenced across multiple independent search results)
- Chrome for Developers — "Web Audio FAQ" (developer.chrome.com/blog/web-audio-faq) — confidence: HIGH (official vendor documentation)
- WebKit Bug Tracker (bugs.webkit.org) — issues on `HTMLAudioElement` repeat-play delay and Web Audio glitches in Safari — confidence: MEDIUM-HIGH (primary source bug reports, corroborated by independent blog write-ups describing the same symptom)
- Matt Montag, "Unlock JavaScript Web Audio in Safari and Chrome" — confidence: MEDIUM (independent implementation write-up, corroborated by MDN's autoplay guide and multiple other sources describing the same unlock-on-first-gesture pattern)
- npm registry (`howler`, `use-sound` package pages) + Snyk Advisor + GitHub Releases for `goldfire/howler.js` — confidence: HIGH (primary registry/repo metadata: last publish dates, version numbers, activity signals)
- Vite official docs, "Static Asset Handling" (vite.dev/guide/assets) — confidence: HIGH (official documentation) — used to confirm `public/` vs `src/assets/` behavior and Workbox precache interaction
- vite-plugin-pwa docs (vite-pwa-org.netlify.app) + GitHub issues — confidence: MEDIUM-HIGH (official plugin docs, cross-checked against a GitHub issue confirming the 2 MiB default and per-strategy config keys)
- No Context7/MCP documentation tool was available in this execution environment; all findings above were obtained via WebSearch and cross-checked against at least one primary source (MDN, vendor blog, npm/GitHub registry, or official plugin docs) per claim, per this project's `<source_hierarchy>` protocol.

---
*Stack research for: Hebrew niqqud phonics PWA — audio clip playback layer*
*Researched: 2026-07-11*

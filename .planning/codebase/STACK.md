# Technology Stack

**Analysis Date:** 2026-07-11

## Languages

**Primary:**
- TypeScript 5.2.2 - Application logic and type safety
- JavaScript (ES2020) - Generated output
- HTML5 - Markup with RTL support for Hebrew
- CSS3 - Styling with responsive design

**Compilation:**
- JSX (React) - Component syntax

## Runtime

**Environment:**
- Node.js - Development and build time only
- Browser (Modern browsers with ES2020+ support) - Production runtime
- Service Workers - Offline functionality via Workbox

**Package Manager:**
- npm 7.28.6+
- Lockfile: package-lock.json (present)

## Frameworks

**Core:**
- React 18.2.0 - UI library and component framework
- React DOM 18.2.0 - React rendering to DOM

**Routing:**
- React Router DOM 6.20.0 - Client-side routing and navigation

**Build/Dev:**
- Vite 5.0.8 - Build tool and dev server
- @vitejs/plugin-react 4.2.1 - React support for Vite
- TypeScript 5.2.2 - Type checking and compilation

**PWA/Offline:**
- vite-plugin-pwa 0.17.4 - PWA plugin for Vite
- workbox-window 7.0.0 - Service worker client library
- Workbox suite (via plugin) - Offline caching and service worker management

## Key Dependencies

**Critical:**
- react 18.2.0 - Core UI framework
- react-dom 18.2.0 - DOM rendering
- react-router-dom 6.20.0 - Routing and navigation
- vite 5.0.8 - Build system and dev server
- vite-plugin-pwa 0.17.4 - Progressive Web App support with auto-updates
- workbox-window 7.0.0 - PWA runtime API
- typescript 5.2.2 - TypeScript compiler

**Build/Bundling:**
- esbuild - Fast JavaScript bundler (used by Vite)
- terser - JavaScript minifier (used by Vite)
- rollup - Module bundler (used by Vite)

**Linting/Quality:**
- eslint 8.55.0 - Code linting
- @typescript-eslint/eslint-plugin 6.14.0 - TypeScript linting rules
- @typescript-eslint/parser 6.14.0 - TypeScript parser for ESLint
- eslint-plugin-react-hooks 4.6.0 - React hooks linting
- eslint-plugin-react-refresh 0.4.5 - React refresh validation

**Type Definitions:**
- @types/react 18.2.43 - React type definitions
- @types/react-dom 18.2.17 - React DOM type definitions

## Configuration

**TypeScript:**
- Target: ES2020
- Module: ESNext
- JSX: react-jsx
- Strict mode: enabled (noUnusedLocals, noUnusedParameters, noFallthroughCasesInSwitch)
- Config: `tsconfig.json`, `tsconfig.node.json`

**Build:**
- Vite config: `vite.config.ts`
- Entry point: `index.html` with script module loading `src/main.tsx`
- Output: `dist/` directory (dist included in .gitignore)

**Linting:**
- ESLint config: `.eslintrc.cjs`
- Rules: TypeScript ESLint recommended, React Hooks recommended, React Refresh warnings
- Parser: @typescript-eslint/parser

**PWA:**
- Manifest: `public/manifest.webmanifest` and auto-generated in build
- Icons: 192x192 and 512x512 PNG files
- Name: Nikudon
- Display: standalone (native app-like appearance)
- Orientation: portrait
- Theme color: #ffffff

## Platform Requirements

**Development:**
- Node.js 18+ (implied from package setup)
- npm 7+
- Modern browser with ES2020 support

**Production:**
- Browser: Modern browsers with Service Worker support (Chrome 40+, Firefox 44+, Safari 11.1+, Edge 17+)
- Network: Optional - app works fully offline after initial install via PWA caching
- Storage: LocalStorage capability for client-side persistence
- RTL Support: HTML lang="he" dir="rtl" for Hebrew language and text direction

**Browser APIs Used:**
- Service Workers - Offline caching and background sync
- Web Manifest API - PWA installation
- LocalStorage - Client-side data persistence
- Web Audio API - For audio playback of Hebrew syllables
- Fetch API - For resource loading

---

*Stack analysis: 2026-07-11*

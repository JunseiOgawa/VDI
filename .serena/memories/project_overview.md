## Project Purpose
This application is a standalone image viewer optimized for use with VR goggles, built using Tauri. It aims to make image checking easier through VR passthrough and allows easier image viewing using VR controllers. It is lightweight and can be launched quickly.

## Tech Stack
- Frontend: TypeScript, Vite, TailwindCSS, PostCSS
- Backend: Rust (Tauri)
- Build: Tauri CLI, Vite
- Dependencies: @tauri-apps/api, @tauri-apps/plugin-opener, serde, serde_json

## Code Style and Conventions
- TypeScript: Strict mode enabled, no unused locals/parameters, ES2020 target, module ESNext
- Rust: Edition 2021, standard Tauri setup
- Naming: Standard camelCase for JS/TS, snake_case for Rust
- No specific docstring conventions mentioned, but strict typing enforced

## Commands for Task Completion
- Linting: Not specified (no linting tools in package.json)
- Formatting: Not specified (no formatter in package.json)
- Testing: Not specified (no test scripts or frameworks)
- Building: `npm run build` or `tauri build`
- Development: `npm run dev` (runs Vite and Tauri dev concurrently)

## Rough Structure of Codebase
- `src/`: TypeScript frontend code
  - `main.ts`: Entry point
  - `features/`: Modular features like imageViewer, theme, zoom, utils
  - `types/`: Type definitions
  - `config/`: Configuration
- `src-tauri/`: Rust backend (Tauri)
  - `src/main.rs`: Rust entry point
  - `Cargo.toml`: Rust dependencies
  - `tauri.conf.json`: Tauri configuration

## Commands for Testing, Formatting, and Linting
- Testing: None specified
- Formatting: None specified
- Linting: None specified

## Commands for Running Entrypoints
- Frontend dev: `npm run dev` (starts Vite and Tauri dev)
- Tauri dev: `npx tauri dev`
- Build: `tauri build`
- Preview: `npm run preview`

## Util Commands for the System (Windows)
- Git: `git` (assuming installed)
- List dir: `dir` or `ls` (bash)
- Change dir: `cd`
- Grep: `grep` (if available, or use findstr)
- Find: `find` or `where`

## Guidelines, Styles, Design Patterns
- CSP: Asset protocol enabled with scope "**", note security risk with CDN modifications
- Window: Transparent, no decorations, default 800x600
- Design: Modular features in src/features/
- Patterns: Standard Tauri app structure, Vite for bundling
## Code Style and Conventions

### TypeScript
- Strict mode: Enabled
- Target: ES2020
- Module: ESNext
- Linting: noUnusedLocals, noUnusedParameters, noFallthroughCasesInSwitch
- Imports: ES modules with .ts extensions allowed

### Rust
- Edition: 2021
- Crate type: staticlib, cdylib, rlib
- Dependencies: Standard Tauri setup

### General
- Naming: camelCase for TypeScript, snake_case for Rust
- Structure: Modular features in src/features/
- No specific formatting or linting tools enforced
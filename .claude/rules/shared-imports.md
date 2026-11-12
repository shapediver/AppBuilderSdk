---
paths:
    - "src/shared/**/*.ts"
    - "src/shared/**/*.tsx"
---

# Imports in src/shared

- Don't create `index.ts` barrels that re-export a slice or segment, and don't extend existing ones. Import the concrete module: `@AppBuilderLib/entities/parameter/config/propsParameter`, not `@AppBuilderLib/entities/parameter` or `.../config`. Exception: `shared/mantine-props/index.ts`, which its `AGENTS.md` says to export from.
- Cross-slice imports use `@AppBuilderLib/{layer}/{slice}/{segment}/{file}`. Imports inside a slice are relative.

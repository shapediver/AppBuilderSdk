# Zod-first Icon theme defaultProps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `Icon` theme `defaultProps` **Zod-first**: one schema defines JSON validation and TypeScript theme props; `themeComponentDefaultPropsRegistry` imports that schema instead of duplicating fields.

**Architecture:** Colocate in **`Icon.types.ts`** (types + theme Zod in one place; no separate schema file): export `IconThemeDefaultPropsSchema`, `type IconThemeDefaultProps = z.infer<typeof …>`, and `iconThemeDefaultStyleProps` via `IconThemeDefaultPropsSchema.parse(…)` (same values as today’s `defaultStyleProps`). `Icon.tsx` imports those symbols from `./Icon.types`; `IconThemeProps` uses `IconThemeDefaultProps`; `useIconProps` passes `iconThemeDefaultStyleProps` into `useProps("Icon", …)`. `features/appbuilder/config/themeComponentDefaultPropsRegistry.ts` imports `IconThemeDefaultPropsSchema` from `@AppBuilderLib/shared/ui/icon` (barrel re-export from `./Icon.types`) or from `@AppBuilderLib/shared/ui/icon/Icon.types` if needed for FSD/lint. FSD: **features → shared** is allowed; `shared` must not import `features`.

**Tech Stack:** Zod 4, TypeScript, Jest (existing theme validation tests).

**Worktree:** Implement in **git submodule** `src/shared` (AppBuilderShared); then bump submodule pointer in parent repo if you work from the monorepo root.

---

## File map

| File | Action |
|------|--------|
| `src/shared/shared/ui/icon/Icon.types.ts` | **Modify** — Add `import {z} from "zod"`. Remove `defaultStyleProps` and `IconThemePropsType`. Add `IconThemeDefaultPropsSchema`, `IconThemeDefaultProps`, `iconThemeDefaultStyleProps` (after `IconProps` / related types so the file stays readable). Keep `IconProps`, `IconType`, `sizeMap`, `CustomCSSProperties`. |
| `src/shared/shared/ui/icon/Icon.tsx` | **Modify** — Import `IconThemeDefaultProps`, `iconThemeDefaultStyleProps` from `./Icon.types`; drop `defaultStyleProps` / `IconThemePropsType` imports; `IconThemeProps(props: IconThemeDefaultProps)`; `useIconProps` uses `useProps("Icon", iconThemeDefaultStyleProps, props)`. No `zod` import in `Icon.tsx`. |
| `src/shared/shared/ui/icon/index.ts` | **Modify** — Re-export `IconThemeDefaultPropsSchema`, `iconThemeDefaultStyleProps`, type `IconThemeDefaultProps` from `./Icon.types`. |
| `src/shared/features/appbuilder/config/themeComponentDefaultPropsRegistry.ts` | **Modify** — Replace inline `Icon: z.strictObject({…})` with `Icon: IconThemeDefaultPropsSchema` imported from `@AppBuilderLib/shared/ui/icon` (or `…/icon/Icon.types`). |
| `src/shared/features/appbuilder/config/validateAppBuilderSettingsJson.themeComponents.test.ts` | **Unchanged behavior** — run after refactor to confirm green. |

---

### Task 1: Zod-first theme in `Icon.types.ts` + wire `Icon.tsx`

**Files:**
- Modify: `src/shared/shared/ui/icon/Icon.types.ts`
- Modify: `src/shared/shared/ui/icon/Icon.tsx`

- [ ] **Step 1: Edit `Icon.types.ts`**

1. Add at top (after existing imports, before or after other imports as fits ESLint):

```typescript
import {z} from "zod";
```

2. Remove:

```typescript
export const defaultStyleProps: Partial<IconProps> = {
	size: "1.5rem",
	stroke: "1px",
};
export type IconThemePropsType = Partial<IconProps>;
```

3. After `IconProps` (and related types) are defined, append:

```typescript
/**
 * Single source of truth for Icon theme `defaultProps` (Mantine theme + settings JSON validation).
 * Keys must stay aligned with `useProps("Icon", …)`.
 */
export const IconThemeDefaultPropsSchema = z.strictObject({
	size: z.union([z.string(), z.number()]).optional(),
	stroke: z.union([z.string(), z.number()]).optional(),
});

export type IconThemeDefaultProps = z.infer<typeof IconThemeDefaultPropsSchema>;

/** Defaults passed to `useProps`; validated so drift vs schema fails in tests/runtime. */
export const iconThemeDefaultStyleProps: IconThemeDefaultProps =
	IconThemeDefaultPropsSchema.parse({
		size: "1.5rem",
		stroke: "1px",
	});
```

- [ ] **Step 2: Edit `Icon.tsx`**

1. Imports from `./Icon.types` should include `IconThemeDefaultProps`, `iconThemeDefaultStyleProps` and must **not** import `defaultStyleProps` or `IconThemePropsType`.

2. Replace `IconThemeProps`:

```typescript
export function IconThemeProps(
	props: IconThemeDefaultProps,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}
```

3. Replace `useIconProps`:

```typescript
export function useIconProps(props: Partial<IconProps>): Partial<IconProps> {
	return useProps("Icon", iconThemeDefaultStyleProps, props);
}
```

- [ ] **Step 3: `tsc` (submodule)**

```bash
cd d:/projects/ShapeDiverCreateReactAppExample/src/shared && pnpm exec tsc --noEmit
```

Expected: **PASS**

- [ ] **Step 4: Commit (submodule)**

```bash
cd d:/projects/ShapeDiverCreateReactAppExample/src/shared
git add shared/ui/icon/Icon.types.ts shared/ui/icon/Icon.tsx
git commit -m "SS-9463: Zod-first Icon theme defaultProps in Icon.types.ts"
```

---

### Task 2: Barrel exports + registry import

**Files:**
- Modify: `src/shared/shared/ui/icon/index.ts`
- Modify: `src/shared/features/appbuilder/config/themeComponentDefaultPropsRegistry.ts`

- [ ] **Step 1: Extend `index.ts`**

Re-export from `./Icon.types`:

```typescript
export {
	IconThemeDefaultPropsSchema,
	iconThemeDefaultStyleProps,
} from "./Icon.types";
export type {IconThemeDefaultProps} from "./Icon.types";
```

(Keep existing exports; add these alongside.)

- [ ] **Step 2: Slim registry**

```typescript
import {z} from "zod";
import {IconThemeDefaultPropsSchema} from "@AppBuilderLib/shared/ui/icon";

export const themeComponentDefaultPropsRegistry = {
	Icon: IconThemeDefaultPropsSchema,
} as const satisfies Record<string, z.ZodTypeAny>;
```

Update the registry file comment: **Icon schema lives in `shared/ui/icon/Icon.types.ts` (Zod-first).**

If ESLint FSD rejects the barrel path, use `@AppBuilderLib/shared/ui/icon/Icon.types` for the schema import.

- [ ] **Step 3: Tests**

```bash
cd d:/projects/ShapeDiverCreateReactAppExample && pnpm exec jest src/shared/features/appbuilder/config/validateAppBuilderSettingsJson.themeComponents.test.ts --no-cache
```

Expected: **PASS** (2 tests).

- [ ] **Step 4: `tsc` from parent**

```bash
cd d:/projects/ShapeDiverCreateReactAppExample && pnpm exec tsc --noEmit
```

Expected: **PASS**

- [ ] **Step 5: Commit (submodule)**

```bash
cd d:/projects/ShapeDiverCreateReactAppExample/src/shared
git add shared/ui/icon/index.ts features/appbuilder/config/themeComponentDefaultPropsRegistry.ts
git commit -m "SS-9463: registry imports Icon schema from Icon.types barrel"
```

---

### Task 3: Parent repo submodule pointer (if applicable)

- [ ] **From monorepo root**

```bash
cd d:/projects/ShapeDiverCreateReactAppExample
git add src/shared
git commit -m "SS-9463: bump shared submodule (Zod-first Icon in Icon.types.ts)"
```

---

## Plan self-review

| Requirement | Task |
|-------------|------|
| Schema primary, type `z.infer` | Task 1 (`Icon.types.ts`) |
| No separate `Icon.theme.schema.ts` | Architecture + Task 1 |
| No duplicate field definitions in registry | Task 2 |
| `useProps("Icon", defaults, …)` unchanged semantically | Task 1 (`parse` same values as old defaults) |
| FSD boundaries | Registry imports **down** into shared only |
| JSON validation unchanged | Same Zod object reference in registry |

**Placeholder scan:** none.

---

## Execution handoff

Plan saved to `docs/superpowers/plans/2026-05-11-zod-first-icon-theme-defaultprops.md`.

**1. Subagent-Driven** — one subagent per task above + reviews.  
**2. Inline** — implement Tasks 1–2 in order in one session.

After merge, **optional follow-up:** document the same pattern for the next component (e.g. `ExportButtonComponent`) in `custom-component.mdc` or team wiki.

---

## Appendix A — Inventory: `theme.components` keys (custom / themed)

**Источник:** ключи в `useCustomTheme.ts` в `components: { … }` (то, что реально можно переопределить в JSON через `themeOverrides.components.<Key>`), плюс сверка с `useProps("…")` в коде.

**Важно:** ключ в JSON **должен совпадать** с первым аргументом `useProps` для этого блока стилей. Пример несоответствия имени: компонент `MultiSelectCheckboxesComponent`, а `useProps` — **`"MultiSelectCheckboxes"`**; в теме в `useCustomTheme` ключ — **`MultiSelectCheckboxes`**. В реестре валидатора использовать **именно строку из `useProps`**.

### Список (алфавит, дедуп)

| `useProps` / theme key | Примечание |
|------------------------|------------|
| `AppBuilderActionComponent` | |
| `AppBuilderAgentWidgetComponent` | |
| `AppBuilderAppShellTemplatePage` | |
| `AppBuilderContainer` | |
| `AppBuilderContainerWrapper` | |
| `AppBuilderGridTemplatePage` | |
| `AppBuilderHorizontalContainer` | |
| `AppBuilderImage` | |
| `AppBuilderTemplateSelector` | |
| `AppBuilderTextWidgetComponent` | |
| `AppBuilderVerticalContainer` | |
| `CreateModelStateHook` | |
| `DefaultSession` | |
| `DesktopClientPanel` | |
| `ExportButtonComponent` | |
| `ExportLabelComponent` | |
| `Icon` | уже в реестре (Zod-first в `Icon.types.ts`) |
| `LoaderPage` | |
| `MarkdownWidgetComponent` | |
| `ModalBase` | |
| `MultiSelectCheckboxes` | не путать с именем файла компонента |
| `NotificationWrapper` | |
| `OutputChunkLabelComponent` | |
| `OutputStargateComponent` | |
| `ParameterColorComponent` | |
| `ParameterDraggingComponent` | |
| `ParameterGumballComponent` | |
| `ParameterLabelComponent` | |
| `ParameterSelectComponent` | |
| `ParameterSelectionComponent` | |
| `ParameterSliderComponent` | |
| `ParameterStargateComponent` | |
| `SelectCarouselComponent` | |
| `SelectColorComponent` | |
| `SelectGridComponent` | |
| `StargateInput` | |
| `StargateShared` | второй `useProps` внутри `ExportButtonComponent`, не «экспорт» в смысле файла |
| `TooltipWrapper` | |
| `ViewportBranding` | |
| `ViewportComponent` | |
| `ViewportIconButton` | |
| `ViewportIconButtonDropdown` | |
| `ViewportIcons` | |
| `ViewportOverlayWrapper` | |

**Отдельно (theme без отдельного ключа в таблице выше):** `ParameterBooleanComponent` — есть `useProps("ParameterBooleanComponent", …)`; проверить, есть ли он в `useCustomTheme` под тем же ключом (если нет — JSON overrides для него через общий Mantine-путь не попадут в реестр до добавления в тему).

---

## Appendix B — Сложные кейсы валидации

1. **Вложенные Mantine props (`buttonProps`, `tooltipProps`, …)**  
   Полное отражение `ButtonProps` в Zod тяжёлое и дублирует Mantine. Практика: **узкий strict-слой** только для полей, которые реально кладут в settings JSON, плюс `z.custom` / `passthrough` для редких случаев — или оставить глубину 1–2 уровня с `JsonValue` только для листьев (ослабляет строгость).

2. **Несколько `useProps` в одном файле**  
   Пример: `ExportButtonComponent` + **`StargateShared`**. В JSON два ключа: `ExportButtonComponent` и при необходимости переопределения общих стилей старгейта — `StargateShared`. Два независимых Zod-first модуля/схемы, два входа в реестре.

3. **Имя компонента ≠ имя файла**  
   Ошибка в реестре = «тихий» пропуск валидации (политика registry-only). В плане на каждый PR: grep `useProps("` и сверка с ключами реестра.

4. **`Partial<>` и обязательные theme-поля**  
   Исторически `downloadTooltipProps` в типе могли требоваться, в theme — partial. Zod-схема для JSON должна отражать **фактически допустимый** JSON (обычно все ключи optional), иначе пустой `{}` в теме станет ошибкой.

5. **Совместимость TS и Zod (Icon / stroke)**  
   Поля, где Iconify/Mantine TS уже `string`, а JSON хотел `number`, — схему сужать под TS **или** каст при вызове `useProps` (хуже). Предпочтительно согласовать схему с типами листьев.

6. **Кросс-слайс импорт в реестр**  
   `features/appbuilder` → `shared/.../Icon.types.ts`: предпочтительно **относительный путь** внутри субмодуля, пока корневой Jest не умеет `@AppBuilderLib` (см. текущий `themeComponentDefaultPropsRegistry.ts`).

### Подходы к rollout (кратко)

| Подход | Плюс | Минус |
|--------|------|------|
| **A. По волнам (shared UI → entities → pages)** | Меньше риска, проще ревью | Дольше до полного покрытия |
| **B. По частоте JSON / боли** | Быстрая польза | Неровное покрытие |
| **C. Строго по алфавиту** | Предсказуемо | Может откладывать важные |

**Рекомендация:** **A** или **B** в зависимости от того, что чаще правят в JSON на проде.

---

## Appendix C — Следующие шаги плана (после Icon)

Для каждого ключа из Appendix A (кроме уже сделанного `Icon`):

1. Вынести / объявить `*ThemeDefaultPropsSchema` (Zod-first рядом с типами, как для `Icon` в `*.types.ts` или колонке рядом с компонентом по соглашению команды).
2. Импортировать схему в `themeComponentDefaultPropsRegistry.ts` (относительный импорт из `features/appbuilder/config` при необходимости для Jest).
3. Добавить минимальный тест на `validateAppBuilderSettingsJson` **опционально** раз на компонент или один parametrized suite — по решению команды (избежать взрыва размера тестов).

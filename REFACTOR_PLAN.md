# Refactor Plan

## Goal
Improve maintainability of the editor codebase by:
- reducing component and context bloat,
- restoring a clean type/build baseline,
- separating UI from domain/io logic,
- removing duplication and dead code,
- preserving behavior while refactoring incrementally.

This plan is intentionally incremental and test-first, so each phase can be merged safely.

## Scope
Primary focus: `src/components/**`, with related moves into `src/domain/**`, `src/features/**`, and `src/shared/**`.

Out of scope for now:
- visual redesign,
- feature changes,
- performance micro-optimizations not caused by architecture.

## Success Criteria
- `pnpm.cmd run build` passes.
- `pnpm.cmd test` passes.
- No user-visible regressions in editor flows (build workout, import/export, library operations).
- Smaller, clearer module boundaries:
  - UI components in UI folders.
  - parsing/serialization/business logic outside `components`.
- Reduced prop/context surface in editor UI.

## Phase 0: Baseline Stabilization (must pass first)
Purpose: ensure we can refactor with confidence.

Tasks:
1. Fix current TypeScript/build errors.
2. Fix failing tests/type assertions.
3. Run and record baseline commands:
   - `pnpm.cmd run build`
   - `pnpm.cmd test --run`

Acceptance:
- Both commands pass in CI/local.

## Phase 1: Define Module Boundaries
Purpose: establish target folder conventions before moving files.

Target structure:
- `src/features/editor/` for editor-specific UI/state/hooks.
- `src/domain/workout/` for shared workout types, metrics, zones, pace helpers.
- `src/domain/workout/xml/` for serializer/parser.
- `src/shared/ui/` for generic UI components (if reused).

Tasks:
1. Create folders and barrel files where needed.
2. Document import rules in this file:
   - domain must not import from components/features UI.
   - features may import from domain/shared.

Acceptance:
- New folders exist.
- No behavior changes yet.

## Phase 2: Extract Domain Types + Utilities from `components`
Purpose: remove cross-layer dependency inversion.

Move:
1. `src/components/Editor/editorTypes.ts` -> `src/domain/workout/types.ts`
2. `src/components/helpers.ts` -> `src/domain/workout/metrics.ts` + `src/domain/workout/pace.ts` (or similar split)
3. `src/components/constants.ts` -> `src/domain/workout/zones.ts`

Tasks:
1. Update imports across parsers/editor/workout elements.
2. Keep temporary compatibility re-exports to reduce diff size (optional short-lived shim files).
3. Remove UI-type leakage (`RunningTimes` dependency from component file).

Acceptance:
- Parsers no longer import from `src/components/**`.
- Build/tests still pass.

## Phase 3: Move XML IO Logic out of UI folders
Purpose: separate serialization/persistence from component tree.

Move:
1. `src/components/Editor/createWorkoutXml.ts` -> `src/domain/workout/xml/serializeWorkoutXml.ts`
2. `src/parsers/parseWorkoutXml.ts` -> `src/domain/workout/xml/parseWorkoutXml.ts`
3. `src/components/Editor/workoutLibraryPersistence.ts` -> `src/features/editor/io/workoutLibraryPersistence.ts` (or `src/shared/io/` if reused)

Tasks:
1. Update all call sites and tests.
2. Keep behavior identical.

Acceptance:
- XML parser/serializer located under domain xml module.
- Editor UI imports via domain/io modules only.

## Phase 4: Decompose Oversized Editor Units
Purpose: reduce cognitive load and merge conflicts.

Split `WorkoutLibraryPanel.tsx` into:
1. `useWorkoutLibraryDirectory` (permissions, picker, persistence, refresh).
2. `useWorkoutLibraryMutations` (save/add/duplicate/delete/open).
3. `WorkoutLibraryPanel` (presentation).
4. `WorkoutLibraryItemCard` (item row rendering).
5. Optional `workoutLibraryPreview.ts` for preview block generation.

Split `WorkoutBuilderPanel.tsx` into:
1. `BuilderToolbar`.
2. `WorkoutCanvas`.
3. `BuilderActionsOverlay`.
4. `useBuilderLayout` (height/media queries).
5. keep `useSegmentReorder` as dedicated hook (already good).

Acceptance:
- No single editor file > ~350 lines (soft target).
- Behavior unchanged.

## Phase 5: Context and Prop Surface Cleanup
Purpose: solve parameter bloat and over-broad context usage.

Tasks:
1. Replace single broad context with narrower contexts:
   - `EditorStateContext`
   - `EditorActionsContext`
   - `EditorIOContext`
   - optional `EditorMetricsContext`
2. Update consumers to use minimal required context.
3. For segment components (`Bar`, `RightTrapezoid`, `Interval`, `FreeRide`):
   - pass a `segment` object + focused callbacks instead of many scalar props.
   - centralize shared props (sport/duration/ftp/etc.) via a typed `renderContext` object.

Acceptance:
- Context value surface reduced.
- Segment component prop lists significantly smaller.
- No functionality change.

## Phase 6: Deduplicate Shared Logic
Purpose: prevent drift and bugs.

Tasks:
1. Centralize zone->color mapping in one module (`domain/workout/zones.ts`).
2. Reuse it in:
   - bar/trapezoid rendering,
   - program rows,
   - library previews.
3. Consolidate repeated XML write call pattern in library actions.

Acceptance:
- No duplicate zone color logic across multiple files.
- Repeated IO patterns extracted to helper(s).

## Phase 7: Remove Dead or Conflicting Models
Purpose: avoid double sources of truth.

Tasks:
1. Confirm whether `src/models/segments.ts` is unused.
2. If unused: remove.
3. If needed: integrate with domain types and remove parallel type system.

Acceptance:
- Single source of truth for segment/instruction types.

## Phase 8: Tests and Safety Nets
Purpose: lock in behavior after structural changes.

Tasks:
1. Add/adjust tests around:
   - XML round-trip (`parse` + `serialize`),
   - interval/ramp edge cases,
   - editor IO paths (download + library write calls via mocked APIs),
   - key workout metrics functions.
2. Add small smoke tests for refactored hooks where practical.

Acceptance:
- Test coverage around moved logic remains green.

## Execution Order
1. Phase 0
2. Phase 1
3. Phase 2
4. Phase 3
5. Phase 4
6. Phase 5
7. Phase 6
8. Phase 7
9. Phase 8

## Working Rules During Refactor
- No behavior changes unless explicitly called out.
- Keep PRs small and phase-aligned.
- After each phase:
  - run build/tests,
  - update this plan with status.

## Status Tracker
- [x] Phase 0 Baseline Stabilization
- [x] Phase 1 Define Module Boundaries
- [x] Phase 2 Extract Domain Types + Utilities
- [ ] Phase 3 Move XML IO Logic
- [ ] Phase 4 Decompose Oversized Editor Units
- [ ] Phase 5 Context and Prop Surface Cleanup
- [ ] Phase 6 Deduplicate Shared Logic
- [ ] Phase 7 Remove Dead/Conflicting Models
- [ ] Phase 8 Tests and Safety Nets

# Workout Domain Boundary

This module contains workout domain logic and types.

Contents:
- `types.ts`: segment/meta type definitions
- `running.ts`: running-times model + localStorage loader
- `zones.ts`: zone/color constants
- `metrics.ts`: workout math helpers

Rules:
- Domain code must not import from `src/components/**` or feature UI files.
- Domain code should stay UI-agnostic and reusable by parsers/tests/components.

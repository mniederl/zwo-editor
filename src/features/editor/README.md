# Editor Feature Boundary

This folder is the target home for editor-specific code.

Rules:
- UI/state/hooks for the editor belong here.
- This layer may import from `src/domain/**` and `src/shared/**`.
- This layer must not be imported by `src/domain/**`.

Migration note:
- Existing editor files are still under `src/components/Editor/**` and will be moved incrementally.

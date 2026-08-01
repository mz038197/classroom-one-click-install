# Issue tracker: Local Markdown

Issues and specs for this repo live as markdown files in `.scratch/`.

## Conventions

- One feature/effort per directory: `.scratch/<feature-slug>/`
- The Wayfinder **map** is `.scratch/<effort>/map.md`
- Child tickets are `.scratch/<effort>/issues/NN-<slug>.md`, numbered from `01`
- A `Type:` line records `research` / `prototype` / `grilling` / `task`
- A `Status:` line records `open` / `claimed` / `resolved`
- Blocking uses `Blocked by: NN, NN`
- Comments append under `## Comments`; resolutions under `## Answer`

## Wayfinding operations

- **Map**: `.scratch/<effort>/map.md`
- **Child ticket**: `.scratch/<effort>/issues/NN-<slug>.md`
- **Frontier**: open, unblocked, unclaimed children; first by number wins
- **Claim**: set `Status: claimed` before work
- **Resolve**: append `## Answer`, set `Status: resolved`, append gist to map Decisions so far

# Vans Router Lane defaults to Nickname Redeem

ADR 0003 required Classroom API Key redeem to stay bound to a Google user. On the Vans router the VS Code default is now Nickname Redeem (Invite Code + Classroom Nickname → BYOK); Sign-in Handoff is a secondary「使用 Google 登入」, not a primary button. Pegasi Router Lane and the Google fallback still follow ADR 0003. Portal web redeem stays Google-only. Nickname Redeem is not designed for Cursor; other Cursor behavior is unchanged.

## Considered Options

- **Keep Google as the only extension redeem**: rejected — that is the classroom failure mode.
- **Nickname Redeem on Portal and/or Pegasi**: rejected — Vans VS Code only; Catalog GET parity is unchanged.
- **Cursor Nickname Redeem** (copy key without BYOK): rejected for this path; Cursor is out of scope here, not dropped from the rest of the extension.

## Consequences

- ADR 0003 remains the Handoff mechanism and the Pegasi / Google-fallback path; the “must stay bound to a Google user” default no longer applies to Vans VS Code.
- Router Lane idle shows invite, nickname, and「連線」only.
- Glossary: `CONTEXT.md` (Nickname Redeem, Router Lane, Session Seat Limit).

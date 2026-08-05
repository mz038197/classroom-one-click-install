# Write Classroom API Key into Host chat.lm.secret storage

VS Code Copilot only resolves `${input:chat.lm.secret.*}` against application-scoped rows (`secret://chat.lm.secret.…` in `state.vscdb`), not extension-scoped SecretStorage (`secret://{"extensionId":…}`). We promote the encrypted blob into the Host key (same Electron safeStorage ciphertext) so BYOK stays one-click; the trade-off is depending on VS Code’s internal DB shape and needing a window reload after write.

---
status: aceptada
date: 2026-11-26
---

# Controles de la IA: deny, ask y git hooks, sin sandbox

## Contexto
Una regla que solo está escrita se olvida en una sesión larga, y un control que estorba se
esquiva. La IA no lee secretos, no despliega, no fuerza un push, no se salta los hooks y no
cambia la configuración de sus propios controles.

## Opciones
- **Sandbox de Bash.** Contras: necesita bubblewrap y socat; algunos comandos piden
  excepción.
- **`ask` para la configuración de los controles.** Contras: confirmar cada edición.
- **`deny` total para esa configuración.** Contras: copiar YAML a mano en las tareas de armado.
- **Hook Stop de Claude con `check:fast`.** Contras: corre en cada turno y puede entrar en bucle.

## Decisión
- `.claude/settings.json` versionado:
  - `deny`: leer `.env*`, `.dev.vars*` y la configuración de Wrangler; `git push --force`
    y `-f`; `--no-verify`; `wrangler deploy|rollback|delete|secret`; `gh secret`;
    `gh repo delete`; `pnpm add|install|update|remove`; editar `.claude/**`,
    `pnpm-lock.yaml`, `dist/**`, `.cache/**` y `photos/originals/**`.
  - `ask`: `.github/**`, `.githooks/**` y la configuración de los presupuestos.
- Sin sandbox (decisión del usuario).
- Git hooks sin dependencias: `core.hooksPath .githooks`, configurado por el script
  `prepare`. `pre-commit` corre `check:fast`, `pre-push` corre `check`, y `commit-msg`
  valida Conventional Commits. En la CI, un check valida el título del PR.
- Sin hook Stop.
- Una skill del proyecto revisa el PR contra `docs/decisiones/`.

## Consecuencias
- Riesgo aceptado: un `deny` de Read no cubre `grep -r` ni los scripts de Node. Mitigación:
  no dejar credenciales de Wrangler en la máquina, porque el deploy es en la CI.
- Los límites se repiten en CLAUDE.md, que lee el clasificador de auto mode.

## Confirmación
- `.claude/settings.json` tiene estas reglas.
- `git config core.hooksPath` da `.githooks` después de `pnpm install`.

## Fuentes (2026-11-26)
- code.claude.com/docs/en/permissions.md, /settings.md, /hooks.md, /sandboxing.md,
  /permission-modes.md.

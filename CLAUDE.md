@AGENTS.md

## Límites de este proyecto

Los respalda `.claude/settings.json`; aquí va el porqué.

- No leas secretos ni credenciales (`.env*`, `.dev.vars*`, configuración de Wrangler,
  tokens), tampoco con `grep` ni con scripts. No hay sandbox: la regla depende de ti.
- No despliegues, no hagas rollback y no toques la infraestructura de Cloudflare ni los
  secretos de GitHub. El despliegue es solo de la CI.
- No fuerces un push, no uses `--no-verify` y no te saltes los hooks.
- No instales, actualices ni quites dependencias: da el comando con `!`.
- No edites `.claude/**`, `pnpm-lock.yaml`, `dist/**`, `.cache/**` ni `photos/originals/**`.
- Cambiar `.github/**`, `.githooks/**` o la configuración de los presupuestos pide
  confirmación, y nunca sirve para aflojar un control.

## Modern Web Guidance

- Probar este plugin es uno de los objetivos del proyecto. Las sesiones se abren con él
  (ver `docs/modern-web-guidance.md`).
- Si la sesión no tiene sus skills, avisa al inicio.
- En trabajo de HTML, CSS o JS del sitio, consulta sus skills antes de proponer, y di
  cuándo una decisión vino del plugin.

## Otros plugins

- superpowers y otras skills son opcionales. Si chocan con AGENTS.md, manda AGENTS.md.

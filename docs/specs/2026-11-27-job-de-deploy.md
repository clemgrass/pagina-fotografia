# Job de deploy (issue 9)

## Qué y por qué

En cada push a `main`, la CI publica en Cloudflare el mismo `dist/` que pasó `pnpm check`,
verifica el sitio real y, si está roto, vuelve a la versión anterior (ADR 0003, 0013 y
0017). Listo cuando el sitio mínimo se ve en <https://foto.clemgrass.workers.dev/>.

- Fuera de alcance: previews por PR, dominio propio y la página de foto en el smoke (aún
  no existe; se agrega cuando exista).
- Antiobjetivo: un job que compila de nuevo, que deja el token al alcance de un PR o que
  revierte a una versión rota.

## Enfoques

- **Wrangler como devDependency exacta (elegido por el usuario).** `wrangler@4.165.0`,
  `allowBuilds` con `esbuild` y `workerd` en `false`, `pnpm exec wrangler` en el job.
  Pasa por el lockfile, la regla de 7 días y Dependabot. Contras: `pnpm install` completo
  en el job; sin verificar que funcione sin los `postinstall`. Va en la ADR 0018.
- **`cloudflare/wrangler-action`.** Descartado: instala con `npm i` sin lockfile, se
  salta los 7 días, corre los `postinstall` y es otra acción de terceros que ve el token.
- **`pnpm dlx wrangler@x`.** Descartado: sin lockfile para las transitivas y sin
  verificar si respeta `minimumReleaseAge`.

## Diseño

### `check.yml`

- El job `check` sube `dist/` con `actions/upload-artifact` solo si el evento es push a
  `main`. Retención corta (1 día): el artefacto solo sirve para el deploy de esa corrida.
- Job nuevo `deploy`:
  - `needs: check`, `if` push a `main`, `environment: production`, `permissions:
contents: read`, `timeout-minutes` acotado.
  - Concurrencia propia sin cancelar (`deploy`, `cancel-in-progress: false`): dos pushes
    seguidos se publican en orden.
  - Checkout sin credenciales y `pnpm/setup` (para Wrangler, `wrangler.jsonc` y el smoke).
  - `actions/download-artifact` a `dist/`. No compila.
  - Pasos, con los secretos solo como `env` de los pasos que llaman a Wrangler:
    1. Guarda el ID de la versión activa con `wrangler deployments status --json`. Si no
       lo obtiene, el job falla antes de publicar.
    2. `wrangler deploy` hasta 3 intentos, 2 minutos entre uno y otro, en un loop de bash.
    3. Espera fija de 30 s y corre `node scripts/smoke.ts https://foto.clemgrass.workers.dev`.
    4. Si el smoke falla (`if: failure() && steps.smoke.outcome == 'failure'`):
       `wrangler rollback <ID guardado> --message "smoke falló en <sha>"`. El job queda
       en rojo.

### `scripts/smoke.ts` (TDD)

- Pide `/`, `/en/` y `/speculation-rules.json` con User-Agent propio
  (`pagina-fotografia-smoke`), sin reintentos (ADR 0013).
- Reglas, en funciones puras con tests:
  - Estado 200 en cada ruta.
  - `/` y `/en/`: la CSP real es igual a la que calcula `headersFor` desde `public/_headers`.
  - `/speculation-rules.json`: `Content-Type` exactamente `application/speculationrules+json`
    (pendiente del issue 7).
- Imprime cada problema en español y sale con código 1 si hay alguno.

### Otros

- `docs/cloudflare.md`: la URL del sitio y cómo leer un rollback en Actions.
- ADR 0018 (propuesta): Wrangler como devDependency y su `allowBuilds`.
- ADR 0017: la pregunta abierta sobre el token granular se responde con el primer deploy.

## Decisiones mías (corrígelas)

- Espera de 30 s: Cloudflare no publica un tiempo de propagación. Se ajusta si el smoke
  falla por eso, como test inestable.
- Rollback al ID guardado y no al "anterior" por defecto: si un intento sube una versión y
  falla, la anterior por defecto sería la rota.
- La URL va fija en el workflow: es pública y no es una credencial.

## Sin verificar

- Que Wrangler 4.165.0 despliegue assets sin los `postinstall` de `esbuild` y `workerd`.
- La forma exacta del JSON de `wrangler deployments status --json`.
- Que el token granular (ADR 0017) alcance para `deployments status` y `rollback`.

Los tres se resuelven con el primer deploy en `main`. Si alguno falla, el job queda en rojo
antes o después de publicar, nunca con el sitio roto sin rollback.

## Fuentes (2026-11-27)

- developers.cloudflare.com/workers/wrangler/commands/workers (`rollback`, `--message`
  salta las preguntas; `deployments status --json`).
- developers.cloudflare.com/workers/wrangler/system-environment-variables.
- registry.npmjs.org/wrangler (4.168.0 la última; 4.165.0 del 2026-11-18; `workerd` y
  `esbuild` con `postinstall`).

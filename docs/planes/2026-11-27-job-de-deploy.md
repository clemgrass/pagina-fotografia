# Job de deploy: plan de implementación

> **Para agentes:** usa superpowers:executing-plans o superpowers:subagent-driven-development.
> Los pasos usan casillas (`- [ ]`).

**Objetivo:** en cada push a `main`, publicar el `dist/` que pasó `check`, correr el smoke y
hacer rollback si falla (issue 9).

**Arquitectura:** dos funciones puras con tests (`scripts/deployment.ts` lee la versión
activa; `scripts/smoke.ts` revisa las respuestas) y un job `deploy` en `check.yml` que las
usa. La orquestación queda en el YAML, a la vista; la lógica, en TS con tests.

**Stack:** Node 26 (`node --test`, `fetch`), Wrangler 4.165.0, GitHub Actions.

**Spec:** `docs/specs/2026-11-27-job-de-deploy.md`.

## Restricciones globales

- URL del sitio: `https://foto.clemgrass.workers.dev`.
- User-Agent del smoke: `pagina-fotografia-smoke (+https://github.com/clemgrass/pagina-fotografia)`.
- Rutas del smoke: `/`, `/en/`, `/speculation-rules.json`. Sin reintentos.
- Deploy: hasta 3 intentos, 120 s entre uno y otro. Espera antes del smoke: 30 s.
- Acciones fijadas por SHA completo con comentario de versión; `persist-credentials: false`;
  `permissions` mínimos (ADR 0012). `pnpm lint:actions` (zizmor) sin hallazgos.
- Tests en español, con caso feliz, borde y negativo. Cabecera SPDX Apache-2.0 en cada `.ts`.
- La IA no corre `wrangler deploy`, `rollback` ni `pnpm add`: el usuario instala con `!`.

## Foco de revisión

1. `Content-Type` con parámetros (`application/speculationrules+json; charset=utf-8`): es
   válido; se compara el tipo MIME sin parámetros. Unido con coma a otro tipo: falla.
2. Una ruta que redirige (3xx): falla; `fetch` va con `redirect: 'manual'`.
3. Una ruta que no responde o pasa el timeout (10 s): falla con mensaje, sin excepción suelta.
4. Deploy gradual (dos versiones activas): `activeVersionId` falla y el job no publica.
5. URL base con o sin `/` final: las rutas quedan igual.

---

### Tarea 1: Wrangler como devDependency y ADR 0018

**Archivos:**

- Crear: `docs/decisiones/0018-wrangler-como-devdependency.md` (status `propuesta`).
- Modificar: `pnpm-workspace.yaml` (`allowBuilds: { esbuild: false, workerd: false }`).
- Modificar (lo hace el usuario): `package.json`, `pnpm-lock.yaml`.

- [ ] **Paso 1:** escribir la ADR 0018: contexto (el deploy necesita Wrangler), las tres
      opciones del spec con sus contras, la decisión, `allowBuilds` en `false` y por qué (un
      Worker solo de assets no compila; sin verificar hasta el primer deploy), y la confirmación
      (`pnpm exec wrangler --version` imprime 4.165.0 en la CI).
- [ ] **Paso 2:** agregar `allowBuilds` en `pnpm-workspace.yaml`, con un comentario.
- [ ] **Paso 3:** pedir al usuario `! pnpm add -D wrangler@4.165.0`.
- [ ] **Paso 4:** verificar. `pnpm exec wrangler --version` → `4.165.0`; `pnpm check:fast` en verde.
- [ ] **Paso 5:** commit `build: agregar wrangler 4.165.0 como devDependency`.

### Tarea 2: versión activa (`scripts/deployment.ts`)

**Interfaces:**

- Produce: `activeVersionId(json: string): string` y CLI que lee la salida de
  `wrangler deployments status --json` por stdin e imprime el ID.

Forma del JSON (wrangler 4.165.0, `versions/deployments/status.ts`): el objeto deployment,
con `versions: [{ version_id: string, percentage: number }]`.

- [ ] **Paso 1:** tests en `scripts/deployment.test.ts`:
  - `devuelve el ID de la única versión al 100 %`.
  - `ignora espacios y saltos de línea alrededor del JSON` (borde).
  - `falla si hay más de una versión activa (deploy gradual)`: `throws /gradual/`.
  - `falla si el JSON no trae versions o no es JSON`: `throws`.
- [ ] **Paso 2:** correr `pnpm test` y verlos fallar porque el módulo no existe.
- [ ] **Paso 3:** implementar. CLI con `if (import.meta.main)`, como `commit-message.ts`;
      un error sale con código 1 y mensaje en español.
- [ ] **Paso 4:** `pnpm test` en verde; `pnpm check:fast` en verde.
- [ ] **Paso 5:** commit `feat: leer la versión activa del Worker para el rollback`.

### Tarea 3: smoke (`scripts/smoke.ts`)

**Interfaces:**

- Consume: `parseHeaders`, `headersFor`, `HEADERS_FILE` de `scripts/headers.ts`.
- Produce:
  - `SMOKE_PATHS`, `SMOKE_USER_AGENT`.
  - `interface Observed { path: string; status: number; headers: Record<string, string> }`
    (nombres en minúsculas) o `{ path: string; error: string }`.
  - `smokeProblems(observed: Observed[], rules: HeaderRule[]): string[]`.
  - `observe(baseUrl: string, paths: readonly string[], fetchFn = fetch): Promise<Observed[]>`.
  - CLI `node scripts/smoke.ts <url>`: imprime los problemas y sale con 1 si hay alguno.

- [ ] **Paso 1:** tests de `smokeProblems` (reglas sintéticas de `_headers` en el test):
  - `no reporta nada si todo responde 200 con la CSP de _headers`.
  - `reporta un estado distinto de 200, incluido un 3xx`.
  - `reporta una CSP distinta o ausente`.
  - `acepta application/speculationrules+json con parámetros` (borde).
  - `rechaza un Content-Type unido con coma` (negativo).
  - `reporta una ruta con error de red`.
- [ ] **Paso 2:** tests de `observe` con un `fetchFn` falso:
  - `pide cada ruta con el User-Agent propio y redirect manual`.
  - `une la URL base con o sin "/" final` (borde).
  - `convierte una excepción de fetch en un error de la ruta` (negativo).
- [ ] **Paso 3:** correr `pnpm test` y verlos fallar porque el módulo no existe.
- [ ] **Paso 4:** implementar. Timeout con `AbortSignal.timeout(10_000)`. La CSP esperada
      sale de `headersFor(rules, path)['content-security-policy']`; si `_headers` no da CSP
      para una ruta, no se revisa.
- [ ] **Paso 5:** `pnpm test` y `pnpm check:fast` en verde.
- [ ] **Paso 6:** prueba real contra el "Hello World" actual:
      `node scripts/smoke.ts https://foto.clemgrass.workers.dev` tiene que fallar por CSP y
      404, no por el User-Agent. Mostrar la salida.
- [ ] **Paso 7:** commit `feat: agregar el smoke del sitio publicado`.

### Tarea 4: job `deploy` (pide confirmación: toca `.github/`)

**Archivos:** modificar `.github/workflows/check.yml`, `docs/cloudflare.md`.

- [ ] **Paso 1:** buscar los SHA de `actions/upload-artifact` v7.0.2 y
      `actions/download-artifact` v8.0.2 con `gh api` (tag → commit).
- [ ] **Paso 2:** en `check`, después de `pnpm check`: `upload-artifact` de `dist/`, nombre
      `dist`, `retention-days: 1`, `if-no-files-found: error`, solo con
      `github.event_name == 'push' && github.ref == 'refs/heads/main'`.
- [ ] **Paso 3:** job `deploy`:
  - `needs: check`, mismo `if`, `environment: production`, `permissions: contents: read`,
    `timeout-minutes: 15`, `concurrency: { group: deploy, cancel-in-progress: false }`.
  - checkout sin credenciales, `pnpm/setup` (mismo SHA, `require-lockfile: true`) y
    `download-artifact` a `dist`.
  - Paso `previous` (id): `pnpm exec wrangler deployments status --json | node
scripts/deployment.ts`, y el ID a `$GITHUB_OUTPUT`.
  - Paso `deploy`: loop de bash `for attempt in 1 2 3`, `pnpm exec wrangler deploy`;
    si falla y quedan intentos, `sleep 120`; tras el tercero, `exit 1`.
  - Paso `smoke` (id): `sleep 30` y `node scripts/smoke.ts https://foto.clemgrass.workers.dev`.
  - Paso rollback: `if: failure() && steps.smoke.outcome == 'failure'`,
    `pnpm exec wrangler rollback "$PREVIOUS" --message "smoke falló en $GITHUB_SHA"`, con
    `PREVIOUS` por `env` (nunca `${{ }}` dentro del script; zizmor).
  - `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID` solo en el `env` de los pasos que
    llaman a Wrangler.
- [ ] **Paso 4:** `docs/cloudflare.md`: la URL del sitio y una sección "Si el deploy falla"
      (dónde se ve, qué hizo el rollback, cómo volver a correr).
- [ ] **Paso 5:** `pnpm lint:actions` sin hallazgos y `pnpm check` completo en verde.
- [ ] **Paso 6:** commit `ci: agregar el job de deploy con smoke y rollback`.

### Cierre

- [ ] Mostrar título y cuerpo del PR (`feat: agregar el job de deploy`, cierra #9). La
      sección "Prueba manual" la escribe el usuario. Push después de `pnpm check`.
- [ ] Tras el merge (lo hace el usuario): el primer deploy responde las tres preguntas
      "sin verificar" del spec y la abierta de la ADR 0017; el sitio mínimo se ve en la URL.

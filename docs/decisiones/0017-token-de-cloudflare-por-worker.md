---
status: aceptada
date: 2026-11-27
---

# Token de Cloudflare limitado a un Worker

## Contexto

El job de deploy usa un token de Cloudflare guardado en el environment `production` de
GitHub (ADR 0003). El repo es público y acepta PR de cualquiera (ADR 0012), así que el
token tiene que poder hacer lo mínimo. Cloudflare ahora tiene permisos granulares: un
token puede quedar limitado a un solo Worker. Pero crear un Worker nuevo pide el rol
Admin sobre todos los Workers de la cuenta.

## Opciones

- **Token de la cuenta, rol Editor, limitado al Worker `foto`.** Contras: el Worker se
  crea a mano en el dashboard antes del primer deploy; cambiar `name` en `wrangler.jsonc`
  pide un token nuevo; los permisos granulares son recientes y no está verificado desde
  qué versión de Wrangler funcionan.
- **Token de la cuenta, rol Admin de Workers.** Contras: puede crear, editar y borrar
  cualquier Worker de la cuenta.
- **Permiso clásico "Workers Scripts: Edit".** Contras: alcance de toda la cuenta, igual
  que Admin, y es el modelo anterior.
- **Token de usuario** _(no discutida)_. Contras: depende de una persona; si deja la
  cuenta, el deploy se rompe.

## Decisión

Un Account API token con rol Editor sobre el Worker `foto`, que vence en 1 año y no filtra
por IP, porque los runners de GitHub no tienen IP fija. El token va como secreto
`CLOUDFLARE_API_TOKEN` y el ID de la cuenta como secreto `CLOUDFLARE_ACCOUNT_ID`, como
indica la guía de Cloudflare para GitHub Actions. `wrangler.jsonc` no lleva `account_id`.

## Consecuencias

- Un token filtrado solo puede tocar el sitio, no el resto de la cuenta.
- Una vez al año hay que renovar el token. Si vence, el deploy falla en rojo y el sitio
  sigue con la última versión.
- Los pasos manuales están en `docs/cloudflare.md`.
- Pregunta abierta: ¿la versión de Wrangler que elija el issue 9 acepta el token
  granular? Se responde con el primer deploy.

## Confirmación

- `scripts/wrangler.test.ts` falla si `wrangler.jsonc` trae `account_id` o `main`.
- El environment `production` existe, solo acepta `main` y tiene los dos secretos.
- En **Account API tokens**, el resumen del token dice "Individual Workers · Editor".

## Fuentes (2026-11-27)

- developers.cloudflare.com/workers/authorization (roles por Worker; actualizada el
  2026-11-25).
- developers.cloudflare.com/fundamentals/api/get-started/account-owned-tokens.
- developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions (secretos).
- developers.cloudflare.com/workers/wrangler/configuration (`account_id` por variable de
  entorno).

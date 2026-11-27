---
status: propuesta
date: 2026-11-27
---

# Wrangler como devDependency, sin scripts de instalación

## Contexto

El job `deploy` (ADR 0003 y 0013) necesita Wrangler para publicar, leer la versión activa
y hacer rollback. Wrangler no estaba en el proyecto. Sus dependencias `esbuild` y `workerd`
traen `postinstall`, y `strictDepBuilds` hace fallar la instalación hasta decidirlos en
`allowBuilds` (ADR 0006).

## Opciones

- **devDependency exacta, con `esbuild` y `workerd` en `false`.** Contras: el job
  `deploy` hace un `pnpm install` completo; no está verificado que Wrangler publique sin
  esos scripts.
- **`cloudflare/wrangler-action`.** Contras: instala con `npm i` sin lockfile, así que se
  salta los 7 días de espera y la integridad de las dependencias transitivas; corre los
  `postinstall`; es otra acción de terceros que ve el token.
- **`pnpm dlx wrangler@<versión>`.** Contras: sin lockfile para las transitivas; no está
  verificado si respeta `minimumReleaseAge`.

## Decisión

`wrangler` como devDependency en versión exacta (4.165.0 al crearla), actualizada por
Dependabot como el resto. `allowBuilds` deja `esbuild` y `workerd` en `false`: un Worker
solo de assets (ADR 0001) no compila código ni corre `workerd` al publicar. Sus binarios
llegan por las `optionalDependencies` de cada plataforma, sin scripts.

## Consecuencias

- Wrangler pasa por el lockfile, la regla de 7 días y Dependabot, con la misma versión en
  local y en la CI.
- `wrangler dev` en local podría necesitar los scripts de `workerd`. Si alguien lo usa y
  falla, es una decisión nueva.
- Pregunta abierta: ¿Wrangler publica sin los `postinstall`? Se responde con el primer
  deploy en `main`.

## Confirmación

- `pnpm exec wrangler --version` imprime la versión fijada.
- El job `deploy` corre `pnpm exec wrangler` y no instala nada aparte.

## Fuentes (2026-11-27)

- registry.npmjs.org/wrangler (4.168.0 la última; 4.165.0 publicada el 2026-11-18;
  licencia MIT OR Apache-2.0; `engines.node` >= 22.12.0).
- registry.npmjs.org/workerd y registry.npmjs.org/esbuild (`postinstall: node install.js`).
- pnpm.io/settings (`allowBuilds`, `strictDepBuilds`) (no verificado en esta sesión).

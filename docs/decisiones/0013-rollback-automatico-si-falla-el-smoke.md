---
status: aceptada
date: 2026-11-26
---

# Rollback automático si falla el smoke

## Contexto

Después de cada deploy, un smoke verifica el sitio real. Hay que decidir qué pasa si falla.

## Opciones

- **Rollback automático.** Contras: más lógica en el job que tiene el token; un smoke que
  falla al azar puede revertir un deploy bueno.
- **Job en rojo y rollback manual.** Contras: el sitio roto dura hasta que el usuario actúa.

## Decisión

El smoke pide `/`, `/en/` y una página de foto, con un User-Agent propio, y revisa el
estado 200 y la cabecera CSP. Espera un tiempo fijo a que la versión se propague y no
reintenta. Si falla, el mismo job corre `wrangler rollback` y queda en rojo, así que
GitHub avisa al usuario.

## Consecuencias

- Un smoke que falla al azar se trata como un test inestable: se reproduce y se arregla.
- `wrangler rollback` vuelve a cualquiera de las últimas 100 versiones.

## Confirmación

- El job de deploy tiene el paso de rollback condicionado a que falle el smoke.

## Fuentes (2026-11-26)

- developers.cloudflare.com/workers/configuration/versions-and-deployments/rollbacks.

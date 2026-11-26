---
status: aceptada
date: 2026-11-26
---

# Hosting en Cloudflare Workers solo con assets

## Contexto
El sitio es estático. El stack tiene que ser 100% gratis, fallar antes que cobrar y no
pedir tarjeta. Las cabeceras de seguridad y de caché son parte del producto, y el
público técnico las va a mirar.

## Opciones
- **Cloudflare Workers con static assets, sin script, en `*.workers.dev`.**
  Contras: plataforma nueva para el usuario; el plan Free limita a 20.000 archivos por
  versión y 25 MiB por archivo; no está verificado si el dashboard muestra las peticiones
  servidas directo desde los assets.
- **GitHub Pages** *(no discutida)*. Contras: no permite cabeceras propias, así que el
  CSP no puede ir en una cabecera.
- **Cloudflare Pages** *(no discutida)*. Contras: (no verificado) Cloudflare orienta los
  proyectos nuevos a Workers.
- **Netlify** *(no discutida)*. Contras: no se revisaron sus límites gratis ni si pide
  tarjeta (no verificado).

## Decisión
Cloudflare Workers solo con assets: `wrangler.jsonc` sin `main`, `assets.directory` en
`dist/` y `not_found_handling: "404-page"`. Las cabeceras van en `_headers`. Subdominio de
`workers.dev`.

## Consecuencias
- Las peticiones a los assets son gratis e ilimitadas.
- `_headers` admite 100 reglas de 2.000 caracteres por línea como máximo.
- `workers.dev` aplica siempre un Browser Integrity Check: un cliente con el User-Agent por
  defecto de una librería puede recibir el error 1010. El smoke usa un User-Agent propio.
- `.dev` está en la lista de precarga HSTS: el sitio es solo HTTPS en los navegadores.

## Confirmación
- `wrangler.jsonc` no tiene `main`.
- El smoke después de desplegar recibe 200 y la cabecera CSP.

## Fuentes (2026-11-26)
- developers.cloudflare.com/workers/static-assets/billing-and-limitations ("free and unlimited").
- developers.cloudflare.com/workers/platform/limits (archivos y tamaños).
- developers.cloudflare.com/workers/static-assets/headers (límites de `_headers`).
- developers.cloudflare.com/workers/configuration/routing/workers-dev (Browser Integrity Check).
- registry.google/domains/dev (HSTS preload de `.dev`).

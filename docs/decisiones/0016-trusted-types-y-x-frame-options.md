---
status: aceptada
date: 2026-11-27
---

# Trusted Types y `X-Frame-Options` además de la CSP

## Contexto

La ADR 0007 fija la CSP y las cabeceras. Al implementarla (issue 7), la guía `security` de
Modern Web Guidance pidió dos defensas que la ADR no tiene: `require-trusted-types-for
'script'` y `X-Frame-Options: DENY` junto a `frame-ancestors 'none'`. Esta ADR amplía la
0007, no la reemplaza.

## Opciones

- **Agregar las dos.** Contras: `X-Frame-Options` es redundante en los navegadores
  actuales, que respetan `frame-ancestors`; Trusted Types obliga a pasar por una política
  cualquier JS futuro que escriba HTML en el DOM.
- **Dejar la CSP como está en la ADR 0007.** Contras: un JS futuro (el explicador, el
  simulador de V2) podría usar `innerHTML` con texto sin sanitizar sin que nada lo frene.

## Decisión

Se agregan las dos, en la regla `/*` de `_headers`:

- `require-trusted-types-for 'script'` al final de la CSP. Sin `trusted-types`: hoy no hay
  políticas que permitir.
- `X-Frame-Options: DENY`.

## Consecuencias

- Hoy no cambia nada visible: la galería tiene 0 KB de JS.
- El JS que escriba en `innerHTML` y otros sinks del DOM falla con un `TypeError`. Se usa
  `textContent`, `setHTML()` o una política de Trusted Types; una política nueva es una
  decisión nueva.
- Trusted Types es Baseline 2026: un navegador más antiguo ignora la directiva y sigue
  protegido por el resto de la CSP.

## Confirmación

- El test de `_headers` exige las dos cabeceras.

## Fuentes (2026-11-27)

- Modern Web Guidance, guía `security` (§1.4 y §3.2), CLI 1.0.1.
- developer.mozilla.org: CSP `require-trusted-types-for` ("Baseline 2026", desde febrero
  de 2026).

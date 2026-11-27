---
status: aceptada
date: 2026-11-26
---

# CSP estricta sin inline, solo en `_headers`

## Contexto

Es un sitio estático, sin formularios ni contenido de terceros. El público técnico va a
mirar las cabeceras. Astro mete en el HTML las hojas de estilo de menos de 4 KB por defecto.

## Opciones

- **Nada inline, una sola política en la cabecera.** Contras: el CSS externo suma una
  petición en la primera visita.
- **`security.csp` de Astro (hashes en un `<meta>`) más una cabecera.** Contras: la
  política vive en dos lugares; no funciona en `dev`.

## Decisión

`inlineStylesheets: 'never'`, sin `<script>` ni `style` inline, y los colores de
placeholder en el CSS empaquetado (no `define:vars`). En `_headers`, para todo el sitio:

`default-src 'none'; img-src 'self'; style-src 'self'; font-src 'self'; script-src 'self';
frame-ancestors 'none'; base-uri 'none'; form-action 'none'`

Además:

- `X-Content-Type-Options: nosniff` y `Referrer-Policy: strict-origin-when-cross-origin`.
- `Permissions-Policy` que niega la cámara, el micrófono, la ubicación y `browsing-topics`.
- `COOP: same-origin` y HSTS sin preload.
- CORP `cross-origin` en las fotos (CC BY permite el embed) y `same-origin` en el resto.
- Caché `immutable` para `/_astro/*`, las fotos y las fuentes; `max-age=0, must-revalidate`
  para el HTML.
- Prefetch con la cabecera `Speculation-Rules`, sin script inline.

## Consecuencias

- El CSS baja en paralelo con la foto LCP. Los presupuestos (ADR-0010) dicen si cuesta.
- Si algo necesita inline, es una decisión nueva.
- V2: COOP y COEP solo en la ruta del simulador.

## Confirmación

- Un test unitario lee `_headers` y verifica cada directiva.
- No hay `<script>` sin `src` ni `style=` en `dist/`.
- El smoke revisa la cabecera CSP real.

## Fuentes (2026-11-26)

- docs.astro.build/en/reference/configuration-reference (`security.csp`; `inlineStylesheets`).
- developer.mozilla.org: Speculation_Rules_API (cabecera `Speculation-Rules`).

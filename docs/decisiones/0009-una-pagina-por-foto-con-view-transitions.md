---
status: aceptada
date: 2026-11-26
---

# Una página por foto con `@view-transition`

## Contexto
La galería tiene 0 KB de JS. Ver una foto en grande no puede decodificar más de una
imagen grande a la vez.

## Opciones
- **Una página estática por foto.** Contras: una navegación por foto; la transición es
  parcial en Firefox.
- **Lightbox con `<dialog>`.** Contras: necesita JS para elegir la foto, no hay URL por foto
  y hay que manejar a mano el foco y el botón Atrás.

## Decisión
Cada foto tiene su página con URL propia. `@view-transition { navigation: auto; }` anima
el paso entre la grilla y la foto donde existe (Chrome 126+, Safari 18.2+), y donde no
existe solo navega. Se respeta `prefers-reduced-motion`. El HTML vecino se precarga con la
cabecera `Speculation-Rules` (prefetch, no prerender).

## Consecuencias
- Las URLs son compartibles y el botón Atrás es nativo.
- Prefetch y no prerender, para no gastar RAM en equipos modestos.

## Confirmación
- 0 KB de JS en la galería y en las páginas de foto.
- Playwright en Firefox y WebKit navega bien sin la transición.

## Fuentes (2026-11-26)
- developer.mozilla.org: @view-transition ("not Baseline"); caniuse:
  cross-document-view-transitions.
- developer.mozilla.org: dialog (Baseline amplio); Speculation_Rules_API.

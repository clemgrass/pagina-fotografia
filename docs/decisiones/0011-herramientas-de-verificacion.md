---
status: aceptada
date: 2026-11-26
---

# Herramientas de verificación

## Contexto

`pnpm check` tiene que ser el mismo comando en local y en la CI, y lo bastante rápido para
que nadie quiera saltárselo. Cada dependencia suma a la cadena de suministro.

## Opciones

- **Tests unitarios:** `node:test` (contras: menos comodidades; solo TypeScript borrable)
  o Vitest 5 (contras: suma Vitest y Vite).
- **Navegadores:** Chromium, Firefox y WebKit (contras: 1 o 2 minutos más de CI) o solo
  Chromium (contras: una falla en Safari o Firefox pasa sin que nadie lo note).
- **Validar HTML:** html-validate (contras: no es el validador de referencia del W3C) o
  vnu (contras: Java 17 y `postinstall`).
- **Enlaces:** linkinator (contras: sin modo offline; se saltan los externos) o lychee
  (contras: un binario aparte, otro comando en local).
- **Formato y lint:** Prettier más `astro check` (contras: sin reglas de lint de patrones);
  Prettier más ESLint completo (contras: ~10 dependencias); Biome (contras: Astro experimental).

## Decisión

- `node:test` con la eliminación de tipos de Node 26 (`erasableSyntaxOnly`).
- Playwright con `@axe-core/playwright` en Chromium, Firefox y WebKit. Lighthouse y la
  memoria corren solo en Chromium.
- html-validate y linkinator: los enlaces internos y sus anclas en cada PR, y los externos en
  un job semanal que no bloquea y abre un issue.
- Prettier con `prettier-plugin-astro`, y TypeScript strictest con `astro check`. Sin ESLint
  al inicio.
- La CI falla si queda un `.only`. Un test saltado lleva su motivo y su issue.

## Consecuencias

- Si aparece un hueco real que ESLint cubriría, se agrega en un PR con su motivo.

## Confirmación

- Los scripts `check:fast` y `check` de `package.json` corren estas herramientas.

## Fuentes (2026-11-26)

- nodejs.org/docs/latest-v26.x/api/test.html y /typescript.html.
- registry.npmjs.org: vitest 5.1.2, @axe-core/playwright 4.14.1, html-validate 11.23.0,
  linkinator 8.1.0, vnu-jar, prettier 3.10.1, prettier-plugin-astro 1.1.2.
- biomejs.dev/internals/language-support (Astro experimental).

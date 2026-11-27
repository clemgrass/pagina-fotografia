---
status: aceptada
date: 2026-11-26
---

# Sitio bilingüe sin redirección

## Contexto

El público técnico puede no hablar español. No hay script de Worker que negocie el idioma.

## Opciones

- **Español e inglés.** Contras: el doble de texto que mantener (títulos, `alt`,
  explicador, atribución).
- **Solo español.** Contras: deja fuera al público que no lo habla.
- **Solo inglés.** Contras: el repo y los documentos están en español.

## Decisión

Español en `/` e inglés en `/en/`, con el i18n de Astro (`prefixDefaultLocale: false`). Sin
redirección automática: un enlace visible cambia el idioma. `hreflang` va a mano. El
esquema exige título y `alt` en los dos idiomas.

## Consecuencias

- La primera visita no suma un viaje de red por una redirección.
- Cada texto nuevo se escribe dos veces.

## Confirmación

- El build falla si falta un título o un `alt` en alguno de los dos idiomas.
- Cada página tiene `lang` y `<link rel="alternate" hreflang>` en los dos idiomas.

## Fuentes (2026-11-26)

- docs.astro.build/en/guides/internationalization (`prefixDefaultLocale`; `hreflang` no
  mencionado: no verificado que venga incluido).

---
status: aceptada
date: 2026-11-26
---

# CI endurecida y auditoría con CodeQL y zizmor

## Contexto
El job de deploy tiene el token de Cloudflare. El repo es público y acepta PR de cualquiera.

## Opciones
- **CodeQL con la configuración por defecto más zizmor.** Contras: zizmor no se instala con
  npm; en local se corre con `uvx`.
- **Solo CodeQL.** Contras: cubre menos casos propios de Actions.
- **Solo zizmor.** Contras: no analiza el JS/TS del sitio.

## Decisión
- `permissions` mínimos por job y `persist-credentials: false` en el checkout.
- Toda acción va fijada por su SHA completo, con un comentario de la versión. La opción del
  repo exige SHA.
- Nunca `pull_request_target`. Los PR de personas externas requieren aprobación para correr.
- CodeQL con la configuración por defecto (JS/TS y Actions). zizmor corre cuando cambia
  `.github/`.
- Secret scanning y push protection activos.
- Ruleset de `main`: PR obligatorio con 0 aprobaciones (el autor no puede aprobar su
  propio PR), checks obligatorios, sin force push, sin borrar la rama y bypass vacío.

## Consecuencias
- Pendiente: verificar en la interfaz que los rulesets y push protection estén disponibles
  en un repo público personal con Free. Si no hay rulesets, se usa branch protection clásica.

## Confirmación
- zizmor sin hallazgos.
- Ninguna acción sin SHA en `.github/workflows/`.

## Fuentes (2026-11-26)
- docs.github.com: about-secret-scanning ("runs automatically for free"),
  about-code-scanning-with-codeql (GitHub Actions workflows),
  managing-github-actions-settings-for-a-repository (exigir SHA),
  available-rules-for-rulesets, approving-a-pull-request-with-required-reviews.
- docs.zizmor.sh (1.33.1).

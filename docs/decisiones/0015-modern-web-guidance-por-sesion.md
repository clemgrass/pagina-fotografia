---
status: aceptada
date: 2026-11-26
---

# Modern Web Guidance por sesión, sin evaluación formal

## Contexto

Probar el plugin Modern Web Guidance de Google es uno de los objetivos del proyecto. Es un
conjunto de skills con guías de funciones web modernas y datos de compatibilidad. No
ejecuta nada: no hay hooks ni MCP en la raíz.

## Opciones

- **Cargarlo en todas las sesiones, sin evaluación formal.** Contras: no queda una medición
  de su aporte.
- **Evaluación formal con y sin el plugin (3 tareas × 2 brazos × 2 corridas, medida por
  script).** Contras: las corridas sin plugin contradicen usarlo siempre; 12 sesiones extra.
- **Instalarlo a nivel de usuario o con `npx modern-web-guidance install`.** Contras: el
  asistente escribe dentro del repo y queda activo en otros proyectos.

## Decisión

Se carga por sesión con `DISABLE_TELEMETRY=1 claude --plugin-dir <clon de v1.0.2>`. Las
instrucciones están en `docs/modern-web-guidance.md`. La IA consulta sus skills antes de
proponer HTML, CSS o JS, y dice cuándo una decisión vino del plugin. El usuario compara su
aporte de cabeza.

Excepción a la regla de 7 días: la v1.0.2 (2026-11-23) se usa desde el 2026-11-26, porque
es una herramienta de la sesión y no una dependencia del sitio.

## Consecuencias

- El clon se verifica con el SHA `2b4aa13a72dd47cd135b06ce5abfccd92e19b24f`.
- El build y la CI no dependen del plugin.

## Confirmación

- `claude --plugin-dir <carpeta> plugin list` muestra `modern-web-guidance@inline`.

## Fuentes (2026-11-26)

- github.com/GoogleChrome/modern-web-guidance (tags; `.claude-plugin/plugin.json`).
- developer.chrome.com/docs/modern-web-guidance.
- code.claude.com/docs/en/plugins/cli-reference.md (`@inline`, "Session-only plugins").

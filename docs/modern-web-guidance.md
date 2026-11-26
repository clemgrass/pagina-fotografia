# Modern Web Guidance en este proyecto

El plugin de Google se carga solo por sesión. Nunca se instala a nivel de usuario ni dentro
del repo, y el sitio no depende de él.

## Preparar (una vez)

La v1.0.2 salió el 2026-11-23, con menos de los 7 días que pide la regla de dependencias.
Se usa igual por una excepción aprobada el 2026-11-26: es una herramienta de la sesión, no
una dependencia del sitio, y el build y la CI no la usan.

1. Clona la etiqueta en `tools/`, en la raíz del proyecto. Git la ignora (`.gitignore`):
   ```sh
   git clone --depth 1 --branch v1.0.2 https://github.com/GoogleChrome/modern-web-guidance.git tools/modern-web-guidance-v1.0.2
   ```
2. Verifica que la etiqueta apunta al commit publicado (una etiqueta se puede mover, un SHA no):
   ```sh
   git -C tools/modern-web-guidance-v1.0.2 rev-parse HEAD
   # debe dar 2b4aa13a72dd47cd135b06ce5abfccd92e19b24f
   ```

## Abrir una sesión

Desde la raíz del proyecto:

```sh
DISABLE_TELEMETRY=1 claude --plugin-dir tools/modern-web-guidance-v1.0.2
```

## Verificar que está cargado

```sh
claude --plugin-dir tools/modern-web-guidance-v1.0.2 plugin list
```

Debe aparecer `modern-web-guidance@inline` en "Session-only plugins". El flag va antes del
subcomando.

## Qué no hacer

- No uses `npx modern-web-guidance install`: es un asistente que escribe dentro del repo.
- No corras sus comandos de configuración en la raíz del proyecto (crean `.mwgrc`).

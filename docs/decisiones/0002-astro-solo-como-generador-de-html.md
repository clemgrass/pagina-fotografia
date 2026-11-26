---
status: aceptada
date: 2026-11-26
---

# Astro solo como generador de HTML

## Contexto
El sitio es estático, con casi nada de JavaScript en el cliente. El contenido vive en YAML
y tiene que fallar el build si no cumple un esquema.

## Opciones
- **Astro 7 sin frameworks de UI ni `<ClientRouter />`.** Contras: el usuario no conoce
  Astro; Astro suma dependencias de build.
- **Eleventy** *(no discutida)*. Contras: no evaluadas (no verificado).
- **HTML con un script de generación propio** *(no discutida)*. Contras: hay que
  reimplementar las rutas, el i18n y la validación del contenido.

## Decisión
Astro 7 como generador de HTML. Los componentes `.astro` corren solo en el build. Las
colecciones de contenido cargan YAML con `file()` o `glob()` y lo validan con Zod en
`src/content.config.ts`. TypeScript con `astro/tsconfigs/strictest` y `astro check`.

## Consecuencias
- Cero JS en el cliente por defecto. Cada `<script>` es una decisión visible.
- Las rutas salen de `src/pages/`. El i18n usa la configuración nativa (ADR-0008).
- Astro pide Node 22.23.4 o más, y no soporta las versiones impares.

## Confirmación
- `package.json` no tiene frameworks de UI ni integraciones de islas.
- No hay `ClientRouter` en `src/`.
- El presupuesto de JS por página (ADR-0010) se cumple.

## Fuentes (2026-11-26)
- github.com/withastro/astro/releases (7.4.13, 2026-11-18).
- docs.astro.build/en/install-and-setup (versiones de Node).
- docs.astro.build/en/guides/content-collections (`file()`, `glob()`, Zod).

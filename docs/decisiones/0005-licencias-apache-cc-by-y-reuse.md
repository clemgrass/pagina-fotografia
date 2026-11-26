---
status: aceptada
date: 2026-11-26
---

# Licencias: Apache-2.0, CC BY 4.0 y REUSE

## Contexto
Todo se puede usar libremente si se da crédito al autor. El repo es público y tiene que
dejar claro qué licencia tiene cada archivo.

## Opciones
- **Código Apache-2.0 con NOTICE; fotos, textos y SVG del explicador CC BY 4.0.**
  Contras: dos licencias que declarar.
- **Todo lo que no es foto bajo Apache-2.0.** Contras: Apache está pensada para software
  y es rara para textos e ilustraciones.
- **Declarar con `.reuse/dep5`.** Contras: obsoleto en REUSE 3.3.

## Decisión
- El código va bajo Apache-2.0, con un NOTICE que acredita a "clemgrass".
- Las fotos, los textos y los SVG del explicador van bajo CC BY 4.0. Un fixture binario
  guardado, si existe, va CC0.
- REUSE 3.3: una cabecera SPDX en cada archivo de código y `REUSE.toml` para lo que no
  admite comentarios (fotos, JSON, YAML de configuración, la fuente, los archivos generados).
- La fuente variable tiene licencia OFL-1.1, y su texto va en `LICENSES/`.
- Cada página de foto ofrece un crédito TASL (título, autor, fuente y licencia) listo para
  copiar. El pie resume las licencias.

## Consecuencias
- `reuse lint` corre con `uvx` y la versión fijada, así que `uv` es un requisito de la
  máquina junto a pnpm.
- Pendiente: si se agrega un enlace junto al crédito.

## Confirmación
- `reuse lint` sin errores, dentro de `pnpm check`.

## Fuentes (2026-11-26)
- reuse.software/spec-3.3 ("Comment headers are the RECOMMENDED method"; dep5 obsoleto).
- pypi.org/pypi/reuse (6.3.0).

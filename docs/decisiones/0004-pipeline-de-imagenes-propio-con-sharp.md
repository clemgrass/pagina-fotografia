---
status: aceptada
date: 2026-11-26
---

# Pipeline de imágenes propio con sharp

## Contexto

Las fotos son escaneos de rollo de 35 mm, de 1,3 a 5 MB. El sitio sirve AVIF con JPEG de
respaldo, con 2048 px como máximo y sin metadatos. El CSP no permite `style` inline
(ADR-0007), y en una galería la RAM se va en los píxeles decodificados.

## Opciones

- **Script propio con sharp.** Contras: unas 150 líneas más sus tests que mantener.
- **`<Picture>` de Astro.** Contras: su opción `layout` escribe `style="--fit…"` en cada
  `<img>`, lo que choca con el CSP; la conversión de color no está documentada; no está
  verificado si procesa originales fuera de `src/`.

## Decisión

Un script lee el índice YAML y procesa cada original:

- Lo convierte a sRGB y después borra el perfil ICC, junto con todo otro metadato.
- Genera AVIF y JPEG en 480, 960, 1440 y 2048 px.
- Calcula el color dominante para el placeholder, que va en el CSS empaquetado.
- Guarda el resultado en una caché por hash del original más los parámetros.

La calidad de AVIF y JPEG se elige comparando a la vista con los escaneos reales, porque
AVIF suaviza el grano cuando la calidad es baja.

Limpiar un original no lo vuelve a codificar: quita los segmentos APP1 (EXIF y XMP) y APP13
(IPTC), y conserva APP2 (ICC).

## Consecuencias

- El HTML de las imágenes es propio: `srcset`, `sizes`, `width` y `height` exactos, y
  `fetchpriority="high"` solo en la foto LCP.
- Un build solo codifica las fotos nuevas o cambiadas.
- Si los escaneos resultan ser TIFF, la limpieza cambia (pregunta abierta).

## Confirmación

- Tests del script con fixtures sintéticos: GPS falso, Adobe RGB y 4000 px.
- El check de metadatos sobre `dist/` no encuentra ningún bloque.
- No hay ningún atributo `style=` en `dist/**/*.html`.

## Fuentes (2026-11-26)

- docs.astro.build/en/guides/images (`<Picture>`, salida de `layout`).
- sharp.pixelplumbing.com/api-output (sharp borra los metadatos por defecto; 0.35.5).

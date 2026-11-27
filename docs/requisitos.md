# Requisitos

## Qué es

Un portafolio personal con los highlights de mi fotografía análoga y un explicador sencillo
de cómo funciona una cámara análoga.

## Para quién

Para mí. El público ideal es alguien técnico en fotografía o en diseño web que note por
qué carga tan rápido y en qué orden.

## Por qué

- Mostrar mis fotos bajo CC BY 4.0, para que cualquiera las use dándome crédito.
- Mostrar oficio: un sitio rápido incluso en equipos modestos, con un repo cuidado.
- Probar el plugin Modern Web Guidance en un proyecto real.

## Prioridades

1. Optimización. Si corre lento en un celular de gama baja o un notebook de 4 GB, no sirve.
2. Diseño.
3. Seguridad y calidad del repo, que es público y es portafolio.

## V1

### Galería

- Entre 30 y 50 fotos de 35 mm, sin personas. Escaneos en JPEG de 1,3 a 5 MB.
- Cámaras: Asahi Pentax SP1000, Nikon N8008 y Leica M2.
- Una grilla y una página por foto, con URL propia.
- Cada foto tiene título y `alt` en español e inglés, cámara y rollo, y el aviso
  CC BY 4.0 con un texto de crédito listo para copiar.

### Explicador

- Cómo funciona una cámara análoga: lente, diafragma, profundidad de campo y cómo se
  relaciona con las partes físicas, rollo, ISO y velocidad de obturación.
- Anclado a mis tres cámaras: las réflex Asahi Pentax SP1000 y Nikon N8008, y la Leica M2,
  de telémetro. Explica cómo enfoca cada tipo: espejo y pentaprisma, o telémetro.
- SVG propio y CSS nativo, casi sin JavaScript, sin 3D.

### Transversal

- Español e inglés.
- Un pie con las licencias y cómo acreditarme.
- Stack 100% gratis: ante un límite, falla antes que cobrar. Nada pide tarjeta.

## V2 (no se diseña en la V1)

Un simulador de cámara en el navegador: encuadrar, exponer y revelar con brackets RAW
propios, WebGL2 en un worker y solo en su página. La V1 no le cierra la puerta.

## Fuera de alcance

Fotos con personas; cuentas, formularios y comentarios; analítica en el cliente; 3D.

## Preguntas abiertas

- Un equipo real de gama baja para probar antes de la v1.0.0.
- V2: los brackets RAW chocan con el tope de 25 MiB por archivo de Cloudflare.

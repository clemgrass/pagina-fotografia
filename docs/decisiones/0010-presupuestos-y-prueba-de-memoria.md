---
status: aceptada
date: 2026-11-26
---

# Presupuestos de rendimiento y prueba de memoria por píxeles decodificados

## Contexto
La optimización es la prioridad número uno. Una foto de 2048×1365 decodificada ocupa unos
11 MB, sin importar cuánto pese el AVIF.

## Opciones
- **Presupuestos ajustados desde el inicio.** Contras: alguno puede resultar irreal.
- **Presupuestos holgados (LCP ≤ 2,5 s) que se aprietan después.** Contras: casi nunca se
  aprietan.
- **Memoria medida por píxeles decodificados más el heap y el DOM por CDP.** Contras: no
  es la RAM total del proceso.
- **Memoria medida por el RSS del proceso renderer.** Contras: el número cambia entre
  corridas, y solo funciona en Linux.
- **memlab.** Contras: sirve para fugas de JS, no para imágenes.

## Decisión
Lighthouse CI sobre `dist/` con el perfil móvil por defecto: Slow 4G simulado y CPU 4 veces
más lenta (reproducible en PageSpeed Insights). 3 corridas, mediana, umbrales `error`.

| Métrica | Galería | Explicador |
|---|---|---|
| LCP | ≤ 1,8 s | ≤ 1,5 s |
| CLS / TBT | ≤ 0,01 / ≤ 50 ms | ≤ 0,01 / ≤ 50 ms |
| HTML + CSS | ≤ 35 KB | ≤ 35 KB |
| JS | 0 KB | ≤ 5 KB |
| Imágenes iniciales | ≤ 200 KB | — |
| Total inicial | ≤ 300 KB | ≤ 100 KB |

Prueba de memoria: Playwright con viewport móvil recorre toda la galería, suma
ancho × alto × 4 de cada imagen cargada contra un tope en MB, y mide por CDP el heap de JS
y la cantidad de nodos del DOM.

## Consecuencias
- Un presupuesto solo cambia en un PR con su motivo.
- El presupuesto de JS también hace cumplir las zonas: el código del simulador no puede
  filtrarse a otras páginas.

## Confirmación
- `lighthouserc` con estos umbrales como `error`.
- El test de memoria corre en `pnpm check`.

## Fuentes (2026-11-26)
- github.com/GoogleChrome/lighthouse-ci docs/configuration.md (`@lhci/cli` 0.16.1).
- github.com/GoogleChrome/lighthouse docs/throttling.md (CPU 4x constante).
- developer.mozilla.org: measureUserAgentSpecificMemory (exige aislamiento cross-origin).
- playwright.dev: class-cdpsession.

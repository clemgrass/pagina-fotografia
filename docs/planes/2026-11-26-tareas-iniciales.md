# Tareas iniciales

Cada tarea es un PR y se hace con el ritmo normal. Al crear el repo, pasan a GitHub Issues
(Qué / Por qué / Listo cuando) y este archivo se borra.

## Base

1. **Publicar el repo y configurarlo.** Pasos manuales guiados.
   - Commit inicial en `main` con la documentación de partida. Es la única vez que se
     escribe directo en `main`, porque el ruleset todavía no existe.
   - Crear el repo público `clemgrass/pagina-fotografia` con `gh`. El nombre va en español,
     igual que la carpeta (decisión del usuario, 2026-11-26).
   - Activar:
     - ruleset de `main` (verificar que haya rulesets en Free; si no, branch protection);
     - merge solo squash;
     - secret scanning y push protection;
     - exigir acciones fijadas por SHA;
     - aprobación para los PR de personas externas;
     - CodeQL con la configuración por defecto.
   - Pasar estas tareas a Issues.
   - Listo cuando: el ruleset rechaza un push directo a `main`.
2. **Esqueleto.**
   - `.gitignore`.
   - `package.json` con `packageManager` y `devEngines.runtime`.
   - `pnpm-workspace.yaml` con la edad mínima, `savePrefix` y los scripts bloqueados.
   - Astro 7 mínimo con i18n es/en, tsconfig strictest y Prettier.
   - LICENSE, NOTICE, `REUSE.toml`, `LICENSES/` y un README corto.
   - Listo cuando: `pnpm check:fast` pasa.
3. **Controles de la IA.** La IA propone `.claude/settings.json` (deny y ask) y el usuario
   lo crea. También `.githooks/` (pre-commit, pre-push y commit-msg), el script `prepare`
   y la plantilla de PR.
   - Listo cuando: un commit con mensaje inválido se rechaza, y la IA no puede leer `.env`.
4. **CI base.**
   - Workflow `check` con pnpm/setup y caché.
   - Check del título del PR y zizmor.
   - `dependabot.yml` con cooldown.
   - Listo cuando: un PR de prueba pasa la CI y zizmor no reporta nada.

## Imágenes (TDD)

5. **Limpiar originales y revisar metadatos.** Un comando que quita APP1 y APP13 y conserva
   el ICC, y un check que falla si queda algún metadato. Los escaneos son JPEG.
6. **Generar variantes.** sharp con conversión a sRGB, AVIF y JPEG en 480, 960, 1440 y
   2048 px, color dominante y caché por hash.
7. **Índice de fotos.** `content/photos.yaml` con su esquema Zod (título y `alt` en es/en,
   cámara, rollo, ruta del original) y las fotos de prueba.

## Despliegue

8. **`_headers`.** CSP y cabeceras de la ADR-0007, con un test unitario que las lee.
9. **Cuenta de Cloudflare.** Pasos manuales guiados: crear la cuenta sin tarjeta (si la
   pide, paramos), elegir el subdominio, `wrangler.jsonc`, el token mínimo, el environment
   `production` en GitHub y dónde ver el uso y los límites del plan gratis.
10. **Job de deploy.** Un artefacto de `check`, deploy con 3 reintentos, smoke con un
    User-Agent propio y rollback automático.
    - Listo cuando: el sitio mínimo se ve en `workers.dev`.

## Sitio

11. **Spec de la dirección visual.** 2 o 3 direcciones para elegir, y la tipografía (OFL,
    ≤ 30 KB), con el plugin cargado.
12. **Galería base.**
    - Grilla y página por foto, con `@view-transition` y placeholder de color.
    - Prefetch con la cabecera `Speculation-Rules`.
    - Crédito TASL y pie de licencias.
13. **Verificación completa.**
    - html-validate, linkinator y `reuse lint`.
    - Playwright en 3 navegadores con axe.
    - Lighthouse con los presupuestos y la prueba de memoria.
    - Listo cuando: `pnpm check` y `pre-push` corren todo.
14. **Fotos reales.** El usuario limpia y agrega entre 30 y 50 fotos, y la calidad de AVIF
    se elige comparando a la vista.
15. **Spec del explicador** con las tres cámaras (Pentax SP1000, Nikon N8008 y Leica M2),
    y después construirlo.
16. **Mantenimiento.**
    - Job semanal de enlaces externos.
    - Skill de revisión del PR contra `docs/decisiones/`.
17. **v1.0.0.** Tag y Release.

## Estado

- En curso: tarea 1 (commit inicial y repo público).
- Preguntas abiertas: ver `docs/requisitos.md` y las ADR 0001, 0004, 0005 y 0012.

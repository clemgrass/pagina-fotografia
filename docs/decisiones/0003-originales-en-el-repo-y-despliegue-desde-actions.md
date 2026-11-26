---
status: aceptada
date: 2026-11-26
---

# Originales en el repo y despliegue desde GitHub Actions

## Contexto
El plan inicial dejaba los originales fuera del repo, con solo fotos de prueba CC0 en la
CI, y desplegaba con un hook de git en el equipo del usuario. Pero las fotos van a ser
públicas bajo CC BY 4.0 de todas formas. El hook ataba el proyecto a una máquina y no
corría con `pull.rebase = true`.

## Opciones
- **Originales limpios en el repo; la CI genera las variantes y despliega.**
  Contras: el historial público es para siempre (los clones y los forks se quedan con una
  foto borrada); se publica la resolución completa; el repo pesa entre 65 y 250 MB; el
  token de Cloudflare vive en GitHub.
- **Subir solo las variantes generadas en el equipo.** Contras: un paso manual antes de
  cada PR; cada ajuste de calidad vuelve a subir todos los binarios al historial.
- **Hook local tras el pull de `main`.** Contras: depende de una máquina; no corre con
  `pull.rebase = true`.
- **Workers Builds.** Contras: compila aparte de la CI, la versión de Node va en otro
  archivo y el límite es de 20 minutos por build.
- **Originales en R2** *(no discutida)*.

## Decisión
Los originales van en `photos/originals/`, sin EXIF, GPS, XMP ni IPTC y con su ICC. Un
workflow de GitHub Actions compila una vez, verifica, y en cada push a `main` publica ese
mismo `dist/` con `wrangler deploy`, con 3 reintentos cada 2 minutos. Sin Git LFS.

## Consecuencias
- El proyecto ya no depende de la máquina del usuario, y la CI mide con las fotos reales.
- El token va en el environment `production`, restringido a `main` y con permisos mínimos.
- Sacar una foto del historial exige reescribirlo, y aun así no llega a las copias que ya existen.

## Confirmación
- La CI falla si un original trae EXIF, GPS, XMP o IPTC.
- El job `deploy` usa `download-artifact` del job `check` y no vuelve a compilar.

## Fuentes (2026-11-26)
- docs.github.com: about-large-files-on-github (recomienda menos de 1 GB por repo).
- docs.github.com: about-billing-for-github-actions (Actions gratis en repos públicos).
- developers.cloudflare.com/workers/ci-cd/builds (Workers Builds en Free).

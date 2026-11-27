# pagina-fotografia

Portafolio de fotografía análoga (35 mm, sin personas) y un explicador de cómo funciona una
cámara análoga. Sitio estático en español (`/`) e inglés (`/en/`), hecho con Astro.

La prioridad es que cargue rápido en un celular de gama baja. Los motivos de cada decisión
están en [`docs/decisiones/`](docs/decisiones/) y los requisitos en
[`docs/requisitos.md`](docs/requisitos.md).

## Requisitos

- [pnpm](https://pnpm.io/) 12. Descarga solo la versión de Node fijada en `package.json`.
- [uv](https://docs.astral.sh/uv/), para `reuse` y `zizmor`.

Si usas npm o `npx` dentro del repo, tu Node tiene que ser el de `devEngines.runtime`:
npm no lo descarga y falla con `EBADDEVENGINES`. pnpm sí lo descarga.

## Comandos

```sh
pnpm install      # también activa los git hooks de .githooks/
pnpm dev          # servidor local
pnpm check:fast   # formato, tipos y unitarios (< 30 s)
pnpm check        # todo lo que corre la CI
```

## Licencias

- Código: [Apache-2.0](LICENSE).
- Fotos, textos y SVG del explicador: [CC BY 4.0](LICENSES/CC-BY-4.0.txt), con crédito a
  "clemgrass".

Cada archivo declara su licencia con una cabecera SPDX o en [`REUSE.toml`](REUSE.toml).

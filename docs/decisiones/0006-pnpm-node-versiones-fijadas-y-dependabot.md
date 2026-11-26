---
status: aceptada
date: 2026-11-26
---

# pnpm 12, Node 26, versiones fijadas, 7 días de edad mínima y Dependabot

## Contexto
Si cada máquina usa otra versión, el resultado cambia. Un paquete recién publicado o con
scripts de instalación es una puerta de entrada.

## Opciones
- **pnpm 12.** Contras: hay que instalarlo.
- **npm 11.** Contras: corre los scripts de instalación por defecto (`allowScripts` es
  solo una advertencia).
- **Fijar las versiones en `package.json`** (`packageManager`, `devEngines.runtime` con
  `onFail: "download"`). Contras: la CI necesita `pnpm/setup`, que lee `devEngines.runtime`.
- **`.node-version` más `packageManager`.** Contras: dos archivos, y Node no se descarga solo.
- **`mise.toml`.** Contras: quien clona necesita mise.
- **Actualizaciones con Dependabot.** Contras: su `cooldown` no aplica a las de seguridad.
- **Renovate.** Contras: una app externa con escritura en el repo.
- **Actualizar a mano.** Contras: se olvida.

## Decisión
- pnpm 12 y la línea Node 26 LTS, en versiones exactas en `package.json`.
- En `pnpm-workspace.yaml`: `minimumReleaseAge: 10080` (7 días, en minutos) y
  `savePrefix: ''`. Los scripts de instalación quedan bloqueados (`strictDepBuilds`) y solo
  se habilitan con `allowBuilds`, por decisión explícita.
- Dependabot con `cooldown` de 7 días, PR agrupados una vez al mes para npm y acciones, y
  PR de seguridad inmediatos.
- Un parche de seguridad de menos de 7 días se agrega a `minimumReleaseAgeExclude` con su
  versión exacta, en el mismo PR, y se saca cuando cumple los 7 días.

## Consecuencias
- Al elegir una versión, se toma la última que tenga al menos 7 días.
- Instalar y actualizar lo hace el usuario.

## Confirmación
- `package.json` tiene `packageManager` y `devEngines.runtime` con versiones exactas.
- `pnpm-workspace.yaml` tiene `minimumReleaseAge: 10080`.
- `.github/dependabot.yml` tiene un `cooldown` de 7 días.

## Fuentes (2026-11-26)
- pnpm.io/settings/build y /settings/dependency-resolution y /package_json.
- docs.npmjs.com/cli/v11 (npm 11.21.3 no bloquea los scripts).
- nodejs.org/en/about/previous-releases (Node 26 Active LTS).
- docs.github.com: dependabot-options-reference (cooldown) y supported-ecosystems (pnpm v12).
